"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { useContract } from "~/hooks/useContract";
import { contractReads, App } from "~/lib/contracts";
import { formatEther } from "viem";
import { useConnect } from "wagmi";
import toast from "react-hot-toast";
import Header from "~/components/ui/Header";

export default function MyAppsPage() {
  const { isConnected, address } = useContract();
  const { connect, connectors } = useConnect();
  const [myApps, setMyApps] = useState<(App & { averageRating: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyApps = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    try {
      const allApps = await contractReads.getAllApps();
      const userApps = allApps.filter(
        (app) => app.owner.toLowerCase() === address.toLowerCase()
      );
      setMyApps(userApps);
    } catch (error) {
      console.error("Error fetching my apps:", error);
      toast.error("Failed to load your apps");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchMyApps();
    } else {
      setLoading(false);
    }
  }, [isConnected, address, fetchMyApps]);

  const handleAddNewApp = () => {
    window.location.href = "/add-app";
  };

  const handleAppClick = (app: App & { averageRating: number }) => {
    window.open(app.miniappUrl, "_blank");
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0F0E0E]">
        <Header title="My Apps" showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#ED775A]/20 border border-[#FAD691]/30 rounded-lg p-8 text-center">
            <MessageSquare className="w-16 h-16 text-[#FAD691] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
              Connect to View Your Apps
            </h2>
            <p className="text-[#C9CDCF] mb-6 arimo-400">
              Connect your wallet to see the apps you&apos;ve registered.
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-6 py-3 bg-[#ED775A] text-white rounded-md hover:bg-[#FAD691] hover:text-[#0F0E0E] arimo-600"
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
      <Header title="My Apps" showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#FAD691] flex-1 edu-nsw-act-cursive-600">
            My Apps
          </h1>
          <button
            onClick={handleAddNewApp}
            className="p-3 bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white rounded-full flex items-center justify-center w-12 h-12 shadow-lg transition-all duration-300 hover:scale-110"
          >
            <span className="text-xl font-bold">+</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FAD691] mx-auto mb-4"></div>
              <p className="text-[#C9CDCF] arimo-400">Loading your apps...</p>
            </div>
          </div>
        ) : myApps.length === 0 ? (
          <div className="bg-[#ED775A]/10 rounded-lg shadow-lg p-12 text-center border border-[#FAD691]/30">
            <MessageSquare className="w-16 h-16 text-[#FAD691] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
              No Apps Found
            </h3>
            <p className="text-[#C9CDCF] mb-6 arimo-400">
              You haven&apos;t registered any apps yet. Start by adding your
              first mini app.
            </p>
            <Button
              onClick={handleAddNewApp}
              className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white arimo-600 px-8 py-3 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
              Add Your First App
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myApps.map((app) => (
              <div
                key={app.appId.toString()}
                className="bg-[#ED775A]/10 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-[#FAD691]/30 hover:border-[#FAD691]/60 group overflow-hidden"
              >
                {/* App Header with Image */}
                <div className="relative h-48 bg-gradient-to-br from-[#ED775A]/20 to-[#FAD691]/20 p-6 flex flex-col justify-between">
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-[#FAD691] rounded-full animate-pulse"></div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg border-2 border-[#FAD691]/30">
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/icon.png";
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#FAD691] truncate edu-nsw-act-cursive-600">
                        {app.name}
                      </h3>
                      <p className="text-[#C9CDCF] text-xs mt-1 line-clamp-2 arimo-400">
                        {app.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* App Content */}
                <div className="p-6 space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-[#FAD691]/10 rounded-lg border border-[#FAD691]/20 hover:bg-[#FAD691]/20 transition-colors">
                      <div className="text-lg font-bold text-[#FAD691] arimo-700">
                        {app.totalRatings.toString()}
                      </div>
                      <div className="text-xs text-[#C9CDCF] arimo-400">
                        Reviews
                      </div>
                    </div>
                    <div className="text-center p-3 bg-[#FAD691]/10 rounded-lg border border-[#FAD691]/20 hover:bg-[#FAD691]/20 transition-colors">
                      <div className="text-lg font-bold text-[#FAD691] arimo-700">
                        {app.averageRating.toFixed(1)}
                      </div>
                      <div className="text-xs text-[#C9CDCF] arimo-400">
                        Rating
                      </div>
                    </div>
                    <div className="text-center p-3 bg-[#FAD691]/10 rounded-lg border border-[#FAD691]/20 hover:bg-[#FAD691]/20 transition-colors">
                      <div className="text-lg font-bold text-[#FAD691] arimo-700">
                        {formatEther(app.escrowAmount)}
                      </div>
                      <div className="text-xs text-[#C9CDCF] arimo-400">
                        Available
                      </div>
                    </div>
                  </div>

                  {/* Reward Info */}
                  <div className="p-4 bg-gradient-to-r from-[#ED775A]/10 to-[#FAD691]/10 rounded-lg border border-[#FAD691]/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#FAD691] font-medium arimo-600">
                        Reward per review:
                      </span>
                      <span className="text-[#C9CDCF] font-semibold arimo-600">
                        {formatEther(app.rewardPerReview)} tokens
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-3">
                    <Button
                      onClick={() => handleAppClick(app)}
                      className="w-full bg-[#ED775A] text-white hover:bg-[#FAD691] hover:text-[#0F0E0E] arimo-600 py-3 rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open App
                    </Button>
                    <Button
                      onClick={() =>
                        (window.location.href = `/feedback/${app.appId}`)
                      }
                      className="w-full bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 arimo-600 py-3 rounded-lg border border-[#FAD691]/30 transition-all duration-300 hover:scale-105"
                    >
                      View Reviews
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
