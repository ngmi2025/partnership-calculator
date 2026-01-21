import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// POST - Resume sequence
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

    // Update sequence settings to resumed
    await (supabaseAdmin as any)
      .from('sequence_settings')
      .upsert({
        sequence_name: sequenceName,
        paused: false,
        updated_at: new Date().toISOString(),
      });

    // Optionally: also resume leads that were paused due to sequence_paused
    const { body } = await request.json().catch(() => ({ body: {} }));
    
    if (body?.resumeLeads) {
      const { data: updated, error } = await (supabaseAdmin as any)
        .from('calculator_leads')
        .update({
          paused: false,
          paused_reason: null,
        })
        .eq('current_sequence', sequenceName)
        .eq('paused_reason', 'sequence_paused')
        .select('id');

      return NextResponse.json({
        success: true,
        message: `Sequence ${sequenceName} resumed`,
        leads_resumed: updated?.length || 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Sequence ${sequenceName} resumed globally`,
    });
  } catch (error) {
    console.error('Resume sequence error:', error);
    return NextResponse.json({ error: 'Failed to resume sequence' }, { status: 500 });
  }
}
