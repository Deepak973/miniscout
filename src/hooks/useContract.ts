"use client";

import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "~/lib/contracts";
import MINISCOUT_ABI from "../utils/MiniScoutABI.json";

export function useContract() {
  const { address, isConnected } = useAccount();

  // Read registration fee info
  const { data: registrationFeeInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.MINISCOUT,
    abi: MINISCOUT_ABI,
    functionName: "appRegistrationFee",
  });

  const { data: registrationFeeApplicable } = useReadContract({
    address: CONTRACT_ADDRESSES.MINISCOUT,
    abi: MINISCOUT_ABI,
    functionName: "registrationFeeApplicable",
  });

  const { data: totalApps } = useReadContract({
    address: CONTRACT_ADDRESSES.MINISCOUT,
    abi: MINISCOUT_ABI,
    functionName: "getTotalApps",
  });

  // Write contract functions
  const { writeContractAsync, isPending: isWriting } = useWriteContract();

  const registerApp = async (
    name: string,
    description: string,
    ownerFid: number,
    homeUrl: string,
    miniappUrl: string,
    iconUrl: string,
    appId: string,
    tokenAmount: string,
    rewardPerReview: string,
    appToken: `0x${string}`,
    registrationFee?: bigint
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");

    const args = [
      name,
      description,
      BigInt(ownerFid),
      homeUrl,
      miniappUrl,
      iconUrl,
      appId,
      BigInt(tokenAmount),
      BigInt(rewardPerReview),
      appToken,
    ] as const;

    const result = await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "registerApp",
      args,
      value: registrationFee || 0n,
    });
  };

  const submitFeedback = async (
    appId: bigint,
    rating: number,
    comment: string,
    fid: number
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "submitFeedback",
      args: [appId, BigInt(rating), comment, BigInt(fid)],
    });
  };

  const addEscrow = async (
    appId: bigint,
    amount: string,
    appToken: `0x${string}`
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "addEscrow",
      args: [appId, BigInt(amount), appToken],
    });
  };

  const withdrawEscrow = async (appId: bigint) => {
    if (!isConnected) throw new Error("Wallet not connected");

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "withdrawEscrow",
      args: [appId],
    });
  };

  const deactivateApp = async (appId: bigint) => {
    if (!isConnected) throw new Error("Wallet not connected");

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "deactivateApp",
      args: [appId],
    });
  };

  const updateFeedback = async (
    feedbackId: bigint,
    newRating: number,
    newComment: string
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "updateFeedback",
      args: [feedbackId, BigInt(newRating), newComment],
    });
  };

  const approveTokens = async (
    tokenAddress: `0x${string}`,
    amount: string,
    spender: `0x${string}`
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");

    const _result = await writeContractAsync({
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
      args: [spender, BigInt(amount)],
    });

    return _result;
  };

  return {
    address,
    isConnected,
    registrationFeeInfo: {
      fee: registrationFeeInfo as bigint | undefined,
      isApplicable: registrationFeeApplicable as boolean | undefined,
      totalApps: totalApps as bigint | undefined,
    },
    registerApp,
    submitFeedback,
    addEscrow,
    withdrawEscrow,
    deactivateApp,
    updateFeedback,
    approveTokens,
    isLoading: isWriting,
  };
}
