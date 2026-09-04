import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import logger from '../utils/logger.util.js';
import { AppError } from '../utils/AppError.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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
            throw new AppError('Lỗi khi lưu file lên Cloud Storage', 500);
        }

        const { data: publicUrlData } = supabase.storage
            .from('submissions')
            .getPublicUrl(uniqueFileName);

        return publicUrlData.publicUrl + '?download=' + encodeURIComponent(originalName);
    } catch (error) {
        logger.error('Storage upload exception:', error);
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
            throw new AppError('Lỗi khi lưu file đính kèm lên Cloud Storage', 500);
        }

        const { data: publicUrlData } = supabase.storage
            .from('assignments')
            .getPublicUrl(uniqueFileName);

        return publicUrlData.publicUrl + '?download=' + encodeURIComponent(originalName);
    } catch (error) {
        logger.error('Assignment storage upload exception:', error);
        throw new AppError('Không thể xử lý upload file đính kèm', 500);
    }
};
