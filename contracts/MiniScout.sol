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
    bool public registrationFeeApplicable = false;

    struct App {
        uint256 appId;
        address owner;
        uint256 ownerFid;
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
        uint256 fid;
        address reviewer;
        uint256 rating;
        string comment;
        uint256 rewardAmount;
        uint256 protocolReward;
        uint256 createdAt;
    }

    mapping(uint256 => App) public apps;
    mapping(uint256 => uint256[]) public appFeedbacks;
    mapping(uint256 => Feedback) public feedbacks;
    mapping(uint256 => mapping(address => bool)) public userFeedbackGiven;
    mapping(uint256 => uint256) public appEscrow;
    mapping(address => uint256) public userRewards;
    mapping(uint256 => address) public appOwners;
    mapping(string => bool) public registeredAppIds;
    mapping(address => uint256[]) public userFeedbackIds;
    mapping(uint256 => uint256[]) public fidToUserFeedbackMapping;

    uint256 private _feedbackIds;

    event AppRegistered(
        uint256 indexed appId,
        address indexed owner,
        string name,
        string homeUrl,
        string miniappUrl,
        string iconUrl,
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
        uint256 ownerFid,
        string memory homeUrl,
        string memory miniappUrl,
        string memory iconUrl,
        string memory appId,
        uint256 tokenAmount,
        uint256 rewardPerReview,
        address appToken
    ) external payable nonReentrant {
        if (registrationFeeApplicable) {
            require(msg.value >= appRegistrationFee, "Insufficient registration fee");
        }
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
            ownerFid: ownerFid,
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

        emit AppRegistered(internalAppId, msg.sender, name, homeUrl, miniappUrl, iconUrl, tokenAmount, rewardPerReview);
    }

    /**
     * @dev Submit feedback
     */
    function submitFeedback(uint256 appId, uint256 rating, string memory comment, uint256 fid) external nonReentrant {
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
            fid: fid,
            rating: rating,
            comment: comment,
            rewardAmount: appTokenReward,
            protocolReward: protocolTokenReward,
            createdAt: block.timestamp
        });

        userFeedbackIds[msg.sender].push(feedbackId);
        fidToUserFeedbackMapping[fid].push(feedbackId);

        app.totalRatings++;
        app.totalFeedbackRewards += appTokenReward;

        appEscrow[appId] -= appTokenReward;
        app.escrowAmount = appEscrow[appId];

        appFeedbacks[appId].push(feedbackId);
        userFeedbackGiven[appId][msg.sender] = true;
        userRewards[msg.sender] += appTokenReward;

        IERC20(app.appToken).transfer(msg.sender, appTokenReward);

        if (protocolToken.balanceOf(address(this)) >= protocolTokenReward) {
            protocolToken.transfer(msg.sender, protocolTokenReward);
        }

        emit FeedbackSubmitted(feedbackId, appId, msg.sender, rating, appTokenReward, protocolTokenReward);
    }

    /**
     * @dev Update an existing feedback (rating & comment)
     * @param feedbackId Feedback ID
     * @param newRating New rating (1–5)
     * @param newComment New feedback comment
     */
    function updateFeedback(uint256 feedbackId, uint256 newRating, string memory newComment) external nonReentrant {
        Feedback storage fb = feedbacks[feedbackId];
        require(fb.reviewer == msg.sender, "Not feedback owner");
        require(newRating >= 1 && newRating <= 5, "Rating must be 1-5");
        require(block.timestamp >= fb.createdAt + 1 days, "Can only update after 1 day");
        require(bytes(newComment).length > 0, "Empty comment");
        uint256 appTokenReward = apps[feedbacks[feedbackId].appId].rewardPerReview;
        IERC20(apps[feedbacks[feedbackId].appId].appToken).transfer(msg.sender, appTokenReward / 2);
        fb.rating = newRating;
        fb.comment = newComment;
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
     * @return Apps information
     */
    function getApps() external view returns (App[] memory) {
        App[] memory result = new App[](_appIds);

        for (uint256 i = 0; i < _appIds; i++) {
            result[i] = apps[i + 1];
        }
        return result;
    }

    function getApp(uint256 _appId) public view returns (App memory) {
        return apps[_appId];
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
     * @dev Get all feedback structs for a user
     * @param user User address
     * @return Array of Feedback structs
     */
    function getUserFeedbacks(address user) external view returns (Feedback[] memory) {
        uint256[] storage feedbackIds = userFeedbackIds[user];
        Feedback[] memory result = new Feedback[](feedbackIds.length);

        for (uint256 i = 0; i < feedbackIds.length; i++) {
            result[i] = feedbacks[feedbackIds[i]];
        }
        return result;
    }

    function getAppFeedbacks(uint256 appId) external view returns (Feedback[] memory) {
        uint256[] storage feedbackIds = appFeedbacks[appId];
        Feedback[] memory result = new Feedback[](feedbackIds.length);

        for (uint256 i = 0; i < feedbackIds.length; i++) {
            result[i] = feedbacks[feedbackIds[i]];
        }

        return result;
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
     * @dev Emergency withdraw ETH (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Emergency withdraw ERC20 (only owner)
     */
    function emergencyWithdrawERC20(address _tokenAddress) external onlyOwner {
        IERC20(_tokenAddress).transfer(msg.sender, IERC20(_tokenAddress).balanceOf(address(this)));
    }

    /**
     * @dev Withdraw protocol tokens (only owner)
     */
    function withdrawProtocolTokens() public onlyOwner {
        uint256 balance = protocolToken.balanceOf(address(this));
        require(balance > 0, "No protocol tokens to withdraw");
        protocolToken.transfer(owner(), balance);
    }

    /**
     * @dev update protocol token
     */
    function updateProtocolToken(address _newProtocolToken) external onlyOwner {
        withdrawProtocolTokens();
        protocolToken = IERC20(_newProtocolToken);
    }

    /**
     * @dev enable/disable registrationFee
     */
    function enableFees() external onlyOwner {
        registrationFeeApplicable = !registrationFeeApplicable;
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
