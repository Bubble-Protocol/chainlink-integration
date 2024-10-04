// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IVerificationRegistry.sol";
import "./IdentityDataVault.sol";

contract VerificationRegistry is IVerificationRegistry, Ownable, AccessControl {

    // Role definition for the verification manager
    bytes32 public constant VERIFICATION_MANAGER_ROLE = keccak256("VERIFICATION_MANAGER_ROLE");

    // Mapping to track the user with their identity data contract
    mapping(address => address) private userToVault;

    // Mapping to track the verification status of user addresses
    mapping(address => bool) private verifiedAddresses;

    // Flag to indicate if the service has been terminated
    bool public terminated;

    // Event emitted when an address is verified or revoked
    event VerificationStatusUpdated(address indexed user, bool isVerified);

    // Constructor to set the contract deployer as the owner and admin for roles
    constructor() Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Function to add a verification manager
    function addVerificationManager(address manager) external onlyOwner {
        grantRole(VERIFICATION_MANAGER_ROLE, manager);
    }

    // Function to remove a verification manager
    function removeVerificationManager(address manager) external onlyOwner {
        revokeRole(VERIFICATION_MANAGER_ROLE, manager);
    }

    // Function to check if an address is a verification manager
    function isVerificationManager(address account) external view returns (bool) {
        return hasRole(VERIFICATION_MANAGER_ROLE, account);
    }

    // Function to register a user and their identity data contract
    function registerUser() external {
        require(!terminated, "Service has been terminated");
        IdentityDataVault vault = IdentityDataVault(msg.sender);
        address user = vault.getOwner();
        require(userToVault[user] == address(0), "User already registered");
        userToVault[user] = address(vault);
    }

    // Function to deregister a user and revoke their verification status
    function deregisterUser() external {
        require(!terminated, "Service has been terminated");
        IdentityDataVault vault = IdentityDataVault(msg.sender);
        address user = vault.getOwner();
        _deregisterUser(user);
    }

    // Function to deregister a user and revoke their verification status
    function deregisterUser(address user) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!terminated, "Service has been terminated");
        _deregisterUser(user);
    }

    // Private function to deregister a user and revoke their verification status
    function _deregisterUser(address user) private {
        require(userToVault[user] != address(0), "User not registered");
        userToVault[user] = address(0);
        verifiedAddresses[user] = false;
    }

    // Function to check if user is registered with the service
    function isRegistered(address user) external view returns (bool) {
        return userToVault[user] != address(0);
    }

    // Function to update the verification status of a user (restricted to the verification manager)
    function updateVerificationStatus(address user, bool verified) public onlyRole(VERIFICATION_MANAGER_ROLE) {
        require(userToVault[user] != address(0), "User not registered");
        verifiedAddresses[user] = verified;
        emit VerificationStatusUpdated(user, verified);
    }

    // Function to update the verification status of a user based on their vault address
    // (indirectly restricted to the verification manager)
    function updateVerificationStatusByVault(address vaultAddress, bool verified) external {
        IdentityDataVault vault = IdentityDataVault(vaultAddress);
        updateVerificationStatus(vault.getOwner(), verified);
    }

    // Function to check if an address is verified
    function isVerified(address user) external view returns (bool) {
        return verifiedAddresses[user];
    }

    // Function to terminate the service
    function terminate() external onlyOwner {
        terminated = true;
    }

    // Function to check if the service has been discontinued
    function isTerminated() external view returns (bool) {
        return terminated;
    }

}
