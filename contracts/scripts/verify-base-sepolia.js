const { run } = require("hardhat");

async function main() {
  console.log("🔍 Starting contract verification on Base Sepolia...");

  // Contract addresses (replace with your deployed addresses)
  const MINISCOUT_TOKEN_ADDRESS = process.env.MINISCOUT_TOKEN_ADDRESS;
  const MINISCOUT_CONTRACT_ADDRESS = process.env.MINISCOUT_CONTRACT_ADDRESS;

  if (!MINISCOUT_TOKEN_ADDRESS || !MINISCOUT_CONTRACT_ADDRESS) {
    console.error(
      "❌ Please set MINISCOUT_TOKEN_ADDRESS and MINISCOUT_CONTRACT_ADDRESS in your .env file"
    );
    process.exit(1);
  }

  try {
    // Verify MiniScoutToken
    console.log("\n🔧 Verifying MiniScoutToken...");
    await run("verify:verify", {
      address: MINISCOUT_TOKEN_ADDRESS,
      contract: "contracts/MiniScoutToken.sol:MiniScoutToken",
      constructorArguments: [],
      network: "baseSepolia",
    });
    console.log("✅ MiniScoutToken verified successfully!");

    // Verify MiniScout
    console.log("\n🔧 Verifying MiniScout...");
    await run("verify:verify", {
      address: MINISCOUT_CONTRACT_ADDRESS,
      contract: "contracts/MiniScout.sol:MiniScout",
      constructorArguments: [MINISCOUT_TOKEN_ADDRESS],
      network: "baseSepolia",
    });
    console.log("✅ MiniScout verified successfully!");

    console.log("\n🎉 All contracts verified successfully!");
    console.log("🔗 View contracts on BaseScan:");
    console.log(
      "   MiniScoutToken: https://sepolia.basescan.org/address/" +
        MINISCOUT_TOKEN_ADDRESS
    );
    console.log(
      "   MiniScout: https://sepolia.basescan.org/address/" +
        MINISCOUT_CONTRACT_ADDRESS
    );
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
