import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, website, clickRange, channels, message } = body;

    // Validate required fields
    if (!name || !email || !website) {
      return NextResponse.json(
        { error: 'Name, email, and website are required' },
        { status: 400 }
      );
    }

    // In production, save to Supabase
    // For now, just log and return success
    console.log('Partner Application:', {
      name,
      email,
      website,
      clickRange,
      channels,
      message,
      submittedAt: new Date().toISOString(),
    });

    // TODO: Save to Supabase
    // const { data, error } = await supabase
    //   .from('applications')
    //   .insert({
    //     name,
    //     email,
    //     website,
    //     click_range: clickRange,
    //     channels,
    //     message,
    //   });

    // TODO: Send notification email to UP team
    // await sendApplicationNotification({ name, email, website, clickRange, channels, message });

    return NextResponse.json({ 
      success: true,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
