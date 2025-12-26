export interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface RoadmapItem {
  phase: string;
  title: string;
  items: string[];
  status: 'completed' | 'current' | 'upcoming';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface IdoProject {
  id: string;
  name: string;
  ticker: string;
  description: string;
  image: string;
  status: 'Live' | 'Upcoming' | 'Ended';
  raiseAmount: number; // Changed to number for live calculations
  targetAmount: number; // Added for progress calculation
  participants: number;
  price: string;
  endsIn?: string;
  startsIn?: string;
  access: 'Public' | 'Holders Only';
}

export interface StakingTier {
  name: string;
  requirement: string;
  multiplier: string;
  allocation: string;
  image: string;
  benefits: string[];
}