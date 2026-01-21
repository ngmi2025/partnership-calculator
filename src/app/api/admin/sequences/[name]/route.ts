import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET single sequence details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name: sequenceName } = await params;

    // Get settings
    const { data: settings } = await supabaseAdmin
      .from('sequence_settings')
      .select('*')
      .eq('sequence_name', sequenceName)
      .single();

    // Get templates
    const { data: templates } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('sequence', sequenceName)
      .order('step', { ascending: true });

    return NextResponse.json({
      sequence: {
        name: sequenceName,
        settings: settings || null,
        templates: templates || [],
      },
    });
  } catch (error) {
    console.error('Get sequence error:', error);
    return NextResponse.json({ error: 'Failed to fetch sequence' }, { status: 500 });
  }
}

// PATCH - Update sequence settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name: sequenceName } = await params;
    const updates = await request.json();

    // Validate sequence name
    if (!['calculator_nurture', 'cold_outreach'].includes(sequenceName)) {
      return NextResponse.json({ error: 'Invalid sequence name' }, { status: 400 });
    }

    // Allowed fields to update
    const allowedFields = [
      'paused',
      'send_window_start',
      'send_window_end',
      'send_timezone',
      'daily_limit',
      'skip_weekends',
    ];

    const filteredUpdates: any = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (field in updates) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Upsert settings
    const { data, error } = await (supabaseAdmin as any)
      .from('sequence_settings')
      .upsert({
        sequence_name: sequenceName,
        ...filteredUpdates,
      })
      .select()
      .single();

    if (error) {
      console.error('Update settings error:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    console.error('Update sequence error:', error);
    return NextResponse.json({ error: 'Failed to update sequence' }, { status: 500 });
  }
}
