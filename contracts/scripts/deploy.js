const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MiniScout contracts...");

  // Deploy MiniScoutToken first
  console.log("📝 Deploying MiniScoutToken...");
  const MiniScoutToken = await hre.ethers.getContractFactory("MiniScoutToken");
  const initialSupply = 1000000; // 1 million tokens
  const miniScoutToken = await MiniScoutToken.deploy(initialSupply);
  await miniScoutToken.waitForDeployment();

  const tokenAddress = await miniScoutToken.getAddress();
  console.log("✅ MiniScoutToken deployed to:", tokenAddress);

  // Deploy MiniScout main contract
  console.log("🔧 Deploying MiniScout main contract...");
  const MiniScout = await hre.ethers.getContractFactory("MiniScout");
  const miniScout = await MiniScout.deploy(tokenAddress);
  await miniScout.waitForDeployment();

  const miniScoutAddress = await miniScout.getAddress();
  console.log("✅ MiniScout deployed to:", miniScoutAddress);

  // Transfer some tokens to the MiniScout contract for rewards
  console.log("💰 Transferring tokens to MiniScout contract for rewards...");
  const rewardAmount = hre.ethers.parseEther("100000"); // 100k tokens for rewards
  await miniScoutToken.transfer(miniScoutAddress, rewardAmount);
  console.log(
    "✅ Transferred",
    hre.ethers.formatEther(rewardAmount),
    "tokens to MiniScout contract"
  );

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("   MiniScoutToken:", tokenAddress);
  console.log("   MiniScout:", miniScoutAddress);
  console.log("\n📝 Next steps:");
  console.log("   1. Update your .env file with these contract addresses");
  console.log("   2. Verify contracts on Etherscan");
  console.log("   3. Integrate with your MiniScout frontend");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    contracts: {
      MiniScoutToken: tokenAddress,
      MiniScout: miniScoutAddress,
    },
    settings: {
      initialSupply: initialSupply,
      rewardAmount: hre.ethers.formatEther(rewardAmount),
    },
  };

  const fs = require("fs");
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("📄 Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
