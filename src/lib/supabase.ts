import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role key
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, serviceRoleKey);
}

// Types for database tables
export interface Lead {
  id: string;
  email: string;
  url?: string;
  site_name?: string | null;
  click_range_id?: string;
  monthly_clicks?: number;
  channels?: string[];
  created_at: string;
  source?: string;
  status?: string;
}

export interface Analysis {
  id: string;
  lead_id: string | null;
  url: string;
  traffic_estimate: number;
  traffic_source: string;
  card_content_score: number;
  earnings_conservative: number;
  earnings_realistic: number;
  earnings_optimistic: number;
  created_at: string;
}

// Database operations
export async function saveLead(
  email: string,
  url: string,
  siteName: string
): Promise<{ lead: Lead | null; isNew: boolean; error: string | null }> {
  // Check if lead already exists
  const { data: existingLead } = await supabase
    .from('leads')
    .select('*')
    .eq('email', email)
    .single();

  if (existingLead) {
    // Update existing lead
    const { data, error } = await supabase
      .from('leads')
      .update({ url, site_name: siteName })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      return { lead: null, isNew: false, error: error.message };
    }
    return { lead: data, isNew: false, error: null };
  }

  // Create new lead
  const { data, error } = await supabase
    .from('leads')
    .insert({ email, url, site_name: siteName })
    .select()
    .single();

  if (error) {
    return { lead: null, isNew: true, error: error.message };
  }
  return { lead: data, isNew: true, error: null };
}

export async function saveAnalysis(
  leadId: string | null,
  url: string,
  trafficEstimate: number,
  trafficSource: string,
  cardContentScore: number,
  earningsConservative: number,
  earningsRealistic: number,
  earningsOptimistic: number
): Promise<{ analysis: Analysis | null; error: string | null }> {
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      lead_id: leadId,
      url,
      traffic_estimate: trafficEstimate,
      traffic_source: trafficSource,
      card_content_score: cardContentScore,
      earnings_conservative: earningsConservative,
      earnings_realistic: earningsRealistic,
      earnings_optimistic: earningsOptimistic,
    })
    .select()
    .single();

  if (error) {
    return { analysis: null, error: error.message };
  }
  return { analysis: data, error: null };
}

export async function getLeadWithAnalysis(
  leadId: string
): Promise<{ lead: Lead | null; analysis: Analysis | null; error: string | null }> {
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError) {
    return { lead: null, analysis: null, error: leadError.message };
  }

  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (analysisError && analysisError.code !== 'PGRST116') {
    return { lead, analysis: null, error: analysisError.message };
  }

  return { lead, analysis, error: null };
}
