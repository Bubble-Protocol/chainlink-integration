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
    if (!id) throw new TypeError('Failed to construct ContentId from nothing');
    if (typeof id === 'string') id = ContentId._decodeId(id);
    let chain = options.chainId || options.chain || id.chainId || id.chain;
    let contract = options.contract || id.contract;
    const file = options.file || id.file;
    const provider = options.provider || id.provider;
    if (typeof chain !== 'number') chain = 'NaN';
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
      throw new TypeError('Failed to parse ContentId from {chain: '+chain+', contract: '+contract+', provider: '+provider+'}');
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
    if (typeof file !== 'string') throw new TypeError('Failed to parse ContentId file from '+file);
    let parts = file.split('/');
    if (parts.length > 2) throw new TypeError('Failed to parse ContentId file from '+file+' (too many nested parts)');
    let p = parts[0];
    p = p.slice(0,2) === '0x' ? p.slice(2) : p;
    if (p.length > 64) throw new TypeError('Failed to parse ContentId file from '+file+' (file name too long)');
    p = p.length === 64 ? p : '0'.repeat(64-p.length)+p;
    if (!isHex(p)) throw new TypeError('Failed to parse ContentId file from '+file+' (invalid hex characters)');
    parts[0] = '0x'+p.toLowerCase();
    if (parts.length === 2) {
      if (parts[1].length > 255) throw new TypeError('Failed to parse ContentId file from '+file+' (file name too long)');
      if (!isPOSIXFilename(parts[1])) throw new TypeError('Failed to parse ContentId file from '+file+' (invalid POSIX file name)');
    }
    return parts.join('/');
  }

  /**
   * Decodes a bubble DID or base64 encoded content id.
   */
  static _decodeId(str) {
    let url;
    try {
      url = new URL(str);
    }
    catch (e) {}
    if (url && url.protocol !== 'did:') return ContentId._decodeUrl(url);
    if (str.startsWith('did:bubble:')) str = str.slice(11);
    let b64str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64str.length % 4) b64str += '=';
    try {
      return JSON.parse(Buffer.from(b64str, 'base64').toString('utf8'));
    }
    catch (e) {
      throw new TypeError('Failed to parse ContentId from base64: '+str);
    }
  }

  static _decodeUrl(url) {
    let parts = url.pathname.split('/');
    if (parts.length < 3) throw new TypeError('Failed to construct ContentId from '+url.href+' (must contain chain, contract and file)');
    const provider = url.protocol + '//' + url.host + parts.slice(0, -3).join('/');
    parts = parts.slice(-3);
    return {
      chain: parseInt(parts[0]),
      contract: parts[1],
      provider: provider,
      file: parts[2]
    };
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

  toURL() {
    return this.provider + '/' + this.chain + '/' + this.contract + (this.file ? '/' + this.file : '');
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

/**
 * True if the string is a valid POSIX filename with max length of 255.
 */
function isPOSIXFilename(value) {
  return (
    /^[^\0\/]{1,255}$/.test(value) &&          
    value !== "." &&                             // must not be a special file
    value !== "..");
}