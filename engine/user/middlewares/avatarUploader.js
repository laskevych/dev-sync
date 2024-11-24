import { v4 as uuidv4 } from 'uuid';
import * as path from "path";
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const multer = require('multer');
const profilePictureDir = path.join(__dirname, '../../../public/profile-pictures');

const fileFilter = (request, file, cb) => {
    const allowedTypes = new RegExp(/jpg|png|jpeg/);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (mimeType && extName) {
        return cb(null, true);
    } else {
        cb(new Error(`Allowed types: jpg, png, jpeg`));
    }
};

const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        cb(null, profilePictureDir);
    },
    filename: (request, file, cb) => {
        const uniqueFilename = uuidv4(undefined, undefined, undefined) + path.extname(file.originalname);
        cb(null, uniqueFilename);
    }
});

const upload = multer({
    fileFilter,
    storage,
    limits: { fileSize: 20136291 }
}).single('profilePicture');


const uploadMiddleware = (req, res, next) => {
    upload(req, res, (err) => {
        if (!req.file) {
            return res.status(400).json({ message: 'File not found' });
        }

        if (err) {
            return res.status(400).json({ message: err.message });
        }

        req.body.profilePicture = req.file.filename;
        next();
    });
};

export default uploadMiddleware;