// Simple email service for testing without Nodemailer
export interface AuditEmailData {
  name: string;
  email: string;
  phone: string;
  domain: string;
  timestamp: string;
}

export async function sendAuditEmail(data: AuditEmailData) {
  const { name, email, phone, domain, timestamp } = data;

  // For demo purposes, we'll just log the email data
  // In production, you would integrate with a real email service
  console.log('📧 AUDIT EMAIL WOULD BE SENT:');
  console.log('=====================================');
  console.log(`To: hamareclarke@gmail.com`);
  console.log(`Subject: New SEO Audit Request - ${domain}`);
  console.log(`From: hamareclarke@gmail.com`);
  console.log('');
  console.log('Contact Information:');
  console.log(`- Name: ${name}`);
  console.log(`- Email: ${email}`);
  console.log(`- Phone: ${phone}`);
  console.log(`- Domain: ${domain}`);
  console.log(`- Request Time: ${new Date(timestamp).toLocaleString()}`);
  console.log('=====================================');

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { 
    success: true, 
    messageId: `audit-${Date.now()}`,
    message: 'Audit email logged successfully (demo mode)'
  };
}

export async function sendBookingEmail(data: Omit<AuditEmailData, 'domain'>) {
  const { name, email, phone, timestamp } = data;

  // For demo purposes, we'll just log the email data
  console.log('📧 BOOKING EMAIL WOULD BE SENT:');
  console.log('=====================================');
  console.log(`To: hamareclarke@gmail.com`);
  console.log(`Subject: New Consultation Booking - ${name}`);
  console.log(`From: hamareclarke@gmail.com`);
  console.log('');
  console.log('Contact Information:');
  console.log(`- Name: ${name}`);
  console.log(`- Email: ${email}`);
  console.log(`- Phone: ${phone}`);
  console.log(`- Request Time: ${new Date(timestamp).toLocaleString()}`);
  console.log('=====================================');

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return { 
    success: true, 
    messageId: `booking-${Date.now()}`,
    message: 'Booking email logged successfully (demo mode)'
  };
}
