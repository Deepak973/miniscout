"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Search,
  MessageSquare,
  ExternalLink,
  Gift,
  Copy,
  X,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";
import { useContract } from "~/hooks/useContract";
import { contractReads, App } from "~/lib/contracts";
import { formatEther } from "viem";
import { useConnect, useDisconnect, useSwitchChain } from "wagmi";
import Header from "~/components/ui/Header";
import { base, optimism } from "viem/chains";

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
  const [showTokenChart, setShowTokenChart] = useState(false);
  const [selectedApp, setSelectedApp] = useState<
    (App & { averageRating: number }) | null
  >(null);

  const {
    switchChain,
    error: chainSwitchError,
    isError: isChainSwitchError,
    isPending: isChainSwitchPending,
  } = useSwitchChain();

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
      <div className="min-h-screen bg-gradient-to-br from-[#C9CDCF]/20 to-[#C9CDCF]/10">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FAD691] mx-auto mb-4"></div>
            <p className="text-[#FAD691]">Loading apps...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0E0E]">
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
          <div className="bg-[#ED775A]/20 border border-[#FAD691]/30 rounded-lg p-6 mb-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
                Connect Your Wallet
              </h2>
              <p className="text-[#C9CDCF] mb-4 arimo-400">
                Connect your wallet to register mini apps and submit feedback
              </p>
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="px-6 py-2 bg-[#ED775A] text-white rounded-md hover:bg-[#FAD691] hover:text-[#0F0E0E] transition-colors arimo-600"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        )}

        {/* <button onClick={() => switchChain({ chainId: optimism.id })}>
          {" "}
          switchchain{" "}
        </button> */}

        {/* Stats */}

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ED775A] w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for mini apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border-[#FAD691]/30 focus:border-[#ED775A] focus:ring-[#FAD691]/20"
            />
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#FAD691] libertinus-keyboard-regular">
                Mini Apps
              </h2>
              <span className="text-sm text-[#C9CDCF] arimo-400">
                {filteredApps.length} apps
              </span>
            </div>

            {filteredApps.length === 0 ? (
              <div className="bg-[#ED775A]/10 rounded-lg shadow p-12 text-center border border-[#FAD691]/20">
                <MessageSquare className="w-12 h-12 text-[#FAD691] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#FAD691] mb-2 libertinus-keyboard-regular">
                  No apps found
                </h3>
                <p className="text-[#C9CDCF] mb-6 arimo-400">
                  {searchTerm
                    ? `No apps matching "${searchTerm}"`
                    : "No apps have been registered yet"}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={handleAddNewApp}
                    className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white arimo-600"
                  >
                    Add First App
                  </Button>
                )}
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.appId.toString()}
                  className="group relative bg-gradient-to-br from-[#1C1B1B]/80 to-[#2A2A2A]/60 backdrop-blur-xl rounded-2xl border border-[#FAD691]/20 hover:border-[#FAD691]/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden"
                >
                  {/* Header / Cover */}
                  <div className="relative h-28 w-full">
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.src = "/icon.png")}
                    />
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute -bottom-6 left-4 w-14 h-14 rounded-xl overflow-hidden border-2 border-[#FAD691]/40 shadow-lg bg-black/40">
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = "/icon.png")}
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="pt-8 px-4 pb-4 space-y-3">
                    <div>
                      <h3 className="text-base font-semibold text-[#FAD691] truncate edu-nsw-act-cursive-600">
                        {app.name}
                      </h3>
                      <p className="text-xs text-[#C9CDCF] line-clamp-2 arimo-400">
                        {app.description}
                      </p>
                    </div>

                    {/* Rating + Avg */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-[#FAD691] fill-current" />
                        <span className="text-[#FAD691] font-medium">
                          {app.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-[#C9CDCF]">
                        {app.totalRatings} reviews
                      </span>
                    </div>

                    {/* Rewards */}
                    <div className="mt-4 bg-[#ED775A]/10 rounded-xl border border-[#FAD691]/30 px-4 py-3 shadow-sm">
                      <h3 className="text-sm font-semibold text-[#FAD691] mb-2 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#ED775A]" />
                        Rewards
                      </h3>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-[#C9CDCF]">Per Review</div>
                        <div className="text-right text-[#FAD691] font-medium">
                          {formatEther(app.rewardPerReview)} tokens
                        </div>
                        <div className="text-[#C9CDCF]">Available Pool</div>
                        <div className="text-right text-[#FAD691] font-medium">
                          {formatEther(app.escrowAmount)} tokens
                        </div>
                      </div>
                    </div>

                    {/* Token Address */}
                    <div className="mt-3 bg-[#FAD691]/10 rounded-xl border border-[#FAD691]/30 px-4 py-3 shadow-sm">
                      <h3 className="text-sm font-semibold text-[#FAD691] mb-2 flex items-center gap-2">
                        <span className="text-[#ED775A]">🔗</span>
                        Token Contract
                      </h3>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                            setShowTokenChart(true);
                          }}
                          className="text-sm text-[#FAD691] font-mono arimo-600 hover:text-[#ED775A] transition-colors duration-200 cursor-pointer hover:underline"
                          title="Click to view token chart"
                        >
                          {app.appToken.slice(0, 6)}...{app.appToken.slice(-4)}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(app.appToken);
                            toast.success("Token address copied to clipboard!");
                          }}
                          className="p-1.5 bg-[#ED775A]/20 text-[#FAD691] hover:bg-[#ED775A]/40 rounded-md transition-all duration-200 hover:scale-105"
                          title="Copy token address"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/feedback/${app.appId}`;
                        }}
                        className="flex-1 bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 border border-[#FAD691]/30 text-xs rounded-lg transition hover:scale-105"
                      >
                        Review
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyFeedbackUrl(app.appId.toString());
                        }}
                        className="flex items-center justify-center gap-1 flex-1 bg-[#ED775A]/20 text-[#FAD691] hover:bg-[#ED775A]/30 border border-[#ED775A]/30 text-xs rounded-lg transition hover:scale-105"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(app.miniappUrl, "_blank");
                        }}
                        className="flex items-center justify-center gap-1 flex-1 bg-[#ED775A] text-white hover:bg-[#FAD691] hover:text-[#0F0E0E] text-xs rounded-lg transition hover:scale-105"
                      >
                        <ExternalLink className="w-3 h-3" /> Open
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Token Chart Modal */}
        {showTokenChart && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowTokenChart(false)}
            />

            {/* Modal */}
            <div className="relative bg-[#0F0E0E] rounded-2xl border border-[#FAD691]/30 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-[#FAD691]/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <img
                      src={selectedApp.iconUrl}
                      alt={selectedApp.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/icon.png";
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#FAD691] libertinus-keyboard-regular">
                      {selectedApp.name}
                    </h3>
                    <p className="text-sm text-[#C9CDCF] arimo-400">
                      {selectedApp.appToken.slice(0, 6)}...
                      {selectedApp.appToken.slice(-4)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTokenChart(false)}
                  className="!p-0 !m-0 w-5 h-5 flex items-center justify-center 
                bg-[#ED775A]/20 text-[#FAD691] hover:bg-[#ED775A]/40 
                rounded-lg transition-all duration-200 hover:scale-105"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "400px",
                  }}
                >
                  <iframe
                    id="geckoterminal-embed"
                    title="GeckoTerminal Embed"
                    src={`https://www.geckoterminal.com/base/pools/${selectedApp.appToken}?embed=1&info=0&swaps=0&light_chart=0&chart_type=market_cap&resolution=1d&bg_color=111827`}
                    frameBorder="0"
                    allow="clipboard-write"
                    allowFullScreen
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "12px",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-100">
            {/* Background overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div className="absolute left-0 top-0 h-full w-80 bg-black/60 backdrop-blur-lg shadow-xl border-r border-[#FAD691]/20">
              <div className="flex items-center justify-between p-4 border-b border-[#FAD691]/20">
                <h2 className="text-lg font-semibold text-[#FAD691] libertinus-keyboard-regular">
                  Menu
                </h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-[#C9CDCF] hover:text-[#FAD691]"
                >
                  X
                </button>
              </div>

              <div className="p-4 space-y-4 ">
                <Button
                  onClick={handleAddNewApp}
                  className="w-full bg-[#FAD691] hover:bg-[#ED775A] hover:text-white text-[#0F0E0E] arimo-600 libertinus-keyboard-regular"
                >
                  Add New App
                </Button>
                <Button
                  onClick={handleMyApps}
                  className="w-full bg-[#FAD691] hover:bg-[#ED775A] hover:text-white text-[#0F0E0E] arimo-600 libertinus-keyboard-regular"
                >
                  My Apps
                </Button>
                <Button
                  onClick={handleRewards}
                  className="w-full bg-[#FAD691] hover:bg-[#ED775A] hover:text-white text-[#0F0E0E] arimo-600 libertinus-keyboard-regular"
                >
                  My Rewards
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
