// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IRegistry.sol";

contract BlindRegistry is IRegistry {

    function isEligibleVoter(address /*voter*/) external override pure returns (bool) {
        return true;
    }

}

