import { createPublicClient, http, parseEther, formatEther } from "viem";
import { baseSepolia } from "viem/chains";

import MiniScoutABI from "~/utils/MiniScoutABI.json";

// Types for contract data
export interface App {
  appId: bigint;
  owner: `0x${string}`;
  name: string;
  description: string;
  appToken: `0x${string}`;
  miniappUrl: string;
  iconUrl: string;
  rewardPerReview: bigint;
  totalRatings: bigint;
  totalFeedbackRewards: bigint;
  escrowAmount: bigint;
  isActive: boolean;
  createdAt: bigint;
}

export interface Feedback {
  feedbackId: bigint;
  appId: bigint;
  reviewer: `0x${string}`;
  rating: bigint;
  comment: string;
  rewardAmount: bigint;
  protocolReward: bigint;
  createdAt: bigint;
}

export interface UserTokenReward {
  tokenAddress: `0x${string}`;
  balance: bigint;
  totalEarned: bigint;
  lastUpdated: bigint;
}

// Contract addresses (replace with your deployed addresses)
export const CONTRACT_ADDRESSES = {
  MINISCOUT: "0xcCEAd9170B4A9ef324aB9304Dc6cC37101a5361E",
  MINISCOUT_TOKEN: "0xa2CC944515134b7d257f503E8D3d3D283d45AcDb",
} as const;

// Public client for read operations
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Contract configuration
export const contractConfig = {
  address: CONTRACT_ADDRESSES.MINISCOUT as `0x${string}`,
  abi: MiniScoutABI,
} as const;

// Utility functions
export const formatTokenAmount = (
  amount: bigint,
  _decimals: number = 18
): string => {
  return formatEther(amount);
};

export const parseTokenAmount = (amount: string): bigint => {
  return parseEther(amount);
};

// Contract read functions
export const contractReads = {
  // Get total number of apps
  getTotalApps: async () => {
    return await publicClient.readContract({
      ...contractConfig,
      functionName: "getTotalApps",
    });
  },

  // Get app by ID
  getApp: async (appId: bigint) => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getApp",
      args: [appId],
    })) as App;
  },

  // Get all apps (we'll need to iterate through them)
  getAllApps: async () => {
    const totalApps = await contractReads.getTotalApps();
    const apps: (App & { averageRating: number })[] = [];

    for (let i = 1; i <= Number(totalApps); i++) {
      try {
        const app = (await contractReads.getApp(BigInt(i))) as App;
        if (app.isActive) {
          apps.push({
            ...app,
            appId: BigInt(i),
            averageRating: app.totalRatings > 0n ? 4.5 : 0, // Default rating for now
          });
        }
      } catch (error) {
        console.error(`Error fetching app ${i}:`, error);
      }
    }

    return apps;
  },

  // Get app feedback
  getAppFeedbacks: async (appId: bigint) => {
    const feedbackIds = (await publicClient.readContract({
      ...contractConfig,
      functionName: "getAppFeedbacks",
      args: [appId],
    })) as bigint[];

    const feedbacks: Feedback[] = [];
    for (const feedbackId of feedbackIds) {
      try {
        const feedback = (await publicClient.readContract({
          ...contractConfig,
          functionName: "getFeedback",
          args: [feedbackId],
        })) as Feedback;
        feedbacks.push(feedback);
      } catch (error) {
        console.error(`Error fetching feedback ${feedbackId}:`, error);
      }
    }

    return feedbacks;
  },

  // Check if user has given feedback for an app
  hasUserGivenFeedback: async (appId: bigint, userAddress: `0x${string}`) => {
    return await publicClient.readContract({
      ...contractConfig,
      functionName: "userFeedbackGiven",
      args: [appId, userAddress],
    });
  },

  // Get registration fee
  getRegistrationFee: async () => {
    return await publicClient.readContract({
      ...contractConfig,
      functionName: "appRegistrationFee",
    });
  },

  // Get feedback reward
  getFeedbackReward: async () => {
    return await publicClient.readContract({
      ...contractConfig,
      functionName: "feedbackReward",
    });
  },

  // Get user rewards
  getUserRewards: async (userAddress: `0x${string}`) => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getUserRewards",
      args: [userAddress],
    })) as bigint;
  },

  // Get user's token reward information
  getUserTokenReward: async (
    userAddress: `0x${string}`,
    tokenAddress: `0x${string}`
  ) => {
    return await publicClient.readContract({
      ...contractConfig,
      functionName: "getUserTokenReward",
      args: [userAddress, tokenAddress],
    });
  },

  // Get all tokens a user has earned
  getUserTokens: async (userAddress: `0x${string}`) => {
    return await publicClient.readContract({
      ...contractConfig,
      functionName: "getUserTokens",
      args: [userAddress],
    });
  },

  // Get user's total rewards across all tokens
  getUserTotalRewards: async (userAddress: `0x${string}`) => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getUserTotalRewards",
      args: [userAddress],
    })) as bigint;
  },

  // Get app by token address
  getAppByTokenAddress: async (tokenAddress: `0x${string}`) => {
    const totalApps = await contractReads.getTotalApps();

    for (let i = 1; i <= Number(totalApps); i++) {
      try {
        const app = (await contractReads.getApp(BigInt(i))) as App;
        if (app.appToken.toLowerCase() === tokenAddress.toLowerCase()) {
          return app;
        }
      } catch (error) {
        console.error(`Error fetching app ${i}:`, error);
      }
    }

    return null;
  },

  // Get all token rewards for a user (including protocol tokens)
  getUserTotalRewardsDetailed: async (userAddress: `0x${string}`) => {
    try {
      // Get user's app token rewards
      const appTokenRewards = await contractReads.getUserRewards(userAddress);

      // Get protocol token balance
      const protocolTokenBalance = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MINISCOUT_TOKEN,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "balanceOf",
        args: [userAddress],
      });

      return {
        appTokenRewards,
        protocolTokenRewards: protocolTokenBalance,
        totalRewards: appTokenRewards + protocolTokenBalance,
      };
    } catch (error) {
      console.error("Error fetching user rewards:", error);
      return {
        appTokenRewards: 0n,
        protocolTokenRewards: 0n,
        totalRewards: 0n,
      };
    }
  },
};

// Contract write functions (these will be used with wagmi hooks)
export const contractWrites = {
  // Register app
  registerApp: {
    ...contractConfig,
    functionName: "registerApp",
  },

  // Submit feedback
  submitFeedback: {
    ...contractConfig,
    functionName: "submitFeedback",
  },

  // Add escrow
  addEscrow: {
    ...contractConfig,
    functionName: "addEscrow",
  },

  // Withdraw escrow
  withdrawEscrow: {
    ...contractConfig,
    functionName: "withdrawEscrow",
  },

  // Deactivate app
  deactivateApp: {
    ...contractConfig,
    functionName: "deactivateApp",
  },

  // Claim protocol rewards
  claimProtocolRewards: {
    ...contractConfig,
    functionName: "claimProtocolRewards",
  },
};
