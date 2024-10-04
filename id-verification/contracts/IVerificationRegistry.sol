// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerificationRegistry {

    // Function to check if an address is a verification manager
    function isVerificationManager(address account) external view returns (bool);

    // Function to register a user and their identity data contract.
    // Designed to be called by the user's identity contract
    function registerUser() external;

    // Function to deregister a user and revoke their verification status
    // Designed to be called by the user's identity contract
    function deregisterUser() external;

    // Function to check if a user is registered
    function isRegistered(address user) external view returns (bool);

    // Function to check if an address is verified
    function isVerified(address user) external view returns (bool);

    // Function to update the verification status of a user (restricted to the verification manager)
    function updateVerificationStatus(address user, bool verified) external;

    // Function to update the verification status of a user based on their vault address
    // (indirectly restricted to the verification manager)
    function updateVerificationStatusByVault(address vault, bool verified) external;

    // Function to check if the service has been discontinued
    function isTerminated() external view returns (bool);

}
