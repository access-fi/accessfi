import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia, sepolia } from "wagmi/chains";
import { defineChain } from "viem";

// Horizen Testnet (Base Sepolia)
export const horizenTestnet = defineChain({
  id: 2651420,
  name: "Horizen Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://horizen-testnet.rpc.caldera.xyz/http"],
      webSocket: ["wss://horizen-testnet.rpc.caldera.xyz/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "Horizen Explorer",
      url: "https://horizen-testnet.explorer.caldera.xyz",
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: "AccessFi",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [horizenTestnet, sepolia, base, baseSepolia],
  ssr: true,
});
