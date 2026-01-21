import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

interface LeadRow {
  email: string;
  name?: string;
  channel_name?: string;
  website_url?: string;
  platform?: string;
  subscriber_count?: string;
  notes?: string;
}

interface BulkImportRequest {
  leads: LeadRow[];
  sequence: 'cold_outreach' | 'calculator_nurture';
}

interface ImportError {
  row: number;
  email: string;
  error: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BulkImportRequest = await request.json();

    if (!body.leads || !Array.isArray(body.leads) || body.leads.length === 0) {
      return NextResponse.json(
        { error: 'No leads provided' },
        { status: 400 }
      );
    }

    const sequence = body.sequence || 'cold_outreach';
    const now = new Date().toISOString();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Get all existing emails to check for duplicates
    const emails = body.leads
      .map((l) => l.email?.toLowerCase())
      .filter(Boolean);

    // Check calculator_leads table
    const { data: existingCalcLeads } = await supabaseAdmin
      .from('calculator_leads')
      .select('email')
      .in('email', emails);

    // Check legacy leads table
    const { data: existingLegacyLeads } = await supabaseAdmin
      .from('leads')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set([
      ...(existingCalcLeads || []).map((l: any) => l.email.toLowerCase()),
      ...(existingLegacyLeads || []).map((l: any) => l.email.toLowerCase()),
    ]);

    const toImport: any[] = [];
    const errors: ImportError[] = [];
    let skipped = 0;

    body.leads.forEach((lead, index) => {
      const rowNum = index + 1;
      const email = lead.email?.toLowerCase()?.trim();

      // Validate email
      if (!email) {
        errors.push({ row: rowNum, email: lead.email || '', error: 'Email is required' });
        return;
      }

      if (!emailRegex.test(email)) {
        errors.push({ row: rowNum, email, error: 'Invalid email format' });
        return;
      }

      // Check if already exists
      if (existingEmails.has(email)) {
        skipped++;
        return;
      }

      // Check for duplicates within the import
      const alreadyInImport = toImport.some((l) => l.email === email);
      if (alreadyInImport) {
        skipped++;
        return;
      }

      toImport.push({
        email,
        name: lead.name?.trim() || null,
        channel_name: lead.channel_name?.trim() || null,
        website_url: lead.website_url?.trim() || null,
        platform: lead.platform?.trim()?.toLowerCase() || null,
        subscriber_count: lead.subscriber_count?.trim() || null,
        notes: lead.notes?.trim() || null,

        // Import tracking
        lead_source: 'manual_import',
        import_source: 'spreadsheet',
        imported_at: now,
        imported_by: session.adminId,

        // Lead management defaults
        status: 'new',
        engagement_score: 0,

        // Sequence settings
        current_sequence: sequence,
        sequence_step: 0,
        next_email_at: now,
        paused: false,

        // Compliance
        marketing_consent: false,
        unsubscribed: false,
      });
    });

    // Insert leads in batches of 100
    let imported = 0;
    const batchSize = 100;

    for (let i = 0; i < toImport.length; i += batchSize) {
      const batch = toImport.slice(i, i + batchSize);

      const { data: insertedLeads, error: insertError } = await (supabaseAdmin as any)
        .from('calculator_leads')
        .insert(batch)
        .select('id, email');

      if (insertError) {
        console.error('Batch insert error:', insertError);
        // Add remaining as errors
        batch.forEach((lead, idx) => {
          errors.push({
            row: i + idx + 1,
            email: lead.email,
            error: 'Database insert failed',
          });
        });
        continue;
      }

      imported += insertedLeads?.length || 0;

      // Log activities for imported leads
      if (insertedLeads && insertedLeads.length > 0) {
        const activities = insertedLeads.map((lead: any) => ({
          lead_id: lead.id,
          activity_type: 'lead_imported',
          metadata: {
            import_source: 'spreadsheet',
            imported_by: session.adminId,
            sequence,
          },
        }));

        await (supabaseAdmin as any)
          .from('lead_activity')
          .insert(activities);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 50), // Limit errors to 50
      totalErrors: errors.length,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import leads' },
      { status: 500 }
    );
  }
}

// Endpoint to check for duplicates before import
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: 'Emails array required' }, { status: 400 });
    }

    const normalizedEmails = emails.map((e: string) => e.toLowerCase().trim());

    // Check calculator_leads
    const { data: calcDupes } = await supabaseAdmin
      .from('calculator_leads')
      .select('email')
      .in('email', normalizedEmails);

    // Check legacy leads
    const { data: legacyDupes } = await supabaseAdmin
      .from('leads')
      .select('email')
      .in('email', normalizedEmails);

    const duplicates = [
      ...(calcDupes || []).map((l: any) => l.email),
      ...(legacyDupes || []).map((l: any) => l.email),
    ];

    return NextResponse.json({
      total: emails.length,
      duplicates: [...new Set(duplicates)],
      newCount: emails.length - new Set(duplicates).size,
    });
  } catch (error) {
    console.error('Duplicate check error:', error);
    return NextResponse.json({ error: 'Failed to check duplicates' }, { status: 500 });
  }
}
