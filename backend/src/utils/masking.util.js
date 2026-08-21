import crypto from 'crypto';

/**
 * Generates a stable anonymous ID from a UUID (e.g. A7F2)
 */
export const generateAnonymousId = (id) => {
    if (!id) return '0000';
    const hash = crypto.createHash('sha256').update(String(id)).digest('hex');
    return hash.slice(0, 4).toUpperCase();
};

/**
 * Masks a submission entity to ensure double-blind peer review.
 * Removes all trace of group_id, class, and raw file URLs.
 */
export const maskSubmissionEntity = (submission) => {
    if (!submission) return null;
    
    const id = submission.submission_id || submission.id;
    const anonId = generateAnonymousId(id);
    
    return {
        id: id,
        title: `Anonymous Submission ${anonId}`,
        submittedAt: submission.created_at || submission.submitted_at,
        // Provide a proxy URL instead of raw S3/storage URL to prevent identity leak via filename
        fileUrl: `/api/v1/submissions/${id}/download`,
        versionNumber: submission.version_number
    };
};
