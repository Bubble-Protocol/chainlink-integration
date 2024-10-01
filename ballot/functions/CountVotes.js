const { sha256 } = await import('npm:@noble/hashes/sha2');
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

  async _constructRequest(contentId, method, params={}, options) {
    const request = {
      jsonrpc: "2.0",
      id: this.nextId++,
      method: method,
      params: {
          timestamp: Date.now(),
          nonce: crypto.randomUUID(),
          chainId: contentId.chain,
          contract: contentId.contract,
          file: contentId.file,
          ...params,
          options
      }
    }
    return this._sign(request);
  }

  async _sign(request) {
    if (request.options === undefined) delete request.options;
    const hash = sha256(JSON.stringify(request));
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

const privateKey = args[0];

const contentId = {
    chain: 137,
    contract: "0x27b9F83D7B18b56f3Cb599Af90EfB12D0Dda656b",
    provider: "https://vault.bubbleprotocol.com/v2/polygon",
    file: "0x0000000000000000000000000000000000000000000000000000000000000001"
}

const bubbleManager = new BubbleRPCManager(privateKey);

const result = await bubbleManager.read(contentId, 'text');

return Functions.encodeString(result);

