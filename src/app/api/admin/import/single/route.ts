import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

interface ImportSingleLeadRequest {
  email: string;
  name: string;
  channel_name?: string;
  website_url?: string;
  platform?: string;
  subscriber_count?: string;
  notes?: string;
  sequence: 'cold_outreach' | 'calculator_nurture';
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ImportSingleLeadRequest = await request.json();

    // Validate required fields
    if (!body.email || !body.name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingLead } = await (supabaseAdmin as any)
      .from('calculator_leads')
      .select('id, email')
      .eq('email', body.email.toLowerCase())
      .single();

    if (existingLead) {
      return NextResponse.json(
        { error: 'A lead with this email already exists', existingId: (existingLead as any).id },
        { status: 409 }
      );
    }

    // Also check legacy leads table
    const { data: legacyLead } = await (supabaseAdmin as any)
      .from('leads')
      .select('id, email')
      .eq('email', body.email.toLowerCase())
      .single();

    if (legacyLead) {
      return NextResponse.json(
        { error: 'A lead with this email already exists in the system' },
        { status: 409 }
      );
    }

    // Create the lead
    const newLead = {
      email: body.email.toLowerCase(),
      name: body.name,
      channel_name: body.channel_name || null,
      website_url: body.website_url || null,
      platform: body.platform || null,
      subscriber_count: body.subscriber_count || null,
      notes: body.notes || null,
      
      // Import tracking
      lead_source: 'manual_import',
      import_source: 'single',
      imported_at: new Date().toISOString(),
      imported_by: session.admin_id,
      
      // Lead management defaults
      status: 'new',
      engagement_score: 0,
      
      // Sequence settings
      current_sequence: body.sequence || 'cold_outreach',
      sequence_step: 0,
      next_email_at: new Date().toISOString(), // Start sequence immediately
      paused: false,
      
      // Compliance - no consent for imported leads
      marketing_consent: false,
      unsubscribed: false,
    };

    const { data: lead, error: insertError } = await (supabaseAdmin as any)
      .from('calculator_leads')
      .insert(newLead)
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Log activity
    await (supabaseAdmin as any)
      .from('lead_activity')
      .insert({
        lead_id: lead.id,
        activity_type: 'lead_imported',
        metadata: {
          import_source: 'single',
          imported_by: session.admin_id,
          sequence: body.sequence || 'cold_outreach',
        },
      });

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        email: lead.email,
        name: lead.name,
      },
    });
  } catch (error) {
    console.error('Import single lead error:', error);
    return NextResponse.json(
      { error: 'Failed to import lead' },
      { status: 500 }
    );
  }
}
