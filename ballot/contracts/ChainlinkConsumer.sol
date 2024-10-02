// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {FunctionsClient} from "@chainlink/contracts@1.2.0/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts@1.2.0/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

struct ChainlinkConfig {
    address router;
    uint32 gasLimit;
    bytes32 donId;
}


/**
 * Holds the parameters for a single chainlink function call
 */
abstract contract ChainlinkConsumer is FunctionsClient {

    using FunctionsRequest for FunctionsRequest.Request;

    // Custom error type
    error UnexpectedRequestID(bytes32 requestId);

    // Event to log responses
    event ChainlinkResponse(
        bytes32 indexed requestId,
        bytes response,
        bytes err
    );

    // Chainlink Functions configuration
    ChainlinkConfig private _chainlinkConfig = ChainlinkConfig(
        0xb83E47C2bC239B3bf370bc41e1459A34b41238D0,                         // Router address - Hardcoded for Sepolia
        300000,                                                             // Callback gas limit
        0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000  // donId - Hardcoded for Sepolia
    );

    // State variables to store the last request ID, response, and error
    bytes32 private _lastChainlinkRequestId;

    uint64 private _chainlinkSubscriptionId;

    constructor(uint64 subscriptionId) FunctionsClient(_chainlinkConfig.router) {
        _chainlinkSubscriptionId = subscriptionId;
    }

    function callChainlinkFunctions(string memory source, string[] memory args) internal {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (args.length > 0) req.setArgs(args); // Set the arguments for the request

        // Send the request and store the request ID
        _lastChainlinkRequestId = _sendRequest(
            req.encodeCBOR(),
            _chainlinkSubscriptionId,
            _chainlinkConfig.gasLimit,
            _chainlinkConfig.donId
        );
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (_lastChainlinkRequestId != requestId) revert UnexpectedRequestID(requestId);
        emit ChainlinkResponse(requestId, response, err);
        if (err.length == 0) _handleChainlinkResponse(response);
    }
    
    function _handleChainlinkResponse(bytes memory response) internal virtual;

}

