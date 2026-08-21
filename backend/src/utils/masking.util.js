import crypto from 'crypto';

/**
 * Generates a stable anonymous ID from a UUID (e.g. A7F2BC)
 * Uses assignment_id for scoped hashing to prevent cross-assignment correlation
 */
export const generateAnonymousId = (submissionId, assignmentId) => {
    if (!submissionId) return '000000';
    const hashData = `${submissionId}_${assignmentId || ''}`;
    const hash = crypto.createHash('sha256').update(hashData).digest('hex');
    return hash.slice(0, 6).toUpperCase();
};

/**
 * Masks a submission entity to ensure double-blind peer review.
 * Removes all trace of group_id, class, and raw file URLs.
 */
export const maskSubmissionEntity = (submission, assignmentId) => {
    if (!submission) return null;
    
    const id = submission.submission_id || submission.id;
    const anonId = generateAnonymousId(id, assignmentId);
    
    return {
        publicId: anonId, // Explicitly hiding the raw internal ID
        title: `Anonymous Submission ${anonId}`,
        submittedAt: submission.created_at || submission.submitted_at,
        // Provide a proxy URL instead of raw S3/storage URL to prevent identity leak via filename
        // Using anonId in the URL prevents leaking the raw submission_id
        fileUrl: `/api/v1/submissions/${anonId}/download`
    };
};
