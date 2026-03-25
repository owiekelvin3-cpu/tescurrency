export const BTC_WALLET_ADDRESS = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

export const INVESTMENT_PLANS = [
  { name: "Starter", min: 100, max: 999, roi: 15, duration: 7, description: "Perfect for beginners" },
  { name: "Growth", min: 1000, max: 9999, roi: 25, duration: 14, description: "Accelerate your earnings" },
  { name: "Premium", min: 10000, max: 49999, roi: 40, duration: 21, description: "Maximize your returns" },
  { name: "Elite", min: 50000, max: 500000, roi: 60, duration: 30, description: "For serious investors" },
] as const;

export const BOARD_MEMBERS = [
  { name: "James Richardson", role: "CEO & Founder", image: "" },
  { name: "Sarah Chen", role: "Chief Financial Officer", image: "" },
  { name: "Michael Torres", role: "Head of Investments", image: "" },
  { name: "Emily Watson", role: "Chief Technology Officer", image: "" },
] as const;
