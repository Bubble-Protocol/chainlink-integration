// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerificationManager {

    // Requests the verification process to begin. Calling identity contract must be locked.
    // Designed to be called by the user's identity contract
    function requestVerification() external;

}
