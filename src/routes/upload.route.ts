import { Router } from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { RouteError } from '../common/routeerror.js';
import HttpStatusCodes from '../common/httpstatuscode.js';
const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

router.post("/", upload.single('file'), async (req, res, next) => {
    if (!req.file) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND,"No file was uploaded");
    }

    const uploadResult = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            { resource_type: "auto", folder: "uploads", timeout: 600000 },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    reject(error);
                } else {
                    resolve(result!);
                }
            }
        );

        uploadStream.end(req.file?.buffer);
    });

    res.status(HttpStatusCodes.OK).json({ url: uploadResult.secure_url });
});

export default router;
