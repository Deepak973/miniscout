"use client";

import {
  useAccount,
  useChainId,
  useReadContract,
  useWriteContract,
  useSwitchChain,
} from "wagmi";
import { CONTRACT_ADDRESSES } from "~/lib/contracts";
import MINISCOUT_ABI from "../utils/MiniScoutABI.json";
import { base } from "viem/chains";

export function useContract() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Utility function to ensure we're on the correct chain
  const ensureCorrectChain = async () => {
    if (chainId !== base.id) {
      switchChain({ chainId: base.id });
      // Wait a bit for the chain switch to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  // Read registration fee info
  const { data: registrationFeeInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.MINISCOUT,
    abi: MINISCOUT_ABI,
    functionName: "appRegistrationFee",
    chainId: base.id,
  });

  const { data: registrationFeeApplicable } = useReadContract({
    address: CONTRACT_ADDRESSES.MINISCOUT,
    abi: MINISCOUT_ABI,
    functionName: "registrationFeeApplicable",
    chainId: base.id,
  });

  const { data: totalApps } = useReadContract({
    address: CONTRACT_ADDRESSES.MINISCOUT,
    abi: MINISCOUT_ABI,
    functionName: "getTotalApps",
    chainId: base.id,
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
    await ensureCorrectChain();

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
      chainId: base.id,
    });
  };

  const submitFeedback = async (
    appId: bigint,
    rating: number,
    comment: string,
    fid: number
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");
    await ensureCorrectChain();

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "submitFeedback",
      args: [appId, BigInt(rating), comment, BigInt(fid)],
      chainId: base.id,
    });
  };

  const addEscrow = async (
    appId: bigint,
    amount: string,
    appToken: `0x${string}`
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");
    await ensureCorrectChain();

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "addEscrow",
      args: [appId, BigInt(amount), appToken],
      chainId: base.id,
    });
  };

  const withdrawEscrow = async (appId: bigint) => {
    if (!isConnected) throw new Error("Wallet not connected");
    await ensureCorrectChain();

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "withdrawEscrow",
      args: [appId],
      chainId: base.id,
    });
  };

  const deactivateApp = async (appId: bigint) => {
    if (!isConnected) throw new Error("Wallet not connected");
    await ensureCorrectChain();

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "deactivateApp",
      args: [appId],
      chainId: base.id,
    });
  };

  const updateFeedback = async (
    feedbackId: bigint,
    newRating: number,
    newComment: string
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");
    await ensureCorrectChain();

    return await writeContractAsync({
      address: CONTRACT_ADDRESSES.MINISCOUT,
      abi: MINISCOUT_ABI,
      functionName: "updateFeedback",
      args: [feedbackId, BigInt(newRating), newComment],
      chainId: base.id,
    });
  };

  const approveTokens = async (
    tokenAddress: `0x${string}`,
    amount: string,
    spender: `0x${string}`
  ) => {
    if (!isConnected) throw new Error("Wallet not connected");
    await ensureCorrectChain();

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
      chainId: base.id,
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
