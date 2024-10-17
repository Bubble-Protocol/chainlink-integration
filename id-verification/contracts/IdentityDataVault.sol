// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlledStorage.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlBits.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/extensions/ProviderMetadata.sol";
import "./IVerificationRegistry.sol";
import "./IVerificationManager.sol";

// Bubble structure
uint256 constant OWNER_IDENTITY_FILE = 1;
uint256 constant VERIFICATION_RESULTS_FILE = 2;

/**
 * Smart Data Access contract governing a user's identity data throughout the lifecycle of an ID
 * Verification service. This is an example and must not be used for production purposes.
 *
 * The bubble transitions through the draft -> verifying -> verified -> terminated -> closed states.
 * In the draft state the user (owner) can write their data to the bubble ready for verification.
 * The user can trigger the verification service by calling the `verifyIdentity()` method, which
 * transitions the bubble to the `verifying` state and calls the VerificationManager to execute
 * the off-chain verification using Chainlink Functions. When verification is complete the 
 * VerificationManager returns the result by calling the `verificationComplete()` method. If
 * verification failed the contract returns to the `draft` state so the user can update their data.
 * If passed, the bubble enters the `verified` state and can no longer be popped without first
 * terminating the contract (`terminateContract`) and waiting for the retention period to be over.
 * The retention period is designed to meet regulatory requirements for data to be held for n time
 * following completion of business. It is hard coded below. 
 *
 * This example bubble has just two files - identity data and results - which is rather unrealistic,
 * However it works for this example. The contract currently provides only the user with access to 
 * the data once verified. It could be updated to include an Auditor role allowing a regulatory
 * body to apply for read access to audit the verification process held in the results. 
 */
contract IdentityDataVault is AccessControlledStorage, ProviderMetadata {

    enum State { DRAFT, VERIFYING, VERIFIED, TERMINATED, CLOSED }

    State public state = State.DRAFT;
    address owner = msg.sender;
    IVerificationRegistry public verificationRegistry;
    IVerificationManager public verificationManager;

    // Retention Period: time (seconds) for the data to be retained after the service has been concluded.
    uint public constant RETENTION_PERIOD = 0;
    uint public terminationTime;

    constructor(IVerificationRegistry registry, IVerificationManager manager, string memory providerUrl) 
        ProviderMetadata(providerUrl)
    {
        verificationRegistry = registry;
        verificationManager = manager;
    }

    /**
     * Access permissions for the off-chain bubble:
     *   - The owner can always read their data and the results
     *   - The owner can only write their data in the DRAFT state
     *   - The verifier can only access the bubble (including reading the owner data and writing the results)
     *     when in the VERIFYING state
     *   - Everyone else has no access to the bubble
     */
    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

        // If the contract has been terminated and any retention period is over then the off-chain storage 
        // service should delete the bubble and its contents
        if (isClosed()) return BUBBLE_TERMINATED_BIT;

        // Allow the owner to create the off-chain bubble and list it's contents
        if (contentId == 0 && user == owner) return READ_BIT | WRITE_BIT;

        if (user == owner) {         
            if (state == State.DRAFT) {
                if (contentId == OWNER_IDENTITY_FILE) return READ_BIT | WRITE_BIT;
                else if (contentId == VERIFICATION_RESULTS_FILE) return READ_BIT;
                else return NO_PERMISSIONS;
            }
            else {
                if (contentId == OWNER_IDENTITY_FILE) return READ_BIT;
                else if (contentId == VERIFICATION_RESULTS_FILE) return READ_BIT;
                else return NO_PERMISSIONS;
            }
        }

        else if (verificationRegistry.isVerificationManager(user)) {         
            if (state == State.VERIFYING) {
                if (contentId == OWNER_IDENTITY_FILE) return READ_BIT;
                else if (contentId == VERIFICATION_RESULTS_FILE) return READ_BIT | WRITE_BIT;
                else return NO_PERMISSIONS;
            }
            else return NO_PERMISSIONS;
        }

        else return NO_PERMISSIONS;

    }

    // Returns the owner of the vault
    function getOwner() external view returns (address) {
        return owner;
    }

    // Returns true if the vault is locked ready to be verified
    function isLockedForVeryifying() external view returns (bool) {
        return state == State.VERIFYING;
    }

    // Unlocks the vault (only a verification manager can unlock the vault)
    function verificationComplete(bool success) external {
        require (verificationRegistry.isVerificationManager(msg.sender), "Caller is not a verification manager");
        require (state == State.VERIFYING, "Not in the verifying state");
        state = success ? State.VERIFIED : State.DRAFT;
    }

    // Registers this contract and user with the verification registry
    function register() external {
        require(msg.sender == owner, "Caller is not the owner");
        verificationRegistry.registerUser();
    }

    // Verifies the user's identity
    function verifyIdentity() external {
        require(msg.sender == owner, "Caller is not the owner");
        require(state == State.DRAFT, "Cannot verify unless in the DRAFT state");
        state = State.VERIFYING;
        verificationManager.requestVerification();
    }

    // Terminates the contract by deregistering the user and starting any retention period.
    // Must be in the VERIFIED state to terminate the contract. Otherwise use `close()`
    function terminateContract() external {
        require(msg.sender == owner, "Caller is not the owner");
        require(state == State.VERIFIED, "Can only terminate in the VERIFIED state");
        verificationRegistry.deregisterUser();
        terminationTime = block.timestamp;
        state = State.TERMINATED;
    }

    // Pops the bubble deleting all its data. Can only close if not VERIFIED and not in the
    // retention period.
    function close() external {
        require(msg.sender == owner, "Caller is not the owner");
        require(state != State.VERIFIED, "Cannot close when in the VERIFIED state");
        require(state != State.TERMINATED || isClosed(), "Retention period is still active");
        if (verificationRegistry.isRegistered(owner)) verificationRegistry.deregisterUser();
        state = State.CLOSED;
    }

    // Returns true if the contract has been terminated and any retention period has expired.
    function isClosed() public view returns (bool) {
      return state == State.CLOSED || (state == State.TERMINATED && block.timestamp >= (terminationTime + RETENTION_PERIOD));
    }

}