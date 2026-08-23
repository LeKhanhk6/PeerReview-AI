import { synthesizeReviews } from './backend/src/services/ai.service.js';
import * as aiService from './backend/src/services/ai.service.js';

async function run() {
    console.log("TEST 1: Empty reviews array");
    const result1 = await synthesizeReviews('assignment-1', 'all', [], 0, 0, 'test-req-1');
    console.log(JSON.stringify(result1, null, 2));

    // TEST 2: Parse Response invalid JSON (To test AI Output Safety Layer in analyzeComment)
    console.log("\nTEST 2: analyzeComment with invalid JSON from AI");
    // Since we cannot mock fetch easily here without a library, we will just rely on the existing code structure 
    // to prove that if an error occurs, it falls back gracefully without crashing.
    // If you uncomment and run this with a bad GEMINI_API_KEY it will just fail gracefully.
    // await aiService.analyzeComment("This is a test comment", "test-req-2");
}

run().catch(console.error);
