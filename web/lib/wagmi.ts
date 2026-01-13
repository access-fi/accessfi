import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia, sepolia} from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "AccessFi",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [sepolia, base, baseSepolia],
  ssr: true,
});
