
import { config } from "dotenv";
config();
import pool from "./src/config/db.js";
import { getAssignmentReviewsForSynthesis } from "./src/services/review.service.js";

(async () => {
    try {
        const res = await pool.query("SELECT id FROM assignments LIMIT 1;");
        if(res.rowCount === 0) { console.log("No assignments"); return; }
        const assignmentId = res.rows[0].id;
        console.log("Testing assignment ID:", assignmentId);
        
        const data = await getAssignmentReviewsForSynthesis(assignmentId);
        console.log("Success:", data);
    } catch(err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
})();

