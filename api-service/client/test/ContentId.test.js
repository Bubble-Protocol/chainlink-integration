// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { ContentId } from "../src/ContentId.js";

const VALID_CHAIN = 1;
const ROOT_PATH = '0x0000000000000000000000000000000000000000000000000000000000000000';
const VALID_ADDRESS = '0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929';
const VALID_URL = 'https://bubblevault.com:8131/eth/v2';
const VALID_FILE = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world>>???a.txt';
const VALID_DIR = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063';
const VALID_MAX_LENGTH_FILE = '0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/'+'a'.repeat(255);
const VALID_DIR_NO_PREFIX = '24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063';
const VALID_FILE_NO_PREFIX = '24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world.txt';
const ROOT_PATH_NO_PREFIX = ROOT_PATH.slice(2);
const VALID_BASE64URL_ENCODED_ID = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIn0';
const VALID_BASE64URL_ENCODED_ID_WITH_FILE = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIiwiZmlsZSI6IjB4MjQ4MDJlZGMxZWJhMGY1NzhkY2ZmZDZhZGEzYzViOTU0YThlNzZlNTViYTgzMGNmMTlhMzA4M2Q0ODlhNjA2My9oZWxsby13b3JsZD4-Pz8_YS50eHQifQ';
const VALID_BASE64_ENCODED_ID = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIn0=';
const VALID_BASE64_ENCODED_ID_WITH_FILE = 'eyJjaGFpbiI6MSwiY29udHJhY3QiOiIweGMxNmE0MDlhMzlFRGUzRjM4RTIxMjkwMGY4ZDNhZmU2YWE2QTg5MjkiLCJwcm92aWRlciI6Imh0dHBzOi8vYnViYmxldmF1bHQuY29tOjgxMzEvZXRoL3YyIiwiZmlsZSI6IjB4MjQ4MDJlZGMxZWJhMGY1NzhkY2ZmZDZhZGEzYzViOTU0YThlNzZlNTViYTgzMGNmMTlhMzA4M2Q0ODlhNjA2My9oZWxsby13b3JsZD4+Pz8/YS50eHQifQ==';
const INVALID_BASE64_ENCODED_ID_MISSING_CHAIN = 'eyJjb250cmFjdCI6IjB4YzE2YTQwOWEzOUVEZTNGMzhFMjEyOTAwZjhkM2FmZTZhYTZBODkyOSIsInByb3ZpZGVyIjoiaHR0cHM6Ly9idWJibGV2YXVsdC5jb206ODEzMS9ldGgvdjIifQ';
const INVALID_BASE64_ENCODED_ID_INVALID_CHAIN = 'eyJjaGFpbiI6IjEiLCJjb250cmFjdCI6IjB4YzE2YTQwOWEzOUVEZTNGMzhFMjEyOTAwZjhkM2FmZTZhYTZBODkyOSIsInByb3ZpZGVyIjoiaHR0cHM6Ly9idWJibGV2YXVsdC5jb206ODEzMS9ldGgvdjIifQ';

const VALID_UNICODE_PATH_EXTENSIONS = [
  // ASCII filenames
  "sample.txt",
  "file_name-123.pdf",
  "A_b-C.123",

  // Unicode filenames with various scripts
  "文件.txt", // Chinese
  "файл.pdf", // Cyrillic
  "ファイル.md", // Japanese
  "파일.hwp", // Korean
  "αρχείο.docx", // Greek

  // Mixed ASCII and Unicode characters
  "example_文件.txt",
  "файл_report-2022.pdf",

  // Filenames with special characters
  "file name with spaces.txt",
  "file:name.txt",
  "file?name.txt",
  "file*name.txt",

  // Filenames with leading/trailing spaces
  " file_with_leading_space.txt",
  "file_with_trailing_space.txt ",

  // Filenames with various Unicode normalization forms
  "café.txt", // NFC
  "café.txt" // NFD
];


