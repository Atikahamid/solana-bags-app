// File: server/src/utils/cloudinary.ts

import { Readable } from 'stream';
import cloudinary from 'cloudinary';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  throw new Error(
    'Missing Cloudinary configuration. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment.',
  );
}

cloudinary.v2.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Uploads a video buffer to Cloudinary and returns the hosted video URL.
 *
 * @param buffer - Raw file contents
 * @param publicId - Desired public ID (name) for the uploaded asset
 * @param folder - Optional folder path inside Cloudinary (e.g., "videos/")
 */
export async function uploadFileToCloudinary(
  buffer: Buffer,
  publicId: string,
  folder?: string,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        resource_type: 'video',
        public_id: publicId,
        folder,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result || !result.secure_url) {
          return reject(new Error('Cloudinary upload returned missing URL'));
        }

        resolve(result.secure_url);
      },
    );

    bufferToStream(buffer).pipe(uploadStream);
  });
}
