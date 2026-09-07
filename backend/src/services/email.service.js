import nodemailer from 'nodemailer';
import logger from '../utils/logger.util.js';

/**
 * Determine default Sender Email Address
 */
const getDefaultFrom = () => {
  if (process.env.RESEND_FROM) return process.env.RESEND_FROM;
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  if (process.env.SMTP_USER) return `"PeerReview-AI" <${process.env.SMTP_USER}>`;
  return '"PeerReview-AI" <noreply@peerreview-ai.com>';
};

/**
 * Send email via Resend HTTP REST API
 */
const sendViaResend = async ({ to, subject, html, from }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = from || getDefaultFrom();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: [to],
      subject,
      html,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Resend API Error (${response.status}): ${JSON.stringify(data)}`);
  }

  return { messageId: data.id };
};

/**
 * Create Nodemailer SMTP Transporter with connection pooling & fast timeouts
 */
const createSmtpTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000,     // 10 seconds
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }

  return null;
};

let smtpTransporter = createSmtpTransporter();

/**
 * Universal Email Sender (Dispatches to Resend HTTP API, SMTP Transporter, or Dev Logger)
 */
export const sendMail = async ({ to, subject, html, from }) => {
  const sender = from || getDefaultFrom();

  // 1. Resend HTTP API (Fastest & most reliable on Cloud Hosts like Render)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await sendViaResend({ to, subject, html, from: sender });
      logger.info(`[EMAIL SERVICE] Email sent via Resend API to ${to} | ID: ${res.messageId}`);
      return res;
    } catch (err) {
      logger.error(`[EMAIL SERVICE] Resend API failed for ${to}:`, err);
      // Fallback to SMTP if configured
      if (!smtpTransporter) throw err;
    }
  }

  // 2. Optimized Nodemailer SMTP Transporter
  if (!smtpTransporter) {
    smtpTransporter = createSmtpTransporter();
  }

  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: sender,
        to,
        subject,
        html,
      });
      logger.info(`[EMAIL SERVICE] Email sent via SMTP to ${to} | ID: ${info.messageId}`);
      return info;
    } catch (err) {
      logger.error(`[EMAIL SERVICE] SMTP sendMail failed for ${to}:`, err);
      throw err;
    }
  }

  // 3. Dev Fallback Simulator (Console Log)
  logger.info(`[DEV EMAIL SIMULATOR] To: ${to} | From: ${sender} | Subject: ${subject}`);
  logger.info(`[DEV EMAIL CONTENT] ${html}`);
  return { messageId: 'simulated-dev-id' };
};

/**
 * Gửi email đặt lại mật khẩu với rawToken (Hạn 60 phút)
 */
export const sendPasswordResetEmail = async (toEmail, rawToken) => {
  const appUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-bottom: 16px;">🔐 Yêu Cầu Đặt Lại Mật Khẩu — PeerReview-AI</h2>
      <p style="font-size: 14px; color: #374151;">Xin chào,</p>
      <p style="font-size: 14px; color: #374151;">
        Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email <strong>${toEmail}</strong>.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Đặt Lại Mật Khẩu
        </a>
      </div>
      <p style="font-size: 12px; color: #6b7280;">
        📌 <strong>Lưu ý:</strong> Liên kết này chỉ có hiệu lực trong vòng <strong>60 phút</strong> kể từ khi nhận được email và chỉ có giá trị cho 1 lần sử dụng.
      </p>
      <p style="font-size: 12px; color: #6b7280;">
        Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với Quản trị viên để bảo vệ tài khoản.
      </p>
    </div>
  `;

  try {
    await sendMail({
      to: toEmail,
      subject: '[PeerReview-AI] Hướng dẫn đặt lại mật khẩu',
      html,
    });
  } catch (error) {
    logger.error(`Failed to send password reset email to ${toEmail}:`, error);
  }
};

/**
 * Gửi email nhắc nhở deadline bài tập trước 24h
 */
export const sendDeadlineReminderEmail = async (toEmail, assignmentTitle, hoursLeft = 24, roleType = 'SUBMISSION') => {
  const isSubmission = roleType === 'SUBMISSION';
  const subject = isSubmission
    ? `⏰ Nhắc nhở: Hạn nộp bài tập "${assignmentTitle}" còn ${hoursLeft} giờ`
    : `⏰ Nhắc nhở: Hạn chấm chéo bài tập "${assignmentTitle}" còn ${hoursLeft} giờ`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #d97706; margin-bottom: 16px;">⏰ Nhắc Nhở Hạn Chót — PeerReview-AI</h2>
      <p style="font-size: 14px; color: #374151;">Xin chào,</p>
      <p style="font-size: 14px; color: #374151;">
        Đây là email tự động nhắc nhở bài tập <strong>"${assignmentTitle}"</strong> sẽ hết hạn trong vòng <strong>${hoursLeft} giờ tới</strong>.
      </p>
      <p style="font-size: 14px; color: #374151;">
        ${isSubmission ? 'Vui lòng kiểm tra và thực hiện nộp bài đúng hạn.' : 'Vui lòng truy cập hệ thống để hoàn thành nhiệm vụ đánh giá đồng đẳng.'}
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Truy Cập Hệ Thống
        </a>
      </div>
    </div>
  `;

  try {
    await sendMail({
      to: toEmail,
      subject,
    html,
    });
  } catch (error) {
    logger.error(`Failed to send deadline reminder email to ${toEmail}:`, error);
  }
};
