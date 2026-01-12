import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, text, html }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP not configured. Skipping email send. Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
    return { success: false, reason: 'smtp_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: SMTP_PORT === '465',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, reason: 'send_failed', error: error.message };
  }
}

export function formatAdminNotificationEmail({ workshopId, applicantName, applicantEmail, applicationData }) {
  const formattedData = JSON.stringify(applicationData, null, 2);
  
  const subject = `New Guided Workshop Application – ${workshopId}`;
  
  const text = `New Guided Workshop Application

Workshop ID: ${workshopId}
Name: ${applicantName}
Email: ${applicantEmail}

Application Data:
${formattedData}
`;

  const html = `
<h2>New Guided Workshop Application</h2>
<p><strong>Workshop ID:</strong> ${workshopId}</p>
<p><strong>Name:</strong> ${applicantName}</p>
<p><strong>Email:</strong> ${applicantEmail}</p>

<h3>Application Data</h3>
<pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; font-size: 14px; overflow-x: auto;">${formattedData}</pre>
`;

  return { subject, text, html };
}

export function formatApplicantConfirmationEmail({ workshopId, applicantName }) {
  const firstName = applicantName.split(' ')[0] || applicantName;
  
  const subject = `We received your Guided Workshop application (${workshopId})`;
  
  const text = `Hi ${firstName},

Thank you for applying for a Guided Workshop with Knit by Machine.

Your reference number is: ${workshopId}

I personally review every application to make sure the workshop is a good fit for both you and your project. I'll be in touch within 1–2 business days.

There's nothing you need to do right now. No payment is required until I review your application and confirm it's a good fit.

If you have any questions in the meantime, just reply to this email.

— Sue
Knit by Machine
`;

  const html = `
<p>Hi ${firstName},</p>

<p>Thank you for applying for a Guided Workshop with Knit by Machine.</p>

<p><strong>Your reference number is: ${workshopId}</strong></p>

<p>I personally review every application to make sure the workshop is a good fit for both you and your project. I'll be in touch within 1–2 business days.</p>

<p>There's nothing you need to do right now. No payment is required until I review your application and confirm it's a good fit.</p>

<p>If you have any questions in the meantime, just reply to this email.</p>

<p>— Sue<br>Knit by Machine</p>
`;

  return { subject, text, html };
}