describe('ContentId', () => {

  describe('throws on construction', () => {

    test('when passed nothing', () => {
      expect(() => {new ContentId()}).toThrow("Failed to construct ContentId from nothing");
    })

    test('when passed an empty string', () => {
      expect(() => {new ContentId('')}).toThrow("Failed to construct ContentId from nothing");
    })

    test('when passed an empty object', () => {
      expect(() => {new ContentId({})}).toThrow("Failed to parse ContentId from {chain: NaN, contract: undefined, provider: undefined}");
    })

    test('when passed an invalid base64url string', () => {
      expect(() => {new ContentId('eyJjaG*FpbiI6M')}).toThrow("Failed to parse ContentId from base64: eyJjaG*FpbiI6M");
    })

    test('when passed invalid JSON encoded as base64url string', () => {
      expect(() => {new ContentId('eyJjaGFpbiI6M')})
        .toThrow("Failed to parse ContentId from base64: eyJjaGFpbiI6M");
    })

    test('when passed an object missing the chain field', () => {
      const cid = {
        contract: VALID_ADDRESS,
        provider: VALID_URL
      };
      expect(() => {new ContentId(cid)})
        .toThrow("Failed to parse ContentId from {chain: NaN, contract: 0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929, provider: https://bubblevault.com:8131/eth/v2}");
    })

    test('when passed an object with an invalid chain field', () => {
      const cid = {
        chain: '1',
        contract: VALID_ADDRESS,
        provider: VALID_URL
      };
      expect(() => {new ContentId(cid)})
        .toThrow("Failed to parse ContentId from {chain: NaN, contract: 0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929, provider: https://bubblevault.com:8131/eth/v2}");
    })

    test('when passed an object missing the contract field', () => {
      const cid = {
        chain: VALID_CHAIN,
        provider: VALID_URL
      };
      expect(() => {new ContentId(cid)})
        .toThrow("Failed to parse ContentId from {chain: 1, contract: undefined, provider: https://bubblevault.com:8131/eth/v2}");
    })

    test('when passed an object with an invalid contract field', () => {
      const cid = {
        chain: VALID_CHAIN,
        contract: '0x010203xyz',
        provider: VALID_URL
      };
      expect(() => {new ContentId(cid)})
        .toThrow("Failed to parse ContentId from {chain: 1, contract: 010203xyz, provider: https://bubblevault.com:8131/eth/v2}");
    })

    test('when passed an object missing the provider field', () => {
      const cid = {
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS
      };
      expect(() => {new ContentId(cid)})
        .toThrow("Failed to parse ContentId from {chain: 1, contract: 0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929, provider: undefined}");
    })

    test('when passed an object with an invalid provider field', () => {
      const cid = {
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: 1
      };
      expect(() => {new ContentId(cid)})
        .toThrow("Failed to parse ContentId from {chain: 1, contract: 0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929, provider: 1}");
    })

    test('when passed an object with an invalid file field', () => {
      const cid = {
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: 'myFile'
      };
      expect(() => {new ContentId(cid)})
        .toThrow("Failed to parse ContentId file from myFile");
    })

    test('when passed a base64url encoded id missing the chain field', () => {
      expect(() => {new ContentId(INVALID_BASE64_ENCODED_ID_MISSING_CHAIN)})
        .toThrow("Failed to parse ContentId from {chain: NaN, contract: 0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929, provider: https://bubblevault.com:8131/eth/v2}");
    })

    test('when passed a base64url encoded id with an invalid chain field', () => {
      expect(() => {new ContentId(INVALID_BASE64_ENCODED_ID_INVALID_CHAIN)})
        .toThrow("Failed to parse ContentId from {chain: NaN, contract: 0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929, provider: https://bubblevault.com:8131/eth/v2}");
    })

    test('when passed a did with the wrong method', () => {
      expect(() => {new ContentId('did:notbub:'+VALID_BASE64URL_ENCODED_ID)})
        .toThrow("Failed to parse ContentId from base64: did:notbub:"+VALID_BASE64URL_ENCODED_ID);
    })

    test('when passed a malformed did', () => {
      expect(() => {new ContentId('dod:bubble:'+VALID_BASE64URL_ENCODED_ID)})
        .toThrow("Failed to construct ContentId from dod:bubble:"+VALID_BASE64URL_ENCODED_ID+" (must contain chain, contract and file)");
    })

  });


  describe('can be constructed', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(undefined);
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(VALID_FILE);
    })

    test('with a base64url encoded id (without file)', () => {
      const cid = new ContentId(VALID_BASE64URL_ENCODED_ID);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(undefined);
    })

    test('with a base64url encoded id (with file)', () => {
      const cid = new ContentId(VALID_BASE64URL_ENCODED_ID_WITH_FILE);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(VALID_FILE);
    })

    test('with a base64 encoded id (without file)', () => {
      const cid = new ContentId(VALID_BASE64_ENCODED_ID);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(undefined);
    })

    test('with a base64 encoded id (with file)', () => {
      const cid = new ContentId(VALID_BASE64_ENCODED_ID_WITH_FILE);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(VALID_FILE);
    })

    test('with a base64 encoded DID (without file)', () => {
      const cid = new ContentId('did:bubble:'+VALID_BASE64_ENCODED_ID);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(undefined);
    })

    test('with a base64 encoded DID (with file)', () => {
      const cid = new ContentId('did:bubble:'+VALID_BASE64_ENCODED_ID_WITH_FILE);
      expect(cid.chain).toBe(VALID_CHAIN);
      expect(cid.contract).toBe(VALID_ADDRESS);
      expect(cid.provider).toBe(VALID_URL);
      expect(cid.file).toBe(VALID_FILE);
    })

  })


  describe('.toBase64() generates the correct Base64URL format', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(cid.toBase64()).toBe(VALID_BASE64URL_ENCODED_ID);
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(cid.toBase64()).toBe(VALID_BASE64URL_ENCODED_ID_WITH_FILE);
    })

  })


  describe('.toDID() generates the correct did', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(cid.toDID()).toBe('did:bubble:'+VALID_BASE64URL_ENCODED_ID);
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(cid.toDID()).toBe('did:bubble:'+VALID_BASE64URL_ENCODED_ID_WITH_FILE);
    })

  })


  describe('.toObject() generates the correct plain object', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(JSON.stringify(cid.toObject())).toBe('{"chain":1,"contract":"0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929","provider":"https://bubblevault.com:8131/eth/v2"}');
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(JSON.stringify(cid.toObject())).toBe('{"chain":1,"contract":"0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929","provider":"https://bubblevault.com:8131/eth/v2","file":"0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world>>???a.txt"}');
    })

  })

  describe('.toURL() generates the correct url', () => {

    test('with a plain object (without file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL
      });
      expect(cid.toURL()).toBe('https://bubblevault.com:8131/eth/v2/1/0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929');
    })

    test('with a plain object (with file)', () => {
      const cid = new ContentId({
        chain: VALID_CHAIN,
        contract: VALID_ADDRESS,
        provider: VALID_URL,
        file: VALID_FILE
      });
      expect(cid.toURL()).toBe('https://bubblevault.com:8131/eth/v2/1/0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929/0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/hello-world>>???a.txt');
    })

  })

})


