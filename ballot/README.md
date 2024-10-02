# Ballot
Experimental integration of Bubble Protocol with Chainlnk Functions. 
A decentralised ballot consisting of on-chain voter registry, on-chain ballot process, off-chain bubble to record votes, and a chainlink function to count votes when the ballot has ended.

***This experiment failed due to Chainlink's limit of 5 API calls per function***

# Design

## Contracts

[`IRegistry.sol`](contracts/IRegistry.sol)

On-chain voter registry interface that indicates if an address is eligable to vote. [`BlindRegistry.sol`](contracts/BlindRegistry.sol) is a test implementation that assumes everyone is eligable.

---
[`Ballot.sol`](contracts/Ballot.sol)

Manages the ballot process and controls the bubble. The ballot has an end time and a deletion time. After the end time the ballot can be *finalized* by anyone, which triggers the Chainlink Function. The Chainlink Function has its own private key passed as a secret, which it uses to access the bubble and count the votes, passing the results back to the Ballot. [`BallotTestBubble.sol`](contracts/BallotTestBubble.sol) is a test version that doesn't include the call to  chainlink.

Voters write their vote to the bubble in a file named as their public address. The vote has the structure `{vote: <delegate>, signature: <sig>}` and is encrypted so only the voter and the vote counter can read it (encryption not implemented). The voter can change their vote at any time until the ballot has been finalized after which it can no longer be written to. 

[`ChainlinkConsumer.sol`](contracts/ChainlinkConsumer.sol)

Abstract contract that encapsulates a chainlink function. `Ballot` inherits this contract.

## Chainlink Function

[`CountVotes.js`](functions/CountVotes.js) counts the votes when triggered by the `Ballot` contract and provides the *Vote Counter* role. The `Ballot` contract limits the Vote Counter's bubble access to after the ballot has been finalized. 

The function reads the bubble root directory then reads all submitted votes, counting them and writing the result to file `0x01`. The result includes the delegate counts and a list of the voters whose votes were counted, each stored as the hash of the vote signature so that the voter can validate that their vote was counted.

The source code does not use the Bubble Protocol libraries instead constructing the signed requests itself.