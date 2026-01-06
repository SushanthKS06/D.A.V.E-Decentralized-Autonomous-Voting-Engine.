# Gas Optimization Analysis

This document analyzes the gas costs of the VoteLedger Voting contract and explains the optimizations applied.

---

## Understanding Gas

**What is Gas?**
- Gas is the unit measuring computational effort in Ethereum
- Every operation costs a specific amount of gas
- Users pay: `gas used × gas price = transaction fee`
- Gas price fluctuates based on network demand

**Why Gas Matters:**
- High gas costs make dApps expensive to use
- Optimized contracts save users money
- But over-optimization can hurt readability

---

## Gas Costs by Operation

### Deployment

| Operation | Approximate Gas | Notes |
|-----------|-----------------|-------|
| Contract deployment (3 candidates) | ~850,000 | One-time cost |
| Each additional candidate | ~35,000 | String storage |

**Breakdown:**
- Base contract bytecode: ~400,000 gas
- Constructor execution: ~150,000 gas
- Storing 3 candidate names: ~300,000 gas

---

### Voting

| Operation | Approximate Gas | Notes |
|-----------|-----------------|-------|
| First vote from address | ~67,000 | Storage: 0→1 (expensive) |
| Voting cost breakdown: | | |
| ├─ Check deadline | ~800 | Read timestamp |
| ├─ Check hasVoted | ~2,100 | Cold storage read |
| ├─ Check candidateId | ~800 | Read array length |
| ├─ Set hasVoted=true | ~22,100 | Storage: 0→1 |
| ├─ Increment voteCount | ~5,000 | Storage: add to existing |
| └─ Emit event | ~1,500 | Log data |

---

### Read Functions (Off-chain)

| Function | Gas Cost | Notes |
|----------|----------|-------|
| getVoteCount() | 0 | Free when called off-chain |
| getCandidate() | 0 | Free when called off-chain |
| getCandidateCount() | 0 | Free when called off-chain |
| getAllResults() | 0 | Free when called off-chain |
| isVotingActive() | 0 | Free when called off-chain |

**Why Free?**
- `view` functions don't modify state
- When called from off-chain (e.g., frontend), they run on the local node
- Only cost gas if called from another contract

---

## Optimizations Applied

### 1. Custom Errors vs require() Strings

**Old Pattern:**
```solidity
require(!hasVoted[msg.sender], "You have already voted");
// Gas: ~23,500
```

**Our Pattern:**
```solidity
if (hasVoted[msg.sender]) revert AlreadyVoted();
// Gas: ~22,000
```

**Savings:** ~1,500 gas per error check

**Why:**
- Error strings are stored in the contract bytecode
- Each character costs deployment gas
- Custom errors are more compact

---

### 2. unchecked{} for Safe Math

**Default (Solidity 0.8+):**
```solidity
voteCounts[_candidateId]++; // Includes overflow check
// Gas: ~5,200
```

**Our Pattern:**
```solidity
unchecked {
    voteCounts[_candidateId]++;
}
// Gas: ~5,000
```

**Savings:** ~200 gas per operation

**Why It's Safe:**
- Max votes = max Ethereum addresses ≈ 2^160
- uint256 max = 2^256
- Overflow is mathematically impossible

---

### 3. immutable for Deployer

**Regular Storage:**
```solidity
address public deployer; // Set in constructor
// Read cost: ~2,100 gas (cold)
```

**Our Pattern:**
```solidity
address public immutable deployer;
// Read cost: ~100 gas
```

**Savings:** ~2,000 gas per read

**Why:**
- `immutable` variables are stored in the contract bytecode
- No storage slot needed
- Much cheaper to read

---

### 4. Mappings vs Arrays for Voter Tracking

**Array Pattern (NOT used):**
```solidity
address[] public voters;
// Checking if voted: O(n) loop, ~2,100 × n gas
```

**Our Pattern:**
```solidity
mapping(address => bool) public hasVoted;
// Checking if voted: O(1), ~2,100 gas
```

**Why:**
- Mappings provide constant-time lookup
- Gas cost doesn't increase with voter count
- Essential for scalability

---

### 5. external vs public

**public functions:**
```solidity
function vote(uint256 _candidateId) public { ... }
// Slightly more expensive due to copied parameters
```

