export type AgeGroup = '18-24' | '25-34' | '35-44' | '45+';
export type Gender = 'Male' | 'Female' | 'Prefer not to say';
export type Occupation = 'Student' | 'Salaried Professional' | 'Business Owner' | 'Other';
export type ShoppingFrequency = 'Weekly' | '2-3 times a month' | 'Once a month' | 'Once in 2-3 months';
export type DiscoveryChannel =
  | 'Social Media (Instagram / YouTube)'
  | 'Word of Mouth'
  | 'Mall / Store Walk-in'
  | 'Online Shopping'
  | 'Celebrity / Influencer'
  | 'Brand Website'
  | 'TV / OOH Advertisement'
  | 'Other';
export type VisitReason =
  | 'Browsing / No specific reason'
  | 'Looking for a specific product'
  | 'Gift for someone'
  | 'Self-reward / treat'
  | 'Special occasion (wedding, event)'
  | 'Sale / Offer'
  | 'Loyalty / regular visit'
  | 'Other';
export type Category =
  | 'Apparel (Shirts / T-shirts / Jackets)'
  | 'Denim'
  | 'Fragrance'
  | 'Accessories (Bags / Belts / Caps)'
  | 'Footwear'
  | 'Did not purchase today';
export type SpendBracket = 'Under ₹3,000' | '₹3,000 – ₹8,000' | '₹8,000 – ₹15,000' | 'Above ₹15,000';
export type Comparison = 'Much Better' | 'Better' | 'Similar' | 'Worse' | "Don't Know";
export type PriorPurchase = 'Yes — more than 3 times' | 'Yes — 1 to 2 times' | 'No — this is my first purchase';

export interface Ratings {
  quality: number;
  style: number;
  value: number;
  prestige: number;
  inStoreExperience: number;
  staff: number;
}

export interface Comparisons {
  hugoBoss: Comparison | '';
  calvinKlein: Comparison | '';
  ralphLauren: Comparison | '';
}

export interface Survey {
  id: string;
  createdAt: string;
  respondentName: string;
  ageGroup: AgeGroup | '';
  gender: Gender | '';
  occupation: Occupation | '';
  shoppingFrequency: ShoppingFrequency | '';
  unaidedRecall: string;
  brandAwareness: string[];
  discoveryChannel: DiscoveryChannel | '';
  discoveryOther: string;
  word1: string;
  word2: string;
  word3: string;
  ratings: Ratings;
  comparisons: Comparisons;
  visitReason: VisitReason | '';
  visitReasonOther: string;
  categories: string[];
  spendBracket: SpendBracket | '';
  purchaseBarrier: string;
  priorPurchase: PriorPurchase | '';
  nps: number;
  feedback: string;
}

export interface CompetitorVisit {
  id: string;
  createdAt: string;
  storeName: string;
  visitDate: string;
  vmScore: number;
  staffScore: number;
  productRangeScore: number;
  footfall: 'Low' | 'Medium' | 'High';
  pricePoint: 'Higher' | 'Similar' | 'Lower';
  observation: string;
}

export interface PerformanceEntry {
  id: string;
  date: string; // YYYY-MM-DD
  bills: number;
  units: number;
  asp: number;
  atv: number;
  upt: number;
}

