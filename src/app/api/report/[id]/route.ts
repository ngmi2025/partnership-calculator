import { NextRequest, NextResponse } from 'next/server';
import { getLeadWithAnalysis } from '@/lib/supabase';

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

    return NextResponse.json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          email: lead.email,
          clickRangeId: lead.click_range_id,
          monthlyClicks: lead.monthly_clicks,
          channels: lead.channels,
          createdAt: lead.created_at,
        },
        earnings: analysis ? {
          conservative: analysis.earnings_conservative,
          realistic: analysis.earnings_realistic,
          optimistic: analysis.earnings_optimistic,
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
