"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./input";
import { Label } from "./label";
import { Coins, CheckCircle, Loader2 } from "lucide-react";
import { useContract } from "~/hooks/useContract";
import {
  getTokenDetails,
  formatTokenAmount,
  TokenDetails,
} from "~/lib/tokenUtils";
import { CONTRACT_ADDRESSES } from "~/lib/contracts";
import toast from "react-hot-toast";

interface TokenDeploymentProps {
  onTokenDeployed: (tokenAddress: string) => void;
  onTokenChecked: (isChecked: boolean) => void;
  tokenImage?: string;
}

export default function TokenDeployment({
  onTokenDeployed,
  onTokenChecked,
  tokenImage: _tokenImage,
}: TokenDeploymentProps) {
  const { address } = useContract();
  const [manualTokenAddress, setManualTokenAddress] = useState("");
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState(false);

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
      onTokenChecked(true); // Notify parent that token is checked
      toast.success(`Token found: ${details.name} (${details.symbol})`);
    } catch (error) {
      console.error("Error fetching token details:", error);
      setTokenDetails(null);
      onTokenChecked(false); // Notify parent that token check failed
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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualTokenAddress(value);

    // Clear token details when address changes
    if (tokenDetails) {
      setTokenDetails(null);
      onTokenChecked(false); // Notify parent that token is no longer checked
    }
  };

  return (
    <div className="space-y-4">
      {/* Coming Soon Notice */}
      <div className="p-3 bg-[#FAD691]/10 border border-[#FAD691]/20 rounded-lg">
        <div className="flex items-center space-x-2">
          <Coins className="w-4 h-4 text-[#FAD691]" />
          <span className="text-xs text-[#C9CDCF] arimo-400">
            Zora deployment coming soon
          </span>
        </div>
      </div>

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
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#C9CDCF] arimo-400">Balance:</span>
              <span className="ml-1 text-[#C9CDCF] font-medium">
                {formatTokenAmount(tokenDetails.balance, tokenDetails.decimals)}
              </span>
            </div>
            <div>
              <span className="text-[#C9CDCF] arimo-400">Decimals:</span>
              <span className="ml-1 text-[#C9CDCF] font-medium">
                {tokenDetails.decimals}
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
  );
}
