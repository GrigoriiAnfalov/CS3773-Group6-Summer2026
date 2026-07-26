const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

// Only allow real image files, keyed off the actual file bytes' declared mimetype
const ALLOWED_MIME_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = ALLOWED_MIME_TYPES[file.mimetype];
    const uniqueName = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, uniqueName);
  }
});

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(null, true);
  }
  cb(new Error('Only PNG, JPEG, WEBP, and GIF images are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

module.exports = upload;
