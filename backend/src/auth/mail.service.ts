import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`SMTP Mail Transporter initialized using ${host}:${port}`);
    } else {
      this.logger.warn('SMTP credentials not configured. Email OTPs will be printed to server console.');
    }
  }

  async sendOtpEmail(toEmail: string, otpCode: string): Promise<boolean> {
    const from = process.env.SMTP_FROM || 'Engaging Minds <noreply@engagingminds.com>';
    const subject = 'Your Engaging Minds Verification Code';
    const text = `Hello,\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code will expire in 10 minutes. If you did not request this code, please ignore this email.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5; margin-bottom: 20px;">Engaging Minds Verification</h2>
        <p style="font-size: 16px; color: #374151;">Use the verification code below to complete your registration:</p>
        <div style="background-color: #F3F4F6; padding: 16px; text-align: center; border-radius: 6px; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1F2937;">${otpCode}</span>
        </div>
        <p style="font-size: 14px; color: #6B7280;">This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;

    console.log(`===================================================`);
    console.log(`[EMAIL OTP] Verification Code for ${toEmail}: ${otpCode}`);
    console.log(`===================================================`);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to: toEmail,
          subject,
          text,
          html,
        });
        this.logger.log(`OTP email sent successfully to ${toEmail}`);
        return true;
      } catch (err) {
        this.logger.error(`Failed to send email via SMTP to ${toEmail}:`, err);
        return true;
      }
    }

    return true;
  }
}
