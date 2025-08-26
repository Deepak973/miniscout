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
    setCurrentStep("token-config");
  };

  useEffect(() => {
    if (context?.user?.fid) {
      setUserFid(context.user.fid);
    }
  }, [context]);

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

  const isFrameOwner = (frame: FrameData) => {
    return userFid && frame.author.fid === userFid;
  };

  const selectFrame = (frame: FrameData) => {
    setSelectedFrame(frame);

    const frameData = frame.manifest.frame || frame.manifest.miniapp;
    if (frameData) {
      setAppData((prev) => ({
        ...prev,
        name: frameData.name || "",
        description: frameData.description || "",
        iconUrl: frameData.icon_url || "",
        appId: frame.frames_url || "",
      }));
    }

    if (isFrameOwner(frame)) {
      setOwnershipVerified(true);
      toast.success("Mini App selected - You are the owner!");
      setCurrentStep("token-setup");
    } else {
      setOwnershipVerified(false);
      toast.error("You are not the owner of this Mini app");
    }
  };

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
          CONTRACT_ADDRESSES.MINISCOUT as `0x${string}`,
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

  const handleApproveTokens = async () => {
    if (!appData.appTokenAddress || !appData.tokenAmount) return;

    setSubmitting(true);
    try {
      await approveTokens(
        appData.appTokenAddress as `0x${string}`,
        appData.tokenAmount,
        CONTRACT_ADDRESSES.MINISCOUT as `0x${string}`
      );

      toast.success("Approval transaction submitted!");

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
          appData.tokenAmount &&
          appData.rewardPerReview &&
          appData.miniappUrl &&
          tokenBalance >= parseEther(appData.tokenAmount || "0") &&
          tokenAllowance >= parseEther(appData.tokenAmount || "0")
        );
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (currentStep === "search" && canProceedToNextStep()) {
      setCurrentStep("token-setup");
      // Scroll to top when moving to next step
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "token-setup" && canProceedToNextStep()) {
      setCurrentStep("token-config");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "token-config" && canProceedToNextStep()) {
      setCurrentStep("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "token-setup") {
      setCurrentStep("search");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "token-config") {
      setCurrentStep("token-setup");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === "review") {
      setCurrentStep("token-config");
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="min-h-screen bg-[#0F0E0E]">
      <Header title="Add New App" showBackButton={true} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-hidden">
        {!isConnected ? (
          <div className="bg-[#ED775A]/20 border border-[#FAD691]/30 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
              Connect to Register App
            </h2>
            <p className="text-[#C9CDCF] mb-6 arimo-400">
              Connect your wallet to register a new mini app and set up rewards
              for reviewers.
            </p>
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="px-6 py-3 bg-[#ED775A] text-white rounded-xl hover:bg-[#FAD691] hover:text-[#0F0E0E] arimo-600 transition-all duration-300 hover:scale-105"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Progress Steps */}
            <div className="bg-[#ED775A]/10 rounded-xl shadow-xl p-8 border border-[#FAD691]/30">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold text-[#FAD691] edu-nsw-act-cursive-600">
                  Steps
                </h2>
                <div className="text-sm text-[#C9CDCF] arimo-400">
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
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        getStepStatus(step.key as Step) === "completed"
                          ? "bg-[#FAD691] border-[#FAD691] text-[#0F0E0E]"
                          : getStepStatus(step.key as Step) === "current"
                          ? "bg-[#ED775A] border-[#FAD691] text-white"
                          : "bg-[#ED775A]/10 border-[#FAD691]/30 text-[#C9CDCF]"
                      }`}
                    >
                      {getStepStatus(step.key as Step) === "completed" ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span className="text-sm font-medium arimo-600">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <span
                      className={`ml-3 text-sm font-medium whitespace-nowrap arimo-600 ${
                        getStepStatus(step.key as Step) === "completed"
                          ? "text-[#FAD691]"
                          : getStepStatus(step.key as Step) === "current"
                          ? "text-[#FAD691]"
                          : "text-[#C9CDCF]"
                      }`}
                    >
                      {step.label}
                    </span>
                    {index < 3 && (
                      <div
                        className={`w-12 h-1 mx-3 rounded-full ${
                          getStepStatus(step.key as Step) === "completed"
                            ? "bg-[#FAD691]"
                            : "bg-[#FAD691]/30"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Registration Fee Info */}
            <div className="bg-[#ED775A]/10 border border-[#FAD691]/30 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <span className="text-[#FAD691] font-medium arimo-600">
                  Registration Fee:
                </span>
                <span className="text-[#FAD691] font-bold arimo-700">
                  {"0.0001"} ETH
                </span>
              </div>
            </div>

            {/* Step 1: Mini app Search */}
            {currentStep === "search" && (
              <div className="bg-[#ED775A]/10 rounded-xl shadow-xl p-8 overflow-hidden border border-[#FAD691]/30">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
                    Step 1: Search for Your MiniApp
                  </h3>
                  <p className="text-[#C9CDCF] arimo-400">
                    Find and select your MiniApp from the search results
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <div className="flex items-center mb-6">
                    <Input
                      type="text"
                      placeholder="Search for your MiniApp..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 text-black text-lg py-4 px-6 h-[56px] rounded-l-xl border border-[#FAD691]/50 focus:ring-2 focus:ring-[#ED775A] focus:border-[#ED775A] shadow-lg"
                    />
                    <button
                      onClick={seachMiniApps}
                      disabled={searching || !searchQuery.trim()}
                      className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white h-[56px] w-[56px] flex items-center justify-center rounded-r-xl shadow-lg transition-all duration-300 hover:scale-105"
                    >
                      {searching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* User FID Info */}
                  {userFid && (
                    <div className="mb-6 p-4 bg-[#FAD691]/20 rounded-xl border border-[#FAD691]/30">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-[#ED775A]" />
                        <span className="text-sm text-[#FAD691] arimo-600">
                          Your FID:{" "}
                          <span className="font-semibold text-[#C9CDCF]">
                            {userFid}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-[#FAD691] edu-nsw-act-cursive-600 text-center">
                        Search Results
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.map((frame, index) => {
                          const isOwner = isFrameOwner(frame);
                          return (
                            <div
                              key={index}
                              className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                                selectedFrame === frame
                                  ? "border-[#FAD691] bg-[#FAD691]/20 shadow-xl"
                                  : isOwner
                                  ? "border-[#ED775A]/50 hover:border-[#FAD691] bg-[#ED775A]/10 hover:bg-[#FAD691]/10"
                                  : "border-[#ED775A]/30 hover:border-[#ED775A]/50 bg-[#ED775A]/5"
                              }`}
                              onClick={() => selectFrame(frame)}
                            >
                              <div className="flex flex-col space-y-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg border-2 border-[#FAD691]/30">
                                    <img
                                      src={
                                        frame.manifest.frame?.icon_url ||
                                        frame.manifest.miniapp?.icon_url ||
                                        "/icon.png"
                                      }
                                      alt="Mini App icon"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = "/icon.png";
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h5 className="font-semibold text-[#FAD691] truncate flex-1 edu-nsw-act-cursive-600">
                                        {frame.manifest.frame?.name ||
                                          frame.manifest.miniapp?.name ||
                                          frame.title}
                                      </h5>
                                      {isOwner && (
                                        <div className="flex items-center space-x-1 px-3 py-1 bg-[#FAD691]/20 rounded-full flex-shrink-0 border border-[#FAD691]/30">
                                          <CheckCircle className="w-3 h-3 text-[#FAD691]" />
                                          <span className="text-xs text-[#FAD691] font-medium arimo-600">
                                            Owner
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-sm text-[#C9CDCF] mb-2 arimo-400">
                                      by {frame.author.display_name} (@
                                      {frame.author.username})
                                    </p>
                                    <p className="text-xs text-[#C9CDCF] arimo-400">
                                      FID: {frame.author.fid}
                                    </p>
                                  </div>
                                </div>

                                <div className="text-sm text-[#C9CDCF] line-clamp-2 arimo-400">
                                  {frame.manifest.frame?.description ||
                                    frame.manifest.miniapp?.description ||
                                    ""}
                                </div>

                                {selectedFrame === frame &&
                                  ownershipVerified && (
                                    <div className="flex justify-center">
                                      <CheckCircle className="w-8 h-8 text-[#FAD691] animate-pulse" />
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Ownership Status */}
                  {selectedFrame && (
                    <div className="mt-6 p-4 bg-[#FAD691]/20 rounded-xl border border-[#FAD691]/30">
                      <div className="flex items-start space-x-3">
                        {ownershipVerified ? (
                          <CheckCircle className="w-6 h-6 text-[#FAD691] flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm font-medium break-words arimo-600 ${
                            ownershipVerified
                              ? "text-[#FAD691]"
                              : "text-red-400"
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
                    <div className="mt-8 flex justify-center">
                      <Button
                        onClick={handleNextStep}
                        className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white px-8 py-4 flex items-center space-x-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 arimo-600"
                      >
                        <span>Continue to Token Setup</span>
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Token Setup */}
            {currentStep === "token-setup" && (
              <div className="bg-[#ED775A]/10 rounded-xl shadow-xl p-8 overflow-hidden border border-[#FAD691]/30">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
                    Step 2: Setup Your Token
                  </h3>
                  <p className="text-[#C9CDCF] arimo-400">
                    Deploy a new token on Zora for your app rewards or use an
                    existing token.
                  </p>
                </div>

                <div className="max-w-2xl mx-auto">
                  <TokenDeployment
                    onTokenDeployed={handleTokenDeployed}
                    tokenImage={
                      selectedFrame?.manifest.frame?.icon_url ||
                      selectedFrame?.manifest.miniapp?.icon_url ||
                      "/icon.png"
                    }
                  />

                  {/* Navigation Buttons */}
                  <div className="mt-8 flex justify-between">
                    <Button
                      onClick={handlePreviousStep}
                      className="bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 px-6 py-3 flex items-center space-x-2 rounded-xl border border-[#FAD691]/30 transition-all duration-300 hover:scale-105 arimo-600"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back </span>
                    </Button>

                    {canProceedToNextStep() && (
                      <Button
                        onClick={handleNextStep}
                        className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white px-8 py-3 flex items-center space-x-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 arimo-600"
                      >
                        <span>Continue</span>
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Token Configuration */}
            {currentStep === "token-config" && (
              <div className="bg-[#ED775A]/10 rounded-xl shadow-xl p-8 overflow-hidden border border-[#FAD691]/30">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
                    Step 3: Configure Rewards & App Details
                  </h3>
                  <p className="text-[#C9CDCF] arimo-400">
                    Set up your token rewards and app configuration
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#FAD691]/10 rounded-xl p-6 border border-[#FAD691]/20">
                      <Label
                        htmlFor="tokenAmount"
                        className="text-sm font-medium text-[#FAD691] arimo-600"
                      >
                        Total Token Amount *
                      </Label>
                      <Input
                        id="tokenAmount"
                        type="text"
                        value={appData.tokenAmount}
                        onChange={(e) =>
                          setAppData({
                            ...appData,
                            tokenAmount: e.target.value,
                          })
                        }
                        placeholder="1000"
                        className="mt-2"
                      />
                      <p className="text-xs text-[#C9CDCF] mt-2 arimo-400">
                        Total tokens to allocate for rewards
                      </p>
                    </div>

                    <div className="bg-[#FAD691]/10 rounded-xl p-6 border border-[#FAD691]/20">
                      <Label
                        htmlFor="rewardPerReview"
                        className="text-sm font-medium text-[#FAD691] arimo-600"
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
                        className="mt-2"
                      />
                      <p className="text-xs text-[#C9CDCF] mt-2 arimo-400">
                        Tokens given per review
                      </p>
                    </div>

                    <div className="bg-[#FAD691]/10 rounded-xl p-6 border border-[#FAD691]/20">
                      <Label
                        htmlFor="miniappUrl"
                        className="text-sm font-medium text-[#FAD691] arimo-600"
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
                        className="mt-2"
                      />
                      <p className="text-xs text-[#C9CDCF] mt-2 arimo-400">
                        The URL where users can access your MiniApp
                      </p>
                    </div>
                  </div>

                  {/* Token Allowance Status */}
                  {appData.appTokenAddress && appData.tokenAmount && (
                    <div className="mb-8 p-6 bg-[#FAD691]/20 rounded-xl border border-[#FAD691]/30">
                      <h4 className="text-lg font-semibold text-[#FAD691] mb-4 edu-nsw-act-cursive-600">
                        Token Status
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-[#FAD691] whitespace-nowrap arimo-600">
                            Balance:
                          </span>
                          <span
                            className={`text-sm font-semibold truncate arimo-600 ${
                              tokenBalance <
                              parseEther(appData.tokenAmount || "0")
                                ? "text-red-400"
                                : "text-[#C9CDCF]"
                            }`}
                          >
                            {checkingAllowance
                              ? "Checking..."
                              : formatEther(tokenBalance)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-[#FAD691] whitespace-nowrap arimo-600">
                            Allowance:
                          </span>
                          <span
                            className={`text-sm font-semibold truncate arimo-600 ${
                              tokenAllowance <
                              parseEther(appData.tokenAmount || "0")
                                ? "text-red-400"
                                : "text-[#C9CDCF]"
                            }`}
                          >
                            {checkingAllowance
                              ? "Checking..."
                              : formatEther(tokenAllowance)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 sm:col-span-2 lg:col-span-1">
                          {checkingAllowance ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#FAD691] border-t-transparent flex-shrink-0"></div>
                          ) : tokenAllowance >=
                              parseEther(appData.tokenAmount || "0") &&
                            tokenBalance >=
                              parseEther(appData.tokenAmount || "0") ? (
                            <CheckCircle className="w-4 h-4 text-[#FAD691] flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm arimo-600 ${
                              tokenAllowance >=
                                parseEther(appData.tokenAmount || "0") &&
                              tokenBalance >=
                                parseEther(appData.tokenAmount || "0")
                                ? "text-[#FAD691]"
                                : "text-red-400"
                            }`}
                          >
                            {tokenAllowance >=
                              parseEther(appData.tokenAmount || "0") &&
                            tokenBalance >=
                              parseEther(appData.tokenAmount || "0")
                              ? "Ready"
                              : "Needs Action"}
                          </span>
                        </div>
                      </div>
                      {/* Validation Messages */}
                      {tokenBalance <
                        parseEther(appData.tokenAmount || "0") && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-sm text-red-800 mb-3 arimo-400">
                            ❌ <strong>Insufficient Token Balance:</strong> You
                            need at least {appData.tokenAmount} tokens. Current
                            balance: {formatEther(tokenBalance)} tokens.
                          </p>
                        </div>
                      )}

                      {tokenBalance >= parseEther(appData.tokenAmount || "0") &&
                        tokenAllowance <
                          parseEther(appData.tokenAmount || "0") && (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <p className="text-sm text-yellow-800 mb-3 arimo-400">
                              ⚠️ <strong>Token Approval Required:</strong> You
                              need to approve tokens before registering. Please
                              approve at least {appData.tokenAmount} tokens.
                            </p>
                            <Button
                              onClick={handleApproveTokens}
                              disabled={submitting}
                              className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white px-4 py-2 rounded-lg arimo-600"
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
                      className="bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 px-6 py-3 flex items-center space-x-2 rounded-xl border border-[#FAD691]/30 transition-all duration-300 hover:scale-105 arimo-600"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      <span>Back to Token Setup</span>
                    </Button>

                    {canProceedToNextStep() && (
                      <Button
                        onClick={handleNextStep}
                        className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white px-8 py-3 flex items-center space-x-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 arimo-600"
                      >
                        <span>Review & Register</span>
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review & Register */}
            {currentStep === "review" && (
              <div className="bg-[#ED775A]/10 rounded-xl shadow-xl p-8 overflow-hidden border border-[#FAD691]/30">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-[#FAD691] mb-2 edu-nsw-act-cursive-600">
                    Step 4: Review & Register Your App
                  </h3>
                  <p className="text-[#C9CDCF] arimo-400">
                    Review your app details and complete registration
                  </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-6">
                  {/* App Details */}
                  <div className="bg-[#FAD691]/10 rounded-xl p-6 border border-[#FAD691]/30">
                    <h4 className="text-lg font-semibold text-[#FAD691] mb-4 edu-nsw-act-cursive-600">
                      App Details
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          Name:
                        </span>
                        <p className="text-[#FAD691] font-medium break-words arimo-600">
                          {appData.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          App ID:
                        </span>
                        <p className="text-[#FAD691] font-medium break-words arimo-600">
                          {appData.appId}
                        </p>
                      </div>
                      <div className="lg:col-span-2">
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          Description:
                        </span>
                        <p className="text-[#C9CDCF] break-words arimo-400">
                          {appData.description}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          MiniApp URL:
                        </span>
                        <p className="text-[#FAD691] font-medium break-words arimo-600">
                          {appData.miniappUrl}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          Icon URL:
                        </span>
                        <p className="text-[#FAD691] font-medium break-words arimo-600">
                          {appData.iconUrl}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Token Details */}
                  <div className="bg-[#FAD691]/10 rounded-xl p-6 border border-[#FAD691]/30">
                    <h4 className="text-lg font-semibold text-[#FAD691] mb-4 edu-nsw-act-cursive-600">
                      Token Configuration
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          Token Address:
                        </span>
                        <p className="text-[#FAD691] font-medium break-words arimo-600">
                          {appData.appTokenAddress}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          Total Amount:
                        </span>
                        <p className="text-[#FAD691] font-medium arimo-600">
                          {appData.tokenAmount} tokens
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-[#C9CDCF] arimo-400">
                          Reward Per Review:
                        </span>
                        <p className="text-[#FAD691] font-medium arimo-600">
                          {appData.rewardPerReview} tokens
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Registration Summary */}
                  <div className="bg-[#FAD691]/10 rounded-xl p-6 border border-[#FAD691]/30">
                    <h4 className="text-lg font-semibold text-[#FAD691] mb-4 edu-nsw-act-cursive-600">
                      Registration Summary
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-[#C9CDCF] arimo-400">
                          Registration Fee:
                        </span>
                        <span className="text-[#FAD691] font-medium arimo-600">
                          0.0001 ETH
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#C9CDCF] arimo-400">
                          Token Escrow:
                        </span>
                        <span className="text-[#FAD691] font-medium arimo-600">
                          {appData.tokenAmount} tokens
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#C9CDCF] arimo-400">
                          Max Reviews Possible:
                        </span>
                        <span className="text-[#FAD691] font-medium arimo-600">
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
                <div className="mt-8 flex justify-between">
                  <Button
                    onClick={handlePreviousStep}
                    className="bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 px-6 py-3 flex items-center space-x-2 rounded-xl border border-[#FAD691]/30 transition-all duration-300 hover:scale-105 arimo-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
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
                    className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 arimo-600"
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
