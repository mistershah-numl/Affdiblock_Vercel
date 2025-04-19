import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export type StorageLocation = "id-cards" | "documents" | "licenses" | "avatars"

export interface UploadResult {
  url: string
  filename: string
  contentType: string
  size: number
}

/**
 * Uploads a file to local storage
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
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.length > maxSize) {
    throw new Error(`File size exceeds maximum limit of 5MB`)
  }

  // Validate content type for specific locations
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  if (location === "avatars" || location === "id-cards") {
    if (!allowedImageTypes.includes(contentType)) {
      throw new Error(`Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed for ${location}`)
    }
  }

  // Create directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), "public", "uploads", location)
  try {
    await mkdir(uploadDir, { recursive: true })
  } catch (error) {
    console.error(`Error creating directory ${uploadDir}:`, error)
    throw new Error("Failed to create upload directory")
  }

  // Generate a unique filename
  const extension = path.extname(originalFilename) || ".bin"
  const filename = `${uuidv4()}${extension}`
  const filePath = path.join(uploadDir, filename)

  // Write the file
  try {
    await writeFile(filePath, file)
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error)
    throw new Error("Failed to upload file")
  }

  // Return result
  const url = `/uploads/${location}/${filename}`
  return {
    url,
    filename,
    contentType,
    size: file.length,
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