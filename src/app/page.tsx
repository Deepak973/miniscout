"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Search,
  MessageSquare,
  ExternalLink,
  Gift,
  Copy,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";
import { useContract } from "~/hooks/useContract";
import { contractReads, App } from "~/lib/contracts";
import { formatEther } from "viem";
import { useConnect, useDisconnect } from "wagmi";
import Header from "~/components/ui/Header";

export default function HomePage() {
  const { context: _context } = useMiniApp();
  const { isConnected, address: _address } = useContract();
  const { connect, connectors } = useConnect();
  const { disconnect: _disconnect } = useDisconnect();
  const [allApps, setAllApps] = useState<(App & { averageRating: number })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState<
    (App & { averageRating: number })[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_walletDropdownOpen, _setWalletDropdownOpen] = useState(false);

  useEffect(() => {
    fetchAllApps();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredApps(allApps);
    } else {
      const filtered = allApps.filter((app) =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  }, [searchTerm, allApps]);

  const fetchAllApps = async () => {
    setLoading(true);
    try {
      const apps = await contractReads.getAllApps();
      setAllApps(apps);
    } catch (_error) {
      console.error("Error fetching apps:", _error);
      toast.error("Failed to load apps");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewApp = () => {
    window.location.href = "/add-app";
  };

  const handleMyApps = () => {
    window.location.href = "/my-apps";
  };

  const handleRewards = () => {
    window.location.href = "/rewards";
  };

  const handleAppClick = (app: App & { averageRating: number }) => {
    window.open(app.miniappUrl, "_blank");
  };

  const copyFeedbackUrl = async (appId: string) => {
    const feedbackUrl = `https://farcaster.xyz/miniapps/amt-aKG509bA/miniscout/feedback/${appId}`;
    try {
      await navigator.clipboard.writeText(feedbackUrl);
      toast.success("Feedback URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy URL:", error);
      toast.error("Failed to copy URL");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#59981a] mx-auto mb-4"></div>
            <p className="text-[#3d550c]">Loading apps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
      {/* Header */}
      <Header
        title="MiniScout"
        showMenuButton={true}
        showAddButton={true}
        onMenuClick={() => setSidebarOpen(true)}
        onAddClick={handleAddNewApp}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Wallet Connection Banner */}
        {!isConnected && (
          <div className="bg-[#ecf87f]/30 border border-[#81b622]/30 rounded-lg p-6 mb-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#81b622] mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-[#59981a] mb-4">
                Connect your wallet to register mini apps and submit feedback
              </p>
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="px-6 py-2 bg-[#59981a] text-white rounded-md hover:bg-[#81b622]"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* Stats */}

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#59981a] w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for mini apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-[#81b622]/30 focus:border-[#59981a] focus:ring-[#ecf87f]/20"
            />
          </div>
        </div>

        {/* Apps Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#59981a]">Mini Apps</h2>
            <span className="text-sm text-[#59981a]">
              {filteredApps.length} apps
            </span>
          </div>

          {filteredApps.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <MessageSquare className="w-12 h-12 text-[#81b622] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#3d550c] mb-2">
                No apps found
              </h3>
              <p className="text-[#59981a] mb-6">
                {searchTerm
                  ? `No apps matching "${searchTerm}"`
                  : "No apps have been registered yet"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleAddNewApp}
                  className="bg-[#59981a] hover:bg-[#81b622] text-white"
                >
                  Add First App
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => (
                <div
                  key={app.appId.toString()}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border border-[#ecf87f]/30"
                  onClick={() => handleAppClick(app)}
                >
                  <div className="p-6">
                    {/* Image + Title + Description stacked */}
                    <div className="flex flex-col items-start">
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="w-12 h-12 rounded-lg object-cover mb-3"
                        onError={(e) => {
                          e.currentTarget.src = "/icon.png";
                        }}
                      />
                      <h3 className="text-lg font-semibold text-[#3d550c] truncate">
                        {app.name}
                      </h3>
                      <p className="text-[#59981a] text-sm mt-1 line-clamp-2">
                        {app.description}
                      </p>
                    </div>

                    {/* Rating + Reviews */}
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-[#ecf87f] fill-current" />
                        <span className="text-sm text-[#3d550c]">
                          {app.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-[#59981a]">
                        {app.totalRatings.toString()} reviews
                      </span>
                    </div>

                    {/* Reward Information */}
                    <div className="mt-3 p-2 bg-[#ecf87f]/20 rounded-md">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#3d550c] font-medium">
                          Rewards:
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[#59981a]">
                            {formatEther(app.rewardPerReview)} per review
                          </span>
                          <Gift className="w-3 h-3 text-[#81b622]" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-[#3d550c]">Available:</span>
                        <span className="text-[#59981a]">
                          {formatEther(app.escrowAmount)} tokens
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/feedback/${app.appId}`;
                        }}
                        className="flex-1 bg-[#ecf87f]/20 text-[#3d550c] hover:bg-[#ecf87f]/30"
                      >
                        Review
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyFeedbackUrl(app.appId.toString());
                        }}
                        className="px-3 bg-[#81b622]/20 text-[#3d550c] hover:bg-[#81b622]/30"
                        title="Copy feedback URL"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(app.miniappUrl, "_blank");
                        }}
                        className="px-3 bg-[#59981a] text-white hover:bg-[#81b622]"
                        title="Open MiniApp"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[#ecf87f]/30">
              <h2 className="text-lg font-semibold text-[#3d550c]">Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-[#59981a] hover:text-[#3d550c]"
              >
                X
              </button>
            </div>

            <div className="p-4 space-y-4">
              <Button
                onClick={handleAddNewApp}
                className="w-full bg-[#59981a] hover:bg-[#81b622] text-white"
              >
                Add New App
              </Button>
              <Button
                onClick={handleMyApps}
                className="w-full bg-[#ecf87f]/20 text-[#3d550c] hover:bg-[#ecf87f]/30"
              >
                My Apps
              </Button>
              <Button
                onClick={handleRewards}
                className="w-full bg-[#ecf87f]/20 text-[#3d550c] hover:bg-[#ecf87f]/30"
              >
                My Rewards
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
