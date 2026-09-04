import { EmailCategory, EmailDeliveryStatus, EmailLog, EmailSettings, EmailTemplate, FormSubmissionItem } from '../types';

const EMAIL_LOGS_STORAGE_KEY = 'grenada_email_logs_db';
const EMAIL_SETTINGS_STORAGE_KEY = 'grenada_email_settings_db';
const EMAIL_TEMPLATES_STORAGE_KEY = 'grenada_email_templates_db';

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  engineMode: 'resend',
  senderName: 'Grenada CARICOM Festival Secretariat',
  senderEmail: 'concierge@grenadacaricom2027.com',
  replyToEmail: 'concierge@grenadacaricom2027.com',
  organisationAddress: 'The Festival Village, Grand Anse Beach, St. George\'s, Grenada, West Indies',
  festivalWebsiteUrl: 'https://grenadacaricom2027.com',
  resendApiKey: '',
  sendgridApiKey: '',
  mailchimpApiKey: '',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  autoSendOrderConfirmation: true,
  autoSendWelcomeRegistration: true,
  autoSendEnquiryReply: true,
  bccSecretariatOnOrders: true,
  secretariatBccEmail: 'records@grenadacaricom2027.com'
};

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-order-confirmation',
    category: 'order_confirmation',
    name: 'Festival Pass Confirmation & E-Ticket',
    description: 'Dispatched automatically when a patron completes a festival pass booking or ticket order.',
    subject: 'Your Official Pass Confirmation & Festival Dossier — Grenada CARICOM Festival 2027',
    headline: 'Welcome to the Spice Isle, {name}!',
    introText: 'Thank you for securing your official entry to the Grenada CARICOM Festival 2027. Your pass reservation has been verified and logged with the Festival Secretariat.',
    bodyText: 'Your digital credential confers authorised entry to our festival venues across Grand Anse Beach, the Mellowland Cultural Village, and associated gala showcases. Please retain this receipt and present your reference code upon arrival at the VIP Accreditation Tent.',
    ctaLabel: 'View Official Festival Programme',
    ctaUrl: 'https://grenadacaricom2027.com',
    footerNote: 'Grenada CARICOM Festival 2027 Secretariat • Grand Anse Beach, St. George\'s, Grenada • Enquiries: concierge@grenadacaricom2027.com',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-welcome-registration',
    category: 'welcome_registration',
    name: 'Delegate Welcome & Travel Dossier',
    description: 'Sent upon general festival registration and attendee community sign-up.',
    subject: 'Warm Greetings from the Spice Isle — Your Festival Registration Dossier',
    headline: 'Greetings {name}, your registration is confirmed',
    introText: 'We are delighted to welcome you to the community of the Grenada CARICOM Festival 2027, celebrating the union of British Caribbean culture and Spice Isle hospitality.',
    bodyText: 'Our festival concierge team is currently finalising the official cultural programme, including our world-renowned Mellowland River Tubing expedition, Beach Carnival, and White Sand Gala. You will receive priority updates, pass release alerts, and travel advisories as they are published.',
    ctaLabel: 'Explore Curated Accommodations',
    ctaUrl: 'https://grenadacaricom2027.com',
    footerNote: 'Official Festival Liaison Office • St. George\'s, Grenada',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-enquiry-reply',
    category: 'enquiry_reply',
    name: 'Concierge & Secretariat Response',
    description: 'Dispatched when the Festival Concierge or Secretariat replies to an attendee enquiry.',
    subject: 'Response to your enquiry (Ref: {reference_id}) — Grenada CARICOM Festival',
    headline: 'Festival Concierge Service',
    introText: 'Dear {name}, thank you for contacting the Grenada CARICOM Festival Secretariat regarding your recent enquiry.',
    bodyText: '{reply_message}\n\nShould you require any further assistance or bespoke hospitality arrangements during your stay in Grenada, please do not hesitate to contact our dedicated concierge team.',
    ctaLabel: 'Visit Festival Information Centre',
    ctaUrl: 'https://grenadacaricom2027.com',
    footerNote: 'Grenada CARICOM Festival Concierge • Direct line and WhatsApp assistance available',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-vendor-application',
    category: 'vendor_application',
    name: 'Commercial Stallholder & Vendor Allocation',
    description: 'Notifies commercial vendors, craft exhibitors, and food stallholders of their registration status.',
    subject: 'Commercial Stallholder Status Notice — Grenada CARICOM Festival 2027',
    headline: 'Vendor Registration Update',
    introText: 'Dear {name}, we have processed your application for commercial exhibition space at the upcoming festival village.',
    bodyText: 'Our logistics and environmental health committee has catalogued your submission. Please find enclosed your provisional stall designation and safety compliance requirements. Electrical connections and water access points will be coordinated directly by our ground team.',
    ctaLabel: 'Review Vendor Guidelines',
    ctaUrl: 'https://grenadacaricom2027.com',
    footerNote: 'Commercial Operations Committee • Grand Anse Festival Park',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-vip-invitation',
    category: 'vip_invitation',
    name: 'VIP Artiste & Dignitary Protocol',
    description: 'Protocol briefing and high-commission dossier for headline artistes, sponsors, and dignitaries.',
    subject: 'Official Protocol Invitation & VIP Credentials — Grenada CARICOM Festival 2027',
    headline: 'Distinguished Guest Protocol Briefing',
    introText: 'The Festival Executive Committee has the honour of extending this formal protocol briefing for your attendance at the 2027 celebrations.',
    bodyText: 'Your VIP accreditation includes fast-track diplomatic arrival assistance at Maurice Bishop International Airport (GND), dedicated festival chauffeur transport, and reserved seating for all headline galas and beachfront pavilions.',
    ctaLabel: 'Confirm Protocol Arrival Schedule',
    ctaUrl: 'https://grenadacaricom2027.com',
    footerNote: 'Office of the Festival Director & Diplomatic Liaison',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tpl-broadcast-campaign',
    category: 'broadcast_campaign',
    name: 'Official Festival Communiqué',
    description: 'Custom bulletin or announcement dispatched to filtered groups of festival delegates.',
    subject: '{headline} — Grenada CARICOM Festival 2027',
    headline: 'Official Festival Communiqué',
    introText: 'An official announcement from the Grenada CARICOM Festival 2027 Executive Committee.',
    bodyText: '{body_content}',
    ctaLabel: 'Read Full Communiqué',
    ctaUrl: 'https://grenadacaricom2027.com',
    footerNote: 'Issued by the Grenada CARICOM Festival Organising Committee • St. George\'s, Grenada',
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_DEMO_EMAIL_LOGS: EmailLog[] = [];

