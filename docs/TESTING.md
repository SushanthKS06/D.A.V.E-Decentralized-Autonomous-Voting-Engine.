# Manual Test Cases

This document describes manual test cases for the Voting smart contract. Each test case includes:
- **Preconditions**: What must be true before the test
- **Steps**: What to do
- **Expected Result**: What should happen
- **Why It Matters**: Why this test is important

---

## Test Environment Setup

Before running tests, you need:

1. **Remix IDE** or **Hardhat console**
2. **Multiple accounts** (Remix VM provides 10 test accounts)
3. **Deployed contract** with candidates: ["Alice", "Bob", "Charlie"] and 1 hour duration

---

## Success Scenarios ✅

### Test 1: Deploy with Valid Parameters

**Preconditions**: None

**Steps**:
1. Deploy contract with candidates `["Alice", "Bob", "Charlie"]`
2. Set duration to `3600` (1 hour)

**Expected Result**:
- Contract deploys successfully
- `VotingCreated` event emitted with candidateCount=3
- `getCandidateCount()` returns 3
- `getCandidate(0)` returns "Alice"
- `isVotingActive()` returns true

**Why It Matters**: Verifies basic deployment works correctly.

---

### Test 2: Cast a Valid Vote

**Preconditions**: Contract deployed, voting active

**Steps**:
1. From Account 1, call `vote(0)` (vote for Alice)

**Expected Result**:
- Transaction succeeds
- `VoteCast` event emitted with voter=Account1, candidateId=0
- `hasVoted(Account1)` returns true
- `getVoteCount(0)` returns 1

**Why It Matters**: Core functionality - users can vote.

---

### Test 3: Multiple Voters for Same Candidate

**Preconditions**: Contract deployed, voting active

**Steps**:
1. From Account 1, call `vote(0)` (vote for Alice)
2. From Account 2, call `vote(0)` (vote for Alice)
3. From Account 3, call `vote(0)` (vote for Alice)

**Expected Result**:
- All transactions succeed
- `getVoteCount(0)` returns 3

**Why It Matters**: Vote counting works correctly for multiple voters.

---

### Test 4: Votes Split Across Candidates

**Preconditions**: Contract deployed, voting active

**Steps**:
1. Account 1 votes for candidate 0 (Alice)
2. Account 2 votes for candidate 1 (Bob)
3. Account 3 votes for candidate 2 (Charlie)

**Expected Result**:
- `getVoteCount(0)` returns 1
- `getVoteCount(1)` returns 1
- `getVoteCount(2)` returns 1
- `getAllResults()` returns (["Alice","Bob","Charlie"], [1,1,1])

**Why It Matters**: Votes are correctly attributed to each candidate.

---

### Test 5: Get Winner After Deadline

**Preconditions**: Contract deployed, votes cast (2 for Alice, 1 for Bob), deadline passed

**Steps**:
1. Cast votes: 2 for Alice, 1 for Bob
2. Wait for deadline to pass (or use time manipulation in Hardhat)
3. Call `getWinner()`

**Expected Result**:
- Returns (0, "Alice", 2)
- winnerId = 0
- winnerName = "Alice"
- winnerVotes = 2

**Why It Matters**: Winner determination works correctly.

---

### Test 6: Check Time Remaining

**Preconditions**: Contract deployed with 1 hour duration

**Steps**:
1. Immediately call `getTimeRemaining()`

**Expected Result**:
- Returns approximately 3600 (or slightly less due to block time)

**Why It Matters**: Time tracking works for frontend display.

---

## Failure Scenarios ❌

### Test 7: Double Voting Prevented

**Preconditions**: Contract deployed, Account 1 has already voted

**Steps**:
1. Account 1 calls `vote(0)` (succeeds)
2. Account 1 calls `vote(1)` (attempt to vote again)

**Expected Result**:
- Second transaction **reverts** with `AlreadyVoted` error
- Vote count remains unchanged

**Why It Matters**: Prevents election fraud through double voting.

---

### Test 8: Invalid Candidate Rejected

