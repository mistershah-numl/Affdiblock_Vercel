import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export type StorageLocation = "id-cards" | "documents" | "licenses"

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
 */
export async function uploadFile(
  file: Buffer,
  originalFilename: string,
  contentType: string,
  location: StorageLocation,
): Promise<UploadResult> {
  // Create directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), "public", "uploads", location)
  await mkdir(uploadDir, { recursive: true })

  // Generate a unique filename
  const extension = path.extname(originalFilename)
  const filename = `${uuidv4()}${extension}`
  const filePath = path.join(uploadDir, filename)

  // Write the file
  await writeFile(filePath, file)

  // Return result
  const url = `/uploads/${location}/${filename}`
  return {
    url,
    filename,
    contentType,
    size: file.length,
  }
}
