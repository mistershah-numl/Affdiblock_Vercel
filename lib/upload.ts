import { uploadFileToIPFS } from "./services/ipfs-service"

export type StorageLocation = "id-cards" | "documents" | "licenses" | "avatars"

const folderEnvVars: Record<StorageLocation, string> = {
  "id-cards": "NEXT_PUBLIC_PINATA_FOLDER_CNIC",
  documents: "NEXT_PUBLIC_PINATA_FOLDER_AFFIDAVITS",
  licenses: "NEXT_PUBLIC_PINATA_FOLDER_LICENSES",
  avatars: "NEXT_PUBLIC_PINATA_FOLDER_AVATARS",
}

export interface UploadResult {
  url: string
  filename: string
  contentType: string
  size: number
  ipfsHash: string
}

export async function uploadFile(
  file: Buffer,
  originalFilename: string,
  contentType: string,
  location: StorageLocation,
  idCardNumber?: string
): Promise<UploadResult> {
  // Set size limits: 10MB for licenses, 5MB for others to preserve registration
  const maxSize = location === "licenses" ? 10 * 1024 * 1024 : 5 * 1024 * 1024
  if (file.length > maxSize) {
    throw new Error(`File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`)
  }

  // Define allowed types
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  const allowedDocumentTypes = ["image/jpeg", "image/png", "application/pdf"]

  // Validate file types based on location
  if (location === "documents" && !allowedDocumentTypes.includes(contentType)) {
    throw new Error(`Invalid file type. Only JPEG, PNG, and PDF are allowed for ${location}`)
  }
  if ((location === "id-cards" || location === "avatars") && !allowedImageTypes.includes(contentType)) {
    throw new Error(`Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed for ${location}`)
  }
  if (location === "licenses" && !allowedTypes.includes(contentType)) {
    throw new Error(`Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed for ${location}`)
  }

  const folderId = process.env[folderEnvVars[location]]
  if (!folderId) {
    throw new Error(`Folder ID for ${location} is not configured in environment variables`)
  }

  let filename = originalFilename
  if (location === "id-cards" && idCardNumber) {
    const ext = originalFilename.toLowerCase().includes("_front") ? "_front" : "_back"
    filename = `${idCardNumber}${ext}.${contentType.split("/")[1]}`
  } else if (location === "licenses" && idCardNumber) {
    const randomNo = Math.floor(1000 + Math.random() * 9000)
    filename = `LICENSE_${idCardNumber}_${randomNo}.${contentType.split("/")[1]}`
  } else if (location === "documents" && idCardNumber) {
    filename = `${idCardNumber || Date.now()}.${contentType.split("/")[1]}`
  }

  const fileObj = new File([file], filename, { type: contentType })

  try {
    const formData = new FormData()
    formData.append("file", fileObj)
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: filename,
        folderId: folderId,
      })
    )

    const ipfsHash = await uploadFileToIPFS(fileObj)
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`

    return {
      url,
      filename,
      contentType,
      size: file.length,
      ipfsHash,
    }
  } catch (error: any) {
    console.error(`Error uploading file to Pinata for ${location}:`, {
      message: error.message,
      filename,
      folderId,
    })
    throw new Error(`Failed to upload file to Pinata: ${error.message}`)
  }
}


//initially 109 with registration later 88 etc working , 