// Helper: safe API calls with backend SQLite sync
async function safeApiCall(url: string, options?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------
export const getEmailSettings = (): EmailSettings => {
  if (typeof window === 'undefined') return DEFAULT_EMAIL_SETTINGS;
  try {
    const raw = localStorage.getItem(EMAIL_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_EMAIL_SETTINGS;
    return { ...DEFAULT_EMAIL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_EMAIL_SETTINGS;
  }
};

export const saveEmailSettings = (settings: EmailSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EMAIL_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('grenada_email_settings_updated'));
  } catch (e) {
    console.error('Failed to save email settings locally:', e);
  }

  safeApiCall('/api/email/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

// -------------------------------------------------------------
// TEMPLATES
// -------------------------------------------------------------
export const getEmailTemplates = (): EmailTemplate[] => {
  if (typeof window === 'undefined') return DEFAULT_EMAIL_TEMPLATES;
  try {
    const raw = localStorage.getItem(EMAIL_TEMPLATES_STORAGE_KEY);
    if (!raw) return DEFAULT_EMAIL_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_EMAIL_TEMPLATES;
  } catch {
    return DEFAULT_EMAIL_TEMPLATES;
  }
};

export const saveEmailTemplates = (templates: EmailTemplate[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EMAIL_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(new Event('grenada_email_templates_updated'));
  } catch (e) {
    console.error('Failed to save email templates locally:', e);
  }

  safeApiCall('/api/email/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(templates)
  });
};

export const resetEmailTemplates = (): EmailTemplate[] => {
  saveEmailTemplates(DEFAULT_EMAIL_TEMPLATES);
  return DEFAULT_EMAIL_TEMPLATES;
};

// -------------------------------------------------------------
// EMAIL LOGS & OUTBOX
// -------------------------------------------------------------
export const getEmailLogs = (): EmailLog[] => {
  if (typeof window === 'undefined') return INITIAL_DEMO_EMAIL_LOGS;
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(EMAIL_LOGS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_EMAIL_LOGS));
      return INITIAL_DEMO_EMAIL_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_EMAIL_LOGS;
  } catch {
    return INITIAL_DEMO_EMAIL_LOGS;
  }
};

