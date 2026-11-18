import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Helper to strip surrounding quotes if present in .env
 */
const cleanEnv = (val) => {
  if (!val) return '';
  let str = String(val).trim();
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    str = str.slice(1, -1);
  }
  return str.trim();
};

/**
 * Creates and returns configured Nodemailer transporter
 */
const getTransporter = () => {
  const host = cleanEnv(process.env.MAIL_HOST);
  const port = parseInt(cleanEnv(process.env.MAIL_PORT) || '587', 10);
  const user = cleanEnv(process.env.MAIL_USERNAME || process.env.MAIL_USER);
  const pass = cleanEnv(process.env.MAIL_PASSWORD || process.env.MAIL_PASS);
  const encryption = cleanEnv(process.env.MAIL_ENCRYPTION).toLowerCase();

  if (!host || !user || !pass) {
    return null;
  }

  const isSecure = port === 465 || encryption === 'ssl';

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure, // true for 465, false for 587/25
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents certificate rejection with Amazon SES or custom relay hosts
    },
  });
};

/**
 * Helper to get configured admin notification email
 */
export const getAdminNotificationEmail = () => {
  return (
    cleanEnv(process.env.ADMIN_NOTIFICATION_EMAIL) ||
    cleanEnv(process.env.ADMIN_INITIAL_EMAIL) ||
    'sanjay@niftysoft.in'
  );
};

/**
 * Helper to get default sender address (Must match verified SMTP identity)
 */
const getMailFrom = () => {
  const fromName = cleanEnv(process.env.MAIL_FROM_NAME) || 'VR4Web';

  const fromAddress = cleanEnv(process.env.MAIL_FROM_ADDRESS);
  if (fromAddress) {
    return `"${fromName}" <${fromAddress}>`;
  }

  if (process.env.MAIL_FROM) {
    return process.env.MAIL_FROM;
  }

  const fallbackUser =
    cleanEnv(process.env.MAIL_USERNAME || process.env.MAIL_USER) || 'no-reply@vr4web.com';
  return `"${fromName}" <${fallbackUser}>`;
};

/**
 * Universal safe send email function
 */
