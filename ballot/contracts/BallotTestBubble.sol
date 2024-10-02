// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlledStorage.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlBits.sol";
import {IRegistry} from "./IRegistry.sol";

contract BallotTestBubble is AccessControlledStorage {

    address public admin;
    address public voteCounter;
    IRegistry public voterRegistry;
    uint256 public ballotEndTime;
    uint256 public ballotDeleteTime;
    bool public ballotFinalized;
    bool public resultsReported;

    event VotesCounted(uint256[] results, bytes32 merkleRoot);

    /**
     * @dev Initialise this ballot with the voter registry, vote counter address, ballot end and deletion times, 
     * and chainlink functions parameters
     */
    constructor(
        address _registryAddress,   // address of the voter registry contract
        address _voteCounter,       // address of the vote counter
        uint256 _endTime,           // the ballot period end
        uint256 _deletionTime       // the time that the off-chain bubble can be deleted
    )
    {
        admin = msg.sender;
        voterRegistry = IRegistry(_registryAddress);
        ballotEndTime = _endTime;
        ballotDeleteTime = _deletionTime;
        voteCounter = _voteCounter;
        ballotFinalized = false;
        resultsReported = false;
    }

    /**
     * @dev Can be called by anyone to finalize the ballot once the ballot period has ended.
     *
     * Instructs the off-chain chainlink function to count the votes held in the bubble. The results will
     * be written by the chainlink function via the `reportResults` method.
     */
    function finalizeBallot() external {
        require(block.timestamp >= ballotEndTime, "Ballot period not ended.");
        require(!ballotFinalized, "Ballot has already been finalized.");
        ballotFinalized = true;
    }

    /**
     * @dev Called by the chainlink router (the automated vote counter) to report the ballot results.
     *
     * The results are emitted as an event. Once reported the results cannot be changed.
     */
    function reportResults(uint256[] memory results, bytes32 merkleRoot) external {
        require(ballotFinalized, "Ballot not finalized.");
        require(msg.sender == voteCounter, "Only the vote counter can report results.");
        emit VotesCounted(results, merkleRoot);
        resultsReported = true;
    }

    /**
     * @dev the access permissions for the off chain bubble.
     *
     * Features:
     *   - admin and vote counter are not eligable to vote
     *   - only the admin can create the off-chain bubble
     *   - eligable voters vote by writing to a file named after their address
     *   - once the ballot has been finalized no more votes can be written
     *   - the vote counter only has access once the ballot has been finalized
     *   - once the ballot has been finalized, the vote counter has read access to all votes and can write the results file
     *   - once the results have been reported they cannot be changed
     */
    function getAccessPermissions( address user, uint256 contentId ) override external view returns (uint256) {

        // delete the bubble if the delete time has been reached
        if (block.timestamp >= ballotDeleteTime) return BUBBLE_TERMINATED_BIT;

        // user specific access rights

        if (user == admin) {
            // allow admin only to construct the off-chain bubble
            return WRITE_BIT;
        }

        else if (user == voteCounter) {
            // allow the vote counter to read votes and write the results to a results file only when the ballot is finalized.
            if (ballotFinalized && !resultsReported) {
                if (contentId == RESULTS_FILE) return RWA_BITS;
                else return READ_BIT;
            }
            else return NO_PERMISSIONS;
        }

        else if (voterRegistry.isEligibleVoter(user)) {
            // allow voters to read, write and change their own vote until the ballot has ended, after which make read only
            if (contentId == uint256(uint160(user))) return !ballotFinalized ? READ_BIT | WRITE_BIT : READ_BIT;
            else if (contentId == RESULTS_FILE) return READ_BIT;
            else return NO_PERMISSIONS;
        }

        else {
            // allow anyone else to read the results file at any time but no access to voter files
            if (contentId == RESULTS_FILE) return READ_BIT;
            return NO_PERMISSIONS;
        }
    }

}

// Bubble structure
uint256 constant RESULTS_FILE = 1;
