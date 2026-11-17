
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');

const STORAGE_CONFIG = require('../config/storage.config');
const { getUploadDirectory } = require('../utils/storage.util');

const MIME_EXTENSION_MAP = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png'
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

// Validasi awal berdasarkan ekstensi dan MIME type request
const fileFilter = (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const expectedMime = MIME_EXTENSION_MAP[extension];

    if (
        !expectedMime ||
        !STORAGE_CONFIG.ALLOWED_EXTENSIONS.includes(extension) ||
        !STORAGE_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype) || 
        file.mimetype !== expectedMime
    ) {
        return cb(new Error('Format dokumen tidak diperbolehkan'));
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

// Middleware upload dengan validasi signature file
const uploadEvidence = (req, res, next) => {
    upload.single(STORAGE_CONFIG.FIELD_NAME)(req, res, async (error) => {
        if (error) {
            error.statusCode = error instanceof multer.MulterError ? 400 : 400;
            return next(error);
        }

        if (!req.file) {
            const validationError = new Error('Dokumen wajib diunggah');
            validationError.statusCode = 400;
            return next(validationError);
        }

        try {
            // Dynamic import karena file-type versi 22 menggunakan ESM
            const { fileTypeFromFile } = await import('file-type');

            // Mendeteksi format berdasarkan isi file sebenarnya
            const detectedType = await fileTypeFromFile(req.file.path);
            const extension = path.extname(req.file.originalname).toLowerCase();
            const expectedMime = MIME_EXTENSION_MAP[extension];

            const validSignature =
                detectedType &&
                STORAGE_CONFIG.ALLOWED_MIME_TYPES.includes(detectedType.mime) &&
                detectedType.mime === expectedMime;

            if (!validSignature) {
                await removeUploadedFile(req.file.path);

                const validationError = new Error(
                    'Isi dokumen tidak sesuai dengan format yang diperbolehkan'
                );

                validationError.statusCode = 400;
                return next(validationError);
            }

            // Gunakan MIME hasil deteksi, bukan MIME dari request
            req.file.detectedMimeType = detectedType.mime;

            next();

        } catch (validationError) {
            try {
                await removeUploadedFile(req.file.path);
            } catch (cleanupError) {
                console.error('Gagal menghapus file tidak valid:', cleanupError);
            }

            next(validationError);
        }
    });
};

module.exports = uploadEvidence;
