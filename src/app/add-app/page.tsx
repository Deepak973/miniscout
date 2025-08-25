"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";
import { useContract } from "~/hooks/useContract";
import { formatEther, parseEther } from "viem";
import { useConnect, useDisconnect } from "wagmi";
import { CONTRACT_ADDRESSES, publicClient } from "~/lib/contracts";
import Header from "~/components/ui/Header";
import TokenDeployment from "~/components/ui/TokenDeployment";

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

type Step = "search" | "token-setup" | "token-config" | "review";

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
  const [currentStep, setCurrentStep] = useState<Step>("search");

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

  const handleTokenDeployed = (tokenAddress: string) => {
    setAppData((prev) => ({
      ...prev,
      appTokenAddress: tokenAddress,
    }));
    // Move to next step after token is set
    setCurrentStep("token-config");
  };

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
      // Move to next step
      setCurrentStep("token-setup");
    } else {
      setOwnershipVerified(false);
      toast.error("You are not the owner of this Mini app");
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
          CONTRACT_ADDRESSES.MINISCOUT, // MiniScout contract address
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
        CONTRACT_ADDRESSES.MINISCOUT // MiniScout contract address
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

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case "search":
        return ownershipVerified && selectedFrame;
      case "token-setup":
        return appData.appTokenAddress;
      case "token-config":
        return (
          appData.tokenAmount && appData.rewardPerReview && appData.miniappUrl
        );
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (currentStep === "search" && canProceedToNextStep()) {
      setCurrentStep("token-setup");
    } else if (currentStep === "token-setup" && canProceedToNextStep()) {
      setCurrentStep("token-config");
    } else if (currentStep === "token-config" && canProceedToNextStep()) {
      setCurrentStep("review");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "token-setup") {
      setCurrentStep("search");
    } else if (currentStep === "token-config") {
      setCurrentStep("token-setup");
    } else if (currentStep === "review") {
      setCurrentStep("token-config");
    }
  };

  const getStepStatus = (step: Step) => {
    if (currentStep === step) return "current";
    if (
      (step === "search" && ownershipVerified) ||
      (step === "token-setup" && appData.appTokenAddress) ||
      (step === "token-config" &&
        appData.tokenAmount &&
        appData.rewardPerReview &&
        appData.miniappUrl) ||
      (step === "review" && currentStep === "review")
    ) {
      return "completed";
    }
    return "pending";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecf87f]/20 to-[#81b622]/10">
      {/* Header */}
      <Header title="Add New App" showBackButton={true} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
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
            {/* Progress Steps */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#3d550c]">
                  App Registration Steps
                </h2>
                <div className="text-sm text-[#59981a]">
                  Step{" "}
                  {["search", "token-setup", "token-config", "review"].indexOf(
                    currentStep
                  ) + 1}{" "}
                  of 4
                </div>
              </div>

              <div className="flex items-center justify-between overflow-x-auto">
                {[
                  { key: "search", label: "Select App" },
                  { key: "token-setup", label: "Setup Token" },
                  { key: "token-config", label: "Configure Rewards" },
                  { key: "review", label: "Review & Register" },
                ].map((step, index) => (
                  <div
                    key={step.key}
                    className="flex items-center flex-shrink-0"
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                        getStepStatus(step.key as Step) === "completed"
                          ? "bg-[#59981a] border-[#59981a] text-white"
                          : getStepStatus(step.key as Step) === "current"
                          ? "bg-[#ecf87f] border-[#59981a] text-[#3d550c]"
                          : "bg-white border-[#81b622]/30 text-[#59981a]"
                      }`}
                    >
                      {getStepStatus(step.key as Step) === "completed" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`ml-2 text-sm font-medium whitespace-nowrap ${
                        getStepStatus(step.key as Step) === "completed"
                          ? "text-[#59981a]"
                          : getStepStatus(step.key as Step) === "current"
                          ? "text-[#3d550c]"
                          : "text-[#59981a]"
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < 3 && (
                      <div
                        className={`w-8 h-0.5 mx-2 ${
                          getStepStatus(step.key as Step) === "completed"
                            ? "bg-[#59981a]"
                            : "bg-[#81b622]/30"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Registration Fee Info */}
            <div className="bg-white border border-[#81b622]/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-[#3d550c] font-medium">
                  Registration Fee:
                </span>
                <span className="text-[#3d550c] font-bold">{"0.0001"} ETH</span>
              </div>
            </div>

            {/* Step 1: Mini app Search */}
            {currentStep === "search" && (
              <div className="bg-white rounded-lg shadow p-6 overflow-hidden">
                <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
                  Step 1: Search for Your MiniApp
                </h3>
                <div className="flex items-center mb-4">
                  <Input
                    type="text"
                    placeholder="Search for your MiniApp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-black text-lg py-3 px-4 h-[48px] rounded-l-md border border-[#59981a]/50 focus:ring-2 focus:ring-[#81b622]"
                  />
                  <button
                    onClick={seachMiniApps}
                    disabled={searching || !searchQuery.trim()}
                    className="bg-[#59981a] hover:bg-[#81b622] text-white h-[40px] w-[40px] flex items-center justify-center rounded-md ml-2"
                  >
                    {searching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* User FID Info */}
                {userFid && (
                  <div className="mb-4 p-3 bg-[#ecf87f]/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-[#59981a]" />
                      <span className="text-sm text-[#3d550c]">
                        Your FID:{" "}
                        <span className="font-semibold">{userFid}</span>
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
                          <div className="flex items-start space-x-3">
                            <img
                              src={
                                frame.manifest.frame?.icon_url ||
                                frame.manifest.miniapp?.icon_url ||
                                "/icon.png"
                              }
                              alt="Mini App icon"
                              className="w-12 h-12 rounded-lg flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = "/icon.png";
                              }}
                            />
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <div className="flex items-center space-x-2 mb-1">
                                <div className="font-medium text-[#3d550c] truncate flex-1">
                                  {frame.manifest.frame?.name ||
                                    frame.manifest.miniapp?.name ||
                                    frame.title}
                                </div>
                                {isOwner && (
                                  <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full flex-shrink-0">
                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                    <span className="text-xs text-green-600 font-medium">
                                      Owner
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-[#59981a] mb-1 truncate">
                                by {frame.author.display_name} (@
                                {frame.author.username}) - FID:{" "}
                                {frame.author.fid}
                              </div>
                              <div className="text-xs text-[#3d550c] line-clamp-2 overflow-hidden">
                                {frame.manifest.frame?.description ||
                                  frame.manifest.miniapp?.description ||
                                  ""}
                              </div>
                            </div>
                            {selectedFrame === frame && ownershipVerified && (
                              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
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
                    <div className="flex items-start space-x-2">
                      {ownershipVerified ? (
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm font-medium break-words ${
                          ownershipVerified ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {ownershipVerified
                          ? "Mini App selected - You can register this app"
                          : "You are not the owner of this Mini app"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Step Button */}
                {canProceedToNextStep() && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={handleNextStep}
                      className="bg-[#59981a] hover:bg-[#81b622] text-white px-6 py-2 flex items-center space-x-2"
                    >
                      <span>Continue to Token Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Token Setup */}
            {currentStep === "token-setup" && (
              <div className="bg-white rounded-lg shadow p-6 overflow-hidden">
                <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
                  Step 2: Setup Your Token
                </h3>
                <p className="text-sm text-[#59981a] mb-6">
                  Deploy a new token on Zora for your app rewards or use an
                  existing token.
                </p>

                <TokenDeployment
                  onTokenDeployed={handleTokenDeployed}
                  tokenImage={
                    selectedFrame?.manifest.frame?.icon_url ||
                    selectedFrame?.manifest.miniapp?.icon_url ||
                    "/icon.png"
                  }
                />

                {/* Navigation Buttons */}
                <div className="mt-6 flex justify-between">
                  <Button
                    onClick={handlePreviousStep}
                    className="bg-[#ecf87f]/20 text-[#3d550c] hover:bg-[#ecf87f]/30 px-6 py-2 flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to App Selection</span>
                  </Button>

                  {canProceedToNextStep() && (
                    <Button
                      onClick={handleNextStep}
                      className="bg-[#59981a] hover:bg-[#81b622] text-white px-6 py-2 flex items-center space-x-2"
                    >
                      <span>Continue to Reward Configuration</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Token Configuration */}
            {currentStep === "token-config" && (
              <div className="bg-white rounded-lg shadow p-6 overflow-hidden">
                <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
                  Step 3: Configure Rewards & App Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

                  <div>
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
                </div>

                {/* Token Allowance Status */}
                {appData.appTokenAddress && appData.tokenAmount && (
                  <div className="mb-6 p-4 bg-[#ecf87f]/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-[#3d550c] mb-3">
                      Token Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-[#3d550c] whitespace-nowrap">
                          Balance:
                        </span>
                        <span className="text-sm font-semibold text-[#59981a] truncate">
                          {checkingAllowance
                            ? "Checking..."
                            : formatEther(tokenBalance)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-[#3d550c] whitespace-nowrap">
                          Allowance:
                        </span>
                        <span className="text-sm font-semibold text-[#59981a] truncate">
                          {checkingAllowance
                            ? "Checking..."
                            : formatEther(tokenAllowance)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
                        {checkingAllowance ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#59981a] border-t-transparent flex-shrink-0"></div>
                        ) : tokenAllowance >=
                          parseEther(appData.tokenAmount || "0") ? (
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
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
                    {tokenAllowance <
                      parseEther(appData.tokenAmount || "0") && (
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

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                  <Button
                    onClick={handlePreviousStep}
                    className="bg-[#ecf87f]/20 text-[#3d550c] hover:bg-[#ecf87f]/30 px-6 py-2 flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Token Setup</span>
                  </Button>

                  {canProceedToNextStep() && (
                    <Button
                      onClick={handleNextStep}
                      className="bg-[#59981a] hover:bg-[#81b622] text-white px-6 py-2 flex items-center space-x-2"
                    >
                      <span>Review & Register</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review & Register */}
            {currentStep === "review" && (
              <div className="bg-white rounded-lg shadow p-6 overflow-hidden">
                <h3 className="text-lg font-semibold text-[#3d550c] mb-4">
                  Step 4: Review & Register Your App
                </h3>

                <div className="space-y-6">
                  {/* App Details */}
                  <div className="border border-[#ecf87f]/30 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-[#3d550c] mb-3">
                      App Details
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-[#59981a]">Name:</span>
                        <p className="text-[#3d550c] font-medium break-words">
                          {appData.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#59981a]">App ID:</span>
                        <p className="text-[#3d550c] font-medium break-words">
                          {appData.appId}
                        </p>
                      </div>
                      <div className="lg:col-span-2">
                        <span className="text-sm text-[#59981a]">
                          Description:
                        </span>
                        <p className="text-[#3d550c] break-words">
                          {appData.description}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#59981a]">
                          MiniApp URL:
                        </span>
                        <p className="text-[#3d550c] font-medium break-words">
                          {appData.miniappUrl}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#59981a]">
                          Icon URL:
                        </span>
                        <p className="text-[#3d550c] font-medium break-words">
                          {appData.iconUrl}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Token Details */}
                  <div className="border border-[#ecf87f]/30 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-[#3d550c] mb-3">
                      Token Configuration
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-[#59981a]">
                          Token Address:
                        </span>
                        <p className="text-[#3d550c] font-medium break-words">
                          {appData.appTokenAddress}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#59981a]">
                          Total Amount:
                        </span>
                        <p className="text-[#3d550c] font-medium">
                          {appData.tokenAmount} tokens
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#59981a]">
                          Reward Per Review:
                        </span>
                        <p className="text-[#3d550c] font-medium">
                          {appData.rewardPerReview} tokens
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Registration Summary */}
                  <div className="border border-[#ecf87f]/30 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-[#3d550c] mb-3">
                      Registration Summary
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#59981a]">
                          Registration Fee:
                        </span>
                        <span className="text-[#3d550c] font-medium">
                          0.0001 ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#59981a]">Token Escrow:</span>
                        <span className="text-[#3d550c] font-medium">
                          {appData.tokenAmount} tokens
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#59981a]">
                          Max Reviews Possible:
                        </span>
                        <span className="text-[#3d550c] font-medium">
                          {appData.tokenAmount && appData.rewardPerReview
                            ? Math.floor(
                                Number(appData.tokenAmount) /
                                  Number(appData.rewardPerReview)
                              )
                            : 0}{" "}
                          reviews
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="mt-6 flex justify-between">
                  <Button
                    onClick={handlePreviousStep}
                    className="bg-[#ecf87f]/20 text-[#3d550c] hover:bg-[#ecf87f]/30 px-6 py-2 flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Configuration</span>
                  </Button>

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
                    className="bg-[#59981a] hover:bg-[#81b622] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-2"
                  >
                    {submitting ? "Registering..." : "Register App"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
