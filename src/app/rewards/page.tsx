"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Gift, TrendingUp, Copy } from "lucide-react";
import { useContract } from "~/hooks/useContract";
import { contractReads } from "~/lib/contracts";
import { formatEther } from "viem";
import { useConnect } from "wagmi";
import toast from "react-hot-toast";
import Header from "~/components/ui/Header";

interface TokenRewardInfo {
  tokenAddress: `0x${string}`;
  balance: bigint;
  totalEarned: bigint;
  lastUpdated: bigint;
  appInfo?: {
    name: string;
    iconUrl: string;
    description: string;
  } | null;
}

export default function RewardsPage() {
  const { isConnected, address } = useContract();
  const { connect, connectors } = useConnect();
  const [tokenRewards, setTokenRewards] = useState<TokenRewardInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserRewards = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Get user feedbacks with token addresses
      const userFeedbacks = await contractReads.getUserFeedbacks(address);

      // Group feedbacks by token address and calculate totals
      const tokenMap = new Map<`0x${string}`, TokenRewardInfo>();

      for (const userFeedback of userFeedbacks) {
        const { feedback, tokenAddress } = userFeedback;

        if (!tokenMap.has(tokenAddress)) {
          // Get app info for this token
          const appInfo = await contractReads.getApp(feedback.appId);

          tokenMap.set(tokenAddress, {
            tokenAddress,
            balance: 0n,
            totalEarned: 0n,
            lastUpdated: feedback.createdAt,
            appInfo: {
              name: appInfo.name,
              iconUrl: appInfo.iconUrl,
              description: appInfo.description,
            },
          });
        }

        const tokenInfo = tokenMap.get(tokenAddress)!;
        tokenInfo.totalEarned += feedback.rewardAmount;
        tokenInfo.balance += feedback.rewardAmount; // Assuming all rewards are available
        if (feedback.createdAt > tokenInfo.lastUpdated) {
          tokenInfo.lastUpdated = feedback.createdAt;
        }
      }

      setTokenRewards(Array.from(tokenMap.values()));
    } catch (error) {
      console.error("Error fetching rewards:", error);
      toast.error("Failed to load rewards");
    } finally {
      setLoading(false);
    }
  }, [address]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserRewards();
    setRefreshing(false);
    toast.success("Rewards refreshed!");
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchUserRewards();
    }
  }, [isConnected, address, fetchUserRewards]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0F0E0E]">
        <Header title="My Rewards" showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#ED775A]/20 border border-[#FAD691]/30 rounded-lg p-8 text-center">
            <Gift className="w-16 h-16 text-[#FAD691] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
              Connect to View Rewards
            </h2>
            <p className="text-[#C9CDCF] mb-6 arimo-400">
              Connect your wallet to see your earned rewards from reviewing
              apps.
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-3 py-1.5 text-sm bg-[#ED775A] text-white rounded-md hover:bg-[#FAD691] hover:text-[#0F0E0E] arimo-600"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0E0E]">
      <Header title="My Rewards" showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#FAD691] flex-1 edu-nsw-act-cursive-600">
            My Rewards
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white rounded-md flex items-center justify-center"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FAD691] mx-auto mb-4"></div>
              <p className="text-[#C9CDCF] arimo-400">Loading rewards...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Individual Token Rewards */}
            {tokenRewards.length > 0 && (
              <div className="bg-[#ED775A]/10 rounded-lg shadow p-6 border border-[#FAD691]/30">
                <h2 className="text-lg font-semibold text-[#FAD691] mb-4 edu-nsw-act-cursive-600">
                  Token Breakdown
                </h2>
                <div className="space-y-4">
                  {tokenRewards.map((tokenReward, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-[#FAD691]/30 rounded-lg bg-[#ED775A]/5"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[#FAD691]/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {tokenReward.appInfo ? (
                            <img
                              src={tokenReward.appInfo.iconUrl}
                              alt={tokenReward.appInfo.name}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = "/icon.png";
                              }}
                            />
                          ) : (
                            <Gift className="w-6 h-6 text-[#ED775A]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-[#FAD691] arimo-600">
                              {tokenReward.appInfo ? (
                                tokenReward.appInfo.name
                              ) : (
                                <>
                                  {tokenReward.tokenAddress.slice(0, 6)}...
                                  {tokenReward.tokenAddress.slice(-4)}
                                </>
                              )}
                            </div>
                            <Copy
                              className="w-4 h-4 text-[#C9CDCF] cursor-pointer hover:text-[#FAD691]"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  tokenReward.tokenAddress
                                );
                                toast.success(
                                  "Token address copied to clipboard"
                                );
                              }}
                            />
                          </div>
                          {tokenReward.appInfo && (
                            <div className="text-sm text-[#C9CDCF] line-clamp-1 arimo-400">
                              {tokenReward.appInfo.description}
                            </div>
                          )}
                          <div className="text-xs text-[#C9CDCF] arimo-400">
                            Last updated:{" "}
                            {new Date(
                              Number(tokenReward.lastUpdated) * 1000
                            ).toLocaleDateString()}
                          </div>
                          {tokenReward.appInfo && (
                            <div className="flex items-center space-x-2 mt-2">
                              <a
                                href="https://farcaster.xyz/miniapps/UOg1Ub-TqBku/kondo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#C9CDCF] hover:text-[#FAD691] underline arimo-400"
                              >
                                Convert to USDC
                              </a>
                              <span className="text-xs text-[#C9CDCF] arimo-400">
                                •
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#FAD691] arimo-600">
                          {formatEther(tokenReward.totalEarned)} earned
                        </div>
                        <div className="text-sm text-[#C9CDCF] arimo-400">
                          {formatEther(tokenReward.balance)} available
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Earn More */}
            <div className="bg-[#ED775A]/10 rounded-lg shadow p-6 border border-[#FAD691]/30">
              <h2 className="text-lg font-semibold text-[#FAD691] mb-4 edu-nsw-act-cursive-600">
                How to Earn More
              </h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-[#ED775A] mt-0.5" />
                  <div>
                    <div className="font-medium text-[#FAD691] arimo-600">
                      Review More Apps
                    </div>
                    <div className="text-sm text-[#C9CDCF] arimo-400">
                      Submit detailed reviews for apps to earn both app tokens
                      and protocol tokens.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Gift className="w-5 h-5 text-[#ED775A] mt-0.5" />
                  <div>
                    <div className="font-medium text-[#FAD691] arimo-600">
                      Quality Reviews
                    </div>
                    <div className="text-sm text-[#C9CDCF] arimo-400">
                      Provide helpful and detailed feedback to earn more
                      rewards.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
