import { TeamMember, FaqItem, RoadmapItem, IdoProject, StakingTier } from './types';

export const NFT_IMAGES = [
  "/img/newimg/cap78.webp",
  "/img/newimg/cap80.webp",
  "/img/newimg/cap81.webp",
  "/img/newimg/cap82.webp",
  "/img/newimg/cap83.webp",
  "/img/newimg/cap84.webp",
  "/img/newimg/cap85.webp",
  "/img/newimg/cap86.webp",
];

export const LENTA_IMAGE = "/img/capylenta/Group1.png";

export const IDO_PROJECTS: IdoProject[] = [
  // --- 2 ACTIVE PROJECTS ---
  {
    id: "active-1",
    name: "Growth Fly",
    ticker: "$GROWTH",
    description: "The first AMM DEX optimized for relaxation. Zero stress trading with auto-compounding liquidity pools.",
    image: "/img/idos/growth-logo-technology-software-finance-600nw-2606351741.webp",
    status: 'Live',
    raiseAmount: 392450,
    targetAmount: 500000,
    participants: 4200,
    price: "0.05 USDC",
    endsIn: "14h 30m",
    access: 'Holders Only'
  },
  {
    id: "active-2",
    name: "CapyFi Staking",
    ticker: "$CFI",
    description: "High yield stablecoin vaults. Sleep while you earn with our automated strategies.",
    image: "/img/idos/android-chrome-512x512.png",
    status: 'Live',
    raiseAmount: 120500,
    targetAmount: 200000,
    participants: 890,
    price: "1.20 USDC",
    endsIn: "06h 15m",
    access: 'Public'
  },

  // --- 3 UPCOMING PROJECTS ---
  {
    id: "up-1",
    name: "Hydro Protocol",
    ticker: "$H2O",
    description: "Liquid staking derivative for the Chill ecosystem. Stake SOL, receive stSOL and chill.",
    image: "/img/idos/502x282 (2).png",
    status: 'Upcoming',
    raiseAmount: 0,
    targetAmount: 250000,
    participants: 0,
    price: "0.02 USDC",
    startsIn: "2d 12h",
    access: 'Public'
  },
  {
    id: "up-2",
    name: "Bamboo Network",
    ticker: "$BAM",
    description: "Decentralized physical infrastructure (DePIN) for jungle connectivity and sensors.",
    image: "/img/idos/e8036ba203e74d64445b9796da6c4bfebec1fc4f6cc7b746638869e05cd89cb7i0.webp",
    status: 'Upcoming',
    raiseAmount: 0,
    targetAmount: 1000000,
    participants: 0,
    price: "0.08 USDC",
    startsIn: "5d 08h",
    access: 'Holders Only'
  },
  {
    id: "up-3",
    name: "Thermal Pass",
    ticker: "$HEAT",
    description: "Exclusive access pass for on-chain hot spring events and metaverse spaces.",
    image: "/img/idos/002212525a9e785b17b3d05015d34fd09b3d09cc95d341d2594b016c202776e7i0.webp",
    status: 'Upcoming',
    raiseAmount: 0,
    targetAmount: 150000,
    participants: 0,
    price: "0.15 USDC",
    startsIn: "8d 00h",
    access: 'Holders Only'
  },


];

export const STAKING_TIERS: StakingTier[] = [
  {
    name: "Tourist",
    requirement: "10,000 $CCC",
    multiplier: "1x",
    allocation: "Lottery",
    image: "/img/newimg/cap84.webp",
    benefits: ["Standard Access", "Community Voting"]
  },
  {
    name: "Local",
    requirement: "1 Capybara NFT",
    multiplier: "5x",
    allocation: "Guaranteed",
    image: "/img/newimg/cap86.webp",
    benefits: ["Guaranteed Alloc", "Reduced Fees", "Private Discord"]
  },
  {
    name: "Mayor",
    requirement: "5 Capybara NFTs",
    multiplier: "20x",
    allocation: "Whale Alloc",
    image: "/img/newimg/cap78.webp",
    benefits: ["Max Allocation", "Seed Round Access", "Advisory Board"]
  }
];

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 1, name: "Capy King", role: "Founder", image: "/img/newimg/cap78.webp" },
  { id: 2, name: "Chill Dev", role: "Smart Contracts", image: "/img/newimg/cap80.webp" },
  { id: 3, name: "Zen Artist", role: "Art Director", image: "/img/newimg/cap81.webp" },
  { id: 4, name: "Hydro Homie", role: "Community", image: "/img/newimg/cap82.webp" },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    question: "How do I participate in IDOs?",
    answer: "You need to stake $CCC tokens or hold a Capybara Chill Club NFT to qualify for guaranteed allocation tiers."
  },
  {
    id: 2,
    question: "What is the refund policy?",
    answer: "We offer a 24-hour 'Cool Down' period after listing. If the token price drops below IDO price, you can claim a refund."
  },
  {
    id: 3,
    question: "Which wallet do I need?",
    answer: "We support Phantom, Solflare, and Backpack wallets on the Solana network."
  },
  {
    id: 4,
    question: "Is KYC required?",
    answer: "No. The Capybara Chill Launchpad is decentralized. Your NFT is your identity."
  }
];

export const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    phase: "01",
    title: "Genesis Mint",
    items: ["10,000 Capys Sold Out", "Magic Eden Trending #1", "Community Vault Setup"],
    status: 'completed'
  },
  {
    phase: "02",
    title: "The Utility",
    items: ["$CCC Token Live", "Staking V1 Launched", "First 3 IDOs Sold Out"],
    status: 'completed'
  },
  {
    phase: "03",
    title: "Expansion",
    items: ["Cross-Chain Bridge", "Capy Merch Store", "Partnership Reveals"],
    status: 'current'
  },
  {
    phase: "04",
    title: "Nirvana Chain",
    items: ["Layer 2 Testnet", "Gasless Transactions", "Global Hot Spring Events"],
    status: 'upcoming'
  }
];

// Data for graphs
export const TOKENOMICS_DATA = [
  { name: 'Liquidity', value: 45, fill: '#00c1b6' },
  { name: 'Holders', value: 30, fill: '#32dcd2' },
  { name: 'Treasury', value: 15, fill: '#00929b' },
  { name: 'Team', value: 10, fill: '#92f4ef' },
];

export const PRICE_DATA = [
  { name: 'Day 1', price: 0.001 },
  { name: 'Day 2', price: 0.002 },
  { name: 'Day 3', price: 0.0015 },
  { name: 'Day 4', price: 0.003 },
  { name: 'Day 5', price: 0.0045 },
  { name: 'Day 6', price: 0.004 },
  { name: 'Day 7', price: 0.006 },
];

export const HOLDER_DATA = [
  { name: 'Week 1', holders: 100 },
  { name: 'Week 2', holders: 250 },
  { name: 'Week 3', holders: 600 },
  { name: 'Week 4', holders: 1200 },
  { name: 'Week 5', holders: 1800 },
];