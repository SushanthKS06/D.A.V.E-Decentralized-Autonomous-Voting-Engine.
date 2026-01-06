export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const VOTING_ABI = [
    "event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 timestamp)",
    "event VotingCreated(uint256 candidateCount, uint256 deadline)",
    "function candidates(uint256) view returns (string)",
    "function hasVoted(address) view returns (bool)",
    "function voteCounts(uint256) view returns (uint256)",
    "function votingDeadline() view returns (uint256)",
    "function deployer() view returns (address)",
    "function getCandidate(uint256 _candidateId) view returns (string)",
    "function getVoteCount(uint256 _candidateId) view returns (uint256)",
    "function getCandidateCount() view returns (uint256)",
    "function isVotingActive() view returns (bool)",
    "function getTimeRemaining() view returns (uint256)",
    "function getAllResults() view returns (string[] names, uint256[] votes)",
    "function checkVoterStatus(address _voter) view returns (bool voted)",
    "function getWinner() view returns (uint256 winnerId, string winnerName, uint256 winnerVotes)",
    "function vote(uint256 _candidateId)"
];

export const NETWORKS = {
    31337: {
        name: "Hardhat Local",
        rpcUrl: "http://127.0.0.1:8545"
    },
    11155111: {
        name: "Sepolia Testnet",
        rpcUrl: "https://rpc.sepolia.org"
    }
};
