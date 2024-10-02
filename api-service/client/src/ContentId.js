// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

/**
 * Bubble Protocol content id. Constructs from an object, base64 string, or Bubble DID validating
 * the chain, contract, provider and file properties. Provides methods to export in different 
 * formats.
 */
export class ContentId {

  /**
   * Initialises a new ContentId object. Will throw if any of the required properties are missing
   * or invalid. If id is a plain object it must contain chain, contract and provider properties, 
   * and can optionally contain a file property. The file can be a number or a string and will be
   * converted to valid file id format.
   * 
   * @param {ContentId|Object|String} id Initialises the content id from an object, base64 
   *   string or Bubble DID.
   * @param {*} options to override one or more properties if id is a ContentId object.
   */
  constructor(id, options={}) {
    if (!id) throw new TypeError('ContentId is missing');
    if (typeof id === 'string') id = ContentId._decodeId(id);
    const chain = options.chainId || options.chain || id.chainId || id.chain;
    let contract = options.contract || id.contract;
    const file = options.file || id.file;
    const provider = options.provider || id.provider;
    if (
      !chain || 
      !contract || 
      !id.provider || 
      typeof chain !== 'number' || 
      typeof contract !== 'string' || 
      typeof provider !== 'string' || 
      (contract.slice(0, 2) === '0x' && (contract = contract.slice(2)), contract.length !== 40) || 
      !isHex(contract)
    ) {
      throw new TypeError('Invalid content id');
    }
    this.chain = chain;
    this.contract = '0x'+contract;
    this.provider = provider;
    if (file) this.file = ContentId._expandFileId(file);
  }

  /**
   * Validates a file id and returns it in the correct format.
   */
  static _expandFileId(file) {
    if (typeof file === 'number') file = ""+file;
    if (typeof file !== 'string') throw new TypeError('Invalid file parameter within content id');
    let parts = file.split('/');
    if (parts.length > 2) throw new TypeError('Invalid file parameter within content id');
    let p = parts[0];
    p = p.slice(0,2) === '0x' ? p.slice(2) : p;
    p = p.length === 64 ? p : '0'.repeat(64-p.length)+p;
    if (!isHex(p)) throw new TypeError('Invalid file parameter within content id');
    parts[0] = '0x'+p.toLowerCase();
    return parts.join('/');
  }

  /**
   * Decodes a bubble DID or base64 encoded content id.
   */
  static _decodeId(str) {
    if (str.startsWith('did:bubble:')) str = str.slice(11);
    let b64str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64str.length % 4) b64str += '=';
    try {
      return JSON.parse(Buffer.from(b64str, 'base64').toString('utf8'));
    }
    catch (e) {
      throw new TypeError('Invalid content id');
    }
  }

  /**
   * Encodes the content id as a base64 string.
   */
  static _encodeId(obj) {
    let b64str = Buffer.from(JSON.stringify(obj)).toString('base64');
    return b64str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Exports the content id as a base64 encoded string.
   */
  toBase64() {
    return ContentId._encodeId(this);
  }

  /**
   * Exports the content id as a Bubble DID.
   */
  toDID() {
    return 'did:bubble:' + this.toBase64();
  }

  /**
   * Exports the content id as a plain object.
   */
  toObject() {
    return this;
  }

}


/**
 * True if the string is a valid hex string (without leading 0x).
 */
function isHex(str) {
  return /^[0-9a-fA-F]+$/.test(str);
}