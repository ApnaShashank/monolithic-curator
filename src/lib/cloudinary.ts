import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: string | Buffer): Promise<string | null> {
  try {
    const options = {
      folder: 'monolithic-curator',
      resource_type: 'auto' as const,
    };

    const result = await cloudinary.uploader.upload(file as any, options);
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
}

export default cloudinary;
