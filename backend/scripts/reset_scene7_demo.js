import 'dotenv/config';
import pool from '../src/config/db.js';
import { execSync } from 'child_process';

async function resetScene7() {
  try {
    console.log('Resetting Scene 7 state for video recording...');

    // 1. Clear published analytics (contribution_metrics)
    await pool.query('DELETE FROM contribution_metrics');
    console.log('✔ Cleared contribution_metrics (Publish status reset to Unpublished)');

    // 2. Clear AI Review Summaries
    await pool.query('DELETE FROM review_summary_items');
    await pool.query('DELETE FROM review_summaries');
    console.log('✔ Cleared review_summaries (AI Synthesis reset to ungenerated)');

    // 3. Re-run seed script for warnings (3 warnings: Group 2 unbalanced, Group 3 free-rider, Group 3 low activity)
    console.log('✔ Re-seeding early warning risks for Group 2 & Group 3...');
    execSync('node scripts/seed_warnings_group2_group3.js', { stdio: 'inherit' });

    console.log('✔ Scene 7 reset complete! Ready to record Scene 7 video.');
    process.exit(0);
  } catch (e) {
    console.error('Reset error:', e);
    process.exit(1);
  }
}

resetScene7();
