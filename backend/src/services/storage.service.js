import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import logger from '../utils/logger.util.js';
import { AppError } from '../utils/AppError.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const ensureBucket = async (bucketName) => {
    if (!supabase) return;
    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucket = buckets?.find(b => b.name === bucketName);
        if (!bucket) {
            logger.info(`Storage bucket '${bucketName}' not found. Attempting to create bucket...`);
            const { error } = await supabase.storage.createBucket(bucketName, { public: true });
            if (error) {
                logger.warn(`Auto-create bucket '${bucketName}' returned:`, error.message);
            }
        }
    } catch (err) {
        logger.warn(`Bucket check for '${bucketName}' exception:`, err.message);
    }
};

/**
 * Upload a file buffer to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File mime type
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadSubmissionFile = async (fileBuffer, originalName, mimeType) => {
    if (!supabase) {
        throw new AppError('Storage configuration is missing in .env (SUPABASE_URL and SUPABASE_SERVICE_KEY)', 500);
    }

    await ensureBucket('submissions');

    const fileExt = originalName.split('.').pop();
    const uniqueFileName = `submission_${crypto.randomUUID()}.${fileExt}`;

    try {
        const { data, error } = await supabase.storage
            .from('submissions')
            .upload(uniqueFileName, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            logger.error('Supabase storage upload error:', error);
            const detailMsg = error.message || 'Lỗi khi lưu file lên Cloud Storage';
            throw new AppError(detailMsg.includes('not found') ? 'Bucket "submissions" chưa được tạo trên Supabase Storage' : `Lỗi Cloud Storage: ${detailMsg}`, 500);
        }

        const { data: publicUrlData } = supabase.storage
            .from('submissions')
            .getPublicUrl(uniqueFileName);

        return publicUrlData.publicUrl + '?download=' + encodeURIComponent(originalName);
    } catch (error) {
        logger.error('Storage upload exception:', error);
        if (error instanceof AppError) throw error;
        throw new AppError('Không thể xử lý tiến trình nộp file', 500);
    }
};

/**
 * Upload a file buffer to Supabase Storage for assignments
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File mime type
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadAssignmentAttachment = async (fileBuffer, originalName, mimeType) => {
    if (!supabase) {
        throw new AppError('Storage configuration is missing in .env', 500);
    }

    await ensureBucket('assignments');

    const fileExt = originalName.split('.').pop();
    const uniqueFileName = `attachment_${crypto.randomUUID()}.${fileExt}`;

    try {
        const { data, error } = await supabase.storage
            .from('assignments')
            .upload(uniqueFileName, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            logger.error('Supabase assignment storage upload error:', error);
            const detailMsg = error.message || 'Lỗi khi lưu file đính kèm';
            throw new AppError(detailMsg.includes('not found') ? 'Bucket "assignments" chưa được tạo trên Supabase Storage' : `Lỗi Cloud Storage: ${detailMsg}`, 500);
        }

        const { data: publicUrlData } = supabase.storage
            .from('assignments')
            .getPublicUrl(uniqueFileName);

        return publicUrlData.publicUrl + '?download=' + encodeURIComponent(originalName);
    } catch (error) {
        logger.error('Assignment storage upload exception:', error);
        if (error instanceof AppError) throw error;
        throw new AppError('Không thể xử lý upload file đính kèm', 500);
    }
};

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

/**
 * Upload a file buffer to Supabase Storage for workspace groups
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File mime type
 * @param {string} groupId - The group ID for organizing files
 * @returns {Promise<string>} - The internal path of the uploaded file
 */
export const uploadWorkspaceFile = async (fileBuffer, originalName, mimeType, groupId) => {
    if (!supabase) {
        throw new AppError('Storage configuration is missing in .env', 500);
    }

    await ensureBucket('workspace');

    const fileExt = originalName.split('.').pop() || '';
    const baseName = originalName.slice(0, -(fileExt.length + 1));
    const safeName = slugify(baseName) || 'file';
    
    // Path: groups/{groupId}/{timestamp}_{safeFilename}.{ext}
    const uniqueFileName = `groups/${groupId}/${Date.now()}_${safeName}.${fileExt}`;

    try {
        const { data, error } = await supabase.storage
            .from('workspace')
            .upload(uniqueFileName, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            logger.error('Supabase workspace storage upload error:', error);
            const detailMsg = error.message || 'Lỗi khi lưu file nhóm';
            throw new AppError(detailMsg.includes('not found') ? 'Bucket "workspace" chưa được tạo trên Supabase Storage' : `Lỗi Cloud Storage: ${detailMsg}`, 500);
        }

        return uniqueFileName; // We store the internal path, not public URL
    } catch (error) {
        logger.error('Workspace storage upload exception:', error);
        if (error instanceof AppError) throw error;
        throw new AppError('Không thể xử lý upload file', 500);
    }
};

/**
 * Get a signed URL for a workspace file
 * @param {string} filePath - The internal path of the file
 * @param {string} originalName - Optional original filename for download
 * @returns {Promise<string>} - The signed URL
 */
export const getWorkspaceFileSignedUrl = async (filePath, originalName = '') => {
    if (!supabase) {
        throw new AppError('Storage configuration is missing in .env', 500);
    }

    try {
        const options = { expiresIn: 3600 }; // 1 hour
        if (originalName) {
            options.download = originalName;
        }

        const { data, error } = await supabase.storage
            .from('workspace')
            .createSignedUrl(filePath, 3600, options);

        if (error) {
            logger.error('Supabase get signed URL error:', error);
            throw new AppError('Lỗi khi tạo link tải file', 500);
        }

        return data.signedUrl;
    } catch (error) {
        logger.error('Get signed URL exception:', error);
        if (error instanceof AppError) throw error;
        throw new AppError('Không thể lấy link tải file', 500);
    }
};
