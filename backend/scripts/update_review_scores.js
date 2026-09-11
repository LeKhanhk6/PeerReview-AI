import 'dotenv/config';
import pool from '../src/config/db.js';

async function updateScores() {
  console.log('Updating review scores to realistic 0-100 scale (80-90 points -> 8.0-9.0 / 10)...');
  
  // Get all reviews for SE301 assignment
  const reviewsRes = await pool.query(`
    SELECT r.id, r.total_score 
    FROM reviews r
    JOIN review_assignments ra ON r.review_assignment_id = ra.id
    JOIN submissions s ON ra.submission_id = s.id
    JOIN assignments a ON s.assignment_id = a.id
    JOIN classes c ON a.class_id = c.id
    WHERE c.name LIKE '%SE301%' OR c.course_code = 'SE301'
  `);

  console.log('Found reviews:', reviewsRes.rows);

  // Update low scores (20-35) to high realistic scores (80-90)
  for (const r of reviewsRes.rows) {
    const currentScore = parseFloat(r.total_score);
    let newScore = currentScore;
    if (currentScore < 40) {
      // Multiply by 2.6 ~ 2.8 to scale ~30 points to ~82-88 points out of 100
      newScore = Math.round(currentScore * 2.7 * 10) / 10;
      if (newScore > 95) newScore = 92.5;
      if (newScore < 75) newScore = 78.0;
    }

    await pool.query('UPDATE reviews SET total_score = $1 WHERE id = $2', [newScore, r.id]);
    console.log(`Updated review ${r.id}: ${currentScore} -> ${newScore}`);
  }

  // Calculate new average
  const avgRes = await pool.query(`
    SELECT AVG(CASE WHEN r.total_score > 10 THEN r.total_score / 10.0 ELSE r.total_score END) as avg_score
    FROM reviews r
    JOIN review_assignments ra ON r.review_assignment_id = ra.id
    JOIN submissions s ON ra.submission_id = s.id
    JOIN assignments a ON s.assignment_id = a.id
    JOIN classes c ON a.class_id = c.id
    WHERE c.name LIKE '%SE301%' OR c.course_code = 'SE301'
  `);
  console.log('NEW AVERAGE CLASS SCORE:', avgRes.rows[0].avg_score);

  process.exit(0);
}

updateScores();
