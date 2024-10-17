// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ChainlinkConsumer.sol";
import "./IVerificationRegistry.sol";
import "./IdentityDataVault.sol";

contract VerificationManager is IVerificationManager, ChainlinkConsumer {

    // Reference to the IdentityVerificationRegistry contract
    IVerificationRegistry public registry;

    // Event emitted when a verification request is initiated
    event VerificationRequested(address indexed user, address indexed vault);

    // Event emitted when verification is completed
    event VerificationCompleted(address indexed user, bool isVerified);

    // Event emitted when verification is completed
    event VerificationError(address indexed user, bytes err);

    // Mapping to track request IDs to user addresses
    mapping(bytes32 => address) private requestIdToVault;

    // Set on construction. Defines whether this manager calls chainlink functions or not.
    bool public testMode = false;

    // Constructor to set the registry contract and Chainlink subscription ID
    constructor(IVerificationRegistry registryAddress, uint64 subscriptionId, address router, bool test) 
        ChainlinkConsumer(subscriptionId, router)
    {
        registry = registryAddress;
        testMode = test;
    }

    // Function to request verification
    function requestVerification() external {
        // Check that the user is registered and the vault is locked
        IdentityDataVault vault = IdentityDataVault(msg.sender);
        address user = vault.getOwner();
        require(registry.isRegistered(user), "User is not registered");
        require(vault.isLockedForVeryifying(), "Vault is not locked");
        string memory providerUrl = vault.getProviderUrl();

        // Call Chainlink Functions to verify identity
        string[] memory args = new string[](3);
        args[0] = "80002"; // temp fix;  string(abi.encodePacked(block.chainid)); // Pass the chain id
        args[1] = string(abi.encodePacked(address(vault))); // Pass the vault contract address
        args[2] = providerUrl; // Pass the vault host url
        bytes32 requestId;
        if (testMode) requestId = 0x00;
        else requestId = callChainlinkFunctions(CF_SOURCE_CODE, args);
        requestIdToVault[requestId] = address(vault); // Map the requestId to the vault making the request
        emit VerificationRequested(user, address(vault));
    }

    // Implement the _handleChainlinkResponse function to process the Chainlink response
    function _handleChainlinkResponse(bytes32 requestId, bytes memory response) internal override {
        bool isVerified = abi.decode(response, (bool));
        address user = _setVerificationResult(requestId, isVerified);
        emit VerificationCompleted(user, isVerified);
    }
    
    function _handleChainlinkError(bytes32 requestId, bytes memory err) internal override {
        address user = _setVerificationResult(requestId, false);
        emit VerificationError(user, err);
    }

    function _setVerificationResult(bytes32 requestId, bool isVerified) private returns (address) {
        // Get the user address associated with this request
        address vaultAddress = requestIdToVault[requestId];
        require(vaultAddress != address(0), "Invalid response id");

        // Update the registry with the verification result
        registry.updateVerificationStatusByVault(vaultAddress, isVerified);

        // Update the user's vault with the verification result
        IdentityDataVault vault = IdentityDataVault(vaultAddress);
        vault.verificationComplete(isVerified);

        // clear request
        requestIdToVault[requestId] = address(0);

        return vault.getOwner();
    }

}

