import nodemailer from 'nodemailer';
import logger from '../utils/logger.util.js';

// Create SMTP Transporter with fallbacks for development
const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback dev transporter (logs to console)
  return {
    sendMail: async (mailOptions) => {
      logger.info(`[DEV EMAIL SIMULATOR] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
      logger.info(`[DEV EMAIL CONTENT] ${mailOptions.text || mailOptions.html}`);
      return { messageId: 'simulated-dev-id' };
    },
  };
};

const transporter = createTransporter();

/**
 * Gửi email đặt lại mật khẩu với rawToken (Hạn 15 phút)
 */
export const sendPasswordResetEmail = async (toEmail, rawToken) => {
  const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
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
        📌 <strong>Lưu ý:</strong> Liên kết này chỉ có hiệu lực trong vòng <strong>15 phút</strong> kể từ khi nhận được email và chỉ có giá trị cho 1 lần sử dụng.
      </p>
      <p style="font-size: 12px; color: #6b7280;">
        Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với Quản trị viên để bảo vệ tài khoản.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"PeerReview-AI" <noreply@university.edu.vn>',
      to: toEmail,
      subject: '[PeerReview-AI] Hướng dẫn đặt lại mật khẩu',
      html,
    });
    logger.info(`Password reset email sent to ${toEmail}`);
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
      <h2 style="color: #d97706; margin-bottom: 16px;">⏰ Nhắc Nhở Hạn Chót — PeerReview-AI</h2>
      <p style="font-size: 14px; color: #374151;">Xin chào,</p>
      <p style="font-size: 14px; color: #374151;">
        Đây là email tự động nhắc nhở bài tập <strong>"${assignmentTitle}"</strong> sẽ hết hạn trong vòng <strong>${hoursLeft} giờ tới</strong>.
      </p>
      <p style="font-size: 14px; color: #374151;">
        ${isSubmission ? 'Vui lòng kiểm tra và thực hiện nộp bài đúng hạn.' : 'Vui lòng truy cập hệ thống để hoàn thành nhiệm vụ đánh giá đồng đẳng.'}
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Truy Cập Hệ Thống
        </a>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"PeerReview-AI" <noreply@university.edu.vn>',
      to: toEmail,
      subject,
      html,
    });
    logger.info(`Deadline reminder email sent to ${toEmail}`);
  } catch (error) {
    logger.error(`Failed to send deadline reminder email to ${toEmail}:`, error);
  }
};
