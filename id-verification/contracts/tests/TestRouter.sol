// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IFunctionsRouter} from "@chainlink/contracts@1.2.0/src/v0.8/functions/v1_0_0/interfaces/IFunctionsRouter.sol";
import {IFunctionsClient} from "@chainlink/contracts@1.2.0/src/v0.8/functions/v1_0_0/interfaces/IFunctionsClient.sol";
import {FunctionsResponse} from "@chainlink/contracts@1.2.0/src/v0.8/functions/v1_0_0/libraries/FunctionsResponse.sol";

/// @title Chainlink Functions Router interface.
contract TestRouter is IFunctionsRouter {

  uint256 public sendRequestCount = 0;
  bytes32 mockRequestId;
  IFunctionsClient client;

  function setFunctionsClient(IFunctionsClient _client) external {
    client = _client;
  }

  function setMockRequestId(bytes32 id) external {
    mockRequestId = id;
  }

  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) external {
    client.handleOracleFulfillment(requestId, response, err);
  }

  /// @notice The identifier of the route to retrieve the address of the access control contract
  /// The access control contract controls which accounts can manage subscriptions
  /// @return id - bytes32 id that can be passed to the "getContractById" of the Router
  function getAllowListId() external pure returns (bytes32) {
    return 0;
  }

  /// @notice Set the identifier of the route to retrieve the address of the access control contract
  /// The access control contract controls which accounts can manage subscriptions
  function setAllowListId(bytes32 allowListId) external {}

  /// @notice Get the flat fee (in Juels of LINK) that will be paid to the Router owner for operation of the network
  /// @return adminFee
  function getAdminFee() external pure returns (uint72 adminFee)  {
    return 0;
  }

  /// @notice Sends a request using the provided subscriptionId
  /// param subscriptionId - A unique subscription ID allocated by billing system,
  /// a client can make requests from different contracts referencing the same subscription
  /// param data - CBOR encoded Chainlink Functions request data, use FunctionsClient API to encode a request
  /// param dataVersion - Gas limit for the fulfillment callback
  /// param callbackGasLimit - Gas limit for the fulfillment callback
  /// param donId - An identifier used to determine which route to send the request along
  /// @return requestId - A unique request identifier
  function sendRequest(
    uint64 /*subscriptionId*/,
    bytes calldata /*data*/,
    uint16 /*dataVersion*/,
    uint32 /*callbackGasLimit*/,
    bytes32 /*donId*/
  ) external returns (bytes32) {
    sendRequestCount++;
    return mockRequestId;
  }

  /// @notice Sends a request to the proposed contracts
  /// param subscriptionId - A unique subscription ID allocated by billing system,
  /// a client can make requests from different contracts referencing the same subscription
  /// param data - CBOR encoded Chainlink Functions request data, use FunctionsClient API to encode a request
  /// param dataVersion - Gas limit for the fulfillment callback
  /// param callbackGasLimit - Gas limit for the fulfillment callback
  /// param donId - An identifier used to determine which route to send the request along
  /// @return requestId - A unique request identifier
  function sendRequestToProposed(
    uint64 /*subscriptionId*/,
    bytes calldata /*data*/,
    uint16 /*dataVersion*/,
    uint32 /*callbackGasLimit*/,
    bytes32 /*donId*/
  ) external pure returns (bytes32)  {
    return 0;
  }

  /// @notice Fulfill the request by:
  /// - calling back the data that the Oracle returned to the client contract
  /// - pay the DON for processing the request
  /// @dev Only callable by the Coordinator contract that is saved in the commitment
  /// param response response data from DON consensus
  /// param err error from DON consensus
  /// param juelsPerGas - current rate of juels/gas
  /// param costWithoutFulfillment - The cost of processing the request (in Juels of LINK ), without fulfillment
  /// param transmitter - The Node that transmitted the OCR report
  /// param commitment - The parameters of the request that must be held consistent between request and response time
  /// @return fulfillResult -
  /// @return callbackGasCostJuels -
  function fulfill(
    bytes memory /*response*/,
    bytes memory /*err*/,
    uint96 /*juelsPerGas*/,
    uint96 /*costWithoutFulfillment*/,
    address /*transmitter*/,
    FunctionsResponse.Commitment memory /*commitment*/
  ) external pure returns (FunctionsResponse.FulfillResult, uint96)  {
    return (FunctionsResponse.FulfillResult.FULFILLED, 0);
  }

  /// @notice Validate requested gas limit is below the subscription max.
  /// @param subscriptionId subscription ID
  /// @param callbackGasLimit desired callback gas limit
  function isValidCallbackGasLimit(uint64 subscriptionId, uint32 callbackGasLimit) external view {}

  /// @notice Get the current contract given an ID
  /// param id A bytes32 identifier for the route
  /// @return contract The current contract address
  function getContractById(bytes32 /*id*/) external pure returns (address)  {
    return address(0);
  }

  /// @notice Get the proposed next contract given an ID
  /// param id A bytes32 identifier for the route
  /// @return contract The current or proposed contract address
  function getProposedContractById(bytes32 /*id*/) external pure returns (address) {
    return address(0);
  }

  /// @notice Return the latest proprosal set
  /// @return ids The identifiers of the contracts to update
  /// @return to The addresses of the contracts that will be updated to
  function getProposedContractSet() external pure returns (bytes32[] memory, address[] memory) {
    return (new bytes32[](0), new address[](0));
  }

  /// @notice Proposes one or more updates to the contract routes
  /// @dev Only callable by owner
  function proposeContractsUpdate(bytes32[] memory proposalSetIds, address[] memory proposalSetAddresses) external {}

  /// @notice Updates the current contract routes to the proposed contracts
  /// @dev Only callable by owner
  function updateContracts() external {}

  /// @dev Puts the system into an emergency stopped state.
  /// @dev Only callable by owner
  function pause() external {}

  /// @dev Takes the system out of an emergency stopped state.
  /// @dev Only callable by owner
  function unpause() external {}
}
