# MiniScout 🌱

A decentralized platform for discovering, reviewing, and earning rewards from mini apps built on blockchain technology.

## What is MiniScout?

MiniScout is a Web3-powered platform that connects mini app developers with users through a decentralized review and reward system. Users can discover new mini apps, provide valuable feedback, and earn cryptocurrency rewards for their contributions.

## Key Features

### 🎯 **App Discovery**

- Browse a curated collection of mini apps
- Search and filter apps by name
- View detailed app information including ratings and reviews
- Direct access to mini apps through secure URLs

### ⭐ **Review System**

- Rate apps on a 5-star scale
- Write detailed reviews and feedback
- View all community reviews for transparency
- Earn rewards for providing valuable feedback

### 💰 **Reward System**

- Earn cryptocurrency tokens for each review submitted
- Transparent reward distribution through smart contracts
- View available rewards and escrow amounts for each app
- Track your earned rewards over time

### 🔗 **Wallet Integration**

- Connect your Web3 wallet (MetaMask, WalletConnect, etc.)
- Secure, decentralized authentication
- No centralized accounts or data storage
- Full control over your data and rewards

### 📱 **Developer Tools**

- Register your mini apps on the platform
- Set custom reward amounts for reviews
- Manage your app listings and statistics
- Track user engagement and feedback

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Ethereum/Smart Contracts
- **Wallet Integration**: Wagmi, Viem
- **UI Components**: Custom component library
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+
- A Web3 wallet (MetaMask, WalletConnect, etc.)
- Some ETH for gas fees (if deploying apps)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd miniscout
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Configure the following variables:

   - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your smart contract address
   - `NEXT_PUBLIC_CHAIN_ID`: Target blockchain network ID
   - `NEXT_PUBLIC_RPC_URL`: RPC endpoint for the blockchain

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Users

1. **Connect Your Wallet**

   - Click "Connect Wallet" to link your Web3 wallet
   - Ensure you have some ETH for gas fees

2. **Discover Apps**

   - Browse the main page to see all available mini apps
   - Use the search function to find specific apps
   - Click on app cards to view details

3. **Review Apps**

   - Navigate to any app's feedback page
   - Rate the app (1-5 stars)
   - Write a detailed review
   - Submit to earn rewards

4. **Track Rewards**
   - View your earned rewards in the "My Rewards" section
   - Monitor your review history
   - Withdraw rewards to your wallet

### For Developers

1. **Register Your App**

   - Connect your wallet
   - Navigate to "Add App" from the menu
   - Fill in app details (name, description, URL, icon)
   - Set reward amount per review
   - Deploy to the platform

2. **Manage Your Apps**
   - View all your registered apps in "My Apps"
   - Monitor reviews and ratings
   - Track reward distribution
   - Update app information

## Smart Contract Integration

MiniScout uses smart contracts for:

- App registration and management
- Review submission and storage
- Reward distribution and escrow
- User authentication and verification

The platform ensures transparency and decentralization through on-chain data storage and automated reward distribution.

## Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Code style and standards
- Pull request process
- Bug reporting
- Feature requests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check our [docs](link-to-docs)
- **Discord**: Join our [community](link-to-discord)
- **Twitter**: Follow [@miniscout](link-to-twitter)
- **Email**: support@miniscout.com

## Roadmap

- [ ] Mobile app development
- [ ] Advanced filtering and search
- [ ] Social features and sharing
- [ ] Analytics dashboard for developers
- [ ] Multi-chain support
- [ ] NFT integration for premium features

---

Built with ❤️ by the MiniScout team
