// Copyright (c) 2024 Bubble Protocol
// Distributed under the MIT software license, see the accompanying
// file LICENSE or http://www.opensource.org/licenses/mit-license.php.

import { BubbleRequest } from "../src/BubbleRequest.js";
import { ContentId } from "../src/ContentId.js";

const privateKey = "24802edc1eba0f578dcffd6ada3c5b954a8e76e55ba830cf19a3083d489a6063";

const VALID_FILE = "0x0000000000000000000000000000000000000000000000000000000000000001";
const publicHelloWorld = "eyJjaGFpbiI6MTM3LCJjb250cmFjdCI6IjB4MjdiOUY4M0Q3QjE4YjU2ZjNDYjU5OUFmOTBFZkIxMkQwRGRhNjU2YiIsInByb3ZpZGVyIjoiaHR0cHM6Ly92YXVsdC5idWJibGVwcm90b2NvbC5jb20vdjIvcG9seWdvbiIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ";
const LOCAL_CONTENT_ID = {chain: 137, contract: "0xeffda76da1ce4Da42F0f02Fc5f8419DDd201A8bb", provider: "http://localhost:3000/api/v1/bubble", file: VALID_FILE};


function checkContentId(received, expected) {
  expect(received.chain).toEqual(expected.chain);
  expect(received.contract).toEqual(expected.contract);
  expect(received.provider).toEqual(expected.provider);
  if (expected.file) expect(received.file).toEqual(expected.file);
}

function checkBody(received, expectedMethod, expectedContentId, expectedData, expectedOptions, expectedSignature) {
  received = JSON.parse(received);
  expect(received.method).toEqual(expectedMethod);
  expect(received.params.chainId).toEqual(expectedContentId.chain);
  expect(received.params.contract).toEqual(expectedContentId.contract);
  expect(received.params.file).toEqual(expectedContentId.file);
  if (expectedData) expect(received.params.data).toEqual(expectedData);
  if (expectedOptions) expect(received.params.options).toEqual(expectedOptions);
  if (expectedSignature) expect(received.params.signature).toBeTruthy();
}


