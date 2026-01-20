import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      monthlyClicks,
      clickRangeId,
      channels = [],
      earningsConservative,
      earningsRealistic,
      earningsOptimistic,
      industryDifference,
    } = body;

    if (!email || !monthlyClicks) {
      return NextResponse.json(
        { error: 'Email and monthly clicks are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    let leadId = null;

    // Try to save to Supabase (graceful degradation if not configured)
    try {
      const supabase = createServerClient();
      
      if (supabase) {
        // Upsert lead (update if exists, insert if new)
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .upsert(
            {
              email,
              estimated_clicks: monthlyClicks,
              click_range: clickRangeId,
              channels,
              source: 'calculator',
              status: 'new',
            },
            {
              onConflict: 'email',
            }
          )
          .select()
          .single();

        if (leadError) {
          console.error('Supabase lead error:', leadError);
        } else {
          leadId = lead?.id;
          
          // Store calculation
          await supabase
            .from('calculations')
            .insert({
              lead_id: leadId,
              monthly_clicks: monthlyClicks,
              earnings_conservative: earningsConservative,
              earnings_realistic: earningsRealistic,
              earnings_optimistic: earningsOptimistic,
              industry_comparison: industryDifference,
            });
        }
      }
    } catch (dbError) {
      console.error('Database error (continuing without DB):', dbError);
    }

    // Try to send welcome email (graceful degradation if not configured)
    try {
      await sendWelcomeEmail({
        to: email,
        monthlyClicks,
        earningsConservative,
        earningsRealistic,
        earningsOptimistic,
        industryDifference,
      });
    } catch (emailError) {
      console.error('Email error (continuing without email):', emailError);
    }

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Report unlocked successfully',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
