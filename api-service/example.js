import { BubbleRequest } from "./client/src/BubbleRequest.js";

const publicHelloWorld = "eyJjaGFpbiI6MTM3LCJjb250cmFjdCI6IjB4MjdiOUY4M0Q3QjE4YjU2ZjNDYjU5OUFmOTBFZkIxMkQwRGRhNjU2YiIsInByb3ZpZGVyIjoiaHR0cHM6Ly92YXVsdC5idWJibGVwcm90b2NvbC5jb20vdjIvcG9seWdvbiIsImZpbGUiOiIweDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDEifQ";
const contract = "0xeffda76da1ce4Da42F0f02Fc5f8419DDd201A8bb";
const contentId = {chain: 137, contract: contract, provider: "http://localhost:3000/api/v1/bubble", file: "0x01"};

function logRequest(r, message) {
    console.log();
    console.log('>>>', message);
    console.log('url:',r.url);
    console.log(r.getBody());
}

logRequest(new BubbleRequest(contentId), "plain object");
logRequest(new BubbleRequest(publicHelloWorld), "base64 encoded string");
logRequest(new BubbleRequest("https://my-web-server.com/api/v1/137/0xeffda76da1ce4Da42F0f02Fc5f8419DDd201A8bb/1/my_file"), "long URL");
logRequest(new BubbleRequest("https://my-web-server.com/137/0xeffda76da1ce4Da42F0f02Fc5f8419DDd201A8bb"), "short URL, no file");

