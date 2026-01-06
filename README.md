# VoteLedger 

A beginner-friendly, secure, and transparent blockchain voting system built with Solidity and Ethereum.

## What is VoteLedger?

VoteLedger is a smart contract-based voting system that demonstrates fundamental blockchain concepts:

- **Immutability**: Once cast, votes cannot be changed or deleted
- **Transparency**: Anyone can verify the vote counts on-chain
- **Trustlessness**: No central authority controls the election
- **Security**: Built-in protections against common attack vectors


## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed
- Basic understanding of Ethereum and smart contracts
- MetaMask or similar wallet (for interacting with deployed contracts)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd VoteLedger

# Install dependencies
npm install
```

### Compile the Contract

```bash
npm run compile
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas
```

### Deploy Locally

```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contract
npm run deploy:local
```

## Project Structure

```
VoteLedger/
├── contracts/
│   └── Voting.sol          # The main smart contract
├── scripts/
│   └── deploy.js           # Deployment script
├── test/
│   └── Voting.test.js      # Comprehensive test suite
├── docs/
│   ├── CONTRACT_EXPLANATION.md   # Line-by-line code explanation
│   ├── DEPLOYMENT.md             # Deployment instructions
│   ├── TESTING.md                # Test case documentation
│   ├── SECURITY.md               # Security analysis
│   └── GAS_OPTIMIZATION.md       # Gas considerations
├── frontend/                # Optional React frontend
├── hardhat.config.js        # Hardhat configuration
├── package.json
└── README.md               # This file
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     VOTING.SOL CONTRACT                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │  Candidates │   │  Voters     │   │  Vote Counts    │   │
│  │  string[]   │   │  mapping    │   │  mapping        │   │
│  │             │   │  addr→bool  │   │  id→uint256     │   │
│  └─────────────┘   └─────────────┘   └─────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    FUNCTIONS                         │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  vote(candidateId)     → Cast a vote                │   │
│  │  getCandidate(id)      → Get candidate name         │   │
│  │  getVoteCount(id)      → Get votes for candidate    │   │
│  │  getCandidateCount()   → Total candidates           │   │
│  │  isVotingActive()      → Check if voting is open    │   │
│  │  getWinner()           → Get winner after deadline  │   │
│  │  getAllResults()       → Get all candidates & votes │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. One Vote Per Address
Each Ethereum address can only vote once. Attempting to vote twice results in a revert.

### 2. Fixed Voting Period
The voting deadline is set at deployment and cannot be changed. Votes after the deadline are rejected.

### 3. Immutable Votes
Once cast, votes cannot be modified or deleted. This ensures election integrity.

### 4. Transparent Results
Anyone can query the current vote counts at any time. After the deadline, anyone can see the winner.

### 5. No Owner Privileges
The deployer has no special powers after deployment. They cannot:
- Add or remove candidates
- Extend or shorten the voting period
- Modify vote counts
- Censor voters

## How to Use

### As a Voter

1. Connect your wallet to the network where the contract is deployed
2. Call `vote(candidateId)` with the ID of your chosen candidate
3. Confirm the transaction in your wallet
4. Your vote is now permanently recorded!

### As an Observer

1. Call `getAllResults()` to see all candidates and their vote counts
2. Call `isVotingActive()` to check if voting is still open
3. After the deadline, call `getWinner()` to see the winner

## Interview Talking Points

When discussing this project in an interview, you can highlight:

### Design Decisions

1. **Why `mapping` for voters instead of array?**
   - O(1) lookup vs O(n) search
   - Prevents double voting efficiently
   - More gas efficient

2. **Why custom errors instead of require strings?**
   - Gas savings (~200-500 gas per error)
   - Better developer experience with structured errors
   - More readable in debugging tools

3. **Why `block.timestamp` for deadline?**
   - Simple and readable
   - Accurate enough for voting periods
   - Known limitation: miners can manipulate by ~15 seconds (acceptable trade-off)

4. **Why no upgradeability?**
   - Adds complexity and trust assumptions
   - For voting, immutability is a feature, not a bug
   - Users can verify the code won't change

### Security Measures

1. **Checks-Effects-Interactions pattern**: State changes happen before any external calls
2. **Input validation**: All candidate IDs are bounds-checked
3. **No re-entrancy risk**: No external calls in critical functions
4. **No owner abuse**: Deployer has zero privileges after deployment

### Known Limitations

1. **No privacy**: All votes are public
2. **No Sybil resistance**: One person can create many wallets
3. **Fixed candidates**: Cannot add/remove after deployment
4. **Gas costs**: Each vote costs ~60,000 gas

## Documentation

- [Line-by-Line Contract Explanation](docs/CONTRACT_EXPLANATION.md)
- [Deployment Instructions](docs/DEPLOYMENT.md)
- [Test Cases](docs/TESTING.md)
- [Security Analysis](docs/SECURITY.md)
- [Gas Optimization](docs/GAS_OPTIMIZATION.md)

## Future Improvements

1. **Commit-Reveal Scheme**: Hide votes until the deadline for privacy
2. **Delegation**: Allow users to delegate their votes
3. **Weighted Voting**: Integrate with ERC-20 tokens
4. **Post-Quantum Signatures**: For long-term security
5. **Off-Chain Voting**: Use EIP-712 signatures for gasless voting



