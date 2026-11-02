import { v2 as cloudinary } from "cloudinary";
import type { IconStorage } from "./types";

function configure() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env vars are missing (CLOUDINARY_CLOUD_NAME, _API_KEY, _API_SECRET)");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export const cloudinaryStorage: IconStorage = {
  async uploadSvg(svg, publicId) {
    configure();
    const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: "image",
      overwrite: false,
    });
    return { url: result.secure_url, publicId: result.public_id };
  },

  async deleteAsset(publicId) {
    configure();
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  },
};