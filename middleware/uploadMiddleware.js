
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');

const STORAGE_CONFIG = require('../config/storage.config');
const { getUploadDirectory } = require('../utils/storage.util');

// [MODIFIKASI] Canonical mapping dari ekstensi ke MIME type standar
const CANONICAL_MIME_MAP = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv'
};

// [MODIFIKASI] Tipe signature biner/MIME yang valid untuk masing-masing ekstensi
const ALLOWED_SIGNATURES = {
    '.pdf': ['application/pdf'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.png': ['image/png'],
    '.webp': ['image/webp'],
    '.doc': ['application/msword', 'application/x-cfb', 'application/octet-stream'],
    '.docx': [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream'
    ],
    '.xls': ['application/vnd.ms-excel', 'application/x-cfb', 'application/octet-stream'],
    '.xlsx': [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream'
    ],
    '.csv': ['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel']
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const { directory } = getUploadDirectory();
            cb(null, directory);
        } catch (error) {
            cb(error);
        }
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const filename = `${crypto.randomUUID()}${extension}`;

        cb(null, filename);
    }
});

// [MODIFIKASI] Validasi awal berdasarkan ekstensi dan MIME type request
const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    if (!STORAGE_CONFIG.ALLOWED_EXTENSIONS.includes(extension)) {
        return cb(new Error(`Format file "${extension}" tidak diperbolehkan. Ekstensi yang didukung: ${STORAGE_CONFIG.ALLOWED_EXTENSIONS.join(', ')}`));
    }

    const allowedForExt = ALLOWED_SIGNATURES[extension] || [];
    const isMimeAllowed =
        STORAGE_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype) ||
        allowedForExt.includes(file.mimetype) ||
        file.mimetype === 'application/octet-stream';

    if (!isMimeAllowed) {
        return cb(new Error(`Format konten dokumen (${file.mimetype}) tidak sesuai dengan ekstensi ${extension}`));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: STORAGE_CONFIG.MAX_FILE_SIZE,
        files: 1
    }
});

// Menghapus file apabila validasi gagal
const removeUploadedFile = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

// [MODIFIKASI] Middleware upload dengan penanganan batasan ukuran file yang ramah pengguna
const uploadEvidence = (req, res, next) => {
    upload.single(STORAGE_CONFIG.FIELD_NAME)(req, res, async (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                const maxMb = (STORAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
                return res.status(400).json({
                    status: 'error',
                    message: `Ukuran file melebihi batas maksimal (${maxMb} MB). Silakan sesuaikan atau kompres ukuran file sebelum mengunggah.`
                });
            }
            error.statusCode = 400;
            return next(error);
        }

        if (!req.file) {
            const validationError = new Error('Dokumen evidence wajib diunggah');
            validationError.statusCode = 400;
            return next(validationError);
        }

        try {
            // Dynamic import karena file-type versi 22 menggunakan ESM
            const { fileTypeFromFile } = await import('file-type');

            // Mendeteksi format berdasarkan isi file sebenarnya
            const detectedType = await fileTypeFromFile(req.file.path);
            const extension = path.extname(req.file.originalname).toLowerCase();
            const allowedSignatures = ALLOWED_SIGNATURES[extension] || [];

            let validSignature = false;

            if (detectedType) {
                validSignature =
                    allowedSignatures.includes(detectedType.mime) ||
                    STORAGE_CONFIG.ALLOWED_MIME_TYPES.includes(detectedType.mime);
            } else {
                // Untuk file teks seperti CSV yang tidak memiliki magic bytes biner
                if (extension === '.csv') {
                    validSignature = true;
                }
            }

            if (!validSignature) {
                await removeUploadedFile(req.file.path);

                const validationError = new Error(
                    `Isi dokumen tidak sesuai dengan format file ${extension} yang diperbolehkan`
                );

                validationError.statusCode = 400;
                return next(validationError);
            }

            // Gunakan canonical MIME type agar konsisten dan rapi di database
            req.file.detectedMimeType =
                CANONICAL_MIME_MAP[extension] ||
                detectedType?.mime ||
                req.file.mimetype;

            next();

        } catch (validationError) {
            try {
                await removeUploadedFile(req.file.path);
            } catch (cleanupError) {
                console.error('Gagal membersihkan file yang tidak valid:', cleanupError);
            }

            next(validationError);
        }
    });
};

module.exports = uploadEvidence;
