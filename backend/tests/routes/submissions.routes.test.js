import { jest } from '@jest/globals';
import { z } from 'zod';
import { submitSchema } from '../../src/routes/submissions.routes.js';

describe('submissions.routes - submitSchema', () => {
    it('should pass validation for whitelisted domains', () => {
        const validUrls = [
            'https://s3.amazonaws.com/my-bucket/file.pdf',
            'https://my-app.firebaseapp.com/file.zip',
            'https://storage.googleapis.com/bucket/docs.docx'
        ];

        validUrls.forEach(url => {
            const result = submitSchema.body.safeParse({ file_url: url });
            expect(result.success).toBe(true);
        });
    });

    it('should fail validation for non-whitelisted domains', () => {
        const invalidUrls = [
            'https://malicious.com/file.pdf',
            'http://localhost:3000/test.pdf',
            'https://github.com/hacker/repo/file.zip'
        ];

        invalidUrls.forEach(url => {
            const result = submitSchema.body.safeParse({ file_url: url });
            expect(result.success).toBe(false);
        });
    });

    it('should fail if file_url is not a valid URL format', () => {
        const result = submitSchema.body.safeParse({ file_url: 'not-a-url' });
        if (result.success) {
            console.error("UNEXPECTED SUCCESS:", result.data);
        }
        expect(result.success).toBe(false);
    });
});
