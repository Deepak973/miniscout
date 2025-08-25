"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Gift, TrendingUp, Copy } from "lucide-react";
import { useContract } from "~/hooks/useContract";
import { contractReads } from "~/lib/contracts";
import { formatEther } from "viem";
import { useConnect } from "wagmi";
import toast from "react-hot-toast";
import Header from "~/components/ui/Header";

interface UserRewards {
  totalRewards: bigint;
  appTokenRewards: bigint;
  protocolTokenRewards: bigint;
}

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
  const [_rewards, _setRewards] = useState<UserRewards | null>(null);
  const [tokenRewards, setTokenRewards] = useState<TokenRewardInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserRewards = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      // Get total rewards breakdown
      // const totalRewardsDetailed =
      //   await contractReads.getUserTotalRewardsDetailed(address);
      // setRewards(totalRewardsDetailed);

      // Get individual token rewards
      const userTokens = await contractReads.getUserTokens(address);
      const tokenRewardsData: TokenRewardInfo[] = [];

      for (const tokenAddress of userTokens as `0x${string}`[]) {
        const tokenReward = await contractReads.getUserTokenReward(
          address,
          tokenAddress
        );

        // Type guard to check if tokenReward has the expected structure
        if (
          tokenReward &&
          typeof tokenReward === "object" &&
          "totalEarned" in tokenReward &&
          "balance" in tokenReward &&
          "lastUpdated" in tokenReward &&
          typeof tokenReward.totalEarned === "bigint" &&
          typeof tokenReward.balance === "bigint" &&
          typeof tokenReward.lastUpdated === "bigint" &&
          tokenReward.totalEarned > 0n
        ) {
          // Get app information for this token
          const appInfo = await contractReads.getAppByTokenAddress(
            tokenAddress
          );

          tokenRewardsData.push({
            tokenAddress,
            balance: tokenReward.balance,
            totalEarned: tokenReward.totalEarned,
            lastUpdated: tokenReward.lastUpdated,
            appInfo: appInfo
              ? {
                  name: appInfo.name,
                  iconUrl: appInfo.iconUrl,
                  description: appInfo.description,
                }
              : null,
          });
        }
      }

      setTokenRewards(tokenRewardsData);
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
      <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
        <Header title="My Rewards" showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#ecf87f]/30 border border-[#81b622]/30 rounded-lg p-8 text-center">
            <Gift className="w-16 h-16 text-[#81b622] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[#3d550c] mb-2">
              Connect to View Rewards
            </h2>
            <p className="text-[#59981a] mb-6">
              Connect your wallet to see your earned rewards from reviewing
              apps.
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-3 py-1.5 text-sm bg-[#59981a] text-white rounded-md hover:bg-[#81b622]"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
      <Header title="My Rewards" showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#81b622] flex-1">
            My Rewards
          </h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-[#59981a] hover:bg-[#81b622] text-white rounded-md flex items-center justify-center"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#59981a] mx-auto mb-4"></div>
              <p className="text-[#3d550c]">Loading rewards...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total Rewards Summary */}

            {/* Individual Token Rewards */}
            {tokenRewards.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-[#3d550c] mb-4">
                  Token Breakdown
                </h2>
                <div className="space-y-4">
                  {tokenRewards.map((tokenReward, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-[#ecf87f]/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[#ecf87f]/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
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
                            <Gift className="w-6 h-6 text-[#81b622]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-[#3d550c]">
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
                              className="w-4 h-4 text-[#59981a] cursor-pointer hover:text-[#3d550c]"
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
                            <div className="text-sm text-[#59981a] line-clamp-1">
                              {tokenReward.appInfo.description}
                            </div>
                          )}
                          <div className="text-xs text-[#59981a]">
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
                                className="text-xs text-[#59981a] hover:text-[#3d550c] underline"
                              >
                                Convert to USDC
                              </a>
                              <span className="text-xs text-[#59981a]">•</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[#3d550c]">
                          {formatEther(tokenReward.totalEarned)} earned
                        </div>
                        <div className="text-sm text-[#59981a]">
                          {formatEther(tokenReward.balance)} available
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How to Earn More */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-[#3d550c] mb-4">
                How to Earn More
              </h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-[#81b622] mt-0.5" />
                  <div>
                    <div className="font-medium text-[#3d550c]">
                      Review More Apps
                    </div>
                    <div className="text-sm text-[#59981a]">
                      Submit detailed reviews for apps to earn both app tokens
                      and protocol tokens.
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Gift className="w-5 h-5 text-[#81b622] mt-0.5" />
                  <div>
                    <div className="font-medium text-[#3d550c]">
                      Quality Reviews
                    </div>
                    <div className="text-sm text-[#59981a]">
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
