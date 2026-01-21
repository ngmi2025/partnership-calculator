-- =====================================================
-- EMAIL NURTURE SEQUENCE TEMPLATES
-- Run this in Supabase SQL Editor after creating tables
-- =====================================================

-- =====================================================
-- SEQUENCE 1: CALCULATOR NURTURE
-- For leads who submitted the calculator
-- =====================================================

-- Email 0: Immediate Results Summary (TRANSACTIONAL - no consent needed)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'calculator_nurture',
  0,
  0,
  'Your Partnership Earnings Estimate: {{projected_annual_earnings}}/year',
  'Hi {{name}},

Thanks for checking out the Upgraded Points Partnership Calculator!

Here''s what your numbers look like:

📊 Your Inputs:
- Monthly visitors: {{monthly_visitors}}
- Expected click rate: {{click_rate}}%

💰 Projected Earnings:
- Monthly: {{projected_monthly_earnings}}
- Annual: {{projected_annual_earnings}}

These are conservative estimates based on our average partner performance. Many of our partners exceed these numbers once they dial in their content strategy.

I''d love to hop on a quick call to walk you through:
- How our commission structure actually works
- What content performs best for your audience type
- How to maximize your earnings from day one

Got 15 minutes this week? Just reply with a time that works, or grab a slot here: [CALENDAR_LINK]

Talk soon,

Luke R
Partner Manager @ Upgraded Points

P.S. - No pressure at all. Happy to answer any questions over email if that''s easier.',
  true
);

-- Email 1: Value Prop + Differentiators (Day 2)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'calculator_nurture',
  1,
  2,
  'Quick question about {{channel_name}}',
  'Hey {{name}},

Following up on your earnings estimate from the other day.

I spent some time looking at {{channel_name}} - you''ve built something really solid. Your audience seems like a perfect fit for credit card and travel rewards content.

A few things that make us different from other affiliate programs:

1. **Higher commissions** - We negotiate exclusive rates with issuers that we pass on to partners

2. **Real support** - You''re not just a number. I''m your dedicated partner manager and actually respond to emails (novel concept, I know 😄)

3. **Exclusive offers** - We have deals your audience literally can''t get anywhere else

4. **Fast payments** - Net-30, no minimum threshold nonsense

Would you be open to a 15-min call to see if there''s a fit? No pitch, just want to learn more about what you''re building.

Luke',
  true
);

-- Email 2: Social Proof (Day 5)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'calculator_nurture',
  2,
  3,
  'How one of our partners 3x''d their estimate',
  'Hey {{name}},

Quick story I thought you''d find interesting...

One of our partners came through the calculator projecting around $2,500/month. They were skeptical (fair enough).

6 months later? They''re averaging $8,400/month.

The difference? They focused on two things:
1. Comparison content (Card A vs Card B posts)
2. Timing posts around bonus increases

Both are strategies I walk all new partners through.

Your estimate of {{projected_monthly_earnings}}/month is based on conservative averages. With the right approach, there''s real upside.

Worth a conversation?

Luke

P.S. - If you want, I can share the exact content framework that partner used. Just reply "send it" and I''ll shoot it over.',
  true
);

-- Email 3: Soft Close (Day 8)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'calculator_nurture',
  3,
  3,
  'Still thinking about it?',
  '{{name}},

I know you''re probably slammed, so I''ll keep this short.

If the partnership thing isn''t a fit right now, totally get it. No hard feelings.

But if you''re still mulling it over, here''s what I''d suggest:

**Just try it.**

Sign up takes 5 minutes. Test it with one piece of content. See what happens.

Worst case? You spent 30 minutes and learned it wasn''t for you.

Best case? You''ve got a new revenue stream that grows with your audience.

Here''s the signup link: [SIGNUP_LINK]

Or if you have questions first, just hit reply.

Luke',
  true
);

-- Email 4: Final Breakup (Day 14)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'calculator_nurture',
  4,
  6,
  'Closing the loop',
  'Hey {{name}},

I''ve reached out a few times about the Upgraded Points partnership and haven''t heard back.

