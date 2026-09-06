import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/msword', // doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
    'application/vnd.ms-powerpoint', // ppt
    'text/plain', // txt
    'application/zip', // zip
    'image/png', // png
    'image/jpeg' // jpg/jpeg
];

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'zip', 'png', 'jpeg', 'jpg'];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Limit

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ext && ALLOWED_EXTENSIONS.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('INVALID_FILE_TYPE'));
        }
    }
});

export const handleSingleUpload = (fieldName = 'file') => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new AppError('File vượt quá giới hạn 10MB', 413, 'FILE_TOO_LARGE'));
                }
                return next(new AppError(err.message, 400, 'FILE_UPLOAD_ERROR'));
            } else if (err) {
                if (err.message === 'INVALID_FILE_TYPE') {
                    return next(new AppError('Định dạng file không được hỗ trợ', 400, 'INVALID_FILE_TYPE'));
                }
                return next(err);
            }
            next();
        });
    };
};

export const handleSubmissionUpload = handleSingleUpload('file');
export const handleWorkspaceUpload = handleSingleUpload('file');
