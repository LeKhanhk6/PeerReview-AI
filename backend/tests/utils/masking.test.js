import { jest } from '@jest/globals';
import { generateAnonymousId, maskSubmissionEntity, sanitizeForLog } from '../../src/utils/masking.util.js';

describe('masking.util', () => {
    describe('generateAnonymousId', () => {
        it('should return a stable 6-character uppercase hash for a given submissionId and assignmentId', () => {
            const submissionId = 'user-sub-123';
            const assignmentId = 'assign-456';
            
            const hash1 = generateAnonymousId(submissionId, assignmentId);
            const hash2 = generateAnonymousId(submissionId, assignmentId);
            
            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(6);
            expect(hash1).toMatch(/^[0-9A-Z]{6}$/);
        });

        it('should generate different hashes for different assignmentIds even with same submissionId', () => {
            const submissionId = 'user-sub-123';
            
            const hash1 = generateAnonymousId(submissionId, 'assign-1');
            const hash2 = generateAnonymousId(submissionId, 'assign-2');
            
            expect(hash1).not.toBe(hash2);
        });

        it('should handle missing assignmentId gracefully', () => {
            const hash = generateAnonymousId('sub-123', null);
            expect(hash).toHaveLength(6);
        });

        it('should return "000000" if no submissionId provided', () => {
            expect(generateAnonymousId(null, 'assign-1')).toBe('000000');
        });
    });

    describe('maskSubmissionEntity', () => {
        it('should replace raw id with a publicId and hide PII fields', () => {
            const mockSubmission = {
                id: 'sub-uuid-001',
                created_at: '2026-01-01',
                file_url: 'https://s3.amazonaws.com/bucket/student_nguyen_van_a.pdf',
                group_id: 'group-uuid-999'
            };

            const assignmentId = 'assign-uuid-111';
            
            const masked = maskSubmissionEntity(mockSubmission, assignmentId);
            
            expect(masked).toBeDefined();
            expect(masked.publicId).toBeDefined();
            expect(masked.publicId).toHaveLength(6);
            expect(masked.title).toBe(`Anonymous Submission ${masked.publicId}`);
            expect(masked.fileUrl).toBe(`/api/v1/submissions/${masked.publicId}/download`);
            expect(masked.submittedAt).toBe(mockSubmission.created_at);
            
            // Explicitly assert that raw IDs and PII are NOT present
            expect(masked.id).toBeUndefined();
            expect(masked.group_id).toBeUndefined();
            expect(masked.file_url).toBeUndefined(); // no raw s3 url leaked
        });

        it('should return null if submission is null', () => {
            expect(maskSubmissionEntity(null, 'assign-1')).toBeNull();
        });
    });

    describe('sanitizeForLog', () => {
        it('should strip out sensitive fields and keep whitelisted safe fields', () => {
            const payload = {
                id: 'task-1',
                title: 'Review Task',
                status: 'PENDING',
                email: 'secret@gmail.com', // sensitive
                password: 'password123',   // sensitive
                token: 'jwt.token.abc'     // sensitive
            };

            const sanitized = sanitizeForLog(payload);

            expect(sanitized.id).toBe('task-1');
            expect(sanitized.title).toBe('Review Task');
            expect(sanitized.status).toBe('PENDING');
            
            // Sensitive fields must be removed
            expect(sanitized.email).toBeUndefined();
            expect(sanitized.password).toBeUndefined();
            expect(sanitized.token).toBeUndefined();
        });

        it('should return null if data is null', () => {
            expect(sanitizeForLog(null)).toBeNull();
        });
    });
});