export const saveEmailLogs = (logs: EmailLog[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EMAIL_LOGS_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event('grenada_email_logs_updated'));
  } catch (e) {
    console.error('Failed to save email logs locally:', e);
  }
};

export const addEmailLog = (log: Omit<EmailLog, 'id' | 'dispatchedAt'>): EmailLog => {
  const current = getEmailLogs();
  const newLog: EmailLog = {
    ...log,
    id: `eml-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    dispatchedAt: new Date().toISOString()
  };

  const updated = [newLog, ...current];
  saveEmailLogs(updated);

  safeApiCall('/api/email/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newLog)
  });

  return newLog;
};

export const deleteEmailLog = (id: string): void => {
  const current = getEmailLogs();
  const updated = current.filter(l => l.id !== id);
  saveEmailLogs(updated);

  safeApiCall(`/api/email/logs/${id}`, {
    method: 'DELETE'
  });
};

export const clearEmailLogs = (): void => {
  saveEmailLogs([]);
  safeApiCall('/api/email/logs/clear', {
    method: 'POST'
  });
};

// -------------------------------------------------------------
// HTML EMAIL GENERATOR (BRITISH ENGLISH & LUXURY FESTIVAL STYLING)
// -------------------------------------------------------------
export interface RenderEmailOptions {
  recipientName?: string;
  recipientEmail: string;
  subject: string;
  headline?: string;
  introText?: string;
  bodyText: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
  referenceId?: string;
  category?: EmailCategory;
  metadata?: Record<string, any>;
  primaryColor?: string;
}

export const renderFestivalHtmlEmail = (options: RenderEmailOptions): string => {
  const primaryColor = options.primaryColor || '#F59E0B';
  const name = options.recipientName || 'Valued Festival Delegate';
  const headline = options.headline || 'Official Festival Communiqué';
  const intro = options.introText || '';
  const body = options.bodyText || '';
  const refId = options.referenceId || `GCF-2027-${Math.floor(1000 + Math.random() * 9000)}`;
  const ctaLabel = options.ctaLabel || 'View Official Programme';
  const ctaUrl = options.ctaUrl || 'https://grenadacaricom2027.com';
  const footerNote = options.footerNote || 'Grenada CARICOM Festival 2027 Secretariat • Grand Anse Beach, St. George\'s, Grenada';

  const metadataRows = options.metadata
    ? Object.entries(options.metadata)
        .map(([key, val]) => `
          <tr>
            <td style="padding: 8px 12px; font-size: 13px; color: #a3a3a3; border-bottom: 1px solid rgba(255,255,255,0.06); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1')}</td>
            <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #f5f5f5; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.06); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${String(val)}</td>
          </tr>
        `).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0f14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e5e5e5; -webkit-font-smoothing: antialiased; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0c0f14; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #141822; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.6);">
          
          <!-- Festival Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #181d2a 0%, #0d1017 100%); padding: 36px 32px 28px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center;">
              <div style="display: inline-block; padding: 4px 14px; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 9999px; margin-bottom: 14px;">
                <span style="color: ${primaryColor}; font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Official Communiqué</span>
              </div>
              <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; font-family: Georgia, 'Times New Roman', serif;">
                GRENADA CARICOM FESTIVAL 2027
              </h1>
              <p style="margin: 0; color: #9ca3af; font-size: 13px; letter-spacing: 0.05em;">
                London Vibes Meet The Spice Isle • 22–31 May 2027
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 700; line-height: 1.3; font-family: Georgia, 'Times New Roman', serif;">
                ${headline}
              </h2>

              ${intro ? `<p style="margin: 0 0 18px 0; font-size: 15px; color: #d4d4d4; line-height: 1.6;">${intro}</p>` : ''}

              <div style="margin: 0 0 24px 0; font-size: 14px; color: #a3a3a3; line-height: 1.7; white-space: pre-line;">
${body}
              </div>

              <!-- Official Reference Dossier Badge -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #737373; font-weight: 700; display: block; margin-bottom: 4px;">Authorised Reference</span>
                          <span style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; color: ${primaryColor};">${refId}</span>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; padding: 4px 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                            Verified Entry
                          </span>
                        </td>
                      </tr>
                    </table>
                    ${metadataRows ? `<table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 14px; border-top: 1px solid rgba(255,255,255,0.08);">${metadataRows}</table>` : ''}
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: ${primaryColor}; color: #0c0f14; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
                Need assistance? Reply directly to this email or contact our Concierge Desk.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0d1017; padding: 24px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #737373; line-height: 1.5;">
                ${footerNote}
              </p>
              <p style="margin: 0; font-size: 10px; color: #525252;">
                © 2027 Grenada CARICOM Festival. All rights reserved under UK and CARICOM copyright conventions.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// -------------------------------------------------------------
// DISPATCH ENGINE (PRODUCTION SAAS & SMTP DELIVERY)
// -------------------------------------------------------------
export interface SendEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  category: EmailCategory;
  headline?: string;
  introText?: string;
  bodyText: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
  referenceId?: string;
  metadata?: Record<string, any>;
  primaryColor?: string;
}

export const dispatchEmail = async (payload: SendEmailPayload): Promise<{ success: boolean; log: EmailLog; message: string }> => {
  const settings = getEmailSettings();
  const html = renderFestivalHtmlEmail({
    ...payload,
    primaryColor: payload.primaryColor || '#F59E0B'
  });

  const baseLog: Omit<EmailLog, 'id' | 'dispatchedAt'> = {
    recipientEmail: payload.recipientEmail,
    recipientName: payload.recipientName,
    subject: payload.subject,
    category: payload.category,
    contentHtml: html,
    contentText: `${payload.headline || payload.subject}\n\n${payload.introText || ''}\n\n${payload.bodyText}`,
    status: 'queued',
    senderName: settings.senderName,
    senderEmail: settings.senderEmail,
    referenceId: payload.referenceId || `GCF-2027-${Math.floor(1000 + Math.random() * 9000)}`,
    metadata: payload.metadata
  };

  // Attempt real backend dispatch via server.ts
  const apiResult = await safeApiCall('/api/email/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      contentHtml: html,
      settings
    })
  });

  let finalStatus: EmailDeliveryStatus = 'failed';
  let message = 'Email delivery failed. Please verify your email provider credentials.';
  let errorDetails: string | undefined = undefined;

  if (apiResult) {
    finalStatus = apiResult.status === 'delivered' ? 'delivered' : 'failed';
    message = apiResult.message || message;
    errorDetails = apiResult.error;
  } else {
    finalStatus = 'failed';
    errorDetails = 'Unable to reach backend email service or connection timed out.';
    message = 'Backend email service error. Please check server logs.';
  }

  const createdLog = addEmailLog({
    ...baseLog,
    status: finalStatus,
    errorDetails
  });

  return {
    success: finalStatus === 'delivered',
    log: createdLog,
    message
  };
};

