import { uploadFileToIPFS } from "./services/ipfs-service";

export type StorageLocation = "id-cards" | "documents" | "licenses" | "avatars";

export interface UploadResult {
  url: string;
  filename: string;
  contentType: string;
  size: number;
  ipfsHash: string;
}

/**
 * Uploads a file to Pinata (IPFS)
 * @param file The file buffer to upload
 * @param originalFilename Original filename
 * @param contentType MIME type
 * @param location The storage location/folder
 * @returns Promise with the upload result
 * @throws Error if file validation fails or upload operation encounters an issue
 */
export async function uploadFile(
  file: Buffer,
  originalFilename: string,
  contentType: string,
  location: StorageLocation
): Promise<UploadResult> {
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.length > maxSize) {
    throw new Error(`File size exceeds maximum limit of 5MB`);
  }

  // Validate content type for specific locations
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (location === "documents" && !allowedTypes.includes(contentType)) {
    throw new Error(`Invalid file type. Only JPEG, PNG, and PDF are allowed for ${location}`);
  }
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if ((location === "avatars" || location === "id-cards") && !allowedImageTypes.includes(contentType)) {
    throw new Error(`Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed for ${location}`);
  }

  // Create a File-like object for Pinata upload
  const fileObj = new File([file], originalFilename, { type: contentType });

  // Upload to Pinata
  try {
    const ipfsHash = await uploadFileToIPFS(fileObj);
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return {
      url,
      filename: originalFilename,
      contentType,
      size: file.length,
      ipfsHash,
    };
  } catch (error: any) {
    console.error(`Error uploading file to Pinata:`, error);
    throw new Error(`Failed to upload file to Pinata: ${error.message}`);
  }
}
/**
 * Note: This implementation stores files locally in the public/uploads directory.
 * For production, consider using a cloud storage solution like AWS S3 to handle
 * file uploads for better scalability and persistence. Example configuration:
 *
 * import AWS from "aws-sdk";
 * const s3 = new AWS.S3({
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 *   region: process.env.AWS_REGION,
 * });
 *
 * export async function uploadFile(file: Buffer, originalFilename: string, contentType: string, location: StorageLocation) {
 *   const params = {
 *     Bucket: process.env.AWS_S3_BUCKET_NAME,
 *     Key: `${location}/${Date.now()}-${originalFilename}`,
 *     Body: file,
 *     ContentType: contentType,
 *     ACL: "public-read",
 *   };
 *   const { Location } = await s3.upload(params).promise();
 *   return { url: Location, filename: originalFilename, contentType, size: file.length };
 * }
 */