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
    
    let safeFileUrl = null;
    if (submission.file_url) {
        try {
            // Strip the ?download=... query parameter from the Supabase URL
            // This ensures the original filename is not leaked to the reviewer
            const urlObj = new URL(submission.file_url);
            urlObj.search = '';
            safeFileUrl = urlObj.toString();
        } catch (e) {
            // Fallback for invalid URLs or legacy mock data
            safeFileUrl = submission.file_url.split('?')[0];
        }
    }

    return {
        publicId: anonId, // Explicitly hiding the raw internal ID
        title: `Anonymous Submission ${anonId}`,
        submittedAt: submission.created_at || submission.submitted_at,
        fileUrl: safeFileUrl
    };
};

/**
 * Strips sensitive fields (emails, tokens, urls, passwords) before logging.
 * Whitelists known safe fields.
 */
export const sanitizeForLog = (data) => {
    if (!data) return data;
    const sanitized = { ...data };
    
    // Whitelist approach: only pick known safe fields for tasks and standard entities
    const safeFields = ['id', 'group_id', 'title', 'status', 'assignee_id', 'created_at', 'completed_at', 'message'];
    
    for (const key of Object.keys(sanitized)) {
        if (!safeFields.includes(key)) {
            delete sanitized[key];
        }
    }
    
    return sanitized;
};