// -------------------------------------------------------------
// CONVENIENCE DISPATCHERS FOR APPLICATION EVENTS
// -------------------------------------------------------------
export const dispatchOrderConfirmationEmail = async (order: FormSubmissionItem, primaryColor = '#F59E0B') => {
  const settings = getEmailSettings();
  if (!settings.autoSendOrderConfirmation) return null;
  if (!order.email) return null;

  const templates = getEmailTemplates();
  const tpl = templates.find(t => t.category === 'order_confirmation') || DEFAULT_EMAIL_TEMPLATES[0];

  const passName = order.extraDetails?.Pass || order.topicOrPass || 'Festival Pass Package';
  const qty = order.extraDetails?.Quantity || '1';
  const total = order.amountGBP ? `£${order.amountGBP.toFixed(2)}` : (order.extraDetails?.TotalPaid || 'Confirmed');
  const attendeeName = order.name || 'Festival Delegate';

  const headline = tpl.headline.replace('{name}', attendeeName);
  const intro = tpl.introText.replace('{name}', attendeeName);
  const body = tpl.bodyText;

  return await dispatchEmail({
    recipientEmail: order.email,
    recipientName: attendeeName,
    subject: tpl.subject,
    category: 'order_confirmation',
    headline,
    introText: intro,
    bodyText: body,
    ctaLabel: tpl.ctaLabel,
    ctaUrl: tpl.ctaUrl,
    footerNote: tpl.footerNote,
    referenceId: order.id.toUpperCase().replace('SUB-', 'GCF-'),
    metadata: {
      'Pass Type': passName,
      'Total Passes': qty,
      'Settlement': total,
      'Accommodation': order.extraDetails?.Hotel || 'Independent Travel',
      'Event Dates': '22–31 May 2027'
    },
    primaryColor
  });
};

