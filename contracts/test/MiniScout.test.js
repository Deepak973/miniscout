const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MiniScout", function () {
  let MiniScoutToken, MiniScout;
  let miniScoutToken, miniScout;
  let owner, appOwner, reviewer1, reviewer2;
  let appId;

  beforeEach(async function () {
    [owner, appOwner, reviewer1, reviewer2] = await ethers.getSigners();

    // Deploy MiniScoutToken
    MiniScoutToken = await ethers.getContractFactory("MiniScoutToken");
    miniScoutToken = await MiniScoutToken.deploy(1000000); // 1M tokens

    // Deploy MiniScout
    MiniScout = await ethers.getContractFactory("MiniScout");
    miniScout = await MiniScout.deploy(await miniScoutToken.getAddress());

    // Transfer tokens to MiniScout contract for rewards
    await miniScoutToken.transfer(
      await miniScout.getAddress(),
      ethers.parseEther("100000")
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await miniScout.owner()).to.equal(owner.address);
    });

    it("Should set the correct protocol token", async function () {
      expect(await miniScout.protocolToken()).to.equal(
        await miniScoutToken.getAddress()
      );
    });

    it("Should have correct initial settings", async function () {
      expect(await miniScout.appRegistrationFee()).to.equal(
        ethers.parseEther("0.01")
      );
      expect(await miniScout.minFeedbackReward()).to.equal(
        ethers.parseEther("10")
      );
      expect(await miniScout.maxFeedbackReward()).to.equal(
        ethers.parseEther("100")
      );
      expect(await miniScout.appOwnerRewardPercentage()).to.equal(20);
      expect(await miniScout.protocolFeePercentage()).to.equal(5);
    });
  });

  describe("App Registration", function () {
    it("Should register an app successfully", async function () {
      const registrationFee = await miniScout.appRegistrationFee();
      const escrowAmount = ethers.parseEther("0.1");
      const totalAmount = registrationFee + escrowAmount;

      await expect(
        miniScout
          .connect(appOwner)
          .registerApp(
            "Test App",
            "Test Description",
            "https://test.com",
            "https://test.com/miniapp",
            "https://test.com/icon.png",
            { value: totalAmount }
          )
      )
        .to.emit(miniScout, "AppRegistered")
        .withArgs(
          1,
          appOwner.address,
          "Test App",
          "https://test.com",
          "https://test.com/miniapp",
          totalAmount
        );

      const app = await miniScout.getApp(1);
      expect(app.owner).to.equal(appOwner.address);
      expect(app.name).to.equal("Test App");
      expect(app.isActive).to.be.true;
      expect(app.escrowAmount).to.equal(totalAmount);
    });

    it("Should fail with insufficient registration fee", async function () {
      const insufficientFee = ethers.parseEther("0.005");

      await expect(
        miniScout
          .connect(appOwner)
          .registerApp(
            "Test App",
            "Test Description",
            "https://test.com",
            "https://test.com/miniapp",
            "https://test.com/icon.png",
            { value: insufficientFee }
          )
      ).to.be.revertedWith("Insufficient registration fee");
    });

    it("Should fail with empty name", async function () {
      const registrationFee = await miniScout.appRegistrationFee();

      await expect(
        miniScout
          .connect(appOwner)
          .registerApp(
            "",
            "Test Description",
            "https://test.com",
            "https://test.com/miniapp",
            "https://test.com/icon.png",
            { value: registrationFee }
          )
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Feedback Submission", function () {
    beforeEach(async function () {
      // Register an app first
      const registrationFee = await miniScout.appRegistrationFee();
      const escrowAmount = ethers.parseEther("0.1");
      const totalAmount = registrationFee + escrowAmount;

      await miniScout
        .connect(appOwner)
        .registerApp(
          "Test App",
          "Test Description",
          "https://test.com",
          "https://test.com/miniapp",
          "https://test.com/icon.png",
          { value: totalAmount }
        );

      appId = 1;
    });

    it("Should submit feedback successfully", async function () {
      const initialBalance = await ethers.provider.getBalance(
        reviewer1.address
      );

      await expect(
        miniScout.connect(reviewer1).submitFeedback(appId, 5, "Great app!")
      ).to.emit(miniScout, "FeedbackSubmitted");

      const app = await miniScout.getApp(appId);
      expect(app.totalRatings).to.equal(1);
      expect(app.averageRating).to.equal(5);

      const finalBalance = await ethers.provider.getBalance(reviewer1.address);
      expect(finalBalance).to.be.gt(initialBalance); // Should receive ETH reward
    });

    it("Should fail with invalid rating", async function () {
      await expect(
        miniScout.connect(reviewer1).submitFeedback(appId, 6, "Great app!")
      ).to.be.revertedWith("Rating must be between 1 and 5");
    });

    it("Should fail with empty comment", async function () {
      await expect(
        miniScout.connect(reviewer1).submitFeedback(appId, 5, "")
      ).to.be.revertedWith("Comment cannot be empty");
    });

    it("Should fail for inactive app", async function () {
      // Deactivate the app
      await miniScout.connect(appOwner).deactivateApp(appId);

      await expect(
        miniScout.connect(reviewer1).submitFeedback(appId, 5, "Great app!")
      ).to.be.revertedWith("App is not active");
    });
  });

  describe("Escrow Management", function () {
    beforeEach(async function () {
      // Register an app first
      const registrationFee = await miniScout.appRegistrationFee();
      const escrowAmount = ethers.parseEther("0.1");
      const totalAmount = registrationFee + escrowAmount;

      await miniScout
        .connect(appOwner)
        .registerApp(
          "Test App",
          "Test Description",
          "https://test.com",
          "https://test.com/miniapp",
          "https://test.com/icon.png",
          { value: totalAmount }
        );

      appId = 1;
    });

    it("Should add escrow successfully", async function () {
      const additionalEscrow = ethers.parseEther("0.05");

      await expect(
        miniScout
          .connect(appOwner)
          .addEscrow(appId, { value: additionalEscrow })
      ).to.emit(miniScout, "AppEscrowUpdated");

      const app = await miniScout.getApp(appId);
      const expectedEscrow = ethers.parseEther("0.15"); // 0.1 + 0.05
      expect(app.escrowAmount).to.equal(expectedEscrow);
    });

    it("Should withdraw escrow successfully", async function () {
      const initialBalance = await ethers.provider.getBalance(appOwner.address);

      await expect(miniScout.connect(appOwner).withdrawEscrow(appId)).to.emit(
        miniScout,
        "AppEscrowUpdated"
      );

      const app = await miniScout.getApp(appId);
      expect(app.escrowAmount).to.equal(0);

      const finalBalance = await ethers.provider.getBalance(appOwner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should fail to add escrow from non-owner", async function () {
      const additionalEscrow = ethers.parseEther("0.05");

      await expect(
        miniScout
          .connect(reviewer1)
          .addEscrow(appId, { value: additionalEscrow })
      ).to.be.revertedWith("Only app owner can add escrow");
    });
  });

  describe("App Management", function () {
    beforeEach(async function () {
      // Register an app first
      const registrationFee = await miniScout.appRegistrationFee();
      const escrowAmount = ethers.parseEther("0.1");
      const totalAmount = registrationFee + escrowAmount;

      await miniScout
        .connect(appOwner)
        .registerApp(
          "Test App",
          "Test Description",
          "https://test.com",
          "https://test.com/miniapp",
          "https://test.com/icon.png",
          { value: totalAmount }
        );

      appId = 1;
    });

    it("Should deactivate app successfully", async function () {
      await expect(miniScout.connect(appOwner).deactivateApp(appId))
        .to.emit(miniScout, "AppDeactivated")
        .withArgs(appId, appOwner.address);

      const app = await miniScout.getApp(appId);
      expect(app.isActive).to.be.false;
    });

    it("Should fail to deactivate from non-owner", async function () {
      await expect(
        miniScout.connect(reviewer1).deactivateApp(appId)
      ).to.be.revertedWith("Only app owner can deactivate app");
    });
  });

  describe("Reward Calculation", function () {
    it("Should calculate rewards correctly", async function () {
      const reward1 = await miniScout.calculateBaseReward(1);
      const reward3 = await miniScout.calculateBaseReward(3);
      const reward5 = await miniScout.calculateBaseReward(5);

      expect(reward1).to.equal(ethers.parseEther("10")); // Min reward
      expect(reward5).to.equal(ethers.parseEther("100")); // Max reward
      expect(reward3).to.be.gt(reward1);
      expect(reward3).to.be.lt(reward5);
    });
  });

  describe("Protocol Settings", function () {
    it("Should update settings successfully", async function () {
      await expect(
        miniScout.updateProtocolSettings(
          ethers.parseEther("0.02"), // New registration fee
          ethers.parseEther("20"), // New min reward
          ethers.parseEther("200"), // New max reward
          25, // New owner reward percentage
          10 // New protocol fee percentage
        )
      ).to.emit(miniScout, "ProtocolSettingsUpdated");

      expect(await miniScout.appRegistrationFee()).to.equal(
        ethers.parseEther("0.02")
      );
      expect(await miniScout.minFeedbackReward()).to.equal(
        ethers.parseEther("20")
      );
      expect(await miniScout.maxFeedbackReward()).to.equal(
        ethers.parseEther("200")
      );
      expect(await miniScout.appOwnerRewardPercentage()).to.equal(25);
      expect(await miniScout.protocolFeePercentage()).to.equal(10);
    });

    it("Should fail with invalid percentages", async function () {
      await expect(
        miniScout.updateProtocolSettings(
          ethers.parseEther("0.02"),
          ethers.parseEther("20"),
          ethers.parseEther("200"),
          50, // 50% owner reward
          60 // 60% protocol fee = 110% total
        )
      ).to.be.revertedWith("Percentages exceed 100%");
    });
  });
});
