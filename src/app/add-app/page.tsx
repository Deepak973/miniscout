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
import { formatEther } from "viem";
import { useConnect, useDisconnect } from "wagmi";
import { CONTRACT_ADDRESSES, contractReads } from "~/lib/contracts";
import {
  getTokenDetails,
  parseTokenAmount,
  TokenDetails,
} from "~/lib/tokenUtils";
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
  const {
    isConnected,
    address,
    registerApp,
    approveTokens,
    registrationFeeInfo,
  } = useContract();
  const { connect, connectors } = useConnect();
  const { disconnect: _disconnect } = useDisconnect();
  const [submitting, setSubmitting] = useState(false);
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [checkingAllowance, setCheckingAllowance] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FrameData[]>([]);
  const [selectedFrame, setSelectedFrame] = useState<FrameData | null>(null);
  const [ownershipVerified, setOwnershipVerified] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userFid, setUserFid] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("search");
  const [tokenChecked, setTokenChecked] = useState(false);

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

  const handleTokenChecked = (isChecked: boolean) => {
    setTokenChecked(isChecked);
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

  const selectFrame = async (frame: FrameData) => {
    setSelectedFrame(frame);

    const allApps = await contractReads.getAllApps();
    console.log(allApps);
    console.log(frame.manifest.frame?.name);
    const alreadyRegistered = allApps.filter(
      (app) =>
        app.name.toLowerCase() === frame.manifest.frame?.name.toLowerCase()
    );
    if (alreadyRegistered.length > 0) {
      toast.error("This Mini App is already registered");
      return;
    }

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

  const checkTokenAllowance = async () => {
    if (!appData.appTokenAddress || !address) return;

    setCheckingAllowance(true);
    try {
      const details = await getTokenDetails(
        appData.appTokenAddress as `0x${string}`,
        address as `0x${string}`,
        CONTRACT_ADDRESSES.MINISCOUT as `0x${string}`
      );
      setTokenDetails(details);
    } catch (error) {
      console.error("Error checking token details:", error);
      toast.error("Failed to fetch token details");
    } finally {
      setCheckingAllowance(false);
    }
  };

  const handleApproveTokens = async () => {
    if (!appData.appTokenAddress || !appData.tokenAmount || !tokenDetails)
      return;

    setSubmitting(true);
    try {
      const approvalAmount = parseTokenAmount(
        appData.tokenAmount,
        tokenDetails.decimals
      );

      const _result = await approveTokens(
        appData.appTokenAddress as `0x${string}`,
        approvalAmount.toString(),
        CONTRACT_ADDRESSES.MINISCOUT as `0x${string}`
      );

      toast.success("Approval transaction submitted!");

      await checkTokenAllowance();
    } catch (error: any) {
      console.error("Error approving tokens:", error);
      toast.error(error.message || "Failed to approve tokens");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (appData.appTokenAddress && address) {
      checkTokenAllowance();
    }
  }, [appData.appTokenAddress, address]);

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

    if (!tokenDetails) {
      toast.error("Token details not loaded. Please try again.");
      return;
    }

    const tokenAmount = parseTokenAmount(
      appData.tokenAmount,
      tokenDetails.decimals
    );
    if (tokenDetails.allowance < tokenAmount) {
      toast.error("Insufficient token allowance. Please approve tokens first.");
      return;
    }

    if (tokenDetails.balance < tokenAmount) {
      toast.error("Insufficient token balance");
      return;
    }

    setSubmitting(true);
    try {
      // Calculate registration fee based on new contract logic
      let registrationFee = 0n;
      if (
        registrationFeeInfo?.totalApps !== undefined &&
        registrationFeeInfo.totalApps >= 100n &&
        registrationFeeInfo.isApplicable &&
        registrationFeeInfo.fee
      ) {
        registrationFee = registrationFeeInfo.fee;
      }

      await registerApp(
        appData.name,
        appData.description,
        userFid || 0,
        appData.miniappUrl,
        appData.miniappUrl,
        appData.iconUrl,
        appData.appId,
        parseTokenAmount(appData.tokenAmount, tokenDetails.decimals).toString(),
        parseTokenAmount(
          appData.rewardPerReview,
          tokenDetails.decimals
        ).toString(),
        appData.appTokenAddress as `0x${string}`,
        registrationFee
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
        return appData.appTokenAddress && tokenChecked;
      case "token-config":
        return (
          appData.tokenAmount &&
          appData.rewardPerReview &&
          appData.miniappUrl &&
          tokenDetails &&
          tokenDetails.balance >=
            parseTokenAmount(appData.tokenAmount, tokenDetails.decimals) &&
          tokenDetails.allowance >=
            parseTokenAmount(appData.tokenAmount, tokenDetails.decimals) &&
          BigInt(appData.rewardPerReview) <= BigInt(appData.tokenAmount)
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
      (step === "token-setup" && appData.appTokenAddress && tokenChecked) ||
      (step === "token-config" &&
        appData.tokenAmount &&
        BigInt(appData.rewardPerReview) <= BigInt(appData.tokenAmount) &&
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
            <div className="bg-[#ED775A]/10 rounded-xl shadow-xl p-6 border border-[#FAD691]/30">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
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

              {/* New Horizontal Stepper */}
              <div className="relative">
                <div className="flex justify-between items-center">
                  {[
                    { key: "search", label: "Select App" },
                    { key: "token-setup", label: "Setup Token" },
                    { key: "token-config", label: "Configure" },
                    { key: "review", label: "Register" },
                  ].map((step, index) => {
                    const status = getStepStatus(step.key as Step);

                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center text-center flex-1"
                      >
                        {/* Step Circle */}
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 relative z-10
                ${
                  status === "completed"
                    ? "bg-[#FAD691] border-[#FAD691] text-[#0F0E0E]"
                    : status === "current"
                    ? "bg-[#ED775A] border-[#FAD691] text-white"
                    : "bg-[#ED775A]/10 border-[#FAD691]/30 text-[#C9CDCF]"
                }`}
                        >
                          {status === "completed" ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <span className="text-sm font-medium arimo-600">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* Label */}
                        <span
                          className={`mt-2 text-xs font-medium arimo-600 ${
                            status === "completed"
                              ? "text-[#FAD691]"
                              : status === "current"
                              ? "text-[#FAD691]"
                              : "text-[#C9CDCF]"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Connector Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#FAD691]/30 -z-0" />
                <div
                  className="absolute top-5 left-0 h-0.5 bg-[#FAD691] -z-0 transition-all duration-500"
                  style={{
                    width: `${
                      ([
                        "search",
                        "token-setup",
                        "token-config",
                        "review",
                      ].indexOf(currentStep) /
                        (4 - 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Registration Fee Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">
                  Registration Fee
                </span>
                <span className="text-base font-semibold text-[#FAD691]">
                  {registrationFeeInfo?.totalApps !== undefined &&
                  registrationFeeInfo.totalApps < 100n
                    ? "Free (First 100)"
                    : registrationFeeInfo?.isApplicable &&
                      registrationFeeInfo.fee
                    ? `${formatEther(registrationFeeInfo.fee)} ETH`
                    : "Free"}
                </span>
              </div>

              {registrationFeeInfo?.totalApps !== undefined && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-400">
                    {registrationFeeInfo.totalApps < 100n
                      ? `Free for first 100 apps (${registrationFeeInfo.totalApps}/100 used)`
                      : "Registration fee applies after 100 apps"}
                  </p>

                  {registrationFeeInfo.totalApps >= 100n &&
                    !registrationFeeInfo.isApplicable && (
                      <p className="text-xs text-gray-500 italic">
                        Fees are currently disabled
                      </p>
                    )}
                </div>
              )}
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

                  <div className="mt-8 flex justify-center"></div>
                </div>
              </div>
            )}

            {/* Step 2: Token Setup */}
            {currentStep === "token-setup" && (
              <div className="bg-[#ED775A]/10 rounded-xl shadow-xl p-6 border border-[#FAD691]/30">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-[#FAD691] edu-nsw-act-cursive-600">
                    Add Your Token
                  </h3>
                </div>

                <div className="max-w-lg mx-auto">
                  <TokenDeployment
                    onTokenDeployed={handleTokenDeployed}
                    onTokenChecked={handleTokenChecked}
                    tokenImage={
                      selectedFrame?.manifest.frame?.icon_url ||
                      selectedFrame?.manifest.miniapp?.icon_url ||
                      "/icon.png"
                    }
                  />

                  {/* Navigation */}
                  <div className="mt-6 flex justify-between">
                    <Button
                      onClick={handlePreviousStep}
                      className="bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 px-4 py-2 rounded-lg border border-[#FAD691]/30 arimo-600"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Token Configuration */}
            {currentStep === "token-config" && (
              <div className="bg-[#ED775A]/10 rounded-xl shadow-xl p-6 border border-[#FAD691]/30">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-[#FAD691] edu-nsw-act-cursive-600">
                    Set Rewards
                  </h3>
                </div>

                <div className="max-w-lg mx-auto space-y-4">
                  <div className="bg-[#FAD691]/10 rounded-lg p-4 border border-[#FAD691]/20">
                    <Label
                      htmlFor="tokenAmount"
                      className="text-sm font-medium text-[#FAD691] arimo-600"
                    >
                      Total Tokens
                    </Label>
                    <Input
                      id="tokenAmount"
                      type="number"
                      value={appData.tokenAmount}
                      onChange={(e) => {
                        setAppData({
                          ...appData,
                          tokenAmount: e.target.value,
                        });
                      }}
                      placeholder="1000"
                      className="mt-2"
                    />
                  </div>

                  <div className="bg-[#FAD691]/10 rounded-lg p-4 border border-[#FAD691]/20">
                    <Label
                      htmlFor="rewardPerReview"
                      className="text-sm font-medium text-[#FAD691] arimo-600"
                    >
                      Per Review
                    </Label>
                    <Input
                      id="rewardPerReview"
                      type="number"
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
                  </div>

                  <div className="bg-[#FAD691]/10 rounded-lg p-4 border border-[#FAD691]/20">
                    <Label
                      htmlFor="miniappUrl"
                      className="text-sm font-medium text-[#FAD691] arimo-600"
                    >
                      App URL
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
                      placeholder="https://your-app.com"
                      className="mt-2"
                    />
                  </div>

                  {/* Token Status */}
                  {appData.appTokenAddress && tokenDetails && (
                    <div className="p-3 bg-[#FAD691]/10 rounded-lg border border-[#FAD691]/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#FAD691] arimo-600">
                          {tokenDetails.name} ({tokenDetails.symbol})
                        </span>
                        {checkingAllowance ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-[#FAD691] border-t-transparent"></div>
                        ) : tokenDetails.allowance >=
                            parseTokenAmount(
                              appData.tokenAmount || "0",
                              tokenDetails.decimals
                            ) &&
                          tokenDetails.balance >=
                            parseTokenAmount(
                              appData.tokenAmount || "0",
                              tokenDetails.decimals
                            ) ? (
                          <CheckCircle className="w-3 h-3 text-[#FAD691]" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        )}
                      </div>

                      {/* Minimal Validation */}
                      {tokenDetails.balance <
                        parseTokenAmount(
                          appData.tokenAmount || "0",
                          tokenDetails.decimals
                        ) && (
                        <div className="mt-2 text-xs text-red-400 arimo-400">
                          Insufficient balance
                        </div>
                      )}

                      {tokenDetails.balance >=
                        parseTokenAmount(
                          appData.tokenAmount || "0",
                          tokenDetails.decimals
                        ) &&
                        tokenDetails.allowance <
                          parseTokenAmount(
                            appData.tokenAmount || "0",
                            tokenDetails.decimals
                          ) && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-yellow-400 arimo-400">
                              Approval needed
                            </span>
                            <Button
                              onClick={handleApproveTokens}
                              disabled={submitting}
                              className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white px-2 py-1 rounded text-xs arimo-600"
                            >
                              {submitting ? "..." : "Approve"}
                            </Button>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    <Button
                      onClick={handlePreviousStep}
                      className="bg-[#FAD691]/20 text-[#FAD691] hover:bg-[#FAD691]/30 px-4 py-2 rounded-lg border border-[#FAD691]/30 arimo-600"
                    >
                      Back
                    </Button>

                    <Button
                      disabled={!canProceedToNextStep()}
                      onClick={handleNextStep}
                      className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white px-6 py-2 rounded-lg arimo-600"
                    >
                      Continue
                    </Button>
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
                  <div className="bg-[#ED775A]/10 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-[#FAD691]/30 hover:border-[#FAD691]/60 group overflow-hidden">
                    {/* Cover Header with Stretched Image */}
                    <div className="relative h-32">
                      <img
                        src={appData.iconUrl} // 👈 or app.coverImage if you have a dedicated cover field
                        alt={`${appData.name} cover`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/cover-fallback.png"; // 👈 add fallback cover
                        }}
                      />
                      {/* Dark overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0E]/70 to-transparent" />

                      {/* Floating Profile Icon */}
                      <div className="absolute left-1/2 -bottom-10 -translate-x-1/2">
                        <div className="w-20 h-20 rounded-xl overflow-hidden shadow-lg border-2 border-[#FAD691]/50 bg-[#0F0E0E]">
                          <img
                            src={appData.iconUrl}
                            alt={appData.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/icon.png";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* App Info */}
                    <div className="pt-14 px-6 pb-6 space-y-6 text-center">
                      <h3 className="text-lg font-semibold text-[#FAD691] truncate edu-nsw-act-cursive-600">
                        {appData.name}
                      </h3>
                      <p className="text-[#C9CDCF] text-sm line-clamp-2 arimo-400">
                        {appData.description}
                      </p>

                      {/* Reward Info */}
                      <div className="p-4 bg-gradient-to-r from-[#ED775A]/10 to-[#FAD691]/10 rounded-lg border border-[#FAD691]/20">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#FAD691] font-medium arimo-600">
                            Reward per review:
                          </span>
                          <span className="text-[#C9CDCF] font-semibold arimo-600">
                            {appData.rewardPerReview} tokens
                          </span>
                        </div>
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
                        <span className="text-[#FAD691] font-bold arimo-700">
                          {registrationFeeInfo?.totalApps !== undefined &&
                          registrationFeeInfo.totalApps < 100n
                            ? "Free"
                            : registrationFeeInfo?.isApplicable &&
                              registrationFeeInfo.fee
                            ? `${formatEther(registrationFeeInfo.fee)} ETH`
                            : "Free"}
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
                    <span>Back </span>
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
                      !tokenDetails ||
                      tokenDetails.allowance <
                        parseTokenAmount(
                          appData.tokenAmount || "0",
                          tokenDetails.decimals
                        ) ||
                      !ownershipVerified
                    }
                    className="bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 arimo-600"
                  >
                    {submitting ? "Registering..." : "Register"}
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
