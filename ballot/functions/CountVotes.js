const { keccak_256 } = await import('npm:@noble/hashes/sha3');
const secp = await import('npm:@noble/secp256k1');

class BubbleRPCManager {

  privateKey;
  nextId = 0;

  constructor(privateKey) {
    this.privateKey = privateKey;
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
      responseType: responseType
    }
    const apiResponse = await Functions.makeHttpRequest(httpRequest);
    if (apiResponse.error) throw Error("Request failed: ("+apiResponse.code+") "+apiResponse.message);
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
const bubbleManager = new BubbleRPCManager(privateKey);

const bubbleId = {
    chain: 137,
    contract: ballotContract,
    provider: "https://vault.bubbleprotocol.com/v2/polygon"
}

const root = {
    ...bubbleId,
    file: "0x0000000000000000000000000000000000000000000000000000000000000000"
}

const files = await bubbleManager.list(root, 'text', {});
console.log(files);

const contentId = {
    ...bubbleId,
    file: "0x0000000000000000000000000000000000000000000000000000000000000001"
}

const result = await bubbleManager.read(contentId, 'text');

return Functions.encodeString(result);

