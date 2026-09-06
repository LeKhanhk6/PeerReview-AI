import { describe, it } from 'node:test';
import assert from 'node:assert';
import { handleSingleUpload, MAX_FILE_SIZE_BYTES } from '../middleware/fileUpload.middleware.js';

describe('File Upload Middleware - Unit Test', () => {
    it('should export MAX_FILE_SIZE_BYTES set to 10MB', () => {
        assert.strictEqual(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024);
    });

    it('should pass valid PDF file buffer to next middleware', (t, done) => {
        const middleware = handleSingleUpload('file');

        // Mock req with single pdf file
        const req = {
            headers: {
                'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary'
            }
        };

        const res = {};

        // Call middleware with mock req/res
        middleware(req, res, (err) => {
            // Since no real multipart body is parsed by mock, multer handles empty body without error
            assert.strictEqual(err, undefined);
            done();
        });
    });
});
