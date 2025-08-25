// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MiniScout
 * @dev Smart contract for MiniScout protocol - handles app registration, feedback, and token rewards
 */
contract MiniScout is ReentrancyGuard, Ownable(msg.sender) {
    IERC20 public protocolToken;
    uint256 private _appIds;
    uint256 public appRegistrationFee = 0.0001 ether;
    uint256 public feedbackReward = 25 * 10 ** 18; // fixed protocol token reward

    struct App {
        uint256 appId;
        address owner;
        string name;
        string description;
        address appToken;
        string miniappUrl;
        string iconUrl;
        uint256 rewardPerReview;
        uint256 totalRatings;
        uint256 totalFeedbackRewards;
        uint256 escrowAmount;
        bool isActive;
        uint256 createdAt;
    }

    struct Feedback {
        uint256 feedbackId;
        uint256 appId;
        address reviewer;
        uint256 rating;
        string comment;
        uint256 rewardAmount;
        uint256 protocolReward;
        uint256 createdAt;
    }

    struct UserTokenReward {
        address tokenAddress;
        uint256 balance;
        uint256 totalEarned;
        uint256 lastUpdated;
    }

    mapping(uint256 => App) public apps;
    mapping(uint256 => uint256[]) public appFeedbacks;
    mapping(uint256 => Feedback) public feedbacks;
    mapping(uint256 => mapping(address => bool)) public userFeedbackGiven;
    mapping(uint256 => uint256) public appEscrow;
    mapping(address => uint256) public userRewards;
    mapping(uint256 => address) public appOwners;
    mapping(string => bool) public registeredAppIds;

    // New mappings for detailed token tracking
    mapping(address => mapping(address => UserTokenReward)) public userTokenRewards; // user => token => reward info
    mapping(address => address[]) public userTokens; // user => array of token addresses they've earned

    uint256 private _feedbackIds;

    event AppRegistered(
        uint256 indexed appId,
        address indexed owner,
        string name,
        string homeUrl,
        string miniappUrl,
        uint256 escrowAmount,
        uint256 rewardPerReview
    );

    event FeedbackSubmitted(
        uint256 indexed feedbackId,
        uint256 indexed appId,
        address indexed reviewer,
        uint256 rating,
        uint256 rewardAmount,
        uint256 protocolReward
    );

    event RewardsClaimed(address indexed user, uint256 amount);
    event AppEscrowUpdated(uint256 indexed appId, uint256 newAmount);
    event AppDeactivated(uint256 indexed appId, address indexed owner);
    event ProtocolSettingsUpdated(uint256 registrationFee, uint256 feedbackReward);

    constructor(address _protocolToken) {
        protocolToken = IERC20(_protocolToken);
    }

    /**
     * @dev Register a new app
     */
    function registerApp(
        string memory name,
        string memory description,
        string memory homeUrl,
        string memory miniappUrl,
        string memory iconUrl,
        string memory appId,
        uint256 tokenAmount,
        uint256 rewardPerReview,
        address appToken
    ) external payable nonReentrant {
        require(msg.value >= appRegistrationFee, "Insufficient registration fee");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(miniappUrl).length > 0, "Miniapp URL cannot be empty");
        require(bytes(appId).length > 0, "App ID cannot be empty");
        require(appToken != address(0), "Invalid token address");
        require(tokenAmount >= rewardPerReview, "Escrow must cover at least one review");
        require(rewardPerReview > 0, "Reward per review must be > 0");
        require(!registeredAppIds[appId], "App ID already registered");

        IERC20 token = IERC20(appToken);
        require(token.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer failed");

        _appIds++;
        uint256 internalAppId = _appIds;

        apps[internalAppId] = App({
            appId: internalAppId,
            owner: msg.sender,
            name: name,
            description: description,
            appToken: appToken,
            miniappUrl: miniappUrl,
            iconUrl: iconUrl,
            rewardPerReview: rewardPerReview,
            totalRatings: 0,
            totalFeedbackRewards: 0,
            escrowAmount: tokenAmount,
            isActive: true,
            createdAt: block.timestamp
        });

        appOwners[internalAppId] = msg.sender;
        appEscrow[internalAppId] = tokenAmount;
        registeredAppIds[appId] = true;

        emit AppRegistered(internalAppId, msg.sender, name, homeUrl, miniappUrl, tokenAmount, rewardPerReview);
    }

    /**
     * @dev Submit feedback
     */
    function submitFeedback(uint256 appId, uint256 rating, string memory comment) external nonReentrant {
        App storage app = apps[appId];
        require(app.isActive, "App not active");
        require(rating >= 1 && rating <= 5, "Rating must be 1-5");
        require(bytes(comment).length > 0, "Empty comment");
        require(appEscrow[appId] >= app.rewardPerReview, "Not enough escrow for reward");
        require(!userFeedbackGiven[appId][msg.sender], "Already reviewed");

        _feedbackIds++;
        uint256 feedbackId = _feedbackIds;

        uint256 appTokenReward = app.rewardPerReview;
        uint256 protocolTokenReward = feedbackReward;

        feedbacks[feedbackId] = Feedback({
            feedbackId: feedbackId,
            appId: appId,
            reviewer: msg.sender,
            rating: rating,
            comment: comment,
            rewardAmount: appTokenReward,
            protocolReward: protocolTokenReward,
            createdAt: block.timestamp
        });

        app.totalRatings++;
        app.totalFeedbackRewards += appTokenReward;

        appEscrow[appId] -= appTokenReward;
        app.escrowAmount = appEscrow[appId];

        appFeedbacks[appId].push(feedbackId);
        userFeedbackGiven[appId][msg.sender] = true;
        userRewards[msg.sender] += appTokenReward;

        // Track app token rewards
        UserTokenReward storage appTokenRewardInfo = userTokenRewards[msg.sender][app.appToken];
        if (appTokenRewardInfo.tokenAddress == address(0)) {
            // First time earning this token
            appTokenRewardInfo.tokenAddress = app.appToken;
            userTokens[msg.sender].push(app.appToken);
        }
        appTokenRewardInfo.balance += appTokenReward;
        appTokenRewardInfo.totalEarned += appTokenReward;
        appTokenRewardInfo.lastUpdated = block.timestamp;

        // Track protocol token rewards
        UserTokenReward storage protocolTokenRewardInfo = userTokenRewards[msg.sender][address(protocolToken)];
        if (protocolTokenRewardInfo.tokenAddress == address(0)) {
            // First time earning protocol tokens
            protocolTokenRewardInfo.tokenAddress = address(protocolToken);
            userTokens[msg.sender].push(address(protocolToken));
        }
        protocolTokenRewardInfo.balance += protocolTokenReward;
        protocolTokenRewardInfo.totalEarned += protocolTokenReward;
        protocolTokenRewardInfo.lastUpdated = block.timestamp;

        IERC20(app.appToken).transfer(msg.sender, appTokenReward);

        if (protocolToken.balanceOf(address(this)) >= protocolTokenReward) {
            protocolToken.transfer(msg.sender, protocolTokenReward);
        }

        emit FeedbackSubmitted(feedbackId, appId, msg.sender, rating, appTokenReward, protocolTokenReward);
    }

    /**
     * @dev Add more escrow to an app
     * @param appId App ID
     * @param amount Amount of tokens to add
     * @param appToken Address of the app owner's token
     */
    function addEscrow(uint256 appId, uint256 amount, address appToken) external nonReentrant {
        require(apps[appId].owner == msg.sender, "Only app owner can add escrow");
        require(apps[appId].isActive, "App is not active");
        require(amount > 0, "Amount must be greater than 0");
        require(appToken != address(0), "Invalid token address");

        // Transfer tokens from app owner to contract
        IERC20 token = IERC20(appToken);
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        appEscrow[appId] += amount;
        apps[appId].escrowAmount = appEscrow[appId];

        emit AppEscrowUpdated(appId, appEscrow[appId]);
    }

    /**
     * @dev Withdraw remaining escrow (only app owner)
     * @param appId App ID
     */
    function withdrawEscrow(uint256 appId) external nonReentrant {
        require(apps[appId].owner == msg.sender, "Only app owner can withdraw escrow");
        require(appEscrow[appId] > 0, "No escrow to withdraw");

        uint256 amount = appEscrow[appId];
        appEscrow[appId] = 0;
        apps[appId].escrowAmount = 0;

        // Transfer tokens back to app owner
        IERC20 token = IERC20(apps[appId].appToken);
        require(token.transfer(msg.sender, amount), "Token transfer failed");

        emit AppEscrowUpdated(appId, 0);
    }

    /**
     * @dev Deactivate an app (only app owner)
     * @param appId App ID
     */
    function deactivateApp(uint256 appId) external nonReentrant {
        require(apps[appId].owner == msg.sender, "Only app owner can deactivate app");
        require(apps[appId].isActive, "App is already deactivated");

        apps[appId].isActive = false;

        // Return remaining escrow to owner
        if (appEscrow[appId] > 0) {
            uint256 amount = appEscrow[appId];
            appEscrow[appId] = 0;
            apps[appId].escrowAmount = 0;

            // Transfer tokens back to app owner
            IERC20 token = IERC20(apps[appId].appToken);
            require(token.transfer(msg.sender, amount), "Token transfer failed");
        }

        emit AppDeactivated(appId, msg.sender);
    }

    /**
     * @dev Claim accumulated protocol token rewards
     */
    function claimProtocolRewards() external nonReentrant {
        uint256 balance = protocolToken.balanceOf(msg.sender);
        require(balance > 0, "No protocol tokens to claim");

        // This would typically involve transferring tokens from a reward pool
        // For now, we'll just emit an event
        emit RewardsClaimed(msg.sender, balance);
    }

    /**
     * @dev Update protocol settings (only owner)
     */
    function updateProtocolSettings(uint256 _registrationFee, uint256 _feedbackReward) external onlyOwner {
        appRegistrationFee = _registrationFee;
        feedbackReward = _feedbackReward;

        emit ProtocolSettingsUpdated(_registrationFee, _feedbackReward);
    }

    /**
     * @dev Get fixed feedback reward
     * @return Fixed reward amount
     */
    function getFeedbackReward() public view returns (uint256) {
        return feedbackReward;
    }

    /**
     * @dev Get app information
     * @param appId App ID
     * @return App information
     */
    function getApp(uint256 appId) external view returns (App memory) {
        return apps[appId];
    }

    /**
     * @dev Get feedback information
     * @param feedbackId Feedback ID
     * @return Feedback information
     */
    function getFeedback(uint256 feedbackId) external view returns (Feedback memory) {
        return feedbacks[feedbackId];
    }

    /**
     * @dev Get all feedback for an app
     * @param appId App ID
     * @return Array of feedback IDs
     */
    function getAppFeedbacks(uint256 appId) external view returns (uint256[] memory) {
        return appFeedbacks[appId];
    }

    /**
     * @dev Get total number of apps
     * @return Total app count
     */
    function getTotalApps() external view returns (uint256) {
        return _appIds;
    }

    /**
     * @dev Get total number of feedback
     * @return Total feedback count
     */
    function getTotalFeedback() external view returns (uint256) {
        return _feedbackIds;
    }

    /**
     * @dev Get user's total rewards
     * @param user User address
     * @return Total rewards earned
     */
    function getUserRewards(address user) external view returns (uint256) {
        return userRewards[user];
    }

    /**
     * @dev Get user's token reward information
     * @param user User address
     * @param tokenAddress Token address
     * @return Token reward information
     */
    function getUserTokenReward(address user, address tokenAddress) external view returns (UserTokenReward memory) {
        return userTokenRewards[user][tokenAddress];
    }

    /**
     * @dev Get all tokens a user has earned
     * @param user User address
     * @return Array of token addresses
     */
    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }

    /**
     * @dev Get user's total rewards across all tokens
     * @param user User address
     * @return Total rewards in wei
     */
    function getUserTotalRewards(address user) external view returns (uint256) {
        uint256 total = 0;
        address[] memory tokens = userTokens[user];

        for (uint256 i = 0; i < tokens.length; i++) {
            UserTokenReward memory reward = userTokenRewards[user][tokens[i]];
            total += reward.totalEarned;
        }

        return total;
    }

    /**
     * @dev Emergency withdraw ETH (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Withdraw protocol tokens (only owner)
     */
    function withdrawProtocolTokens() external onlyOwner {
        uint256 balance = protocolToken.balanceOf(address(this));
        require(balance > 0, "No protocol tokens to withdraw");
        protocolToken.transfer(owner(), balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
