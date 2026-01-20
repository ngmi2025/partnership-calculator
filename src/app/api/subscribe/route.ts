import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getLeadScore, isHighValueLead } from '@/lib/leadScoring';
import { sendWelcomeEmail, sendHighValueAlert } from '@/lib/emails';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
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

    // Calculate lead score
    const { score, priority } = getLeadScore(clickRangeId);

    // Get click range label for emails
    const clickRangeLabels: Record<string, string> = {
      'range-1': '100-500',
      'range-2': '500-2,000',
      'range-3': '2,000-5,000',
      'range-4': '5,000-10,000',
      'range-5': '10,000+',
    };
    const clickRangeLabel = clickRangeLabels[clickRangeId] || clickRangeId;

    let leadId = null;
    let isNewLead = false;

    // Try to save to Supabase (graceful degradation if not configured)
    try {
      const supabase = createServerClient();
      
      if (supabase) {
        // Check if lead already exists
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', email)
          .single();

        if (existingLead) {
          // Update existing lead
          const { data: lead, error: leadError } = await supabase
            .from('leads')
            .update({
              name: name || null,
              clicks_midpoint: monthlyClicks,
              click_range: clickRangeId,
              channels,
              earnings_conservative: earningsConservative,
              earnings_realistic: earningsRealistic,
              earnings_optimistic: earningsOptimistic,
              lead_score: score,
              priority,
            })
            .eq('email', email)
            .select('id')
            .single();

          if (leadError) {
            console.error('Supabase lead update error:', leadError);
          } else {
            leadId = lead?.id;
          }
        } else {
          // Insert new lead
          isNewLead = true;
          const { data: lead, error: leadError } = await supabase
            .from('leads')
            .insert({
              name: name || null,
              email,
              clicks_midpoint: monthlyClicks,
              click_range: clickRangeId,
              channels,
              earnings_conservative: earningsConservative,
              earnings_realistic: earningsRealistic,
              earnings_optimistic: earningsOptimistic,
              lead_score: score,
              priority,
              source: 'calculator',
              status: 'new',
            })
            .select('id')
            .single();

          if (leadError) {
            console.error('Supabase lead insert error:', leadError);
          } else {
            leadId = lead?.id;

            // Track welcome email event
            if (leadId) {
              await supabase.from('email_events').insert({
                lead_id: leadId,
                email_type: 'welcome',
              });
            }
          }
        }
      }
    } catch (dbError) {
      console.error('Database error (continuing without DB):', dbError);
    }

    // Only send emails for new leads
    if (isNewLead) {
      // Try to send welcome email (graceful degradation if not configured)
      try {
        await sendWelcomeEmail({
          name: name || undefined,
          email,
          clickRange: clickRangeLabel,
          earnings: {
            conservative: earningsConservative,
            realistic: earningsRealistic,
            optimistic: earningsOptimistic,
          },
        });
      } catch (emailError) {
        console.error('Welcome email error (continuing):', emailError);
      }

      // Send alert for high-value leads
      if (isHighValueLead(score)) {
        try {
          await sendHighValueAlert(
            name,
            email,
            clickRangeLabel,
            {
              conservative: earningsConservative,
              realistic: earningsRealistic,
              optimistic: earningsOptimistic,
            },
            priority
          );
        } catch (alertError) {
          console.error('Alert email error (continuing):', alertError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      leadId,
      isNewLead,
      score,
      priority,
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
