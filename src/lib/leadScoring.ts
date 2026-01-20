// Lead scoring based on click ranges

export const CLICK_RANGES = {
  '100-500': { midpoint: 300, score: 10, priority: 'low' as const },
  '500-2000': { midpoint: 1250, score: 25, priority: 'standard' as const },
  '2000-5000': { midpoint: 3500, score: 50, priority: 'medium' as const },
  '5000-10000': { midpoint: 7500, score: 75, priority: 'high' as const },
  '10000+': { midpoint: 15000, score: 100, priority: 'hot' as const },
} as const;

export type ClickRange = keyof typeof CLICK_RANGES;
export type Priority = 'low' | 'standard' | 'medium' | 'high' | 'hot';

export interface LeadScore {
  midpoint: number;
  score: number;
  priority: Priority;
}

export function getLeadScore(clickRange: string): LeadScore {
  // Map the UI click range IDs to the scoring ranges
  const rangeMapping: Record<string, ClickRange> = {
    'range-1': '100-500',
    'range-2': '500-2000',
    'range-3': '2000-5000',
    'range-4': '5000-10000',
    'range-5': '10000+',
  };

  const mappedRange = rangeMapping[clickRange] || clickRange;
  return CLICK_RANGES[mappedRange as ClickRange] || CLICK_RANGES['500-2000'];
}

export function isHighValueLead(score: number): boolean {
  return score >= 75;
}
