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
      <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
        <Header title="My Apps" showBackButton={true} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#ecf87f]/30 border border-[#81b622]/30 rounded-lg p-8 text-center">
            <MessageSquare className="w-16 h-16 text-[#81b622] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[#3d550c] mb-2">
              Connect to View Your Apps
            </h2>
            <p className="text-[#59981a] mb-6">
              Connect your wallet to see the apps you&apos;ve registered.
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-6 py-3 bg-[#59981a] text-white rounded-md hover:bg-[#81b622]"
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
      <Header title="My Apps" showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#81b622] flex-1">My Apps</h1>
          <button
            onClick={handleAddNewApp}
            className="p-2 bg-[#59981a] hover:bg-[#81b622] text-white rounded-md flex items-center justify-center"
          >
            +
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#59981a] mx-auto mb-4"></div>
              <p className="text-[#3d550c]">Loading your apps...</p>
            </div>
          </div>
        ) : myApps.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MessageSquare className="w-16 h-16 text-[#81b622] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#3d550c] mb-2">
              No Apps Found
            </h3>
            <p className="text-[#59981a] mb-6">
              You haven&apos;t registered any apps yet. Start by adding your
              first mini app.
            </p>
            <Button
              onClick={handleAddNewApp}
              className="bg-[#59981a] hover:bg-[#81b622] text-white"
            >
              Add Your First App
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {myApps.map((app) => (
              <div
                key={app.appId.toString()}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-[#ecf87f]/30"
              >
                <div className="p-6">
                  {/* Image, Title and Description in one column */}
                  <div className="flex flex-col items-start">
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-16 h-16 rounded-lg object-cover mb-3"
                      onError={(e) => {
                        e.currentTarget.src = "/icon.png";
                      }}
                    />
                    <h3 className="text-xl font-semibold text-[#3d550c] truncate">
                      {app.name}
                    </h3>
                    <p className="text-[#59981a] text-sm mt-1 line-clamp-2">
                      {app.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-3 bg-[#ecf87f]/20 rounded-lg">
                      <div className="text-lg font-bold text-[#3d550c]">
                        {app.totalRatings.toString()}
                      </div>
                      <div className="text-xs text-[#59981a]">Reviews</div>
                    </div>
                    <div className="text-center p-3 bg-[#ecf87f]/20 rounded-lg">
                      <div className="text-lg font-bold text-[#3d550c]">
                        {app.averageRating.toFixed(1)}
                      </div>
                      <div className="text-xs text-[#59981a]">Rating</div>
                    </div>
                    <div className="text-center p-3 bg-[#ecf87f]/20 rounded-lg">
                      <div className="text-lg font-bold text-[#3d550c]">
                        {formatEther(app.escrowAmount)}
                      </div>
                      <div className="text-xs text-[#59981a]">Available</div>
                    </div>
                  </div>

                  {/* Reward Info */}
                  <div className="mt-4 p-3 bg-[#ecf87f]/20 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#3d550c] font-medium">
                        Reward per review:
                      </span>
                      <span className="text-[#59981a] font-semibold">
                        {formatEther(app.rewardPerReview)} tokens
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-6">
                    <Button
                      onClick={() => handleAppClick(app)}
                      className="flex-1 bg-[#59981a] text-white hover:bg-[#81b622]"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open App
                    </Button>
                    <Button
                      onClick={() =>
                        (window.location.href = `/feedback/${app.appId}`)
                      }
                      className="flex-1 bg-[#ecf87f]/20 text-[#3d550c] hover:bg-[#ecf87f]/30"
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
