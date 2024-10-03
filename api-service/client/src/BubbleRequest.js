// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

const { keccak_256 } = await import('@noble/hashes/sha3');
const secp = await import('@noble/secp256k1');
import { ContentId } from './ContentId.js';

/**
 * A BubbleRequest object is a subclass of the Request object used for Bubble Protocol requests.
 * 
 * Usage:
 *   const request = new BubbleRequest(url, options);
 *   const signedRequest = await request.sign(privateKeyOrSignFunction);
 *   const response = fetch(signedRequest);
 */
export class BubbleRequest extends Request {

  /**
   * Constructs a new BubbleRequest object. 
   * 
   * Options must include either:
   *   - contentId: ContentId object, did, or base64 encoded string
   *   - body: containing params with chainId, contract and (optionally) file
   *     e.g. {body: {params: {chainId: 123, contract: "0x12..34", file: "0x56..78"}}}
   * 
   * If options.body.method is not provided, it defaults to 'read'.
   */
  constructor(contentId, options) {
    const validatedContentId = new ContentId(contentId);
    if (options && typeof options !== 'object') throw new TypeError('Failed to construct BubbleRequest - invalid options parameter');
    const bOptions = {...options};
    bOptions.method = 'POST'; // all bubble requests are POST
    bOptions.body = BubbleRequest._constructBubbleRequestBody(validatedContentId, bOptions.body);
    super(bOptions.url || validatedContentId.provider, bOptions);
    this.headers.set('Content-Type', 'application/json');
    this.contentId = validatedContentId;
    this.request = bOptions.body;
  }

  /**
   * Constructs a Bubble Protocol request body from the provided options.
   */
  static _constructBubbleRequestBody(contentId, options={}) {
    const params = options.params || {};
    const nonce = params.nonce || crypto.randomUUID();
    const request = {
      jsonrpc: options.jsonrpc || "2.0",
      id: options.id || nonce,
      method: options.method || 'read',
      params: {
          timestamp: params.timestamp || Date.now(),
          nonce: nonce,
          chainId: contentId.chain,
          contract: contentId.contract,
          file: contentId.file,
      }
    }
    if (params.data) request.params.data = params.data;
    if (params.options) request.params.options = params.options;
    return JSON.stringify(request);
  }

  /**
   * Signs the request with the provided private key or sign function returning a new Request object.
   * This request will be unusable after signing.
   * 
   * @param {Hex|Uint8Array|Function} privateKeyOrSignFunction  Private key to sign the request with, 
   * or a function that returns a signature `function (hash) => Signature`
   * @param {Object} options  Optional parameters. Can include:
   *   - jsonrpcVersion: version to insert in the body's `jsonrpc` field (2.0 by default)
   *   - jsonrpcId: id to insert in the body's `id` field (uses the nonce in the params by default)
   * @returns Request A new Request object signed with the provided private key
   */
  async sign(privateKeyOrSignFunction) {
    const body = await this.json();
    const packet = {
      method: body.method,
      params: body.params,
    }
    const hash = keccak_256(JSON.stringify(packet));
    let sig;
    if (typeof privateKeyOrSignFunction === 'function') {
      sig = await privateKeyOrSignFunction(hash);
    }
    else {
      sig = await secp.signAsync(hash, privateKeyOrSignFunction);
      sig = sig.toCompactHex() + secp.etc.bytesToHex([27+sig.recovery])
    }
    body.params.signature = sig;
    return new Request(this, {body: JSON.stringify(body)});
  }

  /**
   * Returns the content id of the request as a ContentId object.
   */
  getContentId() {
    return this.contentId;
  }

  /**
   * Returns the request body as a JSON string.
   */
  getBody() {
    return this.request;
  }
  
}

