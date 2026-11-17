
const path = require('path');

const MAX_FILE_SIZE = Number(
    process.env.EVIDENCE_MAX_FILE_SIZE || 10 * 1024 * 1024
);

if (!Number.isFinite(MAX_FILE_SIZE) || MAX_FILE_SIZE <= 0) {
    throw new Error('EVIDENCE_MAX_FILE_SIZE harus berupa angka positif');
}

const STORAGE_CONFIG = {
    ROOT_PATH: path.resolve(
        process.env.EVIDENCE_STORAGE_PATH ||
        path.join(__dirname, '..', 'storage', 'evidence')
    ),

    MAX_FILE_SIZE,

    ALLOWED_MIME_TYPES: [
        'application/pdf',
        'image/jpeg',
        'image/png'
    ],

    ALLOWED_EXTENSIONS: [
        '.pdf',
        '.jpg',
        '.jpeg',
        '.png'
    ],

    FIELD_NAME: 'file'
};

module.exports = STORAGE_CONFIG;
