const { sha256 } = await import('npm:@noble/hashes/sha2');
const secp = await import('npm:@noble/secp256k1');

const privateKey = args[0];

const contentId = {
    chain: 137,
    contract: "0x27b9F83D7B18b56f3Cb599Af90EfB12D0Dda656b",
    provider: "https://vault.bubbleprotocol.com/v2/polygon",
    file: "0x0000000000000000000000000000000000000000000000000000000000000001"
}

async function constructReadRequest(contentId, options) {
    const request = {
        jsonrpc: "2.0",
        id: 1,
        method: 'read',
        params: {
            timestamp: Date.now(),
            nonce: crypto.randomUUID(),
            chainId: contentId.chain,
            contract: contentId.contract,
            file: contentId.file
        }
    }

    if (request.options === undefined) delete request.options;
    const hash = sha256(JSON.stringify(request));
    const sig = await secp.signAsync(hash, privateKey);
    request.params.signature = sig.toCompactHex() + secp.etc.bytesToHex([27+sig.recovery]);
    return request;
}

const request = await constructReadRequest(contentId);

const httpRequest = {
    url: contentId.provider,
    headers: { 
        'Content-Type': 'application/json'
    },
    method: 'POST',
    data: request,
    responseType: 'text'
}

const apiResponse = await Functions.makeHttpRequest(httpRequest);

if (apiResponse.error) throw Error("Request failed: ("+apiResponse.code+") "+apiResponse.message);

if (apiResponse.data) {
    const {error, result} = JSON.parse(apiResponse.data);
    if (error) throw Error("Bubble Error: ("+error.code+") "+error.message);
    return Functions.encodeString(result);
}

return Functions.encodeString(JSON.stringify(apiResponse).slice(0,255));