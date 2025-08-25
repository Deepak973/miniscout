"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./input";
import { Label } from "./label";

import { useContract } from "~/hooks/useContract";
import toast from "react-hot-toast";
import { Coins } from "lucide-react";

interface TokenDeploymentProps {
  onTokenDeployed: (tokenAddress: string) => void;
  tokenImage?: string;
}

export default function TokenDeployment({
  onTokenDeployed,
  tokenImage,
}: TokenDeploymentProps) {
  const { address } = useContract();
  const [manualTokenAddress, setManualTokenAddress] = useState("");

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
        Enter your existing token address if you already have a launched token.
      </p>

      {/* Coming Soon Notice */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">
              Zora Token Deployment
            </h4>
            <p className="text-xs text-yellow-700">
              Direct token deployment on Zora is coming soon. For now, please
              use an existing token address.
            </p>
          </div>
        </div>
      </div>

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
    </div>
  );
}
