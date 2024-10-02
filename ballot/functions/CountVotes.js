const { keccak_256, sha3_256 } = await import('npm:@noble/hashes/sha3');
const secp = await import('npm:@noble/secp256k1');

class BubbleRPCManager {

  privateKey;
  nextId = 0;

  constructor(privateKey) {
    this.privateKey = privateKey;
  }

  async write(contentId, data, options) {
    return this._send(contentId.provider, null, await this._constructRequest(contentId, 'write', {data}, options));
  }

  async read(contentId, responseType='text', options) {
    return this._send(contentId.provider, responseType, await this._constructRequest(contentId, 'read', {}, options));
  }

  async list(contentId, responseType='json', options) {
    return this._send(contentId.provider, responseType, await this._constructRequest(contentId, 'list', {}, options));
  }

  async _constructRequest(contentId, method, params={}, options) {
    const request = {
      method: method,
      params: {
          timestamp: Date.now(),
          nonce: crypto.randomUUID(),
          chainId: contentId.chain,
          contract: contentId.contract.toLowerCase(),
          file: contentId.file.toLowerCase(),
          ...params,
          options
      }
    }
    const signedRequest = await this._sign(request);
    signedRequest.jsonrpc = "2.0";
    signedRequest.id = this.nextId++;
    return signedRequest;
  }

  async _sign(request) {
    if (request.options === undefined) delete request.options;
    const hash = keccak_256(JSON.stringify(request));
    const sig = await secp.signAsync(hash, this.privateKey);
    request.params.signature = sig.toCompactHex() + secp.etc.bytesToHex([27+sig.recovery]);
    return request;
  }

  async _send(provider, responseType, signedRequest) {
    const httpRequest = {
      url: provider,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      data: signedRequest,
      responseType: responseType || 'json'
    }
    const apiResponse = await Functions.makeHttpRequest(httpRequest);
    if (apiResponse.error) throw Error("Request failed: ("+apiResponse.code+") "+apiResponse.message);
    else if (!responseType) return;
    else if (apiResponse.data) {
        const {error, result} = JSON.parse(apiResponse.data);
        if (error) throw Error("Bubble Error: ("+error.code+") "+error.message);
        return result;
    }
    else {
      throw Error("Unexpected API response: "+JSON.stringify(apiResponse));
    }
  }

}


//
// Main
//

if (!secrets.key) throw Error("Private Key not set in secrets");

const privateKey = secrets.key;
const ballotContract = args[0];
const delegates = JSON.parse(args[1]);
const RESULTS_FILE = "0x0000000000000000000000000000000000000000000000000000000000000001";
const bubbleManager = new BubbleRPCManager(privateKey);

const bubbleId = {
    chain: 137,
    contract: ballotContract,
    provider: "https://vault.bubbleprotocol.com/v2/polygon"
}

async function fetchResults(bubbleId) {
  const countStartTime = Date.now();
  const root = {
      ...bubbleId,
      file: "0x0000000000000000000000000000000000000000000000000000000000000000"
  }
  const files = await bubbleManager.list(root, 'text', {});
  const voteCount = delegates.reduce((obj, d) => { obj[d] = 0; return obj }, {});
  const participants = [];
  for(const f of files) {
    if (f.name !== RESULTS_FILE) {
      const contentId = {...bubbleId, file: f.name};
      const ballotJson = await bubbleManager.read(contentId, 'text');
      const ballot = JSON.parse(ballotJson);
      console.log(ballot)
      if (ballot && ballot.vote && ballot.signature) {
        // TODO decrypt ECDSA
        // TODO recover signer from signature and check it matches f.name
        if (delegates.includes(ballot.vote)) {
          voteCount[ballot.vote]++;
          participants.push(secp.etc.bytesToHex(sha3_256(ballot.signature)))
          console.log('voted', voteCount)
        }
        else {
          console.log('does not include', ballot.vote)
        }
      }
    }
  }
  const countEndTime = Date.now();
  console.log(voteCount, participants)
  return {count: voteCount, participants, countStartTime, countEndTime};
}


const results = await fetchResults(bubbleId);

const resultsHash = sha3_256(JSON.stringify(results));
const sig = await secp.signAsync(resultsHash, privateKey);
results.signature = sig.toCompactHex() + secp.etc.bytesToHex([27+sig.recovery]);

const contentId = {...bubbleId, file: RESULTS_FILE};
await bubbleManager.write(contentId, JSON.stringify(results));

return Functions.encodeString(secp.etc.bytesToHex(resultsHash));

