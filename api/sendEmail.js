export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate CORS and origin
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const { from_name, from_email, subject, message } = req.body;

    // Validate inputs
    if (!from_name || !from_email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(from_email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    console.log({
      service: !!process.env.EMAILJS_SERVICE_ID,
      template: !!process.env.EMAILJS_TEMPLATE_ID,
      publicKey: !!process.env.EMAILJS_PUBLIC_KEY,
    });

    // Send email via EmailJS API (server-to-server)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: process.env.CONTACT_EMAIL,
          from_name: from_name,
          from_email: from_email,
          subject: subject,
          message: message,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('EmailJS Error Body:', errorBody);
    
      throw new Error(
        `EmailJS API error: ${response.status} - ${errorBody}`
      );
    }

    const result = await response.json();

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}
