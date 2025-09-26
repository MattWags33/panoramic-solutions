import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;
if (supabaseUrl && supabaseServiceKey) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

const resend = new Resend(process.env.RESEND_API_KEY!);

export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, message }: ContactFormData = body;

    // Validate required fields
    if (!name || !email || !company || !message) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email address format' },
        { status: 400 }
      );
    }

    console.log('📝 Processing contact form submission:', {
      name,
      email: email.replace(/(.{3}).*(@.*)/, '$1***$2'),
      company,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    // Step 1: Store in Supabase
    let submissionId = null;
    if (supabase) {
      try {
        const { data: submissionData, error: dbError } = await supabase
          .from('contact_submissions')
          .insert([{
            name,
            email,
            company,
            message,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (dbError) {
          console.error('❌ Supabase insert error:', dbError);
          // Continue with email send even if DB fails
        } else {
          submissionId = submissionData?.id;
          console.log('✅ Contact form submission stored in Supabase:', submissionId);
        }
      } catch (dbError: any) {
        console.error('💥 Database storage error:', dbError);
        // Continue with email send even if DB fails
      }
    } else {
      console.warn('⚠️ Supabase not configured - skipping database storage');
    }

    // Step 2: Send email notification to Matt
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
      }

      // Create email content
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f9;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
        
        <!-- Header -->
        <tr>
          <td style="padding:24px;background:#1e3a8a;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;">
              🔔 New Contact Form Submission
            </h1>
            <p style="margin:8px 0 0 0;color:#bfdbfe;font-size:14px;">
              From panoramic-solutions.com contact form
            </p>
          </td>
        </tr>

        <!-- Contact Information -->
        <tr>
          <td style="padding:24px;">
            <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:20px;">
              <h2 style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:600;">
                Contact Information
              </h2>
              
              <div style="margin-bottom:12px;">
                <strong style="color:#475569;font-size:14px;">Name:</strong>
                <div style="color:#1e293b;font-size:16px;margin-top:2px;">${name}</div>
              </div>
              
              <div style="margin-bottom:12px;">
                <strong style="color:#475569;font-size:14px;">Email:</strong>
                <div style="color:#1e293b;font-size:16px;margin-top:2px;">
                  <a href="mailto:${email}" style="color:#1d4ed8;text-decoration:none;">${email}</a>
                </div>
              </div>
              
              <div style="margin-bottom:12px;">
                <strong style="color:#475569;font-size:14px;">Company:</strong>
                <div style="color:#1e293b;font-size:16px;margin-top:2px;">${company}</div>
              </div>
              
              <div>
                <strong style="color:#475569;font-size:14px;">Submitted:</strong>
                <div style="color:#1e293b;font-size:14px;margin-top:2px;">${new Date().toLocaleString('en-US', { 
                  timeZone: 'America/Denver', 
                  dateStyle: 'full', 
                  timeStyle: 'short' 
                })} (Mountain Time)</div>
              </div>
            </div>

            <!-- Message -->
            <div style="background:#f8fafc;border-radius:8px;padding:20px;">
              <h2 style="margin:0 0 16px 0;color:#1e293b;font-size:18px;font-weight:600;">
                Message
              </h2>
              <div style="color:#1e293b;font-size:16px;line-height:1.6;white-space:pre-wrap;">${message}</div>
            </div>
          </td>
        </tr>

        <!-- Action Buttons -->
        <tr>
          <td style="padding:0 24px 24px 24px;">
            <div style="text-align:center;">
              <a href="mailto:${email}?subject=Re: Your inquiry about ${company}" 
                 style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
                📧 Reply to ${name}
              </a>
            </div>
          </td>
        </tr>



      </table>
    </td>
  </tr>
</table>

</body>
</html>
      `;

      const { data, error } = await resend.emails.send({
        from: 'Contact Form <donotreply@app.panoramic-solutions.com>',
        to: ['Matt.Wagner@panoramic-solutions.com'],
        subject: `New Contact: ${name} from ${company}`,
        html: emailHtml,
        tags: [
          { name: 'category', value: 'contact-form' },
          { name: 'source', value: 'website' },
          { name: 'company', value: company.toLowerCase().replace(/[^a-z0-9]/g, '-') }
        ]
      });

      if (error) {
        console.error('❌ Resend error:', error);
        // Return error since email notification is critical
        return NextResponse.json(
          { message: 'Failed to send notification email', error: error.message },
          { status: 500 }
        );
      }

      console.log('✅ Email notification sent successfully:', {
        messageId: data?.id,
        to: 'Matt.Wagner@panoramic-solutions.com',
        from: name,
        company,
        timestamp: new Date().toISOString()
      });

    } catch (emailError: any) {
      console.error('💥 Email send error:', emailError);
      
      return NextResponse.json(
        { message: 'Failed to send notification email', error: emailError.message },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      submissionId
    });

  } catch (error: any) {
    console.error('💥 Contact form submission error:', error);
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}