export const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn(
        `[EmailService] SMTP not fully configured (MAIL_HOST, MAIL_USER, MAIL_PASS). Logged email to "${to}": Subject: "${subject}"`
      );
      return { success: false, mock: true, message: 'SMTP not configured in .env' };
    }

    const mailOptions = {
      from: getMailFrom(),
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br />'),
      ...(replyTo ? { replyTo } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * 1. Contact Form: Admin Notification Email
 */
export const sendContactAdminNotification = async (lead) => {
  const adminEmail = getAdminNotificationEmail();
  const submittedDate = new Date(lead.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const submittedTime = new Date(lead.createdAt || Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `New Contact Lead - ${lead.name}`;

  const text = `A new Contact Lead has been submitted on the VR4Web website.

Name: ${lead.name}
Email: ${lead.email}
Phone: ${lead.phoneCode || ''} ${lead.phone}
Subject: ${lead.subject || 'Website Contact Form'}
Message: ${lead.message}
Submitted Date: ${submittedDate}
Submitted Time: ${submittedTime}

Please log in to the VR4Web Admin Dashboard to view the lead and respond.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #0F3D2E; padding: 24px 28px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">
          VR4WEB <span style="color: #E8890C;">ADMIN NOTIFICATION</span>
        </h1>
        <p style="color: #94A3B8; margin: 4px 0 0; font-size: 13px;">New Contact Lead Submission</p>
      </div>
      <div style="padding: 24px 28px; color: #1E293B;">
        <p style="font-size: 15px; margin-top: 0; line-height: 1.5;">
          A new Contact Lead has been submitted on the VR4Web website.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E; width: 140px;">Name:</td>
            <td style="padding: 10px 0; color: #334155;">${lead.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Email:</td>
            <td style="padding: 10px 0; color: #334155;"><a href="mailto:${lead.email}" style="color: #E8890C;">${lead.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Phone:</td>
            <td style="padding: 10px 0; color: #334155;"><a href="tel:${lead.phoneCode || ''}${lead.phone}" style="color: #0F3D2E; text-decoration: underline;">${lead.phoneCode || ''} ${lead.phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Subject:</td>
            <td style="padding: 10px 0; color: #334155;">${lead.subject || 'Website Contact Form'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Submitted Date:</td>
            <td style="padding: 10px 0; color: #334155;">${submittedDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Submitted Time:</td>
            <td style="padding: 10px 0; color: #334155;">${submittedTime}</td>
          </tr>
        </table>
        <div style="background-color: #F8FAF9; border-left: 4px solid #E8890C; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px; font-weight: bold; color: #0F3D2E; font-size: 13px;">Message:</p>
          <p style="margin: 0; color: #475569; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${lead.message}</p>
        </div>
        <p style="font-size: 13px; color: #64748B; margin-top: 24px;">
          Please log in to the VR4Web Admin Dashboard to view the lead and respond.
        </p>
      </div>
      <div style="background-color: #F8FAF9; border-top: 1px solid #E5E7EB; padding: 14px 28px; text-align: center; font-size: 12px; color: #94A3B8;">
        VR4Web Enterprise Management Suite &bull; Automated System Dispatch
      </div>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    text,
    html,
    replyTo: lead.email,
  });
};

/**
 * 2. Contact Form: User Acknowledgement Email
 */
export const sendContactUserAcknowledgement = async (lead) => {
  const subject = 'Thank You for Contacting VR4Web';

  const text = `Dear ${lead.name},

Thank you for contacting VR4Web.

We have successfully received your message. Our team will review your request and get back to you as soon as possible.

Thank you for your interest in VR4Web.

Best Regards,
VR4Web Team
https://www.vr4web.com/`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #0F3D2E; padding: 24px 28px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">
          VR4WEB
        </h1>
        <p style="color: #E8890C; margin: 4px 0 0; font-size: 13px; font-weight: bold;">Innovative Digital Solutions Online</p>
      </div>
      <div style="padding: 28px; color: #1E293B; line-height: 1.6;">
        <p style="font-size: 16px; font-weight: bold; color: #0F3D2E; margin-top: 0;">
          Dear ${lead.name},
        </p>
        <p style="font-size: 14px; color: #334155;">
          Thank you for contacting <strong>VR4Web</strong>.
        </p>
        <p style="font-size: 14px; color: #334155;">
          We have successfully received your message. Our team will review your request and get back to you as soon as possible.
        </p>
        <div style="background-color: #F8FAF9; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #E5E7EB;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: #0F3D2E;">Summary of your message:</p>
          <p style="margin: 0; font-size: 13px; color: #64748B; font-style: italic;">"${lead.message}"</p>
        </div>
        <p style="font-size: 14px; color: #334155;">
          Thank you for your interest in VR4Web.
        </p>
        <p style="font-size: 14px; color: #0F3D2E; margin-top: 28px; line-height: 1.4;">
          <strong>Best Regards,</strong><br />
          VR4Web Team<br />
          <a href="https://www.vr4web.com/" style="color: #E8890C; text-decoration: none;">https://www.vr4web.com/</a>
        </p>
      </div>
      <div style="background-color: #F8FAF9; border-top: 1px solid #E5E7EB; padding: 14px 28px; text-align: center; font-size: 12px; color: #94A3B8;">
        &copy; ${new Date().getFullYear()} VR4Web. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: lead.email,
    subject,
    text,
    html,
  });
};

/**
 * 3. Enquiry Form: Admin Notification Email
 */
export const sendEnquiryAdminNotification = async (enquiry) => {
  const adminEmail = getAdminNotificationEmail();
  const submittedDate = new Date(enquiry.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const submittedTime = new Date(enquiry.createdAt || Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `New Project Enquiry - ${enquiry.name}`;

  const text = `A new project enquiry has been submitted on the VR4Web website.

Name: ${enquiry.name}
Email: ${enquiry.email}
Phone: ${enquiry.countryCode || ''} ${enquiry.phone}
About Your Project: ${enquiry.projectType || enquiry.aboutProject || 'Website Project'}
Project Budget: ${enquiry.projectBudget || 'Not Specified'}
Additional Message: ${enquiry.message}
Submitted Date: ${submittedDate}
Submitted Time: ${submittedTime}

Please log in to the VR4Web Admin Dashboard to view the enquiry and respond.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #0F3D2E; padding: 24px 28px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: -0.5px;">
          VR4WEB <span style="color: #E8890C;">PROJECT ENQUIRY</span>
        </h1>
        <p style="color: #94A3B8; margin: 4px 0 0; font-size: 13px;">New Client Project Brief</p>
      </div>
      <div style="padding: 24px 28px; color: #1E293B;">
        <p style="font-size: 15px; margin-top: 0; line-height: 1.5;">
          A new project enquiry has been submitted on the VR4Web website.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px;">
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E; width: 140px;">Name:</td>
            <td style="padding: 10px 0; color: #334155;">${enquiry.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Email:</td>
            <td style="padding: 10px 0; color: #334155;"><a href="mailto:${enquiry.email}" style="color: #E8890C;">${enquiry.email}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Phone:</td>
            <td style="padding: 10px 0; color: #334155;"><a href="tel:${enquiry.countryCode || ''}${enquiry.phone}" style="color: #0F3D2E; text-decoration: underline;">${enquiry.countryCode || ''} ${enquiry.phone}</a></td>
          </tr>
          ${
            enquiry.company
              ? `
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Company:</td>
            <td style="padding: 10px 0; color: #334155;">${enquiry.company}</td>
          </tr>`
              : ''
          }
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">About Your Project:</td>
            <td style="padding: 10px 0; color: #334155; font-weight: 600;">${enquiry.projectType || enquiry.aboutProject || 'Website Project'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Project Budget:</td>
            <td style="padding: 10px 0; color: #E8890C; font-weight: bold;">${enquiry.projectBudget || 'Not Specified'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Submitted Date:</td>
            <td style="padding: 10px 0; color: #334155;">${submittedDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #0F3D2E;">Submitted Time:</td>
            <td style="padding: 10px 0; color: #334155;">${submittedTime}</td>
          </tr>
        </table>
        <div style="background-color: #F8FAF9; border-left: 4px solid #0F3D2E; padding: 14px 18px; margin: 18px 0; border-radius: 4px;">
          <p style="margin: 0 0 6px; font-weight: bold; color: #0F3D2E; font-size: 13px;">Additional Message:</p>
          <p style="margin: 0; color: #475569; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${enquiry.message}</p>
        </div>
        <p style="font-size: 13px; color: #64748B; margin-top: 24px;">
          Please log in to the VR4Web Admin Dashboard to view the enquiry and respond.
        </p>
      </div>
      <div style="background-color: #F8FAF9; border-top: 1px solid #E5E7EB; padding: 14px 28px; text-align: center; font-size: 12px; color: #94A3B8;">
        VR4Web Enterprise Management Suite &bull; Automated System Dispatch
      </div>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject,
    text,
    html,
    replyTo: enquiry.email,
  });
};

/**
 * 4. Enquiry Form: User Acknowledgement Email
 */
export const sendEnquiryUserAcknowledgement = async (enquiry) => {
  const subject = 'Thank You for Your Project Enquiry - VR4Web';

  const text = `Dear ${enquiry.name},

Thank you for sharing your project requirements with VR4Web.

We have successfully received your enquiry. Our team will review your project details and contact you to discuss the next steps.

We appreciate your interest in working with us.

Best Regards,
VR4Web Team
https://www.vr4web.com/`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #0F3D2E; padding: 24px 28px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">
          VR4WEB
        </h1>
        <p style="color: #E8890C; margin: 4px 0 0; font-size: 13px; font-weight: bold;">Digital Solutions & Software Engineering</p>
      </div>
      <div style="padding: 28px; color: #1E293B; line-height: 1.6;">
        <p style="font-size: 16px; font-weight: bold; color: #0F3D2E; margin-top: 0;">
          Dear ${enquiry.name},
        </p>
        <p style="font-size: 14px; color: #334155;">
          Thank you for sharing your project requirements with <strong>VR4Web</strong>.
        </p>
        <p style="font-size: 14px; color: #334155;">
          We have successfully received your enquiry. Our team will review your project details and contact you to discuss the next steps.
        </p>
        <div style="background-color: #F8FAF9; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #E5E7EB;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: #0F3D2E;">Selected Project Scope:</p>
          <p style="margin: 0; font-size: 13px; color: #334155;">
            <strong>Category:</strong> ${enquiry.projectType || 'General Development'}<br />
            <strong>Budget:</strong> ${enquiry.projectBudget || 'Flexible'}
          </p>
        </div>
        <p style="font-size: 14px; color: #334155;">
          We appreciate your interest in working with us.
        </p>
        <p style="font-size: 14px; color: #0F3D2E; margin-top: 28px; line-height: 1.4;">
          <strong>Best Regards,</strong><br />
          VR4Web Team<br />
          <a href="https://www.vr4web.com/" style="color: #E8890C; text-decoration: none;">https://www.vr4web.com/</a>
        </p>
      </div>
      <div style="background-color: #F8FAF9; border-top: 1px solid #E5E7EB; padding: 14px 28px; text-align: center; font-size: 12px; color: #94A3B8;">
        &copy; ${new Date().getFullYear()} VR4Web. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: enquiry.email,
    subject,
    text,
    html,
  });
};

/**
 * 5. Admin Direct Reply Email
 */
export const sendAdminReplyEmail = async ({ to, subject, message, adminEmail }) => {
  const text = `${message}

---
Best Regards,
VR4Web Engineering & Advisory Team
https://www.vr4web.com/`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background: #ffffff;">
      <div style="background-color: #0F3D2E; padding: 20px 24px;">
        <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: bold;">
          VR4WEB <span style="color: #E8890C;">COMMUNICATION</span>
        </h2>
      </div>
      <div style="padding: 24px; color: #1E293B; line-height: 1.6; font-size: 14px;">
        <div style="white-space: pre-wrap; color: #1E293B; margin-bottom: 24px;">${message}</div>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="margin: 0; color: #0F3D2E; font-size: 13px;">
          <strong>VR4Web Team</strong><br />
          Email: <a href="mailto:${adminEmail || 'info@vr4web.com'}" style="color: #E8890C;">${adminEmail || 'info@vr4web.com'}</a><br />
          Website: <a href="https://www.vr4web.com/" style="color: #0F3D2E;">https://www.vr4web.com/</a>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    text,
    html,
    replyTo: adminEmail,
  });
};

