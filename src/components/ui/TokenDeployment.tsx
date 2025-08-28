"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./input";
import { Label } from "./label";
import { Coins, CheckCircle, Loader2, Zap, Settings } from "lucide-react";
import { useContract } from "~/hooks/useContract";
import {
  getTokenDetails,
  formatTokenAmount,
  TokenDetails,
} from "~/lib/tokenUtils";
import { CONTRACT_ADDRESSES } from "~/lib/contracts";
import toast from "react-hot-toast";
import { createCoinCall, getCoinCreateFromLogs } from "@zoralabs/coins-sdk";
import {
  useChainId,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import { base } from "viem/chains";
import { Address } from "viem";
import React, { useEffect } from "react";
import { switchChain } from "viem/actions";

interface TokenDeploymentProps {
  onTokenDeployed: (tokenAddress: string) => void;
  onTokenChecked: (isChecked: boolean) => void;
  tokenImage?: string;
  tokenName?: string;
  description?: string;
}

export default function TokenDeployment({
  onTokenDeployed,
  onTokenChecked,
  tokenImage,
  tokenName = "My App Token",
  description,
}: TokenDeploymentProps) {
  const { address } = useContract();
  const [manualTokenAddress, setManualTokenAddress] = useState("");
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [deploymentMode, setDeploymentMode] = useState<"manual" | "zora">(
    "manual"
  );
  const [deploying, setDeploying] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [savedTokenAddress, setSavedTokenAddress] = useState<string>("");
  const [editableTokenName, setEditableTokenName] = useState(tokenName);

  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  // Load saved token data on component mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("deployedTokenAddress");
    const savedName = localStorage.getItem("deployedTokenName");
    const savedSymbol = localStorage.getItem("deployedTokenSymbol");

    if (savedAddress && savedName === tokenName) {
      setSavedTokenAddress(savedAddress);
      setManualTokenAddress(savedAddress);
      // Auto-fetch token details for saved token
      fetchTokenDetails(savedAddress);
    }
  }, [tokenName]);

  // Update editableTokenName when tokenName prop changes
  useEffect(() => {
    setEditableTokenName(tokenName);
  }, [tokenName]);

  const { sendTransaction, data: txHash } = useSendTransaction({
    mutation: {
      onSuccess: (hash) => {
        console.log("✅ Transaction sent:", hash);
        toast.success("Transaction sent, waiting for confirmation...");
      },
      onError: (error: Error) => {
        console.error("❌ Transaction failed:", error);
      },
    },
  });

  const {
    data: receipt,
    isSuccess,
    isLoading,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const fetchTokenDetails = async (tokenAddress: string) => {
    if (!address || !tokenAddress.trim()) return;

    setLoading(true);
    try {
      const details = await getTokenDetails(
        tokenAddress as `0x${string}`,
        address as `0x${string}`,
        CONTRACT_ADDRESSES.MINISCOUT as `0x${string}`
      );
      setTokenDetails(details);
      onTokenChecked(true);
      toast.success(`Token found: ${details.name} (${details.symbol})`);
    } catch (error) {
      console.error("Error fetching token details:", error);
      setTokenDetails(null);
      onTokenChecked(false);
      toast.error("Invalid token address or token not found");
    } finally {
      setLoading(false);
    }
  };

  const handleManualTokenAddress = () => {
    if (!manualTokenAddress.trim()) {
      toast.error("Please enter a valid token address");
      return;
    }

    if (
      !manualTokenAddress.startsWith("0x") ||
      manualTokenAddress.length !== 42
    ) {
      toast.error("Please enter a valid Token address");
      return;
    }

    if (tokenDetails) {
      onTokenDeployed(manualTokenAddress);
      toast.success("Token selected successfully!");
    } else {
      fetchTokenDetails(manualTokenAddress);
    }
  };

  const clearSavedToken = () => {
    localStorage.removeItem("deployedTokenAddress");
    localStorage.removeItem("deployedTokenName");
    localStorage.removeItem("deployedTokenSymbol");
    setSavedTokenAddress("");
    setManualTokenAddress("");
    setTokenDetails(null);
    onTokenChecked(false);
    toast.success("Saved token cleared");
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualTokenAddress(value);

    if (tokenDetails) {
      setTokenDetails(null);
      onTokenChecked(false);
    }
  };

  const handleZoraDeployment = async () => {
    if (!address || !editableTokenName || !tokenSymbol.trim()) {
      toast.error("Please provide token name and symbol");
      return;
    }

    if (chainId !== base.id) {
      switchChain({ chainId: base.id });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    setDeploying(true);
    try {
      // Upload metadata to Pinata via API
      const metadataResponse = await fetch("/api/metadata/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editableTokenName,
          description: description || "Reward token for app reviews",
          image: tokenImage,
        }),
      });

      if (!metadataResponse.ok) {
        const errorData = await metadataResponse.json();
        throw new Error(errorData.error || "Failed to upload metadata");
      }

      const metadataData = await metadataResponse.json();
      const metadataUri = metadataData.gatewayUrl;

      console.log("Metadata uploaded:", metadataData);

      const args = {
        creator: address as Address,
        name: editableTokenName,
        symbol: tokenSymbol.toUpperCase(),
        uri: metadataUri,
        payoutRecipient: address as Address,
        chainId: base.id,
        skipMetadataValidation: true,
        platformReferrer: process.env
          .NEXT_PUBLIC_PLATFORM_REFERRER as `0x${string}`,
        metadata: {
          type: "RAW_URI" as const,
          uri: metadataUri,
        },
        currency: "ZORA" as const,
      };

      const txCall = await createCoinCall(args);
      console.log(txCall, "txCall");

      if (txCall && Array.isArray(txCall) && txCall.length > 0) {
        sendTransaction({
          to: txCall[0].to,
          data: txCall[0].data,
          value: txCall[0].value,
        });

        toast.success("Token deployment transaction submitted!");
      } else {
        throw new Error("Failed to create transaction call");
      }
    } catch (error) {
      console.error("Error deploying token:", error);
      toast.error("Failed to deploy token");
    } finally {
      setDeploying(false);
    }
  };

  useEffect(() => {
    if (isSuccess && receipt) {
      console.log("✅ Transaction confirmed:", receipt);

      // Now parse logs from the receipt
      const deployedAddress = getCoinCreateFromLogs(receipt);
      console.log("🎉 Deployed Coin:", deployedAddress?.coin);

      if (deployedAddress?.coin) {
        const tokenAddress = deployedAddress.coin as `0x${string}`;
        onTokenDeployed(tokenAddress);
        onTokenChecked(true);
        toast.success(`Token deployed successfully`);

        // Save the deployed token address to localStorage
        localStorage.setItem("deployedTokenAddress", tokenAddress);
        localStorage.setItem("deployedTokenName", editableTokenName);
        localStorage.setItem("deployedTokenSymbol", tokenSymbol);
      }
    }
  }, [
    isSuccess,
    receipt,
    onTokenDeployed,
    onTokenChecked,
    editableTokenName,
    tokenSymbol,
  ]);

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="bg-[#FAD691]/10 rounded-lg p-4 border border-[#FAD691]/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#FAD691] arimo-600">
            Token Setup
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDeploymentMode("manual")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                deploymentMode === "manual"
                  ? "bg-[#ED775A] text-white"
                  : "bg-[#FAD691]/20 text-[#C9CDCF] hover:bg-[#FAD691]/30"
              }`}
            >
              <Settings className="w-3 h-3 inline mr-1" />
              Manual
            </button>
            <button
              onClick={() => setDeploymentMode("zora")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                deploymentMode === "zora"
                  ? "bg-[#ED775A] text-white"
                  : "bg-[#FAD691]/20 text-[#C9CDCF] hover:bg-[#FAD691]/30"
              }`}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              Deploy on Zora
            </button>
          </div>
        </div>

        {deploymentMode === "manual" ? (
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="manualTokenAddress"
                className="text-sm font-medium text-[#FAD691] arimo-600"
              >
                Token Address
              </Label>
              <Input
                id="manualTokenAddress"
                type="text"
                value={manualTokenAddress}
                onChange={handleAddressChange}
                placeholder="0x..."
                className="mt-2"
              />
            </div>

            {/* Token Details Display */}
            {loading && (
              <div className="p-3 bg-[#FAD691]/10 border border-[#FAD691]/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-[#FAD691] animate-spin" />
                  <span className="text-xs text-[#C9CDCF] arimo-400">
                    Fetching token details...
                  </span>
                </div>
              </div>
            )}

            {tokenDetails && !loading && (
              <div className="p-3 bg-[#FAD691]/10 border border-[#FAD691]/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-[#FAD691]" />
                    <span className="text-sm font-medium text-[#FAD691] arimo-600">
                      {tokenDetails.name} ({tokenDetails.symbol})
                    </span>
                  </div>
                  {savedTokenAddress && (
                    <button
                      onClick={clearSavedToken}
                      className="text-xs text-red-400 hover:text-red-300 arimo-400"
                    >
                      Clear Saved
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#C9CDCF] arimo-400">Balance:</span>
                    <span className="ml-1 text-[#C9CDCF] font-medium">
                      {formatTokenAmount(
                        tokenDetails.balance,
                        tokenDetails.decimals
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#C9CDCF] arimo-400">Allowance:</span>
                    <span className="ml-1 text-[#C9CDCF] font-medium">
                      {formatTokenAmount(
                        tokenDetails.allowance,
                        tokenDetails.decimals
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#C9CDCF] arimo-400">Decimals:</span>
                    <span className="ml-1 text-[#C9CDCF] font-medium">
                      {tokenDetails.decimals}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#C9CDCF] arimo-400">Status:</span>
                    <span
                      className={`ml-1 font-medium ${
                        tokenDetails.allowance > 0n
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {tokenDetails.allowance > 0n
                        ? "Approved"
                        : "Not Approved"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleManualTokenAddress}
              disabled={!manualTokenAddress.trim() || loading}
              className="w-full bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white arimo-600 disabled:opacity-50"
            >
              {loading
                ? "Fetching..."
                : tokenDetails
                ? "Use This Token"
                : "Check Token"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Zora Deployment Form */}
            <div className="bg-gradient-to-r from-[#ED775A]/10 to-[#FAD691]/10 rounded-lg p-4 border border-[#FAD691]/20">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-4 h-4 text-[#FAD691]" />
                <span className="text-sm font-medium text-[#FAD691] arimo-600">
                  Deploy New Token on Zora
                </span>
              </div>
              <p className="text-xs text-[#C9CDCF] arimo-400 mb-4">
                Create a new token for your app rewards. This will deploy a Zora
                token on Base network.
              </p>
            </div>

            <div>
              <Label
                htmlFor="tokenName"
                className="text-sm font-medium text-[#FAD691] arimo-600"
              >
                Token Name
              </Label>
              <Input
                id="tokenName"
                type="text"
                value={editableTokenName}
                onChange={(e) => setEditableTokenName(e.target.value)}
                placeholder="Enter token name"
                className="mt-2"
              />
              <p className="text-xs text-[#C9CDCF] mt-1 arimo-400">
                Default: {tokenName} (you can customize this)
              </p>
            </div>

            <div>
              <Label
                htmlFor="tokenSymbol"
                className="text-sm font-medium text-[#FAD691] arimo-600"
              >
                Token Symbol
              </Label>
              <Input
                id="tokenSymbol"
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                placeholder="e.g., REWARD"
                maxLength={10}
                className="mt-2"
              />
              <p className="text-xs text-[#C9CDCF] mt-1 arimo-400">
                Short symbol for your token (max 10 characters)
              </p>
            </div>

            {/* Token Preview */}
            {tokenSymbol && (
              <div className="p-3 bg-[#FAD691]/10 border border-[#FAD691]/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-[#FAD691]/30">
                    <img
                      src={tokenImage || "/icon.png"}
                      alt="Token"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/icon.png";
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#FAD691] arimo-600">
                      {editableTokenName} ({tokenSymbol.toUpperCase()})
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleZoraDeployment}
              disabled={!tokenSymbol.trim() || deploying}
              className="w-full bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white arimo-600 disabled:opacity-50"
            >
              {deploying ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span></span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Deploy on Zora</span>
                </div>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
