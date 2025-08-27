import { publicClient } from "./contracts";

export interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  allowance: bigint;
}

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
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
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function getTokenDetails(
  tokenAddress: `0x${string}`,
  userAddress: `0x${string}`,
  spenderAddress: `0x${string}`
): Promise<TokenDetails> {
  try {
    const [name, symbol, decimals, balance, allowance] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "name",
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "symbol",
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [userAddress],
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [userAddress, spenderAddress],
      }),
    ]);

    return {
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number,
      balance: balance as bigint,
      allowance: allowance as bigint,
    };
  } catch (error) {
    console.error("Error fetching token details:", error);
    throw new Error("Failed to fetch token details");
  }
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;

  if (fractionalPart === 0n) {
    return wholePart.toString();
  }

  const fractionalString = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = fractionalString.replace(/0+$/, "");

  return `${wholePart}.${trimmedFractional}`;
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [wholePart, fractionalPart = "0"] = amount.split(".");
  const paddedFractional = fractionalPart
    .padEnd(decimals, "0")
    .slice(0, decimals);
  const wholeBigInt = BigInt(wholePart || "0");
  const fractionalBigInt = BigInt(paddedFractional);

  return wholeBigInt * BigInt(10 ** decimals) + fractionalBigInt;
}