export const dispatchWelcomeRegistrationEmail = async (submission: FormSubmissionItem, primaryColor = '#F59E0B') => {
  const settings = getEmailSettings();
  if (!settings.autoSendWelcomeRegistration) return null;
  if (!submission.email) return null;

  const templates = getEmailTemplates();
  const tpl = templates.find(t => t.category === 'welcome_registration') || DEFAULT_EMAIL_TEMPLATES[1];
  const attendeeName = submission.name || 'Festival Delegate';

  const headline = tpl.headline.replace('{name}', attendeeName);
  const intro = tpl.introText.replace('{name}', attendeeName);

  return await dispatchEmail({
    recipientEmail: submission.email,
    recipientName: attendeeName,
    subject: tpl.subject,
    category: 'welcome_registration',
    headline,
    introText: intro,
    bodyText: tpl.bodyText,
    ctaLabel: tpl.ctaLabel,
    ctaUrl: tpl.ctaUrl,
    footerNote: tpl.footerNote,
    referenceId: submission.id.toUpperCase().replace('SUB-', 'REG-'),
    metadata: {
      'Country of Residence': submission.extraDetails?.Country || 'United Kingdom',
      'Festival Interest': submission.topicOrPass || 'General Programme & Galas'
    },
    primaryColor
  });
};

export const dispatchEnquiryReplyEmail = async (
  submission: FormSubmissionItem,
  replyMessage: string,
  sentBy: string = 'Festival Concierge',
  primaryColor = '#F59E0B'
) => {
  const settings = getEmailSettings();
  if (!settings.autoSendEnquiryReply) return null;
  if (!submission.email) return null;

  const templates = getEmailTemplates();
  const tpl = templates.find(t => t.category === 'enquiry_reply') || DEFAULT_EMAIL_TEMPLATES[2];
  const recipientName = submission.name || 'Festival Delegate';

  const body = tpl.bodyText
    .replace('{reply_message}', replyMessage)
    .replace('{name}', recipientName);

  return await dispatchEmail({
    recipientEmail: submission.email,
    recipientName,
    subject: tpl.subject.replace('{reference_id}', submission.id),
    category: 'enquiry_reply',
    headline: `Enquiry Update: ${submission.topicOrPass || 'Concierge Service'}`,
    introText: tpl.introText.replace('{name}', recipientName),
    bodyText: body,
    ctaLabel: tpl.ctaLabel,
    ctaUrl: tpl.ctaUrl,
    footerNote: tpl.footerNote,
    referenceId: submission.id,
    metadata: {
      'Dispatched By': sentBy,
      'Original Enquiry': submission.messageOrDetails ? submission.messageOrDetails.substring(0, 100) + '...' : 'General Enquiry'
    },
    primaryColor
  });
};
