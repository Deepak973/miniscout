"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, User } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";
import { useContract } from "~/hooks/useContract";
import { formatEther, parseEther } from "viem";
import { useConnect, useDisconnect } from "wagmi";
import { publicClient } from "~/lib/contracts";
import Header from "~/components/ui/Header";

interface AppData {
  name: string;
  description: string;
  iconUrl: string;
  miniappUrl: string;
  appId: string;
  tokenAmount: string;
  rewardPerReview: string;
  appTokenAddress: string;
}

interface FrameData {
  version: string;
  image: string;
  frames_url: string;
  title: string;
  manifest: {
    frame?: {
      name: string;
      home_url: string;
      icon_url: string;
      description: string;
    };
    miniapp?: {
      name: string;
      home_url: string;
      icon_url: string;
      description: string;
    };
  };
  author: {
    fid: number;
    username: string;
    display_name: string;
    custody_address: string;
  };
}

export default function AddAppPage() {
  const { context } = useMiniApp();
  const { isConnected, address, registerApp, approveTokens } = useContract();
  const { connect, connectors } = useConnect();
  const { disconnect: _disconnect } = useDisconnect();
  const [submitting, setSubmitting] = useState(false);
  const [tokenAllowance, setTokenAllowance] = useState<bigint>(0n);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [checkingAllowance, setCheckingAllowance] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FrameData[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFid, setUserFid] = useState<number | null>(null);

  const [appData, setAppData] = useState<AppData>({
    name: "",
    description: "",
    iconUrl: "",
    miniappUrl: "",
    appId: "",
    tokenAmount: "",
    rewardPerReview: "",
    appTokenAddress: "",
  });

  // Get user's FID from context
  useEffect(() => {
    if (context?.user?.fid) {
      setUserFid(context.user.fid);
    }
  }, [context]);

  // Search for frames using backend API
  const seachMiniApps = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/frames/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      const data = await response.json();

      if (data.success && data.frames) {
        setSearchResults(data.frames);
        toast.success(`Found ${data.frames.length} MiniApp`);
      } else {
        setSearchResults([]);
        toast.error(data.error || "No frames found");
      }
    } catch (error) {
      console.error("Error searching frames:", error);
      toast.error("Failed to search frames");
    } finally {
      setSearching(false);
    }
  };

  // Check if user owns the frame (FID match)
  const isFrameOwner = (frame: FrameData) => {
    return userFid && frame.author.fid === userFid;
  };

  // Select a frame
  const selectFrame = (frame: FrameData) => {
    setSelectedFrame(frame);

    // Extract frame data
    const frameData = frame.manifest.frame || frame.manifest.miniapp;
    if (frameData) {
      setAppData((prev) => ({
        ...prev,
        name: frameData.name || "",
        description: frameData.description || "",
        iconUrl: frameData.icon_url || "",
        appId: frame.frames_url || "",
        // Don't auto-fill miniappUrl - let user input it
      }));
    }

    // Check ownership
    if (isFrameOwner(frame)) {
      setOwnershipVerified(true);
      toast.success("Mini App selected - You are the owner!");
    } else {
      setOwnershipVerified(false);
      toast.error("You are not the owner of this frame");
    }
  };

  // Check token allowance and balance
  const checkTokenAllowance = useCallback(async () => {
    if (!appData.appTokenAddress || !appData.tokenAmount) return;

    setCheckingAllowance(true);
    try {
      const allowance = await publicClient.readContract({
        address: appData.appTokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
            ],
            name: "allowance",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "allowance",
        args: [
          address as `0x${string}`,
          "0xcCEAd9170B4A9ef324aB9304Dc6cC37101a5361E", // MiniScout contract address
        ],
      });

      const balance = await publicClient.readContract({
        address: appData.appTokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      setTokenAllowance(allowance);
      setTokenBalance(balance);
    } catch (error) {
      console.error("Error checking allowance:", error);
      toast.error("Failed to check token allowance");
    } finally {
      setCheckingAllowance(false);
    }
  }, [appData.appTokenAddress, appData.tokenAmount, address]);

  // Handle token approval using the hook function
  const handleApproveTokens = async () => {
    if (!appData.appTokenAddress || !appData.tokenAmount) return;

    setSubmitting(true);
    try {
      // Use the approveTokens function from the useContract hook
      await approveTokens(
        appData.appTokenAddress as `0x${string}`,
        appData.tokenAmount,
        "0xcCEAd9170B4A9ef324aB9304Dc6cC37101a5361E" // MiniScout contract address
      );

      toast.success("Approval transaction submitted!");

      // Wait for transaction and refresh allowance
      setTimeout(() => {
        checkTokenAllowance();
      }, 5000);
    } catch (error: any) {
      console.error("Error approving tokens:", error);
      toast.error(error.message || "Failed to approve tokens");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (appData.appTokenAddress && appData.tokenAmount && address) {
      checkTokenAllowance();
    }
  }, [
    appData.appTokenAddress,
    appData.tokenAmount,
    address,
    checkTokenAllowance,
  ]);

  const handleSubmit = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!ownershipVerified) {
      toast.error("Please select a frame that you own");
      return;
    }

    if (
      !appData.name ||
      !appData.description ||
      !appData.miniappUrl ||
      !appData.appId ||
      !appData.tokenAmount ||
      !appData.rewardPerReview ||
      !appData.appTokenAddress
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const tokenAmount = parseEther(appData.tokenAmount);
    if (tokenAllowance < tokenAmount) {
      toast.error("Insufficient token allowance. Please approve tokens first.");
      return;
    }

    if (tokenBalance < tokenAmount) {
      toast.error("Insufficient token balance");
      return;
    }

    setSubmitting(true);
    try {
      await registerApp(
        appData.name,
        appData.description,
        appData.miniappUrl,
        appData.miniappUrl,
        appData.iconUrl,
        appData.appId,
        appData.tokenAmount,
        appData.rewardPerReview,
        appData.appTokenAddress as `0x${string}`
      );

      toast.success("App registered successfully!");
      window.location.href = "/";
    } catch (error: any) {
      toast.error(error.message || "Failed to register app");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
      {/* Header */}
      <Header title="Add New App" showBackButton={true} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <div className="bg-[#ecf87f]/30 border border-[#81b622]/30 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold text-[#3d550c] mb-2">
              Connect to Register App
            </h2>
            <p className="text-[#59981a] mb-6">
              Connect your wallet to register a new mini app and set up rewards
              for reviewers.
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-6 py-3 bg-[#59981a] text-white rounded-md hover:bg-[#81b622]"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Registration Fee Info */}
            <div className="bg-white border border-[#81b622]/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-[#3d550c] font-medium">
                  Registration Fee:
                </span>
                <span className="text-[#3d550c] font-bold">{"0.001"} ETH</span>
              </div>
            </div>

            {/* Mini app Search */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
                Search for Your MiniApp
              </h3>
              <div className="flex space-x-2 mb-4 items-center">
                <Input
                  type="text"
                  placeholder="Search for your MiniApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 text-black text-lg py-3 px-4 h-[50px]"
                />
                <Button
                  onClick={seachMiniApps}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-[#59981a] hover:bg-[#81b622] text-white p-2 h-[40px] w-[40px] flex items-center justify-center"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* User FID Info */}
              {userFid && (
                <div className="mb-4 p-3 bg-[#ecf87f]/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-[#59981a]" />
                    <span className="text-sm text-[#3d550c]">
                      Your FID: <span className="font-semibold">{userFid}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[#3d550c]">
                    Search Results:
                  </h4>
                  {searchResults.map((frame, index) => {
                    const isOwner = isFrameOwner(frame);
                    return (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedFrame === frame
                            ? "border-[#59981a] bg-[#ecf87f]/20"
                            : isOwner
                            ? "border-[#81b622]/50 hover:border-[#59981a] bg-[#ecf87f]/10"
                            : "border-[#81b622]/30 hover:border-[#81b622]/50"
                        }`}
                        onClick={() => selectFrame(frame)}
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              frame.manifest.frame?.icon_url ||
                              frame.manifest.miniapp?.icon_url ||
                              "/icon.png"
                            }
                            alt="Mini App icon"
                            className="w-12 h-12 rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = "/icon.png";
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="font-medium text-[#3d550c]">
                                {frame.manifest.frame?.name ||
                                  frame.manifest.miniapp?.name ||
                                  frame.title}
                              </div>
                              {isOwner && (
                                <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span className="text-xs text-green-600 font-medium">
                                    Owner
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-[#59981a] mt-1">
                              by {frame.author.display_name} (@
                              {frame.author.username}) - FID: {frame.author.fid}
                            </div>
                            <div className="text-xs text-[#3d550c] mt-1 line-clamp-2">
                              {frame.manifest.frame?.description ||
                                frame.manifest.miniapp?.description ||
                                ""}
                            </div>
                          </div>
                          {selectedFrame === frame && ownershipVerified && (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ownership Status */}
              {selectedFrame && (
                <div className="mt-4 p-3 bg-[#ecf87f]/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    {ownershipVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        ownershipVerified ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {ownershipVerified
                        ? "Mini App selected - You can register this app"
                        : "You are not the owner of this frame"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Mini App Details */}
            {selectedFrame && ownershipVerified && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
                  Mini App Details (Auto-filled)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-[#3d550c]">
                      App Name
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-[#3d550c]">
                      {appData.name}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#3d550c]">
                      App ID
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-[#3d550c]">
                      {appData.appId}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-[#3d550c]">
                      Description
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-[#3d550c]">
                      {appData.description}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-[#3d550c]">
                      Icon URL
                    </Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md text-[#3d550c]">
                      {appData.iconUrl}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Token Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
                Token Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label
                    htmlFor="appTokenAddress"
                    className="text-sm font-medium text-[#3d550c]"
                  >
                    App Token Address *
                  </Label>
                  <Input
                    id="appTokenAddress"
                    type="text"
                    value={appData.appTokenAddress}
                    onChange={(e) =>
                      setAppData({
                        ...appData,
                        appTokenAddress: e.target.value,
                      })
                    }
                    placeholder="0x..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="tokenAmount"
                    className="text-sm font-medium text-[#3d550c]"
                  >
                    Total Token Amount *
                  </Label>
                  <Input
                    id="tokenAmount"
                    type="text"
                    value={appData.tokenAmount}
                    onChange={(e) =>
                      setAppData({ ...appData, tokenAmount: e.target.value })
                    }
                    placeholder="1000"
                    className="mt-1"
                  />
                  <p className="text-xs text-[#59981a] mt-1">
                    Total tokens to allocate for rewards
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="rewardPerReview"
                    className="text-sm font-medium text-[#3d550c]"
                  >
                    Reward Per Review *
                  </Label>
                  <Input
                    id="rewardPerReview"
                    type="text"
                    value={appData.rewardPerReview}
                    onChange={(e) =>
                      setAppData({
                        ...appData,
                        rewardPerReview: e.target.value,
                      })
                    }
                    placeholder="10"
                    className="mt-1"
                  />
                  <p className="text-xs text-[#59981a] mt-1">
                    Tokens given per review
                  </p>
                </div>
              </div>

              {/* MiniApp URL Input */}
              <div className="mt-6">
                <Label
                  htmlFor="miniappUrl"
                  className="text-sm font-medium text-[#3d550c]"
                >
                  MiniApp URL *
                </Label>
                <Input
                  id="miniappUrl"
                  type="text"
                  value={appData.miniappUrl}
                  onChange={(e) =>
                    setAppData({
                      ...appData,
                      miniappUrl: e.target.value,
                    })
                  }
                  placeholder="https://your-miniapp-url.com"
                  className="mt-1"
                />
                <p className="text-xs text-[#59981a] mt-1">
                  The URL where users can access your MiniApp
                </p>
              </div>

              {/* Token Allowance Status */}
              {appData.appTokenAddress && appData.tokenAmount && (
                <div className="mt-6 p-4 bg-[#ecf87f]/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-[#3d550c] mb-3">
                    Token Status
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-[#3d550c]">Balance:</span>
                      <span className="text-sm font-semibold text-[#59981a]">
                        {checkingAllowance
                          ? "Checking..."
                          : formatEther(tokenBalance)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-[#3d550c]">Allowance:</span>
                      <span className="text-sm font-semibold text-[#59981a]">
                        {checkingAllowance
                          ? "Checking..."
                          : formatEther(tokenAllowance)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {checkingAllowance ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#59981a] border-t-transparent"></div>
                      ) : tokenAllowance >=
                        parseEther(appData.tokenAmount || "0") ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm ${
                          tokenAllowance >=
                          parseEther(appData.tokenAmount || "0")
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tokenAllowance >=
                        parseEther(appData.tokenAmount || "0")
                          ? "Approved"
                          : "Needs Approval"}
                      </span>
                    </div>
                  </div>
                  {tokenAllowance < parseEther(appData.tokenAmount || "0") && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800 mb-3">
                        You need to approve tokens before registering. Please
                        approve at least {appData.tokenAmount} tokens.
                      </p>
                      <Button
                        onClick={handleApproveTokens}
                        disabled={submitting}
                        className="bg-[#59981a] hover:bg-[#81b622] text-white px-4 py-2"
                      >
                        {submitting ? "Approving..." : "Approve Tokens"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !appData.name ||
                  !appData.description ||
                  !appData.miniappUrl ||
                  !appData.appId ||
                  !appData.tokenAmount ||
                  !appData.rewardPerReview ||
                  !appData.appTokenAddress ||
                  tokenAllowance < parseEther(appData.tokenAmount || "0") ||
                  !ownershipVerified
                }
                className="bg-[#59981a] hover:bg-[#81b622] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3"
              >
                {submitting ? "Registering..." : "Register App"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
