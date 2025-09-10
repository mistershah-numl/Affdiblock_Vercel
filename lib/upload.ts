import { uploadFileToIPFS } from "./services/ipfs-service";

export type StorageLocation = "id-cards" | "documents" | "licenses" | "avatars";

// Map storage locations to environment variable names for Pinata folder IDs
const folderEnvVars: Record<StorageLocation, string> = {
  "id-cards": "NEXT_PUBLIC_PINATA_FOLDER_CNIC",
  documents: "NEXT_PUBLIC_PINATA_FOLDER_AFFIDAVITS",
  licenses: "NEXT_PUBLIC_PINATA_FOLDER_LICENSES",
  avatars: "NEXT_PUBLIC_PINATA_FOLDER_AVATARS",
};

export interface UploadResult {
  url: string;
  filename: string;
  contentType: string;
  size: number;
  ipfsHash: string;
}

/**
 * Uploads a file to Pinata (IPFS) in a specific folder with a custom filename
 * @param file The file buffer to upload
 * @param originalFilename Original filename
 * @param contentType MIME type
 * @param location The storage location/folder
 * @param idCardNumber Optional identifier for naming files (e.g., idCardNumber for id-cards, licenseNumber for licenses)
 * @returns Promise with the upload result
 * @throws Error if file validation fails, folder ID is missing, or upload operation encounters an issue
 */
export async function uploadFile(
  file: Buffer,
  originalFilename: string,
  contentType: string,
  location: StorageLocation,
  idCardNumber?: string
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
  if ((location === "id-cards" || location === "avatars" || location === "licenses") && !allowedImageTypes.includes(contentType)) {
    throw new Error(`Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed for ${location}`);
  }

  // Get folder ID from environment variables
  const folderId = process.env[folderEnvVars[location]];
  if (!folderId) {
    throw new Error(`Folder ID for ${location} is not configured in environment variables`);
  }

  // Determine filename
  let filename = originalFilename;
  if (location === "id-cards" && idCardNumber) {
    // For ID cards, use idCardNumber_front or idCardNumber_back
    const ext = originalFilename.toLowerCase().endsWith("_front") || originalFilename.includes("_front")
      ? "_front"
      : "_back";
    filename = `${idCardNumber}${ext}.${contentType.split("/")[1]}`;
  } else if (location === "licenses" && idCardNumber) {
    // For licenses, use idCardNumber (or licenseNumber) without _front/_back
    filename = `${idCardNumber}.${contentType.split("/")[1]}`;
  } else if (location === "documents" && idCardNumber) {
    // For documents (affidavits), use idCardNumber or a timestamp
    filename = `${idCardNumber || Date.now()}.${contentType.split("/")[1]}`;
  }

  // Create a File-like object for Pinata upload
  const fileObj = new File([file], filename, { type: contentType });

  // Upload to Pinata with folder metadata
  try {
    const formData = new FormData();
    formData.append("file", fileObj);
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: filename,
        folderId: folderId, // Use folder ID from environment variable
      })
    );

    const ipfsHash = await uploadFileToIPFS(fileObj);
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    return {
      url,
      filename,
      contentType,
      size: file.length,
      ipfsHash,
    };
  } catch (error: any) {
    console.error(`Error uploading file to Pinata for ${location}:`, {
      message: error.message,
      filename,
      folderId,
    });
    throw new Error(`Failed to upload file to Pinata: ${error.message}`);
  }
}

/**
 * Note: This implementation stores files on Pinata (IPFS) in specific folders using folder IDs from environment variables.
 * For production, ensure all folder IDs are correctly configured in .env.local.
 */