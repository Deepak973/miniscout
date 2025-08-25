const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Base Sepolia...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy MiniScoutToken first
  console.log("\n🔧 Deploying MiniScoutToken...");
  const MiniScoutToken = await ethers.getContractFactory("MiniScoutToken");
  const miniScoutToken = await MiniScoutToken.deploy();
  await miniScoutToken.deployed();
  console.log("✅ MiniScoutToken deployed to:", miniScoutToken.address);

  // Deploy MiniScout with the token address
  console.log("\n🔧 Deploying MiniScout...");
  const MiniScout = await ethers.getContractFactory("MiniScout");
  const miniScout = await MiniScout.deploy(miniScoutToken.address);
  await miniScout.deployed();
  console.log("✅ MiniScout deployed to:", miniScout.address);

  // Transfer ownership of token to MiniScout contract
  console.log("\n🔧 Transferring token ownership to MiniScout contract...");
  const transferTx = await miniScoutToken.transferOwnership(miniScout.address);
  await transferTx.wait();
  console.log("✅ Token ownership transferred to MiniScout contract");

  // Mint initial tokens to MiniScout contract for rewards
  console.log("\n🔧 Minting initial tokens for rewards...");
  const initialRewardAmount = ethers.utils.parseEther("10000"); // 10,000 tokens for rewards
  const mintTx = await miniScoutToken.mint(
    miniScout.address,
    initialRewardAmount
  );
  await mintTx.wait();
  console.log(
    "✅ Minted",
    ethers.utils.formatEther(initialRewardAmount),
    "tokens to MiniScout contract"
  );

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Contract Addresses:");
  console.log("   MiniScoutToken:", miniScoutToken.address);
  console.log("   MiniScout:", miniScout.address);
  console.log("\n🔗 Base Sepolia Explorer:");
  console.log(
    "   MiniScoutToken: https://sepolia.basescan.org/address/" +
      miniScoutToken.address
  );
  console.log(
    "   MiniScout: https://sepolia.basescan.org/address/" + miniScout.address
  );

  console.log("\n📝 Next steps:");
  console.log("   1. Verify contracts on BaseScan");
  console.log("   2. Update your frontend with the contract addresses");
  console.log("   3. Test the contracts on Base Sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
