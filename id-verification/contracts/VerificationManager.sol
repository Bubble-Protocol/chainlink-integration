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
        args[0] = string(abi.encodePacked(block.chainid)); // Pass the chain id
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
        // Parse the result (assuming it returns a boolean verification result)
        bool isVerified = abi.decode(response, (bool));

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

        // Emit an event indicating the completion of the verification
        emit VerificationCompleted(vault.getOwner(), isVerified);
    }
    
    // Test point for simulating chainlink response when in test mode
    function testHandleChainlinkResponse(bytes32 requestId, bytes memory response) external {
        require(testMode, "not in test mode");
        _handleChainlinkResponse(requestId, response);
    }

}

string constant CF_SOURCE_CODE = "Functions.encodeUint256(1)";

