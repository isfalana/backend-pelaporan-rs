
const path = require('path');

// [MODIFIKASI] Batas ukuran file evidence default 5 MB (5 * 1024 * 1024 bytes)
const MAX_FILE_SIZE = Number(
    process.env.EVIDENCE_MAX_FILE_SIZE || 5 * 1024 * 1024
);

if (!Number.isFinite(MAX_FILE_SIZE) || MAX_FILE_SIZE <= 0) {
    throw new Error('EVIDENCE_MAX_FILE_SIZE harus berupa angka positif');
}

// [MODIFIKASI] Menambahkan dukungan lengkap untuk dokumen PDF, DOC, DOCX, XLS, XLSX, CSV, dan format gambar
const STORAGE_CONFIG = {
    ROOT_PATH: path.resolve(
        process.env.EVIDENCE_STORAGE_PATH ||
        path.join(__dirname, '..', 'storage', 'evidence')
    ),

    MAX_FILE_SIZE,

    ALLOWED_MIME_TYPES: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-cfb',
        'application/octet-stream'
    ],

    ALLOWED_EXTENSIONS: [
        '.pdf',
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
        '.csv'
    ],

    FIELD_NAME: 'file'
};

module.exports = STORAGE_CONFIG;
