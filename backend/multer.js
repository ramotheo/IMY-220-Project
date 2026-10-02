// Motheo Morena u24666981

import multer from "multer";
import { randomUUID } from "crypto";
import { extname } from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
            return;
        }

        const error = new Error("Only image files can be uploaded.");
        error.code = "INVALID_FILE_TYPE";
        cb(error);
    },
});

export default upload;