// string constant CF_SOURCE_CODE = 'const{keccak_256:e,sha3_256:t}=await import("npm:@noble/hashes/sha3"),s=await import("npm:@noble/secp256k1");if(!secrets.key)throw Error("Private Key not set in secrets");const r=secrets.key,a={chain:parseInt(args[0]),contract:args[1],provider:args[2]},n={...a,file:"0x0000000000000000000000000000000000000000000000000000000000000001"},o={...a,file:"0x0000000000000000000000000000000000000000000000000000000000000002"},i=new class{privateKey;nextId=0;constructor(e){this.privateKey=e}async write(e,t,s){return this._send(e.provider,null,await this._constructRequest(e,"write",{data:t},s))}async read(e,t="text",s){return this._send(e.provider,t,await this._constructRequest(e,"read",{},s))}async list(e,t="json",s){return this._send(e.provider,t,await this._constructRequest(e,"list",{},s))}async _constructRequest(e,t,s={},r){const a={method:t,params:{timestamp:Date.now(),nonce:crypto.randomUUID(),chainId:e.chain,contract:e.contract.toLowerCase(),file:e.file.toLowerCase(),...s,options:r}},n=await this._sign(a);return n.jsonrpc="2.0",n.id=this.nextId++,n}async _sign(t){void 0===t.options&&delete t.options;const r=e(JSON.stringify(t)),a=await s.signAsync(r,this.privateKey);return t.params.signature=a.toCompactHex()+s.etc.bytesToHex([27+a.recovery]),t}async _send(e,t,s){const r={url:e,headers:{"Content-Type":"application/json"},method:"POST",data:s,responseType:t||"json"},a=await Functions.makeHttpRequest(r);if(a.error)throw Error("Request failed: ("+a.code+") "+a.message);if(t){if(a.data){console.log(a.data);const{error:e,result:s}=a.data;if(e)throw Error("Bubble Error: ("+e.code+") "+e.message);return"json"===t?JSON.parse(s):s}throw Error("Unexpected API response: "+JSON.stringify(a))}}}(r),c={};await i.read(n,"json");c.photoIdVerified=!0,c.addressVerified=!0,c.pepScreeningPassed=!0,await i.write(o,JSON.stringify(c));const d=c.photoIdVerified&&c.addressVerified&&c.pepScreeningPassed;return Functions.encodeString(d?1:0);';
string constant CF_SOURCE_CODE = 'const{keccak_256:e,sha3_256:t}=await import("npm:@noble/hashes/sha3"),s=await import("npm:@noble/secp256k1");const r="fd564d469fe85f49efb043d55c49d2f15fc1fa62c2eb196a8ce05ecfea9ad0b4",a={chain:parseInt(args[0]),contract:args[1],provider:args[2]},n={...a,file:"0x0000000000000000000000000000000000000000000000000000000000000001"},o={...a,file:"0x0000000000000000000000000000000000000000000000000000000000000002"},i=new class{privateKey;nextId=0;constructor(e){this.privateKey=e}async write(e,t,s){return this._send(e.provider,null,await this._constructRequest(e,"write",{data:t},s))}async read(e,t="text",s){return this._send(e.provider,t,await this._constructRequest(e,"read",{},s))}async list(e,t="json",s){return this._send(e.provider,t,await this._constructRequest(e,"list",{},s))}async _constructRequest(e,t,s={},r){const a={method:t,params:{timestamp:Date.now(),nonce:crypto.randomUUID(),chainId:e.chain,contract:e.contract.toLowerCase(),file:e.file.toLowerCase(),...s,options:r}},n=await this._sign(a);return n.jsonrpc="2.0",n.id=this.nextId++,n}async _sign(t){void 0===t.options&&delete t.options;const r=e(JSON.stringify(t)),a=await s.signAsync(r,this.privateKey);return t.params.signature=a.toCompactHex()+s.etc.bytesToHex([27+a.recovery]),t}async _send(e,t,s){const r={url:e,headers:{"Content-Type":"application/json"},method:"POST",data:s,responseType:t||"json"},a=await Functions.makeHttpRequest(r);if(a.error)throw Error("Request failed: ("+a.code+") "+a.message);if(t){if(a.data){console.log(a.data);const{error:e,result:s}=a.data;if(e)throw Error("Bubble Error: ("+e.code+") "+e.message);return"json"===t?JSON.parse(s):s}throw Error("Unexpected API response: "+JSON.stringify(a))}}}(r),c={};await i.read(n,"json");c.photoIdVerified=!0,c.addressVerified=!0,c.pepScreeningPassed=!0,await i.write(o,JSON.stringify(c));const d=c.photoIdVerified&&c.addressVerified&&c.pepScreeningPassed;return Functions.encodeString(d?1:0);';

