// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "remix_tests.sol"; // this import is automatically injected by Remix.
import "hardhat/console.sol";
import "https://github.com/Bubble-Protocol/bubble-sdk/blob/main/contracts/AccessControlBits.sol";
import { VerificationRegistry } from "../VerificationRegistry.sol";
import { VerificationManager } from "../VerificationManager.sol";
import { IdentityDataVault } from "../IdentityDataVault.sol";
import { TestRouter } from "./TestRouter.sol";

contract SharedVault_Logic_Test {

    // Test Variables
    address creator = address(this);
    address verifier = address(123); // address of the off-chain function's private key - the secret passed to the chainlink DON
    address randomUser = address(456);
    VerificationRegistry registry;
    VerificationManager manager;
    IdentityDataVault vault;
    TestRouter chainlinkRouter;

    // Constants
    uint256 constant IDENTITY_FILE = 1;
    uint256 constant RESULTS_FILE = 2;

    function beforeAll () public {
        chainlinkRouter = new TestRouter();
        registry = new VerificationRegistry();
        manager = new VerificationManager(registry, 0, address(chainlinkRouter), false);
        vault = new IdentityDataVault(registry, manager, "https://vault.bubbleprotocol.com/v2/polygon");
        registry.addVerificationManager(address(manager));
        registry.addVerificationManager(address(verifier));
        chainlinkRouter.setFunctionsClient(manager);
        Assert.ok(!registry.isTerminated(), "registry should not be terminated by default");
        Assert.ok(!registry.isRegistered(creator), "user should not be registered by default");
        Assert.ok(!registry.isVerified(creator), "user should not be verified by default");
        Assert.ok(uint(vault.state()) == 0, "vault should be in the draft state");
        Assert.ok(!vault.isLockedForVeryifying(), "vault should not be locked by default");
        Assert.ok(!vault.isClosed(), "vault should not be closed");
        Assert.equal(chainlinkRouter.sendRequestCount(), 0, "mock sendRequestCount incorrect");
    }

    function checkDefaultAccessPermissions() public {
        Assert.equal(vault.getAccessPermissions(creator, IDENTITY_FILE), READ_BIT | WRITE_BIT, "creator should have rw access to identity file");
        Assert.equal(vault.getAccessPermissions(creator, RESULTS_FILE), READ_BIT, "creator should have r access to results file");
        Assert.equal(vault.getAccessPermissions(verifier, IDENTITY_FILE), NO_PERMISSIONS, "verifier should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(verifier, RESULTS_FILE), NO_PERMISSIONS, "verifier should have no access to results file");
        Assert.equal(vault.getAccessPermissions(randomUser, IDENTITY_FILE), NO_PERMISSIONS, "unrelated user should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(randomUser, RESULTS_FILE), NO_PERMISSIONS, "unrelated user should have no access to results file");
    }

    function registerUser() public {
        vault.register();
        Assert.ok(registry.isRegistered(creator), "vault should be registered");
    }

    function requestVerification() public {
        chainlinkRouter.setMockRequestId(0);
        vault.verifyIdentity();
        Assert.equal(chainlinkRouter.sendRequestCount(), 1, "mock sendRequestCount incorrect");
        Assert.ok(uint(vault.state()) == 1, "vault should be in the verifying state");
        Assert.ok(vault.isLockedForVeryifying(), "vault id should be locked");
        Assert.ok(!registry.isVerified(creator), "user should not be verified");
        Assert.equal(vault.getAccessPermissions(creator, IDENTITY_FILE), READ_BIT, "creator should have r access to identity file");
        Assert.equal(vault.getAccessPermissions(creator, RESULTS_FILE), READ_BIT, "creator should have r access to results file");
        Assert.equal(vault.getAccessPermissions(verifier, IDENTITY_FILE), READ_BIT, "verifier should have r access to identity file");
        Assert.equal(vault.getAccessPermissions(verifier, RESULTS_FILE), READ_BIT | WRITE_BIT, "verifier should have rw access to results file");
        Assert.equal(vault.getAccessPermissions(randomUser, IDENTITY_FILE), NO_PERMISSIONS, "unrelated user should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(randomUser, RESULTS_FILE), NO_PERMISSIONS, "unrelated user should have no access to results file");
    }

    function publishFailedVerificationResult() public {
        bytes memory response = abi.encodePacked(uint256(0));
        bytes memory error = new bytes(0);
        chainlinkRouter.fulfillRequest(0, response, error);
        Assert.ok(registry.isRegistered(creator), "user should be registered");
        Assert.ok(!registry.isVerified(creator), "user should not be verified");
        Assert.ok(uint(vault.state()) == 0, "vault should be back in the draft state");
        Assert.ok(!vault.isLockedForVeryifying(), "vault should not be locked");
        Assert.equal(vault.getAccessPermissions(creator, IDENTITY_FILE), READ_BIT | WRITE_BIT, "creator should have rw access to identity file");
        Assert.equal(vault.getAccessPermissions(creator, RESULTS_FILE), READ_BIT, "creator should have r access to results file");
        Assert.equal(vault.getAccessPermissions(verifier, IDENTITY_FILE), NO_PERMISSIONS, "verifier should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(verifier, RESULTS_FILE), NO_PERMISSIONS, "verifier should have no access to results file");
        Assert.equal(vault.getAccessPermissions(randomUser, IDENTITY_FILE), NO_PERMISSIONS, "unrelated user should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(randomUser, RESULTS_FILE), NO_PERMISSIONS, "unrelated user should have no access to results file");
    }

    function publishSameResponseFails() public {
        bytes memory response = abi.encodePacked(uint256(0));
        bytes memory error = new bytes(0);
        try chainlinkRouter.fulfillRequest(0, response, error) {
            Assert.ok(false, "method should revert");
        } catch Error(string memory reason) {
            Assert.equal(reason, "Invalid response id", "expected revert message incorrect");
        } catch (bytes memory /*lowLevelData*/) {
            Assert.ok(false, "failed unexpected");
        }
    }

    function requestReVerification1() public {
        chainlinkRouter.setMockRequestId(0);
        vault.verifyIdentity();
        Assert.equal(chainlinkRouter.sendRequestCount(), 2, "mock sendRequestCount incorrect");
        Assert.ok(uint(vault.state()) == 1, "vault should be in the verifying state");
        Assert.ok(vault.isLockedForVeryifying(), "vault id should be locked");
        Assert.ok(!registry.isVerified(creator), "user should not be verified");
    }

    function publishVerificationError() public {
        bytes memory response = new bytes(0);
        bytes memory error = abi.encode("Simulated Error!"); 
        chainlinkRouter.fulfillRequest(0, response, error);
        Assert.ok(registry.isRegistered(creator), "user should be registered");
        Assert.ok(!registry.isVerified(creator), "user should not be verified");
        Assert.ok(uint(vault.state()) == 0, "vault should be back in the draft state");
        Assert.ok(!vault.isLockedForVeryifying(), "vault should not be locked");
    }

    function requestReverification2() public {
        chainlinkRouter.setMockRequestId(0);
        vault.verifyIdentity();
        Assert.equal(chainlinkRouter.sendRequestCount(), 3, "mock sendRequestCount incorrect");
        Assert.ok(uint(vault.state()) == 1, "vault should be in the verifying state");
        Assert.ok(vault.isLockedForVeryifying(), "vault id should be locked");
        Assert.ok(!registry.isVerified(creator), "user should not be verified");
        Assert.equal(vault.getAccessPermissions(creator, IDENTITY_FILE), READ_BIT, "creator should have r access to identity file");
        Assert.equal(vault.getAccessPermissions(creator, RESULTS_FILE), READ_BIT, "creator should have r access to results file");
        Assert.equal(vault.getAccessPermissions(verifier, IDENTITY_FILE), READ_BIT, "verifier should have r access to identity file");
        Assert.equal(vault.getAccessPermissions(verifier, RESULTS_FILE), READ_BIT | WRITE_BIT, "verifier should have rw access to results file");
        Assert.equal(vault.getAccessPermissions(randomUser, IDENTITY_FILE), NO_PERMISSIONS, "unrelated user should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(randomUser, RESULTS_FILE), NO_PERMISSIONS, "unrelated user should have no access to results file");
    }

    function publishVerificationResult() public {
        bytes memory response = abi.encodePacked(uint256(1));
        bytes memory error = new bytes(0);
        chainlinkRouter.fulfillRequest(0, response, error);
        Assert.ok(uint(vault.state()) == 2, "vault should be in the verified state");
        Assert.ok(!vault.isLockedForVeryifying(), "vault should not be locked for verifying");
        Assert.ok(registry.isRegistered(creator), "user should be registered");
        Assert.ok(registry.isVerified(creator), "user should be verified");
        Assert.equal(vault.getAccessPermissions(creator, IDENTITY_FILE), READ_BIT, "creator should have r access to identity file");
        Assert.equal(vault.getAccessPermissions(creator, RESULTS_FILE), READ_BIT, "creator should have r access to results file");
        Assert.equal(vault.getAccessPermissions(verifier, IDENTITY_FILE), NO_PERMISSIONS, "verifier should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(verifier, RESULTS_FILE), NO_PERMISSIONS, "verifier should have no access to results file");
        Assert.equal(vault.getAccessPermissions(randomUser, IDENTITY_FILE), NO_PERMISSIONS, "unrelated user should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(randomUser, RESULTS_FILE), NO_PERMISSIONS, "unrelated user should have no access to results file");
    }

    function terminateContract() public {
        vault.terminateContract();
        Assert.ok(uint(vault.state()) == 3, "vault should be in the terminated state");
        Assert.ok(!vault.isLockedForVeryifying(), "vault should not be locked for verifying");
        Assert.ok(!registry.isRegistered(creator), "user should no longer be registered");
        Assert.ok(!registry.isVerified(creator), "user should no longer be verified");
    }

    function closeBubble() public {
        vault.close();
        Assert.ok(uint(vault.state()) == 4, "vault should be in the closed state");
        Assert.ok(vault.isClosed(), "vault should be closed");
        Assert.ok(!registry.isRegistered(creator), "user should not be registered");
        Assert.ok(!registry.isVerified(creator), "user should not be verified");
        Assert.equal(vault.getAccessPermissions(creator, IDENTITY_FILE), BUBBLE_TERMINATED_BIT, "creator should have r access to identity file");
        Assert.equal(vault.getAccessPermissions(creator, RESULTS_FILE), BUBBLE_TERMINATED_BIT, "creator should have r access to results file");
        Assert.equal(vault.getAccessPermissions(verifier, IDENTITY_FILE), BUBBLE_TERMINATED_BIT, "verifier should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(verifier, RESULTS_FILE), BUBBLE_TERMINATED_BIT, "verifier should have no access to results file");
        Assert.equal(vault.getAccessPermissions(randomUser, IDENTITY_FILE), BUBBLE_TERMINATED_BIT, "unrelated user should have no access to identity file");
        Assert.equal(vault.getAccessPermissions(randomUser, RESULTS_FILE), BUBBLE_TERMINATED_BIT, "unrelated user should have no access to results file");
    }

}