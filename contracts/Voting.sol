// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Voting {
    string[] public candidates;
    mapping(address => bool) public hasVoted;
    mapping(uint256 => uint256) public voteCounts;
    uint256 public votingDeadline;
    address public immutable deployer;

    event VoteCast(
        address indexed voter,
        uint256 indexed candidateId,
        uint256 timestamp
    );

    event VotingCreated(uint256 candidateCount, uint256 deadline);

    error VotingEnded();
    error VotingNotEnded();
    error AlreadyVoted();
    error InvalidCandidate();
    error NoCandidates();
    error InvalidDuration();

    constructor(string[] memory _candidateNames, uint256 _durationInSeconds) {
        if (_candidateNames.length == 0) {
            revert NoCandidates();
        }

        if (_durationInSeconds == 0) {
            revert InvalidDuration();
        }

        deployer = msg.sender;

        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidates.push(_candidateNames[i]);
        }

        votingDeadline = block.timestamp + _durationInSeconds;

        emit VotingCreated(candidates.length, votingDeadline);
    }

    function vote(uint256 _candidateId) external {
        if (block.timestamp > votingDeadline) {
            revert VotingEnded();
        }

        if (hasVoted[msg.sender]) {
            revert AlreadyVoted();
        }

        if (_candidateId >= candidates.length) {
            revert InvalidCandidate();
        }

        hasVoted[msg.sender] = true;

        unchecked {
            voteCounts[_candidateId]++;
        }

        emit VoteCast(msg.sender, _candidateId, block.timestamp);
    }

    function getCandidate(uint256 _candidateId) external view returns (string memory) {
        if (_candidateId >= candidates.length) {
            revert InvalidCandidate();
        }
        return candidates[_candidateId];
    }

    function getVoteCount(uint256 _candidateId) external view returns (uint256) {
        if (_candidateId >= candidates.length) {
            revert InvalidCandidate();
        }
        return voteCounts[_candidateId];
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function isVotingActive() external view returns (bool) {
        return block.timestamp <= votingDeadline;
    }

    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= votingDeadline) {
            return 0;
        }
        return votingDeadline - block.timestamp;
    }

    function getWinner() external view returns (
        uint256 winnerId,
        string memory winnerName,
        uint256 winnerVotes
    ) {
        if (block.timestamp <= votingDeadline) {
            revert VotingNotEnded();
        }

        uint256 highestVotes = 0;
        uint256 winningId = 0;

        for (uint256 i = 0; i < candidates.length; i++) {
            if (voteCounts[i] > highestVotes) {
                highestVotes = voteCounts[i];
                winningId = i;
            }
        }

        return (winningId, candidates[winningId], highestVotes);
    }

    function getAllResults() external view returns (
        string[] memory names,
        uint256[] memory votes
    ) {
        uint256 count = candidates.length;
        names = new string[](count);
        votes = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            names[i] = candidates[i];
            votes[i] = voteCounts[i];
        }

        return (names, votes);
    }

    function checkVoterStatus(address _voter) external view returns (bool voted) {
        return hasVoted[_voter];
    }
}
