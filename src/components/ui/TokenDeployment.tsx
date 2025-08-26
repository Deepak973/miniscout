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
    <div className="bg-[#ED775A]/10 rounded-lg shadow p-6 border border-[#FAD691]/30">
      <div className="flex items-center space-x-2 mb-4">
        <Coins className="w-5 h-5 text-[#ED775A]" />
        <h3 className="text-lg font-semibold text-[#FAD691] edu-nsw-act-cursive-600">
          Token Setup
        </h3>
      </div>

      <p className="text-sm text-[#C9CDCF] mb-4 arimo-400">
        Enter your existing token address if you already have a launched token.
      </p>

      {/* Coming Soon Notice */}
      <div className="mb-6 p-4 bg-[#FAD691]/20 border border-[#FAD691]/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-[#FAD691]" />
          <div>
            <h4 className="text-sm font-medium text-[#FAD691] arimo-600">
              Zora Token Deployment
            </h4>
            <p className="text-xs text-[#C9CDCF] arimo-400">
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
            className="text-sm font-medium text-[#FAD691] arimo-600"
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
          <p className="text-xs text-[#C9CDCF] mt-1 arimo-400">
            Enter the address of your existing ERC-20 token
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleManualTokenAddress}
            disabled={!manualTokenAddress.trim()}
            className="w-full bg-[#ED775A] hover:bg-[#FAD691] hover:text-[#0F0E0E] text-white arimo-600"
          >
            Use This Token
          </Button>
        </div>
      </div>
    </div>
  );
}
