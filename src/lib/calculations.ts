// Commission rates
const COMMISSION_SHARE = 0.65; // UP's standard rate (65%)
const INDUSTRY_AVERAGE_SHARE = 0.50; // Typical sub-affiliate rate elsewhere

// Scenario configurations
const SCENARIOS = {
  conservative: { 
    name: 'Conservative',
    conversionRate: 0.03, // 3% of clicks convert to approvals
    avgCommission: 85,    // Average commission per approval
  },
  realistic: { 
    name: 'Realistic',
    conversionRate: 0.04, // 4%
    avgCommission: 100,
  },
  optimistic: { 
    name: 'Optimistic',
    conversionRate: 0.05, // 5%
    avgCommission: 125,
  },
};

// Click range options with midpoints for calculation
export const CLICK_RANGES = [
  { 
    id: '100-500', 
    label: '100 - 500 clicks/month',
    description: 'Just getting started or testing the waters',
    midpoint: 300,
  },
  { 
    id: '500-2000', 
    label: '500 - 2,000 clicks/month',
    description: 'Growing audience, consistent content',
    midpoint: 1250,
  },
  { 
    id: '2000-5000', 
    label: '2,000 - 5,000 clicks/month',
    description: 'Established creator with engaged audience',
    midpoint: 3500,
  },
  { 
    id: '5000-10000', 
    label: '5,000 - 10,000 clicks/month',
    description: 'High-traffic content or multiple channels',
    midpoint: 7500,
  },
  { 
    id: '10000+', 
    label: '10,000+ clicks/month',
    description: 'Large audience or high-volume tool/app',
    midpoint: 15000,
  },
];

// Channel options - no emojis, with Lucide icon names
export const CHANNEL_OPTIONS = [
  { id: 'blog', label: 'Blog / Website', iconName: 'Globe' },
  { id: 'youtube', label: 'YouTube', iconName: 'Youtube' },
  { id: 'newsletter', label: 'Newsletter', iconName: 'Mail' },
  { id: 'social', label: 'Social Media', iconName: 'Share2' },
  { id: 'extension', label: 'Browser Extension', iconName: 'Puzzle' },
  { id: 'app', label: 'Mobile App', iconName: 'Smartphone' },
  { id: 'podcast', label: 'Podcast', iconName: 'Mic' },
  { id: 'other', label: 'Other', iconName: null },
];

export interface ScenarioResult {
  name: string;
  conversionRate: number;
  avgCommission: number;
  monthlyApprovals: number;
  monthlyEarnings: number;
  annualEarnings: number;
}

export interface EarningsCalculation {
  monthlyClicks: number;
  clickRangeId: string;
  // Approval estimates (range)
  monthlyApprovalsLow: number;
  monthlyApprovalsHigh: number;
  // Scenario breakdowns
  conservative: ScenarioResult;
  realistic: ScenarioResult;
  optimistic: ScenarioResult;
  // Industry comparison
  industryComparison: {
    upRate: number;
    industryRate: number;
    upMonthly: number;
    upAnnual: number;
    industryMonthly: number;
    industryAnnual: number;
    monthlyDifference: number;
    annualDifference: number;
  };
}

function calculateScenario(
  monthlyClicks: number,
  scenarioKey: keyof typeof SCENARIOS
): ScenarioResult {
  const scenario = SCENARIOS[scenarioKey];
  const monthlyApprovals = monthlyClicks * scenario.conversionRate;
  const grossMonthly = monthlyApprovals * scenario.avgCommission;
  const partnerMonthly = grossMonthly * COMMISSION_SHARE;
  
  return {
    name: scenario.name,
    conversionRate: scenario.conversionRate,
    avgCommission: scenario.avgCommission,
    monthlyApprovals: Math.round(monthlyApprovals),
    monthlyEarnings: Math.round(partnerMonthly),
    annualEarnings: Math.round(partnerMonthly * 12),
  };
}

export function calculateEarnings(
  monthlyClicks: number,
  clickRangeId: string = 'custom'
): EarningsCalculation {
  // Calculate all three scenarios
  const conservative = calculateScenario(monthlyClicks, 'conservative');
  const realistic = calculateScenario(monthlyClicks, 'realistic');
  const optimistic = calculateScenario(monthlyClicks, 'optimistic');
  
  // Calculate industry comparison using realistic scenario
  const realisticGross = (monthlyClicks * SCENARIOS.realistic.conversionRate * SCENARIOS.realistic.avgCommission);
  const upMonthly = realisticGross * COMMISSION_SHARE;
  const industryMonthly = realisticGross * INDUSTRY_AVERAGE_SHARE;
  
  return {
    monthlyClicks,
    clickRangeId,
    monthlyApprovalsLow: conservative.monthlyApprovals,
    monthlyApprovalsHigh: optimistic.monthlyApprovals,
    conservative,
    realistic,
    optimistic,
    industryComparison: {
      upRate: COMMISSION_SHARE * 100,
      industryRate: INDUSTRY_AVERAGE_SHARE * 100,
      upMonthly: Math.round(upMonthly),
      upAnnual: Math.round(upMonthly * 12),
      industryMonthly: Math.round(industryMonthly),
      industryAnnual: Math.round(industryMonthly * 12),
      monthlyDifference: Math.round(upMonthly - industryMonthly),
      annualDifference: Math.round((upMonthly - industryMonthly) * 12),
    },
  };
}

export function getClickRangeById(id: string) {
  return CLICK_RANGES.find(range => range.id === id);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

// Smart CTA text - never shows low values
export function getSmartCTAText(monthlyEarnings: number): string {
  if (monthlyEarnings >= 500) {
    return `Ready to Earn ~${formatCurrency(monthlyEarnings)}/Month?`;
  }
  return 'Ready to Start Earning?';
}
