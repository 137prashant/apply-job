const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { generateEmailTemplate } = require('./emailTemplate');

const INLINE_IMAGES = [
  { file: 'mobile.png', cid: 'mobile', contentType: 'image/png' },
  { file: 'linkedin.png', cid: 'linkedin', contentType: 'image/png' },
  { file: 'portfolio.png', cid: 'portfolio', contentType: 'image/png' },
  { file: 'github.png', cid: 'github', contentType: 'image/png' },
];

class EmailService {
  constructor(provider = 'sendgrid') {
    this.provider = provider === 'gmail' ? 'gmail' : 'sendgrid';

    if (this.provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    }
  }

  getGmailUser() {
    return process.env.GMAIL_USER || process.env.EMAIL_FROM;
  }

  getGmailPassword() {
    return process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '') || '';
  }

  getGmailTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.getGmailUser(),
        pass: this.getGmailPassword(),
      },
    });
  }

  resolveCvPath(cvPath) {
    const defaultCvPath = path.join(process.cwd(), 'public', 'prashant.pdf');
    return cvPath || defaultCvPath;
  }

  buildSendGridAttachments(cvPath) {
    const attachments = INLINE_IMAGES.map(({ file, cid, contentType }) => {
      const filePath = path.join(process.cwd(), 'public', file);
      return this.buildSendGridAttachment(filePath, {
        filename: file,
        contentType,
        disposition: 'inline',
        contentId: cid,
      });
    }).filter(Boolean);

    const cvToUse = this.resolveCvPath(cvPath);
    const cvAttachment = this.buildSendGridAttachment(cvToUse, {
      filename: 'prashant.pdf',
      contentType: 'application/pdf',
      disposition: 'attachment',
    });

    if (cvAttachment) {
      attachments.push(cvAttachment);
    } else {
      console.warn('CV file not found at:', cvToUse);
    }

    return attachments;
  }

  buildSendGridAttachment(filePath, { filename, contentType, disposition, contentId }) {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const attachment = {
      content: fs.readFileSync(filePath).toString('base64'),
      filename,
      type: contentType,
      disposition,
    };

    if (contentId) {
      attachment.content_id = contentId;
    }

    return attachment;
  }

  buildNodemailerAttachments(cvPath) {
    const attachments = INLINE_IMAGES.map(({ file, cid }) => {
      const filePath = path.join(process.cwd(), 'public', file);
      if (!fs.existsSync(filePath)) {
        return null;
      }

      return {
        filename: file,
        path: filePath,
        cid,
      };
    }).filter(Boolean);

    const cvToUse = this.resolveCvPath(cvPath);
    if (fs.existsSync(cvToUse)) {
      attachments.push({
        filename: 'prashant.pdf',
        path: cvToUse,
      });
    } else {
      console.warn('CV file not found at:', cvToUse);
    }

    return attachments;
  }

  async sendViaSendGrid(toEmail, template, cvPath) {
    const msg = {
      to: toEmail,
      from: process.env.EMAIL_FROM,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
      attachments: this.buildSendGridAttachments(cvPath),
    };

    const [result] = await sgMail.send(msg);
    return { success: true, messageId: result.headers['x-message-id'] };
  }

  async sendViaGmail(toEmail, template, cvPath) {
    const transporter = this.getGmailTransporter();
    const info = await transporter.sendMail({
      from: this.getGmailUser(),
      to: toEmail,
      subject: template.subject,
      html: template.htmlBody,
      text: template.textBody,
      attachments: this.buildNodemailerAttachments(cvPath),
    });

    return { success: true, messageId: info.messageId };
  }

  async sendApplicationEmail(toEmail, name, company = null, cvPath = null) {
    try {
      const template = generateEmailTemplate({
        name,
        company,
      });

      if (this.provider === 'gmail') {
        return await this.sendViaGmail(toEmail, template, cvPath);
      }

      return await this.sendViaSendGrid(toEmail, template, cvPath);
    } catch (error) {
      console.error(`Error sending email via ${this.provider}:`, error);
      const sendGridMessage = error.response?.body?.errors?.[0]?.message;
      return { success: false, error: sendGridMessage || error.message };
    }
  }

  async sendBulkEmails(emails, cvPath = null) {
    const results = [];

    for (const emailData of emails) {
      const result = await this.sendApplicationEmail(
        emailData.email,
        emailData.name,
        emailData.company,
        cvPath
      );

      results.push({
        email: emailData.email,
        ...result,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return results;
  }

  async verifySendGridConnection() {
    if (!process.env.SENDGRID_API_KEY) {
      return { success: false, error: 'SENDGRID_API_KEY is not configured' };
    }

    if (!process.env.EMAIL_FROM) {
      return { success: false, error: 'EMAIL_FROM is not configured' };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        },
      });

      if (response.ok) {
        return { success: true, message: 'SendGrid API key is valid' };
      }

      if (response.status === 401) {
        return { success: false, error: 'Invalid SendGrid API key' };
      }

      return { success: false, error: `SendGrid API returned status ${response.status}` };
    } catch (error) {
      console.error('SendGrid verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyGmailConnection() {
    const user = this.getGmailUser();
    const password = this.getGmailPassword();

    if (!user) {
      return { success: false, error: 'GMAIL_USER or EMAIL_FROM is not configured' };
    }

    if (!password) {
      return { success: false, error: 'GMAIL_APP_PASSWORD is not configured' };
    }

    try {
      const transporter = this.getGmailTransporter();
      await transporter.verify();
      return { success: true, message: 'Gmail SMTP connection is valid' };
    } catch (error) {
      console.error('Gmail verification failed:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyConnection() {
    if (this.provider === 'gmail') {
      return this.verifyGmailConnection();
    }

    return this.verifySendGridConnection();
  }

  static getProviderStatus() {
    return {
      sendgrid: {
        configured: !!(process.env.SENDGRID_API_KEY && process.env.EMAIL_FROM),
        from: process.env.EMAIL_FROM || null,
      },
      gmail: {
        configured: !!(
          (process.env.GMAIL_USER || process.env.EMAIL_FROM) &&
          process.env.GMAIL_APP_PASSWORD
        ),
        from: process.env.GMAIL_USER || process.env.EMAIL_FROM || null,
      },
    };
  }
}

module.exports = EmailService;