describe('Filename tests: ContentId', () => {

  const VALID_ID = new ContentId(VALID_BASE64URL_ENCODED_ID);

  describe('construction succeeds', () => {

    test('with a valid file with no path extension', () => {
      expect(() => new ContentId(VALID_ID, {file: VALID_DIR})).not.toThrow();
    })

    test('with a valid file with path extension', () => {
      expect(() => new ContentId(VALID_ID, {file: VALID_FILE})).not.toThrow();
    })

    test('with the root path', () => {
      expect(() => new ContentId(VALID_ID, {file: ROOT_PATH})).not.toThrow();
    })

    test('with a valid file with no path extension (no 0x prefix)', () => {
      expect(() => new ContentId(VALID_ID, {file: VALID_DIR_NO_PREFIX})).not.toThrow();
    })

    test('with a valid file with path extension (no 0x prefix)', () => {
      expect(() => new ContentId(VALID_ID, {file: VALID_FILE_NO_PREFIX})).not.toThrow();
    })

    test('with the root path (no 0x prefix)', () => {
      expect(() => new ContentId(VALID_ID, {file: ROOT_PATH_NO_PREFIX})).not.toThrow();
    })

    test('with valid unicode characters', () => {
      VALID_UNICODE_PATH_EXTENSIONS.forEach(path => {
        expect(() => new ContentId(VALID_ID, {file: VALID_DIR+'/'+path})).not.toThrow();
      })
    })

    test('with a valid maximum length path extension', () => {
      expect(() => new ContentId(VALID_ID, {file: VALID_MAX_LENGTH_FILE})).not.toThrow();
    })

  })  
  
  
  describe('construction fails', () => {

    test('with undefined parameter', () => {
      expect(() => new ContentId({...VALID_ID, chain: undefined}))
      .toThrow("Failed to parse ContentId from {chain: NaN, contract: 0xc16a409a39EDe3F38E212900f8d3afe6aa6A8929, provider: https://bubblevault.com:8131/eth/v2}");
    })

    test('with empty parameter', () => {
      expect(() => new ContentId({...VALID_ID, contract: ''}))
      .toThrow("Failed to parse ContentId from {chain: 1, contract: , provider: https://bubblevault.com:8131/eth/v2}");
    })

    test('with incorrect type of parameter', () => {
      expect(() => new ContentId({...VALID_ID, file: {}}))
      .toThrow("Failed to parse ContentId file from [object Object]");
    })

    test('with a path extension that is more than 255 character', () => {
      expect(() => new ContentId({...VALID_ID, file: VALID_MAX_LENGTH_FILE+'p'}))
      .toThrow("Failed to parse ContentId file from "+VALID_MAX_LENGTH_FILE+"p");
    })

    test('with a directory part that is too long', () => {
      expect(() => new ContentId({...VALID_ID, file: '1'+VALID_DIR_NO_PREFIX}))
      .toThrow("Failed to parse ContentId file from 124802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063 (file name too long)");
    })

    test('with a null character in its extension', () => {
      expect(() => new ContentId({...VALID_ID, file: VALID_DIR+'/invalid\0extension'}))
      .toThrow("Failed to parse ContentId file from 0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/invalid\0extension (invalid POSIX file name)");
    })

    test('with a missing /', () => {
      expect(() => new ContentId({...VALID_ID, file: VALID_DIR+'hello-world.txt'}))
      .toThrow("Failed to parse ContentId file from 0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063hello-world.txt (file name too long)");
    })

    test('with more than one /', () => {
      expect(() => new ContentId({...VALID_ID, file: VALID_DIR+'/myDir/hello-world.txt'}))
      .toThrow("Failed to parse ContentId file from 0x24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063/myDir/hello-world.txt");
    })

    test('with the reserved . path', () => {
      expect(() => new ContentId({...VALID_ID, file: VALID_DIR+'/.'}))
      .toThrow("Failed to parse ContentId file from "+VALID_DIR+"/. (invalid POSIX file name)");
    })

    test('with the reserved .. path', () => {
      expect(() => new ContentId({...VALID_ID, file: VALID_DIR+'/..'}))
      .toThrow("Failed to parse ContentId file from "+VALID_DIR+"/.. (invalid POSIX file name)");
    })

  })


  describe("converts permissioned part to lowercase", () => {

    const UPPERCASE_DIR = '0x'+VALID_DIR.slice(2).toUpperCase();
    const LOWERCASE_DIR = '0x'+VALID_DIR.slice(2).toLowerCase();

    test("when a directory", () => {
      const id = new ContentId(VALID_ID, {file: UPPERCASE_DIR});
      expect(id.file.split('/')[0]).toBe(LOWERCASE_DIR);
      expect(id.file).toBe(LOWERCASE_DIR);
    })
  
    test("when a file in a directory (and does not convert path extension)", () => {
      const id = new ContentId(VALID_ID, {file: UPPERCASE_DIR+'/MyFile.txt'});
      expect(id.file.split('/')[0]).toBe(LOWERCASE_DIR);
      expect(id.file).toBe(LOWERCASE_DIR+'/MyFile.txt');
    })
  
  })


  describe("adds leading '0x'", () => {

    test("when a directory", () => {
      const id = new ContentId(VALID_ID, {file: VALID_DIR.slice(2)});
      expect(id.file).toBe(VALID_DIR);
    })
  
    test("when a file in a directory (and does not convert path extension)", () => {
      const id = new ContentId(VALID_ID, {file: VALID_DIR.slice(2)+'/MyFile.txt'});
      expect(id.file).toBe(VALID_DIR+'/MyFile.txt');
    })
  
  })

})