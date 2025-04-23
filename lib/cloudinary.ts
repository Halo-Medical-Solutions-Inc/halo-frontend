import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file to Cloudinary
 * @param file The file to upload
 * @param resourceType The type of resource ('image', 'video', 'auto')
 * @returns Promise with the upload result
 */
export const uploadToCloudinary = async (file: File, resourceType: "image" | "video" | "auto" = "auto") => {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);

    // Create the upload string by removing the data URL prefix
    const uploadStr = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // Upload to cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:${file.type};base64,${uploadStr}`,
        {
          resource_type: resourceType,
          filename_override: file.name,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    return result;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
};

/**
 * Converts a file to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
