import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import MINISCOUT_ABI from "../utils/MiniScoutABI.json";

export const CONTRACT_ADDRESSES = {
  MINISCOUT: "0xd376d8063AB94Ed9F0b0644F3028fEd4729dA1e0" as `0x${string}`, // Update with your deployed address
  PROTOCOL_TOKEN:
    "0x7de87b9bbd164D21fa8691657c3DC841aD246e65 " as `0x${string}`, // Update with your protocol token address
};

export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export interface App {
  appId: bigint;
  owner: `0x${string}`;
  ownerFid: bigint;
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
  fid: bigint;
  reviewer: `0x${string}`;
  rating: bigint;
  comment: string;
  rewardAmount: bigint;
  protocolReward: bigint;
  createdAt: bigint;
}

export interface UserFeedbackWithToken {
  feedback: Feedback;
  tokenAddress: `0x${string}`;
}

const contractConfig = {
  address: CONTRACT_ADDRESSES.MINISCOUT,
  abi: MINISCOUT_ABI,
} as const;

export const contractReads = {
  // Get registration fee info
  getRegistrationFeeInfo: async () => {
    const [fee, isApplicable, totalApps] = await Promise.all([
      publicClient.readContract({
        ...contractConfig,
        functionName: "appRegistrationFee",
      }),
      publicClient.readContract({
        ...contractConfig,
        functionName: "registrationFeeApplicable",
      }),
      publicClient.readContract({
        ...contractConfig,
        functionName: "getTotalApps",
      }),
    ]);
    return { fee, isApplicable, totalApps };
  },

  // Get all apps
  getAllApps: async (): Promise<(App & { averageRating: number })[]> => {
    const apps = (await publicClient.readContract({
      ...contractConfig,
      functionName: "getApps",
    })) as App[];
    return apps.map((app: App) => ({
      ...app,
      averageRating: app.totalRatings > 0n ? 4.5 : 0, // Default rating for now
    }));
  },

  // Get single app
  getApp: async (appId: bigint): Promise<App> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getApp",
      args: [appId],
    })) as App;
  },

  // Get app feedbacks
  getAppFeedbacks: async (appId: bigint): Promise<Feedback[]> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getAppFeedbacks",
      args: [appId],
    })) as Feedback[];
  },

  // Get user feedbacks with token addresses
  getUserFeedbacks: async (
    userAddress: `0x${string}`
  ): Promise<UserFeedbackWithToken[]> => {
    const [feedbacks, tokenAddresses] = (await publicClient.readContract({
      ...contractConfig,
      functionName: "getUserFeedbacks",
      args: [userAddress],
    })) as [Feedback[], `0x${string}`[]];

    console.log(feedbacks, "feedbacks");

    if (feedbacks.length === 0) {
      return [];
    }
    return feedbacks.map((feedback: Feedback, index: number) => ({
      feedback,
      tokenAddress: tokenAddresses[index],
    }));
  },

  // Get single feedback
  getFeedback: async (feedbackId: bigint): Promise<Feedback> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getFeedback",
      args: [feedbackId],
    })) as Feedback;
  },

  // Check if user has given feedback for an app
  hasUserGivenFeedback: async (
    appId: bigint,
    userAddress: `0x${string}`
  ): Promise<boolean> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "userFeedbackGiven",
      args: [appId, userAddress],
    })) as boolean;
  },

  // Get app escrow amount
  getAppEscrow: async (appId: bigint): Promise<bigint> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "appEscrow",
      args: [appId],
    })) as bigint;
  },

  // Get app owner
  getAppOwner: async (appId: bigint): Promise<`0x${string}`> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "appOwners",
      args: [appId],
    })) as `0x${string}`;
  },

  // Get feedback reward
  getFeedbackReward: async (): Promise<bigint> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getFeedbackReward",
    })) as bigint;
  },

  // Get total counts
  getTotalApps: async (): Promise<bigint> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getTotalApps",
    })) as bigint;
  },

  getTotalFeedback: async (): Promise<bigint> => {
    return (await publicClient.readContract({
      ...contractConfig,
      functionName: "getTotalFeedback",
    })) as bigint;
  },
};
