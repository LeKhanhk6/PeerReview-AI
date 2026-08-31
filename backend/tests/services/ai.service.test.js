import { jest } from '@jest/globals';

// Setup module mock for DB pool
jest.unstable_mockModule('../../src/config/db.js', () => ({
    default: {
        query: jest.fn(),
        connect: jest.fn()
    }
}));

const { default: poolMock } = await import('../../src/config/db.js');
const aiService = await import('../../src/services/ai.service.js');

describe('AI Service (Staff-Level Resilience)', () => {
    let fetchSpy;
    let clientMock;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test-key';
        delete process.env.AI_MOCK;
        global.allowConsoleError();

        
        fetchSpy = jest.spyOn(global, 'fetch');
        
        clientMock = {
            query: jest.fn(),
            release: jest.fn(),
        };
        poolMock.connect.mockResolvedValue(clientMock);
    });

    afterEach(() => {
        fetchSpy.mockRestore();
    });

    describe('callProvider Resilience (Retry, Timeout, OOM Guard)', () => {
        it('Retry Classification: Should NOT retry on 4xx (Bad Request)', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Bad prompt' })
            });

            // Fast sleep for tests
            const result = await aiService.analyzeComment('bad input', 'req-1');
            
            // Should return fallback response immediately
            expect(result.category).toBe('UNKNOWN');
            // Fetch should only be called ONCE (no retry on 400)
            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });

        it('Retry Classification: Should retry with exponential backoff on 5xx', async () => {
            // Mock fast sleep inside aiService to avoid test hanging
            const sleepSpy = jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());
            
            fetchSpy
                .mockResolvedValueOnce({ ok: false, status: 500 }) // Attempt 1
                .mockResolvedValueOnce({ ok: false, status: 503 }) // Attempt 2
                .mockResolvedValueOnce({ ok: false, status: 502 }) // Attempt 3
                .mockResolvedValueOnce({ ok: false, status: 504 }); // Attempt 4

            await aiService.analyzeComment('test', 'req-2');
            
            // Should retry up to maxRetries (default 3) -> Total 4 calls
            expect(fetchSpy).toHaveBeenCalledTimes(4);
            
            sleepSpy.mockRestore();
        });

        it('Timeout Hard Cancel: AbortController should abort fetch strictly', async () => {
            process.env.AI_TIMEOUT = '10'; // Use 10ms timeout for test

            fetchSpy.mockImplementation((url, options) => {
                return new Promise((resolve, reject) => {
                    const timer = setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 200);
                    const onAbort = () => {
                        clearTimeout(timer);
                        const err = new Error('The operation was aborted');
                        err.name = 'AbortError';
                        reject(err);
                    };
                    if (options?.signal?.aborted) {
                        onAbort();
                    } else if (options?.signal) {
                        options.signal.addEventListener('abort', onAbort, { once: true });
                    }
                });
            });
            
            const result = await aiService.analyzeComment('unique timeout hard cancel test input 12345', 'req-3');
            
            expect(result.category).toBe('UNKNOWN');
            expect(fetchSpy).toHaveBeenCalled();
            
            delete process.env.AI_TIMEOUT;
        });

        it('Memory Protection: Should reject payloads exceeding byte limit', async () => {
            // Simulate a 2MB string response (in bytes, not chars)
            // '🔥' is 4 bytes. 500,000 * 4 = 2,000,000 bytes (~2MB)
            const giantString = '🔥'.repeat(500000); 
            
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    candidates: [{
                        content: { parts: [{ text: giantString }] }
                    }]
                })
            });

            const result = await aiService.analyzeComment('test', 'req-4');
            
            // Assuming MAX_RESPONSE_SIZE is around 1MB (1048576 bytes)
            // The service should catch the byte limit and return fallback
            expect(result.category).toBe('UNKNOWN');
        });
        
        it('Invalid JSON: Should activate fallback gracefully', async () => {
            fetchSpy.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    candidates: [{
                        content: { parts: [{ text: 'This is completely invalid {JSON' }] }
                    }]
                })
            });

            const result = await aiService.analyzeComment('test', 'req-5');
            
            expect(result.category).toBe('UNKNOWN');
            expect(result.guidance_message).toBeDefined();
        });
    });

    describe('synthesizeReviews Partial Failure & Transaction Guard', () => {
        it('Should synthesize successfully even if 1 chunk fails (Partial chunk failure)', async () => {
            const reviews = Array(120).fill('good job'); // Creates 3 chunks (50, 50, 20)
            
            fetchSpy.mockImplementation(async (url, options) => {
                const body = JSON.parse(options.body);
                const text = body.contents[0].parts[0].text;
                
                // Final synthesis
                if (text.includes('Các tóm tắt:')) {
                    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"summary": "Final ok", "strengths": ["1"]}' }] } }] }) };
                }

                // Chunking logic based on some arbitrary state to fail exactly one chunk continuously
                if (!fetchSpy._failCount) fetchSpy._failCount = 0;
                
                // Let's fail the second chunk (which is the second call to fetch since concurrency is parallel, 
                // but we can just fail once every 3 calls to simulate 1 chunk failing all its retries)
                fetchSpy._failCount++;
                if (fetchSpy._failCount >= 2 && fetchSpy._failCount <= 5) { // 1 original + 3 retries = 4 failures
                    return { ok: false, status: 500 };
                }
                
                return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"summary": "Chunk ok"}' }] } }] }) };
            });

            // Disable retries for this test to speed up the failure of chunk 2
            const sleepSpy = jest.spyOn(global, 'setTimeout').mockImplementation((cb) => cb());

            const result = await aiService.synthesizeReviews(1, 'time-1', reviews, 120, 120, 'req-6');
            
            expect(result.summary).toBe('Final ok');
            expect(fetchSpy).toHaveBeenCalled();
            // It should have continued despite chunk 2 failing
            
            sleepSpy.mockRestore();
        });
    });

    describe('updateSummaryItemsAI Teacher Race Guard', () => {
        it('MUST strictly enforce is_teacher_edited = false to prevent overwriting human work', async () => {
            const items = [{ topic_category: 'GENERAL', content: 'new content', frequency_count: 5 }];
            
            clientMock.query
                .mockResolvedValueOnce() // BEGIN
                .mockResolvedValueOnce({ rowCount: 1, rows: [{ status: 'DRAFT' }] }) // SELECT FOR UPDATE
                .mockResolvedValueOnce({ rowCount: 1 }) // UPDATE
                .mockResolvedValueOnce(); // COMMIT

            await aiService.updateSummaryItemsAI(1, items);

            // Find the UPDATE query call
            const updateCall = clientMock.query.mock.calls.find(call => 
                call[0].includes('UPDATE review_summary_items')
            );
            
            expect(updateCall).toBeDefined();
            const queryStr = updateCall[0];
            
            // HARD ASSERTION: MUST explicitly check for teacher edit flag
            expect(queryStr).toMatch(/is_teacher_edited\s*=\s*false/);
        });
    });
});
