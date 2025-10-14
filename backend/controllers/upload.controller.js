const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const imagesDir = path.join(uploadsRoot, 'images');

if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot);
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${Date.now()}_${base}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported file type'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

exports.uploadImageMiddleware = upload.single('image');

exports.handleUploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const publicUrl = `/uploads/images/${req.file.filename}`;
    res.json({ url: publicUrl, filename: req.file.filename });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};


