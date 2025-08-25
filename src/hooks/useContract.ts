"use client";

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { contractReads, contractWrites } from "~/lib/contracts";
import { parseEther } from "viem";
import { useState } from "react";

export function useContract() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Read contract data
  const { data: totalApps } = useReadContract({
    ...contractWrites.registerApp,
    functionName: "getTotalApps",
  });

  const { data: registrationFee } = useReadContract({
    ...contractWrites.registerApp,
    functionName: "appRegistrationFee",
  }) as { data: bigint | undefined };

  const { data: feedbackReward } = useReadContract({
    ...contractWrites.registerApp,
    functionName: "feedbackReward",
  });

  // Write contract functions
  const { writeContractAsync, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Register app function
  const registerApp = async (
    name: string,
    description: string,
    homeUrl: string,
    miniappUrl: string,
    iconUrl: string,
    appId: string,
    tokenAmount: string,
    rewardPerReview: string,
    appTokenAddress: `0x${string}`
  ) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        ...contractWrites.registerApp,
        args: [
          name,
          description,
          homeUrl,
          miniappUrl,
          iconUrl,
          appId,
          parseEther(tokenAmount),
          parseEther(rewardPerReview),
          appTokenAddress,
        ],
        value: registrationFee ? registrationFee : parseEther("0.0001"), // Default fee
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Submit feedback function
  const submitFeedback = async (
    appId: bigint,
    rating: number,
    comment: string
  ) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        ...contractWrites.submitFeedback,
        args: [appId, BigInt(rating), comment],
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Add escrow function
  const addEscrow = async (
    appId: bigint,
    amount: string,
    appTokenAddress: `0x${string}`
  ) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        ...contractWrites.addEscrow,
        args: [appId, parseEther(amount), appTokenAddress],
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Withdraw escrow function
  const withdrawEscrow = async (
    appId: bigint,
    appTokenAddress: `0x${string}`
  ) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        ...contractWrites.withdrawEscrow,
        args: [appId, appTokenAddress],
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Deactivate app function
  const deactivateApp = async (
    appId: bigint,
    appTokenAddress: `0x${string}`
  ) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        ...contractWrites.deactivateApp,
        args: [appId, appTokenAddress],
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Claim protocol rewards function
  const claimProtocolRewards = async () => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        ...contractWrites.claimProtocolRewards,
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Approve tokens function
  const approveTokens = async (
    tokenAddress: `0x${string}`,
    amount: string,
    spenderAddress: `0x${string}`
  ) => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }

    setIsLoading(true);
    try {
      await writeContractAsync({
        address: tokenAddress,
        abi: [
          {
            inputs: [
              { name: "spender", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        functionName: "approve",
        args: [spenderAddress, parseEther(amount)],
      });
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Check if user has given feedback for an app
  const hasUserGivenFeedback = async (appId: bigint) => {
    if (!isConnected || !address) return false;

    try {
      return await contractReads.hasUserGivenFeedback(appId, address);
    } catch (error) {
      console.error("Error checking user feedback:", error);
      return false;
    }
  };

  // Get user rewards
  const getUserRewards = async () => {
    if (!isConnected || !address) return 0n;

    try {
      const rewards = await contractReads.getUserRewards(address);
      return rewards || 0n;
    } catch (error) {
      console.error("Error getting user rewards:", error);
      return 0n;
    }
  };

  return {
    // State
    isConnected,
    address,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    hash,

    // Contract data
    totalApps,
    registrationFee,
    feedbackReward,

    // Functions
    registerApp,
    submitFeedback,
    addEscrow,
    withdrawEscrow,
    deactivateApp,
    claimProtocolRewards,
    approveTokens,
    hasUserGivenFeedback,
    getUserRewards,
  };
}
