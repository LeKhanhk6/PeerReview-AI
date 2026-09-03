
import { config } from "dotenv";
config();
import pool from "./src/config/db.js";
import * as reviewService from "./src/services/review.service.js";
import * as aiService from "./src/services/ai.service.js";
import crypto from "crypto";

(async () => {
    try {
        const res = await pool.query("SELECT id FROM assignments LIMIT 1;");
        if(res.rowCount === 0) { console.log("No assignments"); return; }
        const assignmentId = res.rows[0].id;
        console.log("Testing assignment ID:", assignmentId);
        
        const { reviewsText, totalReviews, reviewsUsed } = await reviewService.getAssignmentReviewsForSynthesis(assignmentId);
        console.log("Reviews fetched:", totalReviews);

        if (totalReviews < 5) {
            console.log("Not enough reviews");
            process.exit(0);
        }

        const requestId = crypto.randomUUID();
        const timeframeKey = "all_all";
        
        const synthesis = await aiService.synthesizeReviews(assignmentId, timeframeKey, reviewsText, totalReviews, reviewsUsed, requestId);
        console.log("Synthesis result:", synthesis);
    } catch(err) {
        console.error("Error:", err);
    } finally {
        process.exit();
    }
})();

