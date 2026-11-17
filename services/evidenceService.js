const fs = require('fs/promises');
const path = require('path');

const STORAGE_CONFIG = require('../config/storage.config');
const { resolveStoragePath } = require('../utils/storage.util');

// Menyimpan informasi file yang sudah diunggah oleh Multer.
exports.saveEvidenceFile = async (file) => {
  if (!file || !file.path || !file.filename) {
    throw new Error('File evidence tidak valid.');
  }

  const rootPath = path.resolve(STORAGE_CONFIG.ROOT_PATH);
  const absoluteFilePath = path.resolve(file.path);

  const relativePath = path.relative(rootPath, absoluteFilePath);

  // Pastikan file berada di dalam direktori storage.
  if (
    !relativePath ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error('Lokasi file berada di luar direktori storage.');
  }

  return {
    stored_name: file.filename,
    file_path: relativePath.split(path.sep).join('/')
  };
};

// Menghapus file fisik.
exports.deleteEvidenceFile = async (filePath) => {
  if (!filePath) return;

  const absolutePath = resolveStoragePath(filePath);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

// Memeriksa keberadaan file.
exports.checkEvidenceFile = async (filePath) => {
  if (!filePath) return false;

  const absolutePath = resolveStoragePath(filePath);

  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
};