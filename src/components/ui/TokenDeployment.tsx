"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./input";
import { Label } from "./label";
import { createCoinCall } from "@zoralabs/coins-sdk";
import { Address } from "viem";
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { base } from "viem/chains";
import { useContract } from "~/hooks/useContract";
import toast from "react-hot-toast";
import {
  Loader2,
  Coins,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface TokenDeploymentProps {
  onTokenDeployed: (tokenAddress: string) => void;
  tokenImage?: string;
}

export default function TokenDeployment({
  onTokenDeployed,
  tokenImage,
}: TokenDeploymentProps) {
  const { address } = useContract();
  const { sendTransaction, data: hash } = useSendTransaction();
  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({ hash });

  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTokenAddress, setManualTokenAddress] = useState("");

  const handleDeployToken = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!tokenName.trim() || !tokenSymbol.trim()) {
      toast.error("Please fill in token name and symbol");
      return;
    }

    setIsDeploying(true);
    try {
      const metadata = {
        name: tokenName.trim(),
        symbol: tokenSymbol.trim().toUpperCase(),
        description:
          tokenDescription.trim() || `${tokenName} token for MiniScout rewards`,
        image: tokenImage || "/icon.png",
      };

      const args = {
        creator: address as Address,
        name: tokenName.trim(),
        symbol: tokenSymbol.trim().toUpperCase(),
        uri: `data:application/json;base64,${btoa(JSON.stringify(metadata))}`,
        payoutRecipient: address as Address,
        chainId: base.id,
        startingMarketCap: "LOW" as const,
      };

      const txCalls = await createCoinCall(args);

      if (txCalls && Array.isArray(txCalls) && txCalls.length > 0) {
        await sendTransaction({
          to: txCalls[0].to,
          data: txCalls[0].data,
          value: txCalls[0].value || 0n,
        });
        toast.success("Token deployment transaction submitted!");
      } else {
        throw new Error("Failed to create transaction call");
      }
    } catch (error: any) {
      console.error("Error deploying token:", error);
      toast.error(error.message || "Failed to deploy token");
      setIsDeploying(false);
    }
  };

  // Handle successful transaction and extract token address
  if (isSuccess && receipt) {
    try {
      // Import the function to get coin address from logs
      import("@zoralabs/coins-sdk")
        .then(({ getCoinCreateFromLogs }) => {
          const coinDeployment = getCoinCreateFromLogs(receipt);

          if (coinDeployment?.coin) {
            toast.success(
              `Token deployed successfully at ${coinDeployment.coin}`
            );
            onTokenDeployed(coinDeployment.coin);
            setIsDeploying(false);
          } else {
            // If we can't extract the coin address, show transaction hash
            toast.success(
              `Token deployment successful! Transaction: ${receipt.transactionHash.slice(
                0,
                10
              )}...`
            );
            setIsDeploying(false);
          }
        })
        .catch((error) => {
          console.error("Error parsing deployment logs:", error);
          // Fallback: show success message with transaction hash
          toast.success(
            `Token deployed successfully! Transaction: ${receipt.transactionHash.slice(
              0,
              10
            )}...`
          );
          setIsDeploying(false);
        });
    } catch (error) {
      console.error("Error importing Zora SDK:", error);
      toast.success(
        "Token deployed successfully! Please check your wallet for the token address."
      );
      setIsDeploying(false);
    }
  }

  const handleManualTokenAddress = () => {
    if (!manualTokenAddress.trim()) {
      toast.error("Please enter a valid token address");
      return;
    }

    if (
      !manualTokenAddress.startsWith("0x") ||
      manualTokenAddress.length !== 42
    ) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    onTokenDeployed(manualTokenAddress);
    toast.success("Token address set successfully!");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Coins className="w-5 h-5 text-[#59981a]" />
        <h3 className="text-lg font-semibold text-[#3d550c]">Token Setup</h3>
      </div>

      <p className="text-sm text-[#59981a] mb-4">
        {showManualInput
          ? "Enter your existing token address if you already have a launched token."
          : "Deploy a new token on Zora for your app rewards or use an existing token."}
      </p>

      {/* Toggle Button */}
      <div className="mb-6">
        <Button
          onClick={() => setShowManualInput(!showManualInput)}
          className="w-full bg-[#ecf87f]/20 text-[#3d550c] hover:bg-[#ecf87f]/30 flex items-center justify-center space-x-2"
        >
          {showManualInput ? (
            <>
              <ArrowLeft className="w-4 h-4" />
              <span>Deploy New Token on Zora</span>
            </>
          ) : (
            <>
              <span>Use Existing Token Address</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>

      {!showManualInput ? (
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="tokenName"
              className="text-sm font-medium text-[#3d550c]"
            >
              Token Name *
            </Label>
            <Input
              id="tokenName"
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="My Awesome Token"
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="tokenSymbol"
              className="text-sm font-medium text-[#3d550c]"
            >
              Token Symbol *
            </Label>
            <Input
              id="tokenSymbol"
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="MAT"
              className="mt-1"
            />
            <p className="text-xs text-[#59981a] mt-1">
              Usually 3-4 characters (e.g., MAT, USDC, ETH)
            </p>
          </div>

          <div>
            <Label
              htmlFor="tokenDescription"
              className="text-sm font-medium text-[#3d550c]"
            >
              Token Description
            </Label>
            <Input
              id="tokenDescription"
              type="text"
              value={tokenDescription}
              onChange={(e) => setTokenDescription(e.target.value)}
              placeholder="Token for MiniScout app rewards"
              className="mt-1"
            />
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleDeployToken}
              disabled={
                isDeploying ||
                isConfirming ||
                !tokenName.trim() ||
                !tokenSymbol.trim()
              }
              className="w-full bg-[#59981a] hover:bg-[#81b622] disabled:bg-gray-400 disabled:cursor-not-allowed text-white"
            >
              {isDeploying || isConfirming ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isConfirming ? "Deploying..." : "Preparing..."}</span>
                </div>
              ) : (
                "Deploy Token on Zora"
              )}
            </Button>
          </div>

          <div className="text-center">
            <a
              href="https://zora.co/coins"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-sm text-[#59981a] hover:text-[#3d550c] underline"
            >
              <span>Learn more about Zora Coins</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="manualTokenAddress"
              className="text-sm font-medium text-[#3d550c]"
            >
              Token Contract Address *
            </Label>
            <Input
              id="manualTokenAddress"
              type="text"
              value={manualTokenAddress}
              onChange={(e) => setManualTokenAddress(e.target.value)}
              placeholder="0x..."
              className="mt-1"
            />
            <p className="text-xs text-[#59981a] mt-1">
              Enter the address of your existing ERC-20 token
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleManualTokenAddress}
              disabled={!manualTokenAddress.trim()}
              className="w-full bg-[#59981a] hover:bg-[#81b622] text-white"
            >
              Use This Token
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
