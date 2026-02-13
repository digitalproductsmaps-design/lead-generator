export interface BusinessLead {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  niche: string;
  location: string;
  status: 'PENDING' | 'GENERATED' | 'CONTACTED';
  generatedEmail?: string;
  foundAt: string; // ISO Date string
}

export interface ScrapingStats {
  totalLeads: number;
  emailsSent: number;
  lastRun: string | null;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  FINDER = 'FINDER',
  HISTORY = 'HISTORY',
}

export const TARGET_NICHES = [
  'Plumbers',
  'Electricians',
  'Roofers',
  'Landscapers',
  'House Cleaners',
  'HVAC Repair',
  'Painters',
  'Locksmiths',
  'Dry Cleaners',
  'Bakeries'
];

export const TARGET_CITIES = [
  'New York, USA',
  'London, UK',
  'Toronto, Canada',
  'Sydney, Australia',
  'Austin, Texas',
  'Chicago, Illinois',
  'Manchester, UK',
  'Vancouver, Canada'
];