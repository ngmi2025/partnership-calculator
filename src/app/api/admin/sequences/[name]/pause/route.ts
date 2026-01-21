import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST - Pause all leads in sequence
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name: sequenceName } = await params;

    // Validate sequence name
    if (!['calculator_nurture', 'cold_outreach'].includes(sequenceName)) {
      return NextResponse.json({ error: 'Invalid sequence name' }, { status: 400 });
    }

    // Update sequence settings to paused
    await (supabaseAdmin as any)
      .from('sequence_settings')
      .upsert({
        sequence_name: sequenceName,
        paused: true,
        updated_at: new Date().toISOString(),
      });

    // Optionally: also pause all individual leads in this sequence
    const { body } = await request.json().catch(() => ({ body: {} }));
    
    if (body?.pauseLeads) {
      const { data: updated, error } = await (supabaseAdmin as any)
        .from('calculator_leads')
        .update({
          paused: true,
          paused_reason: 'sequence_paused',
        })
        .eq('current_sequence', sequenceName)
        .eq('paused', false)
        .select('id');

      return NextResponse.json({
        success: true,
        message: `Sequence ${sequenceName} paused`,
        leads_paused: updated?.length || 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Sequence ${sequenceName} paused globally`,
    });
  } catch (error) {
    console.error('Pause sequence error:', error);
    return NextResponse.json({ error: 'Failed to pause sequence' }, { status: 500 });
  }
}