Totally fine - I know how busy things get, and maybe the timing just isn''t right.

I''ll stop filling up your inbox, but wanted to leave you with this:

The offer stands whenever you''re ready. Just reply to this email (I keep them all) and we can pick up where we left off.

In the meantime, keep crushing it with {{channel_name}}.

Luke

P.S. - If I''m totally off base and you''re not interested at all, just let me know. Always helps me improve my outreach.',
  true
);


-- =====================================================
-- SEQUENCE 2: COLD OUTREACH
-- For prospects we've identified but haven't used calculator
-- =====================================================

-- Email 0: Initial Outreach (Immediate)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'cold_outreach',
  0,
  0,
  'Partnership opportunity for {{channel_name}}',
  'Hi {{name}},

I came across {{channel_name}} and was impressed by what you''ve built. Your content on [TOPIC] really resonates - you can tell your audience trusts your recommendations.

I''m Luke, Partner Manager at Upgraded Points. We work with creators in the credit card and travel space to help them monetize through our affiliate program.

A few quick stats:
- Our average active partner earns $3,200/month
- We have exclusive card offers you won''t find elsewhere
- Dedicated support (me) - not a faceless affiliate network

Would you be open to a quick chat to see if there''s a fit? I''d love to learn more about your content strategy and share how our top partners are structuring their monetization.

No pressure either way - just thought it was worth reaching out.

Luke R
Partner Manager @ Upgraded Points',
  true
);

-- Email 1: Value Add (Day 3)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'cold_outreach',
  1,
  3,
  'Thought this might help {{channel_name}}',
  'Hey {{name}},

Following up on my note from a few days ago.

I put together a quick breakdown of what''s working for creators in your space right now:

**Top performing content types:**
1. "Best cards for X" comparison posts (highest conversion)
2. Personal experience reviews ("I''ve had this card for 6 months...")
3. Limited-time bonus alerts (great for engagement)

**What NOT to do:**
- Generic listicles with no personality
- Pushing cards you haven''t actually used
- Ignoring the travel/points angle

Happy to share more specifics on a call, but wanted to give you something useful either way.

Worth 15 minutes to chat?

Luke',
  true
);

-- Email 2: Social Proof (Day 7)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'cold_outreach',
  2,
  4,
  'How creators like you are earning $5k+/month',
  '{{name}},

I work with a lot of creators in the credit card/travel space, and I''ve noticed something interesting...

The ones who do really well (I''m talking $5k-$20k/month) all have one thing in common:

They don''t just promote cards. They teach their audience HOW to use points strategically.

It''s the difference between:
❌ "Sign up for this card, it''s great"
✅ "Here''s how I used this card to book a $15k trip for $200"

The second approach builds trust AND converts better.

If that resonates with your content style, we should talk. Our program is built for creators who want to do affiliate marketing the right way.

Quick call this week?

Luke',
  true
);

-- Email 3: Direct Ask (Day 12)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'cold_outreach',
  3,
  5,
  'Quick yes or no?',
  '{{name}},

I''ll cut to the chase:

Would you be interested in learning more about partnering with Upgraded Points?

If yes → Just reply "yes" and I''ll send over details + set up a quick call

If no → No worries at all, I''ll stop reaching out

If maybe later → Let me know and I''ll circle back in a few months

Just trying to respect your time and inbox.

Luke',
  true
);

-- Email 4: Breakup (Day 20)
INSERT INTO email_templates (id, sequence, step, delay_days, subject, body, active)
VALUES (
  gen_random_uuid(),
  'cold_outreach',
  4,
  8,
  'Last one from me',
  'Hey {{name}},

This''ll be my last email about the partnership stuff.

I''ve reached out a few times and haven''t heard back, so I''ll assume the timing isn''t right. Totally understand.

If anything changes down the road, my inbox is always open. Just reply to any of these emails and I''ll get it.

Keep up the great work with {{channel_name}}.

Luke

P.S. - If you''re curious about your earning potential, you can always check out our calculator: [CALCULATOR_LINK]. No signup required.',
  true
);
