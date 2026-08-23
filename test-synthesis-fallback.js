import { synthesizeReviews } from './backend/src/services/ai.service.js';

async function run() {
    // We can't easily mock callProvider since it's internal to ai.service.js and not exported,
    // But we can test the empty reviews array case quickly.
    console.log("TEST 1: Empty reviews array");
    const result1 = await synthesizeReviews('assignment-1', 'all', [], 0, 0, 'test-req-1');
    console.log(JSON.stringify(result1, null, 2));
}

run().catch(console.error);