describe('BubbleRequest', () => {

  describe('throws on construction', () => {

    test('when passed nothing', () => {
      expect(() => {new BubbleRequest()}).toThrow("Failed to construct ContentId from nothing");
    })

    test('when passed an empty object', () => {
      expect(() => {new BubbleRequest({})}).toThrow("Failed to parse ContentId from {chain: NaN, contract: undefined, provider: undefined}");
    })

    test('when passed an invalid ContentId', () => {
      expect(() => {new BubbleRequest("https://webapi.com")}).toThrow("Failed to construct ContentId from https://webapi.com/ (must contain chain, contract and (optionally) file)");
    })

    test('when passed an invalid options parameter', () => {
      expect(() => {new BubbleRequest(LOCAL_CONTENT_ID, "hello")}).toThrow("Failed to construct BubbleRequest - invalid options parameter");
    })

  })

  describe('by default', () => {

    const request = new BubbleRequest(LOCAL_CONTENT_ID);
    let body;

    beforeAll(async () => {
      body = await request.json();
    })

    test('is a POST request', () => {
      expect(request.method).toBe('POST');
    })

    test('has the content id provider as its url', () => {
      checkContentId(request.url, LOCAL_CONTENT_ID.provider);
    })

    test('has a JSON Content-type header', () => {
      expect(request.headers.get("Content-Type")).toBe('application/json');
    })

    test('has the expected content id', () => {
      checkContentId(request.getContentId(), LOCAL_CONTENT_ID);
    })

    test("has only jsonrpc, id, method and params fields in the body", () => {
      expect(Object.keys(body)).toEqual(['jsonrpc', 'id', 'method', 'params']);
    })

    test('has the jsonRPC v2.0 field in the body by default', () => {
      expect(body.jsonrpc).toEqual('2.0');
    })

    test('has a jsonRPC id field in the body', () => {
      expect(body.id).toBeTruthy();
    })

    test('uses the nonce from the params as the jsonRPC id by default', () => {
      expect(body.id).toBe(body.params.nonce);
    })

    test("has the 'read' method in the body", () => {
      expect(body.method).toBe('read');
    })

    test("has a numeric timestamp in the body params", () => {
      expect(typeof body.params.timestamp).toBe('number');
    })

    test("has a nonce in the body params", () => {
      expect(body.params.nonce).toBeTruthy();
    })

    test("has the correct content id in the body params", () => {
      expect(body.params.chainId).toBe(LOCAL_CONTENT_ID.chain);
      expect(body.params.contract).toBe(LOCAL_CONTENT_ID.contract);
      expect(body.params.file).toBe(LOCAL_CONTENT_ID.file);
    })

    test("has no signature field in the body params", () => {
      expect(Object.keys(body.params).includes('signature')).toBe(false);
    })

    test("has no data field in the body params", () => {
      expect(Object.keys(body.params).includes('data')).toBe(false);
    })

    test("has no options field in the body params", () => {
      expect(Object.keys(body.params).includes('options')).toBe(false);
    })

    test('returns the body via getBody()', () => {
      checkBody(request.getBody(), 'read', LOCAL_CONTENT_ID);
    })

  })

  describe('can construct from', () => {

    test('a plain object', () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID);
      expect(request.url).toBe(LOCAL_CONTENT_ID.provider);
      checkContentId(request.getContentId(), LOCAL_CONTENT_ID);
    })
    
    test('a ContentId object', () => {
      const contentId = new ContentId(LOCAL_CONTENT_ID);
      const request = new BubbleRequest(contentId);
      expect(request.url).toBe(LOCAL_CONTENT_ID.provider);
      checkContentId(request.getContentId(), LOCAL_CONTENT_ID);
    })

    test('a base64 encoded content id', () => {
      const contentId = new ContentId(LOCAL_CONTENT_ID);
      const request = new BubbleRequest(contentId.toBase64());
      expect(request.url).toBe(LOCAL_CONTENT_ID.provider);
      checkContentId(request.getContentId(), LOCAL_CONTENT_ID);
    })

    test('a Bubble DID', () => {
      const contentId = new ContentId(LOCAL_CONTENT_ID);
      const request = new BubbleRequest(contentId.toDID());
      expect(request.url).toBe(LOCAL_CONTENT_ID.provider);
      checkContentId(request.getContentId(), LOCAL_CONTENT_ID);
    })

    test('a url with chain, contract and file', () => {
      const contentId = new ContentId(LOCAL_CONTENT_ID);
      const request = new BubbleRequest(contentId.toURL());
      expect(request.url).toBe(LOCAL_CONTENT_ID.provider);
      checkContentId(request.getContentId(), LOCAL_CONTENT_ID);
    })

    test('a url with chain and contract only', () => {
      const contentId = new ContentId(LOCAL_CONTENT_ID);
      contentId.file = null;
      const request = new BubbleRequest(contentId.toURL());
      expect(request.url).toBe(LOCAL_CONTENT_ID.provider);
      checkContentId(request.getContentId(), {...LOCAL_CONTENT_ID, file: null});
    })

  })

  describe('options', () => {

    test('can override the jsonRPC version in the options', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {jsonrpc: '1.0'}});
      const body = await request.json();
      expect(body.jsonrpc).toBe('1.0');
    })

    test('can override the jsonRPC id in the options', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {id: '123'}});
      const body = await request.json();
      expect(body.id).toBe('123');
    })

    test('can override the body method', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {method: 'write'}});
      const body = await request.json();
      expect(body.method).toBe('write');
    })

    test('can include data in the body params', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {params: {data: 'Hello, World!'}}});
      const body = await request.json();
      expect(body.params.data).toBe('Hello, World!');
    })

    test('can include options in the body params', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {params: {options: 'Hello, World!'}}});
      const body = await request.json();
      expect(body.params.options).toBe('Hello, World!');
    })

    test('can override the request url', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {url: 'https://overridden.com/'});
      expect(request.url).toBe('https://overridden.com/');
    })

    test('cannot insert additional body fields', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {testField: 'unwanted'}});
      const body = await request.json();
      expect(Object.keys(body).includes('testField')).toBe(false);
    })

    test('cannot insert additional param fields', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {params: {testField: 'unwanted'}}});
      const body = await request.json();
      expect(Object.keys(body.params).includes('testField')).toBe(false);
    })

    test('cannot override contentId param fields', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {params: {chainId: 'unwanted', contract: 'unwanted', file: 'unwanted'}}});
      const body = await request.json();
      expect(body.params.chainId).toBe(LOCAL_CONTENT_ID.chain);
      expect(body.params.contract).toBe(LOCAL_CONTENT_ID.contract);
      expect(body.params.file).toBe(LOCAL_CONTENT_ID.file);
    })

  })

  describe('signing', () => {

    const request = new BubbleRequest(LOCAL_CONTENT_ID, {body: {jsonrpc: '1.1', id: '123'}});
    let signedRequest;
    let body;
    let signedBody;

    beforeAll(async () => {
      signedRequest = await request.sign(privateKey);
      body = JSON.parse(request.getBody());
      signedBody = await signedRequest.json();
    })

    test('returns a new signed Request', async () => {
      expect(signedRequest).toBeInstanceOf(Request);
    })

    test('has the same URL as the original request', () => {
      expect(signedRequest.url).toBe(request.url);
    })

    test('has the same jsonrpc version as the original request', () => {
      expect(signedRequest.jsonrpc).toBe(request.jsonrpc);
    })

    test('has the same jsonrpc id as the original request', () => {
      expect(signedRequest.id).toBe(request.id);
    })

    test('has the same method as the original request', () => {
      expect(signedRequest.method).toBe(request.method);
    })

    test('has the same headers as the original request', () => {
      expect(signedRequest.headers).toEqual(request.headers);
    })

    test('has the same body method as the original request', () => {
      expect(signedBody.method).toEqual(body.method);
    })

    test('has the same body method as the original request', () => {
      expect(signedBody.method).toEqual(body.method);
    })

    test('has the same body params as the original request but with the signature added', () => {
      expect(signedBody.params.signature).toBeTruthy();
      const sbpCopy = {...signedBody.params};
      delete sbpCopy.signature;
      expect(sbpCopy).toEqual(body.params);
    })

    test('has a 65-byte hex signature', () => {
      expect(signedBody.params.signature).toMatch(/^[0-9a-f]{130}$/);
    })

    test('can use a uint8array private key', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID);
      const signedRequest = await request.sign(Uint8Array.from(Buffer.from(privateKey, 'hex')));
      expect(signedRequest).toBeInstanceOf(Request);
      const body = await signedRequest.json();
      expect(body.params.signature).toMatch(/^[0-9a-f]{130}$/);
    })

    test('can use a signing function', async () => {
      const request = new BubbleRequest(LOCAL_CONTENT_ID);
      const signFunction = async (hash) => 'hello'
      const signedRequest = await request.sign(signFunction);
      expect(signedRequest).toBeInstanceOf(Request);
      const body = await signedRequest.json();
      expect(body.params.signature).toBe('hello');
    })

    test('generates the correct signature', async () => {
      const request = new BubbleRequest(publicHelloWorld)
      const signedRequest = await request.sign(privateKey);
      const response = await fetch(signedRequest);
      expect(response.ok).toBe(true);
    })

  })

})