**Our Pattern:**
```solidity
function vote(uint256 _candidateId) external { ... }
// Parameters accessed directly from calldata
```

**Savings:** Small but consistent

---

## Optimizations NOT Applied (And Why)

### bytes32 instead of string

**Could Do:**
```solidity
bytes32[] public candidates;
// ~20,000 gas per candidate storage
```

**We Did:**
```solidity
string[] public candidates;
// ~35,000 gas per candidate storage
```

**Why Not Optimized:**
- strings are more flexible (no 32-char limit)
- More beginner-friendly
- Deployment is one-time cost
- Use case tolerance: few candidates (< 20)

---

### Packed Storage

**Could Do:**
```solidity
// Pack deadline and count in one slot
struct VotingData {
    uint128 deadline;
    uint128 candidateCount;
}
```

**We Did:**
```solidity
uint256 public votingDeadline;
// candidates.length for count
```

**Why Not Optimized:**
- Marginal savings (~2,000 gas deployment)
- Reduces readability significantly
- Learning project prioritizes clarity

---

### Events-Only Vote Storage

**Could Do:**
```solidity
// Don't store votes in mapping, just emit events
// Frontend reconstructs state from event logs
```

**We Did:**
```solidity
mapping(uint256 => uint256) public voteCounts;
// Store vote counts on-chain
```

**Why Not Optimized:**
- On-chain reads are essential for other contracts
- getWinner() needs on-chain data
- Event reconstruction requires off-chain infrastructure
- More complex for beginners

---

## Gas Comparison Table

| Operation | Our Contract | Unoptimized | Savings |
|-----------|--------------|-------------|---------|
| Deploy (3 candidates) | ~850,000 | ~870,000 | ~20,000 |
| Vote | ~67,000 | ~70,000 | ~3,000 |
| Error (AlreadyVoted) | ~22,000 | ~25,000 | ~3,000 |
| Read deployer | ~100 | ~2,100 | ~2,000 |

---

## Testing Gas Usage

Run tests with gas reporting:

```bash
REPORT_GAS=true npm test
```

Sample output:
```
·--------------------------------|---------------------------|
|      Solc version: 0.8.19      ·  Optimizer enabled: true  ·
·································|···························|
|  Methods                                                    |
·--------------------|-----------|·····|·····|···············|
|  Contract  ·  Method           ·  Gas       · # Calls       |
·------------|-------------------|------------|---------------|
|  Voting    ·  vote             ·     67234  ·           15  |
|  Voting    ·  getVoteCount     ·          0  ·           10  |
|  Voting    ·  getCandidateCount·          0  ·            5  |
·------------|-------------------|------------|---------------|
|  Deployments                    ·            ·  % of limit  |
·---------------------------------|------------|---------------|
|  Voting (3 candidates)          ·    852341  ·      2.8 %   |
·---------------------------------|------------|---------------|
```

---

## Cost Estimates (USD)

At different gas prices (assuming 1 ETH = $2,000):

| Operation | 20 gwei | 50 gwei | 100 gwei |
|-----------|---------|---------|----------|
| Deploy | $34.00 | $85.00 | $170.00 |
| Vote | $2.70 | $6.70 | $13.40 |

**Formula:** `cost = gas × (gwei / 1e9) × ethPrice`

---

## Recommendations for Lower Costs

1. **Deploy on Layer 2** (Arbitrum, Optimism, Base)
   - 10-100x cheaper gas
   - Same security guarantees

2. **Use off-peak times**
   - Gas is cheaper when network is less busy
   - Check https://etherscan.io/gastracker

3. **Consider meta-transactions**
   - Users sign votes, relayer pays gas
   - More complex to implement

4. **Batch operations (future)**
   - Allow voting for multiple elections in one tx
   - Share base transaction costs

---

## Future Optimization Ideas

1. **Bitmap voting**
   - Store multiple yes/no votes in single uint256
   - Only for binary choices

2. **Merkle proof verification**
   - Off-chain vote aggregation
   - On-chain proof verification
   - Much lower per-vote cost

3. **Zero-knowledge rollups**
   - Batch thousands of votes
   - Single proof on mainnet
   - Advanced implementation
