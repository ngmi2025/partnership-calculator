import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST - Change lead's sequence
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const { sequence, startImmediately } = await request.json();

    // Validate sequence name
    if (!['calculator_nurture', 'cold_outreach'].includes(sequence)) {
      return NextResponse.json({ error: 'Invalid sequence name' }, { status: 400 });
    }

    // Get current lead data
    const { data: lead, error: fetchError } = await supabaseAdmin
      .from('calculator_leads')
      .select('current_sequence, sequence_step')
      .eq('id', leadId)
      .single();

    if (fetchError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const oldSequence = (lead as any).current_sequence;

    // Update lead
    const updates: any = {
      current_sequence: sequence,
      sequence_step: 0,
      paused: false,
      paused_reason: null,
    };

    if (startImmediately !== false) {
      updates.next_email_at = new Date().toISOString();
    }

    const { error: updateError } = await (supabaseAdmin as any)
      .from('calculator_leads')
      .update(updates)
      .eq('id', leadId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to change sequence' }, { status: 500 });
    }

    // Log activity
    await (supabaseAdmin as any)
      .from('lead_activity')
      .insert({
        lead_id: leadId,
        activity_type: 'sequence_changed',
        metadata: {
          from_sequence: oldSequence,
          to_sequence: sequence,
          changed_by: session.adminId,
        },
      });

    return NextResponse.json({
      success: true,
      message: `Lead moved to ${sequence} sequence`,
    });
  } catch (error) {
    console.error('Change sequence error:', error);
    return NextResponse.json({ error: 'Failed to change sequence' }, { status: 500 });
  }
}
