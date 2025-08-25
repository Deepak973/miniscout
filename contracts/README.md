# MiniScout Smart Contracts

This directory contains the smart contracts for the MiniScout protocol, which handles app registration, feedback submission, and token rewards.

## 📋 Contract Overview

### MiniScoutToken.sol

- **Purpose**: ERC20 token for protocol rewards
- **Symbol**: MST (MiniScout Token)
- **Features**: Mintable, burnable, transferable
- **Initial Supply**: 1,000,000 tokens

### MiniScout.sol

- **Purpose**: Main protocol contract
- **Features**:
  - App registration with ETH escrow
  - Feedback submission with rewards
  - Token distribution system
  - Escrow management
  - Protocol fee collection

## 🚀 Deployment Instructions

### Prerequisites

1. Node.js (v16 or higher)
2. npm or yarn
3. MetaMask or similar wallet
4. Test ETH (for testnet deployment)

### Setup

1. **Install dependencies**:

   ```bash
   cd contracts
   npm install
   ```

2. **Configure environment**:

   ```bash
   cp env.example .env
   # Edit .env with your values
   ```

3. **Compile contracts**:
   ```bash
   npm run compile
   ```

### Deployment

#### Local Development

```bash
# Start local node
npm run node

# In another terminal, deploy to localhost
npm run deploy:local
```

#### Testnet (Sepolia)

```bash
npm run deploy:sepolia
```

#### Mainnet

```bash
npm run deploy:mainnet
```

### Verification

```bash
# Verify on Etherscan (Sepolia)
npm run verify:sepolia

# Verify on Etherscan (Mainnet)
npm run verify:mainnet
```

## 📊 Contract Functions

### App Registration

```solidity
function registerApp(
    string memory name,
    string memory description,
    string memory homeUrl,
    string memory miniappUrl,
    string memory iconUrl
) external payable
```

- **Cost**: 0.01 ETH registration fee + escrow amount
- **Requirements**: Valid app data, sufficient ETH

### Feedback Submission

```solidity
function submitFeedback(
    uint256 appId,
    uint256 rating,
    string memory comment
) external
```

- **Rewards**: ETH from escrow + protocol tokens
- **Requirements**: App must be active, valid rating (1-5)

### Escrow Management

```solidity
function addEscrow(uint256 appId) external payable
function withdrawEscrow(uint256 appId) external
```

- **Add**: Increase escrow for more rewards
- **Withdraw**: Remove unused escrow (app owner only)

## 💰 Reward System

### ETH Rewards (from escrow)

- **Reviewer**: 75% of base reward
- **App Owner**: 20% of base reward
- **Protocol**: 5% of base reward

### Protocol Token Rewards

- **Base Amount**: 10 MST tokens per feedback
- **Rating Bonus**: Higher ratings get more tokens
- **Maximum**: 100 MST tokens per feedback

### Reward Calculation

```solidity
baseReward = minReward + ((maxReward - minReward) * (rating - 1)) / 4
```

## 🔧 Integration with Frontend

### Environment Variables

Add these to your frontend `.env`:

```env
NEXT_PUBLIC_MINISCOUT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MINISCOUT_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111  # Sepolia
```

### Web3 Integration

```javascript
import { ethers } from "ethers";
import MiniScoutABI from "./abis/MiniScout.json";
import MiniScoutTokenABI from "./abis/MiniScoutToken.json";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const miniScoutContract = new ethers.Contract(
  process.env.NEXT_PUBLIC_MINISCOUT_CONTRACT_ADDRESS,
  MiniScoutABI,
  signer
);

const tokenContract = new ethers.Contract(
  process.env.NEXT_PUBLIC_MINISCOUT_TOKEN_ADDRESS,
  MiniScoutTokenABI,
  signer
);
```

### Key Functions for Frontend

#### Register App

```javascript
const registerApp = async (appData) => {
  const registrationFee = ethers.parseEther("0.01");
  const escrowAmount = ethers.parseEther("0.1"); // 0.1 ETH escrow
  const totalAmount = registrationFee + escrowAmount;

  const tx = await miniScoutContract.registerApp(
    appData.name,
    appData.description,
    appData.homeUrl,
    appData.miniappUrl,
    appData.iconUrl,
    { value: totalAmount }
  );

  await tx.wait();
  return tx;
};
```

#### Submit Feedback

```javascript
const submitFeedback = async (appId, rating, comment) => {
  const tx = await miniScoutContract.submitFeedback(appId, rating, comment);

  await tx.wait();
  return tx;
};
```

#### Get App Data

```javascript
const getApp = async (appId) => {
  const app = await miniScoutContract.getApp(appId);
  return {
    appId: app.appId.toString(),
    owner: app.owner,
    name: app.name,
    description: app.description,
    homeUrl: app.homeUrl,
    miniappUrl: app.miniappUrl,
    iconUrl: app.iconUrl,
    totalRatings: app.totalRatings.toString(),
    averageRating: app.averageRating.toString(),
    escrowAmount: ethers.formatEther(app.escrowAmount),
    isActive: app.isActive,
    createdAt: new Date(app.createdAt * 1000),
  };
};
```

## 📝 Events

### AppRegistered

```solidity
event AppRegistered(
    uint256 indexed appId,
    address indexed owner,
    string name,
    string homeUrl,
    string miniappUrl,
    uint256 escrowAmount
);
```

### FeedbackSubmitted

```solidity
event FeedbackSubmitted(
    uint256 indexed feedbackId,
    uint256 indexed appId,
    address indexed reviewer,
    uint256 rating,
    uint256 rewardAmount,
    uint256 appOwnerReward,
    uint256 protocolReward
);
```

## 🔒 Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable**: Access control for admin functions
- **Input Validation**: Comprehensive parameter checks
- **Escrow Protection**: Secure fund management
- **Emergency Functions**: Owner can withdraw funds if needed

## 🧪 Testing

```bash
npm run test
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Support

For questions or issues:

1. Check the documentation
2. Review the contract code
3. Open an issue on GitHub
4. Contact the development team