**Preconditions**: Contract deployed with 3 candidates (IDs 0, 1, 2)

**Steps**:
1. Call `vote(3)` (non-existent candidate)
2. Call `vote(999)` (obviously invalid)

**Expected Result**:
- Both transactions **revert** with `InvalidCandidate` error

**Why It Matters**: Prevents wasted votes on invalid candidates.

---

### Test 9: Voting After Deadline Rejected

**Preconditions**: Contract deployed, deadline has passed

**Steps**:
1. Wait for deadline to pass
2. Call `vote(0)`

**Expected Result**:
- Transaction **reverts** with `VotingEnded` error
- `isVotingActive()` returns false

**Why It Matters**: Enforces voting period - late votes are invalid.

---

### Test 10: Get Winner Before Deadline Fails

**Preconditions**: Contract deployed, voting still active

**Steps**:
1. Before deadline, call `getWinner()`

**Expected Result**:
- Transaction **reverts** with `VotingNotEnded` error

**Why It Matters**: Prevents announcing partial results during voting.

---

### Test 11: Deploy with No Candidates Fails

**Preconditions**: None

**Steps**:
1. Attempt to deploy with empty candidate array `[]`

**Expected Result**:
- Deployment **fails** with `NoCandidates` error

**Why It Matters**: Prevents deploying a useless election.

---

### Test 12: Deploy with Zero Duration Fails

**Preconditions**: None

**Steps**:
1. Attempt to deploy with duration `0`

**Expected Result**:
- Deployment **fails** with `InvalidDuration` error

**Why It Matters**: Prevents elections that end immediately.

---

## Edge Cases 🔄

### Test 13: Tie Handling

**Preconditions**: Contract deployed

**Steps**:
1. Account 1 votes for candidate 0
2. Account 2 votes for candidate 1
3. (Now tied: 1 vote each)
4. Wait for deadline
5. Call `getWinner()`

**Expected Result**:
- Returns candidate 0 (first in tie)
- Note: This is documented behavior, not a bug

**Why It Matters**: Documents tie behavior for users.

---

### Test 14: Winner with Zero Votes

**Preconditions**: Contract deployed, NO votes cast

**Steps**:
1. Wait for deadline without casting any votes
2. Call `getWinner()`

**Expected Result**:
- Returns (0, "Alice", 0)
- First candidate "wins" with 0 votes

**Why It Matters**: Contract doesn't break with edge case.

---

### Test 15: Single Candidate Election

**Preconditions**: None

**Steps**:
1. Deploy with single candidate `["Only One"]`
2. Vote for candidate 0
3. Get winner

**Expected Result**:
- All operations succeed
- Winner is correctly "Only One"

**Why It Matters**: Contract works for simple elections.

---

### Test 16: Long Candidate Names

**Preconditions**: None

**Steps**:
1. Deploy with candidate name of 100+ characters

**Expected Result**:
- Deployment succeeds (but costs more gas)
- `getCandidate(0)` returns full name

**Why It Matters**: No arbitrary limits on names.

---

## Gas Usage Tests ⛽

### Test 17: First Vote Gas Cost

**Steps**:
1. Deploy contract
2. Vote from fresh account
3. Note gas used

**Expected Result**:
- Approximately 67,000-75,000 gas
- `hasVoted` storage slot changes from 0→1 (costly)
- Vote count increments

---

### Test 18: Read Function Gas (Off-chain)

**Steps**:
1. Call `getVoteCount(0)` from ethers.js/web3.js

**Expected Result**:
- 0 gas cost (view function called off-chain)

**Why It Matters**: Verifies reads are free.

---

## Test Result Template

Use this template to record test results:

```
Test #: [Number]
Date: [YYYY-MM-DD]
Tester: [Name]
Network: [Hardhat/Remix/Sepolia]

Result: [PASS/FAIL]
Notes: [Any observations]
Gas Used: [If applicable]
Transaction Hash: [If on testnet]
```

---

## Automated Test Suite

For automated testing, run:

```bash
npm test
```

This runs the tests in `test/Voting.test.js` which covers all these scenarios programmatically with assertions.
