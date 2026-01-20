import { NextRequest, NextResponse } from 'next/server';
import { getLeadWithAnalysis } from '@/lib/supabase';
import { calculateEarnings, getCardContentLabel } from '@/lib/calculations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const { lead, analysis, error } = await getLeadWithAnalysis(id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve report' },
        { status: 500 }
      );
    }

    if (!lead) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // If we have analysis data, recalculate projections
    let projection = null;
    let contentLabel = null;

    if (analysis) {
      projection = calculateEarnings(
        analysis.traffic_estimate,
        analysis.card_content_score
      );
      contentLabel = getCardContentLabel(analysis.card_content_score);
    }

    return NextResponse.json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          email: lead.email,
          url: lead.url,
          siteName: lead.site_name,
          createdAt: lead.created_at,
        },
        analysis: analysis ? {
          trafficEstimate: analysis.traffic_estimate,
          trafficSource: analysis.traffic_source,
          cardContentScore: analysis.card_content_score,
          contentLabel,
          earnings: {
            conservative: analysis.earnings_conservative,
            realistic: analysis.earnings_realistic,
            optimistic: analysis.earnings_optimistic,
          },
          projection,
        } : null,
      },
    });
  } catch (error) {
    console.error('Report retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}
