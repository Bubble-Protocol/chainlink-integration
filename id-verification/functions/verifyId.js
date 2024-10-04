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
        console.log(apiResponse.data)
        const {error, result} = apiResponse.data;
        if (error) throw Error("Bubble Error: ("+error.code+") "+error.message);
        if (responseType === 'json') return JSON.parse(result);
        else return result;
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

const bubbleId = {
    chain: parseInt(args[0]),
    contract: args[1],
    provider: args[2]
}

const USER_ID_FILE = {...bubbleId, file: "0x0000000000000000000000000000000000000000000000000000000000000001"};
const RESULTS_FILE = {...bubbleId, file: "0x0000000000000000000000000000000000000000000000000000000000000002"};

const bubbleManager = new BubbleRPCManager(privateKey);
const results = {};


// 1. Fetch user id data from secure bubble
const identityData = await bubbleManager.read(USER_ID_FILE, 'json');

// 2. Verify id doc using the Identity Verification API.
results.photoIdVerified = true;  // TODO: await Functions.makeHttpRequest(...);

// 3. Verify user address using the Address Verification API.
results.addressVerified = true;  // TODO: await Functions.makeHttpRequest(...);

// 4. Perform sanctions/PEP screening via the respective API.
results.pepScreeningPassed = true;  // TODO: await Functions.makeHttpRequest(...);

// 5. Write verification results back into the Bubble
await bubbleManager.write(RESULTS_FILE, JSON.stringify(results));

// Return the overall verification status
const verified = results.photoIdVerified && results.addressVerified && results.pepScreeningPassed;
return Functions.encodeString(verified ? 1 : 0);

