const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || 'uploads/menu-images';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
    },
    fileFilter: fileFilter
});

// Process image middleware
const processImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const filename = `menu-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const filepath = path.join(uploadDir, filename);

        // Process image with sharp
        await sharp(req.file.buffer)
            .resize(800, 600, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(filepath);

        req.file.filename = filename;
        req.file.path = filepath;
        req.file.url = `/uploads/menu-images/${filename}`;

        next();
    } catch (error) {
        next(error);
    }
};

// Multiple images upload
const uploadMultiple = upload.array('images', 5);
const processMultipleImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next();
    }

    try {
        const processedFiles = [];

        for (const file of req.files) {
            const filename = `menu-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const filepath = path.join(uploadDir, filename);

            await sharp(file.buffer)
                .resize(800, 600, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 80 })
                .toFile(filepath);

            processedFiles.push({
                ...file,
                filename,
                path: filepath,
                url: `/uploads/menu-images/${filename}`
            });
        }

        req.files = processedFiles;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    upload: upload.single('image'),
    uploadMultiple,
    processImage,
    processMultipleImages
};