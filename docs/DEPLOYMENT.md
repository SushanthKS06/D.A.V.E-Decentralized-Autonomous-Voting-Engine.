# Deployment Instructions

This guide covers deploying the VoteLedger Voting contract using both Remix IDE (beginner-friendly) and Hardhat (professional).

## Table of Contents

1. [Option A: Remix IDE (Easiest)](#option-a-remix-ide-easiest)
2. [Option B: Hardhat Local Network](#option-b-hardhat-local-network)
3. [Option C: Hardhat to Sepolia Testnet](#option-c-hardhat-to-sepolia-testnet)
4. [Post-Deployment Verification](#post-deployment-verification)

---

## Option A: Remix IDE (Easiest)

Remix is a browser-based IDE. No installation required!

### Step 1: Open Remix

1. Go to [https://remix.ethereum.org](https://remix.ethereum.org)
2. You'll see a file explorer on the left

### Step 2: Create the Contract File

1. In the file explorer, click the "contracts" folder
2. Click the "New File" icon (📄)
3. Name it `Voting.sol`
4. Copy and paste the entire contents of `contracts/Voting.sol`

### Step 3: Compile

1. Click the "Solidity Compiler" tab (second icon on the left, or Ctrl+S)
2. Set compiler version to `0.8.19` or later
3. Click "Compile Voting.sol"
4. You should see a green checkmark ✓

### Step 4: Deploy

1. Click the "Deploy & Run Transactions" tab (third icon)
2. Environment: Select one of:
   - "Remix VM (Shanghai)" - for testing (fake ETH, instant)
   - "Injected Provider - MetaMask" - for real networks
3. Fill in constructor parameters:
   - `_CANDIDATENAMES`: `["Alice","Bob","Charlie"]`
   - `_DURATIONINSECONDS`: `86400` (24 hours)
4. Click "Deploy"

### Step 5: Interact

1. Scroll down to "Deployed Contracts"
2. Expand your contract
3. You'll see all the functions:
   - Orange buttons = state-changing (cost gas)
   - Blue buttons = read-only (free)

### Testing in Remix

```
1. Call getCandidateCount() → Should return 3
2. Call getCandidate(0) → Should return "Alice"
3. Call vote(0) → Cast a vote for Alice
4. Call getVoteCount(0) → Should return 1
5. Try vote(0) again → Should fail with "AlreadyVoted"
```

---

## Option B: Hardhat Local Network

This method runs a local Ethereum blockchain on your computer.

### Prerequisites

- Node.js v18+ installed
- VoteLedger project cloned

### Step 1: Install Dependencies

```bash
cd VoteLedger
npm install
```

### Step 2: Compile

```bash
npm run compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### Step 3: Start Local Network

Open a terminal and run:
```bash
npm run node
```

This starts a local Ethereum node with:
- 10 test accounts, each with 10,000 ETH
- Mining blocks automatically
- RPC endpoint at http://127.0.0.1:8545

**Keep this terminal open!**

### Step 4: Deploy

Open a NEW terminal and run:
```bash
npm run deploy:local
```

Expected output:
```
🗳️  VoteLedger Deployment Script
================================

Deploying with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000.0 ETH

Deployment Configuration:
-------------------------
Candidates: ["Alice Johnson", "Bob Smith", "Charlie Brown"]
Voting Duration: 86400 seconds

Deploying Voting contract...

✅ Contract deployed successfully!
================================

Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Save the contract address!**

### Step 5: Interact via Console

```bash
npx hardhat console --network localhost
```

Then in the console:
```javascript
// Get contract
const Voting = await ethers.getContractFactory("Voting")
const voting = Voting.attach("YOUR_CONTRACT_ADDRESS")

// Check candidates
await voting.getCandidateCount()  // 3n

// Vote
await voting.vote(0)  // Vote for Alice

// Check votes
await voting.getVoteCount(0)  // 1n

// Exit
.exit
```

---

## Option C: Hardhat to Sepolia Testnet

Deploying to a real (test) network!

### Step 1: Get Sepolia ETH

1. Get a Sepolia faucet: https://sepoliafaucet.com/ or https://faucet.sepolia.dev/
2. You'll need ~0.01 ETH for deployment

### Step 2: Get an RPC URL

Use a provider like:
- [Alchemy](https://alchemy.com) (free tier available)
- [Infura](https://infura.io) (free tier available)

Sign up and create a Sepolia endpoint.

### Step 3: Configure Environment

Create a `.env` file in the project root:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_wallet_private_key_without_0x_prefix
```

> ⚠️ **NEVER commit .env to git!** It's already in .gitignore.

### Step 4: Update hardhat.config.js

Uncomment the Sepolia network config and add dotenv:

```javascript
require("dotenv").config();

// ... in networks section:
sepolia: {
  url: process.env.SEPOLIA_RPC_URL || "",
  accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  chainId: 11155111,
},
```

Also install dotenv:
```bash
npm install dotenv
```

### Step 5: Deploy

```bash
npm run deploy:sepolia
```

### Step 6: Verify on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS '["Alice","Bob","Charlie"]' 86400
```

---

## Post-Deployment Verification

After deploying, verify everything works:

### Checklist

- [ ] Contract address saved
- [ ] getCandidateCount() returns expected number
- [ ] All candidate names are correct
- [ ] votingDeadline is set correctly
- [ ] isVotingActive() returns true
- [ ] Can cast a vote
- [ ] Double voting is prevented
- [ ] Invalid candidate voting is prevented

### Verification Script

```javascript
async function verifyDeployment(votingAddress) {
  const Voting = await ethers.getContractFactory("Voting");
  const voting = Voting.attach(votingAddress);
  
  console.log("Verifying deployment...\n");
  
  // Check candidates
  const count = await voting.getCandidateCount();
  console.log(`Candidates: ${count}`);
  
  for (let i = 0; i < count; i++) {
    const name = await voting.getCandidate(i);
    console.log(`  [${i}] ${name}`);
  }
  
  // Check deadline
  const deadline = await voting.votingDeadline();
  console.log(`\nDeadline: ${new Date(Number(deadline) * 1000).toISOString()}`);
  
  // Check status
  const active = await voting.isVotingActive();
  console.log(`Voting Active: ${active}`);
  
  console.log("\n✅ Deployment verified!");
}
```

---

## Troubleshooting

### "Nonce too high"
Your MetaMask transaction count doesn't match the network. Reset MetaMask account (Settings → Advanced → Clear Activity).

### "Insufficient funds"
You need ETH for gas. Use a faucet for testnets or add ETH for mainnet.

### "Contract not verified"
Wait a few minutes after deployment, then try verification again.

### "Invalid constructor arguments"
Arrays must be in JSON format: `["a","b","c"]` not `[a, b, c]`

---

## Next Steps

After successful deployment:

1. **Run the tests**: `npm test`
2. **Try the frontend**: See `frontend/` directory
3. **Read the security docs**: `docs/SECURITY.md`
