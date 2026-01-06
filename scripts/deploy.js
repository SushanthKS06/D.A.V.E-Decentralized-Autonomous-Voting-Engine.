const hre = require("hardhat");

async function main() {
    console.log("VoteLedger Deployment Script");
    console.log("================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

    const candidates = [
         "Sushanth",
        "Thalapathy Vetri Kondan",
        "JD"
    ];

    const votingDurationSeconds = 86400;

    console.log("Deployment Configuration:");
    console.log("-------------------------");
    console.log("Candidates:", candidates);
    console.log("Voting Duration:", votingDurationSeconds, "seconds");
    console.log("                ", (votingDurationSeconds / 3600).toFixed(2), "hours\n");

    console.log("Deploying Voting contract...\n");

    const Voting = await hre.ethers.getContractFactory("Voting");
    const voting = await Voting.deploy(candidates, votingDurationSeconds);

    await voting.waitForDeployment();

    const contractAddress = await voting.getAddress();

    console.log(" Contract deployed successfully!");
    console.log("================================\n");
    console.log("Contract Address:", contractAddress);

    const deadline = await voting.votingDeadline();
    const candidateCount = await voting.getCandidateCount();

    console.log("\nContract Details:");
    console.log("-----------------");
    console.log("Number of candidates:", candidateCount.toString());
    console.log("Voting deadline:", new Date(Number(deadline) * 1000).toISOString());
    console.log("Deployer address:", await voting.deployer());

    console.log("\nRegistered Candidates:");
    for (let i = 0; i < candidateCount; i++) {
        const name = await voting.getCandidate(i);
        console.log(`  [${i}] ${name}`);
    }

    console.log("\n================================");
    console.log(" Next Steps:");
    console.log("================================\n");

    console.log("1. Save this contract address:", contractAddress);
    console.log("\n2. Interact with the contract:");
    console.log("   npx hardhat console --network localhost");
    console.log('   > const Voting = await ethers.getContractFactory("Voting")');
    console.log(`   > const voting = Voting.attach("${contractAddress}")`);
    console.log("   > await voting.vote(0)");
    console.log("   > await voting.getVoteCount(0)\n");

    console.log("3. For Etherscan verification (testnet only):");
    console.log(`   npx hardhat verify --network sepolia ${contractAddress} '${JSON.stringify(candidates)}' ${votingDurationSeconds}\n`);

    return {
        address: contractAddress,
        candidates,
        votingDurationSeconds,
        deadline: Number(deadline)
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n Deployment failed!");
        console.error(error);
        process.exit(1);
    });
