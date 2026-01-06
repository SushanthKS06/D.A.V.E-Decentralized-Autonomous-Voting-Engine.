const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Voting", function () {
    async function deployVotingFixture() {
        const [owner, voter1, voter2, voter3] = await ethers.getSigners();

        const candidates = ["Alice", "Bob", "Charlie"];
        const votingDuration = 86400;

        const Voting = await ethers.getContractFactory("Voting");
        const voting = await Voting.deploy(candidates, votingDuration);

        const deployBlock = await ethers.provider.getBlock("latest");
        const deployTime = deployBlock.timestamp;
        const expectedDeadline = deployTime + votingDuration;

        return {
            voting,
            candidates,
            votingDuration,
            expectedDeadline,
            owner,
            voter1,
            voter2,
            voter3
        };
    }

    describe("Deployment", function () {
        it("Should set the correct candidates", async function () {
            const { voting, candidates } = await loadFixture(deployVotingFixture);

            expect(await voting.getCandidateCount()).to.equal(candidates.length);

            for (let i = 0; i < candidates.length; i++) {
                expect(await voting.getCandidate(i)).to.equal(candidates[i]);
            }
        });

        it("Should set the correct voting deadline", async function () {
            const { voting, expectedDeadline } = await loadFixture(deployVotingFixture);

            const deadline = await voting.votingDeadline();
            expect(deadline).to.be.closeTo(expectedDeadline, 1);
        });

        it("Should set the deployer address", async function () {
            const { voting, owner } = await loadFixture(deployVotingFixture);

            expect(await voting.deployer()).to.equal(owner.address);
        });

        it("Should initialize all vote counts to zero", async function () {
            const { voting, candidates } = await loadFixture(deployVotingFixture);

            for (let i = 0; i < candidates.length; i++) {
                expect(await voting.getVoteCount(i)).to.equal(0);
            }
        });

        it("Should emit VotingCreated event", async function () {
            const candidates = ["Alice", "Bob"];
            const duration = 3600;

            const Voting = await ethers.getContractFactory("Voting");
            const voting = await Voting.deploy(candidates, duration);

            const filter = voting.filters.VotingCreated();
            const events = await voting.queryFilter(filter);
            expect(events.length).to.equal(1);
            expect(events[0].args.candidateCount).to.equal(2);
        });

        it("Should revert if no candidates provided", async function () {
            const Voting = await ethers.getContractFactory("Voting");

            await expect(Voting.deploy([], 86400))
                .to.be.revertedWithCustomError(Voting, "NoCandidates");
        });

        it("Should revert if duration is zero", async function () {
            const Voting = await ethers.getContractFactory("Voting");

            await expect(Voting.deploy(["Alice", "Bob"], 0))
                .to.be.revertedWithCustomError(Voting, "InvalidDuration");
        });
    });

    describe("Voting - Success Cases", function () {
        it("Should allow a user to vote for a valid candidate", async function () {
            const { voting, voter1 } = await loadFixture(deployVotingFixture);

            await voting.connect(voter1).vote(0);

            expect(await voting.getVoteCount(0)).to.equal(1);
            expect(await voting.hasVoted(voter1.address)).to.be.true;
        });

        it("Should correctly update vote counts for multiple voters", async function () {
            const { voting, voter1, voter2, voter3 } = await loadFixture(deployVotingFixture);

            await voting.connect(voter1).vote(0);
            await voting.connect(voter2).vote(0);
            await voting.connect(voter3).vote(1);

            expect(await voting.getVoteCount(0)).to.equal(2);
            expect(await voting.getVoteCount(1)).to.equal(1);
            expect(await voting.getVoteCount(2)).to.equal(0);
        });

        it("Should emit VoteCast event with correct parameters", async function () {
            const { voting, voter1 } = await loadFixture(deployVotingFixture);

            await expect(voting.connect(voter1).vote(1))
                .to.emit(voting, "VoteCast")
                .withArgs(voter1.address, 1, await time.latest() + 1);
        });

        it("Should allow voting right before deadline", async function () {
            const { voting, voter1, votingDuration } = await loadFixture(deployVotingFixture);

            await time.increase(votingDuration - 2);

            await expect(voting.connect(voter1).vote(0)).to.not.be.reverted;
        });
    });

    describe("Voting - Failure Cases", function () {
        it("Should revert if user tries to vote twice", async function () {
            const { voting, voter1 } = await loadFixture(deployVotingFixture);

            await voting.connect(voter1).vote(0);

            await expect(voting.connect(voter1).vote(1))
                .to.be.revertedWithCustomError(voting, "AlreadyVoted");
        });

        it("Should revert for invalid candidate ID", async function () {
            const { voting, voter1, candidates } = await loadFixture(deployVotingFixture);

            await expect(voting.connect(voter1).vote(candidates.length))
                .to.be.revertedWithCustomError(voting, "InvalidCandidate");

            await expect(voting.connect(voter1).vote(999))
                .to.be.revertedWithCustomError(voting, "InvalidCandidate");
        });

        it("Should revert if voting after deadline", async function () {
            const { voting, voter1, votingDuration } = await loadFixture(deployVotingFixture);

            await time.increase(votingDuration + 1);

            await expect(voting.connect(voter1).vote(0))
                .to.be.revertedWithCustomError(voting, "VotingEnded");
        });

        it("Should revert if getCandidate called with invalid ID", async function () {
            const { voting, candidates } = await loadFixture(deployVotingFixture);

            await expect(voting.getCandidate(candidates.length))
                .to.be.revertedWithCustomError(voting, "InvalidCandidate");
        });

        it("Should revert if getVoteCount called with invalid ID", async function () {
            const { voting, candidates } = await loadFixture(deployVotingFixture);

            await expect(voting.getVoteCount(candidates.length))
                .to.be.revertedWithCustomError(voting, "InvalidCandidate");
        });
    });

    describe("Results", function () {
        it("Should correctly report isVotingActive during voting period", async function () {
            const { voting } = await loadFixture(deployVotingFixture);

            expect(await voting.isVotingActive()).to.be.true;
        });

        it("Should correctly report isVotingActive after deadline", async function () {
            const { voting, votingDuration } = await loadFixture(deployVotingFixture);

            await time.increase(votingDuration + 1);

            expect(await voting.isVotingActive()).to.be.false;
        });

        it("Should correctly calculate time remaining", async function () {
            const { voting, votingDuration } = await loadFixture(deployVotingFixture);

            const remaining = await voting.getTimeRemaining();
            expect(remaining).to.be.closeTo(votingDuration, 2);
        });

        it("Should return 0 for time remaining after deadline", async function () {
            const { voting, votingDuration } = await loadFixture(deployVotingFixture);

            await time.increase(votingDuration + 100);

            expect(await voting.getTimeRemaining()).to.equal(0);
        });

        it("Should correctly return all results", async function () {
            const { voting, voter1, voter2, candidates } = await loadFixture(deployVotingFixture);

            await voting.connect(voter1).vote(0);
            await voting.connect(voter2).vote(1);

            const [names, votes] = await voting.getAllResults();

            expect(names.length).to.equal(candidates.length);
            expect(votes[0]).to.equal(1);
            expect(votes[1]).to.equal(1);
            expect(votes[2]).to.equal(0);
        });
    });

    describe("Winner Determination", function () {
        it("Should correctly identify the winner after voting ends", async function () {
            const { voting, voter1, voter2, voter3, votingDuration } = await loadFixture(deployVotingFixture);

            await voting.connect(voter1).vote(0);
            await voting.connect(voter2).vote(0);
            await voting.connect(voter3).vote(1);

            await time.increase(votingDuration + 1);

            const [winnerId, winnerName, winnerVotes] = await voting.getWinner();

            expect(winnerId).to.equal(0);
            expect(winnerName).to.equal("Alice");
            expect(winnerVotes).to.equal(2);
        });

        it("Should return first candidate in case of tie", async function () {
            const { voting, voter1, voter2, votingDuration } = await loadFixture(deployVotingFixture);

            await voting.connect(voter1).vote(0);
            await voting.connect(voter2).vote(1);

            await time.increase(votingDuration + 1);

            const [winnerId, winnerName, winnerVotes] = await voting.getWinner();

            expect(winnerId).to.equal(0);
            expect(winnerName).to.equal("Alice");
        });

        it("Should revert getWinner if voting is still active", async function () {
            const { voting, voter1 } = await loadFixture(deployVotingFixture);

            await voting.connect(voter1).vote(0);

            await expect(voting.getWinner())
                .to.be.revertedWithCustomError(voting, "VotingNotEnded");
        });

        it("Should handle case where no votes were cast", async function () {
            const { voting, votingDuration } = await loadFixture(deployVotingFixture);

            await time.increase(votingDuration + 1);

            const [winnerId, winnerName, winnerVotes] = await voting.getWinner();

            expect(winnerId).to.equal(0);
            expect(winnerName).to.equal("Alice");
            expect(winnerVotes).to.equal(0);
        });
    });

    describe("Voter Status", function () {
        it("Should correctly track voter status", async function () {
            const { voting, voter1, voter2 } = await loadFixture(deployVotingFixture);

            expect(await voting.checkVoterStatus(voter1.address)).to.be.false;
            expect(await voting.checkVoterStatus(voter2.address)).to.be.false;

            await voting.connect(voter1).vote(0);

            expect(await voting.checkVoterStatus(voter1.address)).to.be.true;
            expect(await voting.checkVoterStatus(voter2.address)).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        it("Should work with single candidate", async function () {
            const Voting = await ethers.getContractFactory("Voting");
            const voting = await Voting.deploy(["Only Candidate"], 3600);
            const [, voter1] = await ethers.getSigners();

            await voting.connect(voter1).vote(0);
            expect(await voting.getVoteCount(0)).to.equal(1);
        });

        it("Should work with many candidates", async function () {
            const manyCandidates = Array.from({ length: 20 }, (_, i) => `Candidate ${i}`);

            const Voting = await ethers.getContractFactory("Voting");
            const voting = await Voting.deploy(manyCandidates, 3600);

            expect(await voting.getCandidateCount()).to.equal(20);
        });

        it("Should work with very short voting period", async function () {
            const Voting = await ethers.getContractFactory("Voting");
            const voting = await Voting.deploy(["A", "B"], 1);
            const [, voter1] = await ethers.getSigners();

            await voting.connect(voter1).vote(0);
            expect(await voting.getVoteCount(0)).to.equal(1);
        });
    });
});
