import cron from 'node-cron';
import pool from '../config/db.js';
import logger from '../utils/logger.util.js';
import { sendDeadlineReminderEmail } from './email.service.js';

/**
 * Idempotent DB initialization for deadline_reminders_sent table
 */
export const initDeadlineReminderTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deadline_reminders_sent (
        id SERIAL PRIMARY KEY,
        assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reminder_type VARCHAR(50) NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(assignment_id, user_id, reminder_type)
      );
    `);
  } catch (err) {
    logger.error('Failed to initialize deadline_reminders_sent table:', err);
  }
};

/**
 * Scan & Dispatch 24h Deadline Reminders (Idempotent: 100% duplicate protection)
 */
export const checkAndSendDeadlineReminders = async () => {
  await initDeadlineReminderTable();

  try {
    // 1. Fetch assignments due in the next 24 hours
    const assignmentRes = await pool.query(`
      SELECT a.id, a.title, a.deadline, a.class_id
      FROM assignments a
      WHERE a.deadline >= NOW() 
        AND a.deadline <= NOW() + INTERVAL '24 HOURS'
    `);

    if (assignmentRes.rowCount === 0) {
      return;
    }

    for (const assignment of assignmentRes.rows) {
      // 2. Fetch students enrolled in this class who haven't submitted yet
      const pendingStudentsRes = await pool.query(
        `
        SELECT cm.user_id, u.email, u.full_name
        FROM class_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.class_id = $1 
          AND cm.role = 'STUDENT'
          AND cm.user_id NOT IN (
            SELECT DISTINCT gm.user_id
            FROM submissions sub
            JOIN group_members gm ON sub.group_id = gm.group_id
            WHERE sub.assignment_id = $2
          )
      `,
        [assignment.class_id, assignment.id]
      );

      for (const student of pendingStudentsRes.rows) {
        // 3. Try to insert idempotency marker into deadline_reminders_sent
        const insertRes = await pool.query(
          `
          INSERT INTO deadline_reminders_sent (assignment_id, user_id, reminder_type)
          VALUES ($1, $2, 'SUBMISSION_24H')
          ON CONFLICT (assignment_id, user_id, reminder_type) DO NOTHING
          RETURNING id
        `,
          [assignment.id, student.user_id]
        );

        // If row was inserted (meaning reminder was NOT sent before) -> Send email!
        if (insertRes.rowCount > 0) {
          sendDeadlineReminderEmail(student.email, assignment.title, 24, 'SUBMISSION').catch(
            (err) => {
              logger.error(`Error sending deadline email to ${student.email}:`, err);
            }
          );
        }
      }
    }
  } catch (err) {
    logger.error('Error running checkAndSendDeadlineReminders cron:', err);
  }
};

/**
 * Start Cron Job Scheduler (Runs hourly: '0 * * * *')
 */
export const startDeadlineCronJob = () => {
  // Schedule cron every hour
  cron.schedule('0 * * * *', () => {
    logger.info('[CRON] Running 24h deadline reminder scan...');
    checkAndSendDeadlineReminders();
  });

  logger.info('[CRON] 24h Deadline reminder cron scheduler initialized.');
};