export interface Employee {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export interface DailyKPI {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  sale: number;   // ₹
  bill: number;   // count
  qty: number;    // units
}

export interface LFLBaseline {
  label: string;       // e.g. "1st Apr – 23rd Apr 2025"
  startDate: string;
  endDate: string;
  sale: number;
  bill: number;
  qty: number;
}

export interface Customer {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  ageGroup: AgeGroup | '';
  categoryPrefs: string[];
  spendBracket: SpendBracket | '';
  birthdayMonth: string;
  visitDate: string;
  notes: string;
  purchaseCount: number;
  totalSpend: number;
}

export interface DeadHourEntry {
  id: string;
  date: string; // YYYY-MM-DD
  hour: number; // 10..22
  footfall: number;
  bills: number;
  activation: string;
}

export interface FieldNote {
  id: string;
  createdAt: string;
  date: string;
  observation: string;
  idea: string;
  anomaly: string;
}

export interface PipelineLead {
  id: string;
  createdAt: string;
  company: string;
  contact: string;
  designation: string;
  requirement: 'Gifting' | 'Bulk' | 'Event' | '';
  estValue: number;
  status: 'Prospect' | 'Contacted' | 'Proposal Sent' | 'Closed';
  notes: string;
}

export interface Milestone {
  id: string;
  week: number;
  title: string;
  done: boolean;
}

export interface Settings {
  internName: string;
  storeName: string;
  target: number;
  startDate: string; // YYYY-MM-DD, Week 1 start
}

export interface InsightCard {
  id: string;
  title: string;
  body: string;
  tone: 'positive' | 'negative' | 'neutral' | 'opportunity';
  metric?: string | null;
  generatedAt?: string;
}

/* ---------- Visual Merchandising ---------- */
export const VM_ZONES = [
  'Polo Window Wall',
  'Focal Wall & Table',
  'Polo Table',
  'Women RHS Wall',
  'Women Focal Wall & Table',
  'TJ Table & Glass Wall',
  'Denim Wall',
  'Shirt Shop',
  'THT',
  'Red Window Wall & White Table',
  'Front Focal Wall & Bag Wall',
] as const;
export type VMZone = typeof VM_ZONES[number];

export const VM_ELEMENTS = [
  'Window',
  'Floor',
  'Mannequins',
  'Folding',
  'Jiffy',
  'Cross-Merch',
  'Signage',
  'Lighting',
  'Cleanliness',
  'Stock Density',
  'Team Grooming',
  'Reports',
] as const;
export type VMElement = typeof VM_ELEMENTS[number];

export interface VMLog {
  id: string;
  createdAt: string;
  date: string;           // YYYY-MM-DD
  zone: VMZone | '';
  whatChanged: string;
  changedBy: string;
  score: number;          // 1..5
  beforePhoto?: string;   // base64 data URI
  afterPhoto?: string;
}

export interface VMScorecard {
  id: string;
  createdAt: string;
  date: string;
  scores: Record<VMElement, number>; // 1..5 each
  notes: string;
}

export interface ZoneSales {
  id: string;
  date: string;           // YYYY-MM-DD
  zone: VMZone;
  sale: number;           // ₹
  sqft: number;           // store zone square feet
}

/* ---------- Big Bills (single-txn > ₹20,000) ---------- */
export interface BigBill {
  id: string;
  createdAt: string;
  date: string;
  amount: number;
  employeeId: string;     // id of employee from Employee[]
  customerName: string;
  items: string;          // short note / product summary
}

/* ---------- JOG Promo ---------- */
export interface JogPromoEntry {
  id: string;
  createdAt: string;
  date: string;
  saleThroughJog: number;      // ₹ sales tagged to JOG
  offersRedeemed: number;      // count of JOG vouchers used
  slab1: number;               // count of ₹7,999 slab redemptions
  slab2: number;               // count of ₹13,999 slab redemptions
  slab3: number;               // count of ₹24,999 slab redemptions
  notes: string;
}
export const JOG_SLAB_AMOUNTS = { slab1: 7999, slab2: 13999, slab3: 24999 } as const;

/* ---------- Personal SFA (Sales Force Automation) ---------- */
export const SFA_STAGES = ['Prospect', 'Contacted', 'Trial', 'Won', 'Lost'] as const;
export type SfaStage = typeof SFA_STAGES[number];
/** Probability used for the weighted forecast */
export const SFA_STAGE_WEIGHT: Record<SfaStage, number> = { Prospect: 0.1, Contacted: 0.3, Trial: 0.6, Won: 1, Lost: 0 };

export interface SfaDeal {
  id: string;
  createdAt: string;
  title: string;          // e.g. "Wedding wardrobe – 4 shirts"
  contactName: string;
  phone: string;
  value: number;          // ₹ expected
  stage: SfaStage;
  followUp: string;       // YYYY-MM-DD or ''
  notes: string;
  closedAt?: string;      // ISO when moved to Won/Lost
}

export interface SfaTask {
  id: string;
  createdAt: string;
  title: string;
  due: string;            // YYYY-MM-DD
  done: boolean;
  contactName: string;
  priority: 'High' | 'Normal';
}

export const SFA_ACTIVITY_TYPES = ['Call', 'WhatsApp', 'Visit', 'Walk-in', 'Email'] as const;
export type SfaActivityType = typeof SFA_ACTIVITY_TYPES[number];

export interface SfaActivity {
  id: string;
  createdAt: string;      // ISO timestamp
  type: SfaActivityType;
  contactName: string;
  note: string;
}
