// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for the registry contract to check eligible voters
interface IRegistry {
    function isEligibleVoter(address voter) external view returns (bool);
}
