import { jest } from '@jest/globals';
import { submitSchema } from '../../src/routes/submissions.routes.js';

describe('submissions.routes - submitSchema', () => {
    it('should validate assignmentId parameter format', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const result = submitSchema.params.safeParse({ assignmentId: validUuid });
        expect(result.success).toBe(true);
    });

    it('should fail validation for invalid assignmentId parameter', () => {
        const invalidUuid = 'not-a-uuid';
        const result = submitSchema.params.safeParse({ assignmentId: invalidUuid });
        expect(result.success).toBe(false);
    });
});
