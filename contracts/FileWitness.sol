// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Records when a wallet first anchored a 32-byte file digest.
/// @dev No files, funds, or ownership claims are stored or verified here.
contract FileWitness {
    error EmptyDigest();
    error AlreadyAnchored();

    event FileAnchored(address indexed account, bytes32 indexed digest, uint64 timestamp);

    mapping(address => mapping(bytes32 => uint64)) public anchoredAt;

    function anchor(bytes32 digest) external {
        if (digest == bytes32(0)) revert EmptyDigest();
        if (anchoredAt[msg.sender][digest] != 0) revert AlreadyAnchored();

        uint64 timestamp = uint64(block.timestamp);
        anchoredAt[msg.sender][digest] = timestamp;
        emit FileAnchored(msg.sender, digest, timestamp);
    }
}
