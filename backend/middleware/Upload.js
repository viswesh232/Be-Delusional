const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use an absolute path so uploads work regardless of the process working directory.
// Render deployments need a persistent disk mounted at this location to retain files
// across restarts and deployments.
const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extension);
    },
});

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const fileFilter = (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.has(extension) && allowedMimeTypes.has(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error('Only JPG, PNG, GIF and WEBP image files are allowed'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 20 },
});

module.exports = upload;
