
const fs = require('fs');
const path = require('path');
const STORAGE_CONFIG = require('../config/storage.config');

// Membuat direktori jika belum tersedia
const ensureDirectory = (directoryPath) => {
    fs.mkdirSync(directoryPath, {
        recursive: true
    });
};

// Membuat direktori berdasarkan tahun dan bulan
const getUploadDirectory = (date = new Date()) => {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const directory = path.join(
        STORAGE_CONFIG.ROOT_PATH,
        year,
        month
    );

    ensureDirectory(directory);

    return {
        directory,
        relativeDirectory: path.posix.join(year, month)
    };
};

// Menghasilkan path relatif file
const getRelativePath = (year, month, filename) => {
    if (
        !/^\d{4}$/.test(String(year)) ||
        !/^(0[1-9]|1[0-2])$/.test(String(month)) ||
        typeof filename !== 'string' ||
        !filename ||
        path.basename(filename) !== filename ||
        filename.includes('..')
    ) {
        throw new Error('Informasi path dokumen tidak valid');
    }

    return path.posix.join(
        String(year),
        String(month),
        filename
    );
};

// Memastikan file hanya dapat diakses dari root storage
const resolveStoragePath = (relativePath) => {
    if (
        typeof relativePath !== 'string' ||
        !relativePath.trim() ||
        path.isAbsolute(relativePath) ||
        relativePath.includes('\0')
    ) {
        throw new Error('Path dokumen tidak valid');
    }

    const rootPath = path.resolve(STORAGE_CONFIG.ROOT_PATH);
    const filePath = path.resolve(rootPath, relativePath);

    const relative = path.relative(rootPath, filePath);

    if (
        !relative ||
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
    ) {
        throw new Error('Akses path dokumen ditolak');
    }

    return filePath;
};

module.exports = {
    ensureDirectory,
    getUploadDirectory,
    getRelativePath,
    resolveStoragePath
};
