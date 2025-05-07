import fetch from "node-fetch"

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  throw new Error("Pinata API credentials are not set in environment variables")
}

const auth = `Basic ${Buffer.from(`${PINATA_API_KEY}:${PINATA_API_SECRET}`).toString("base64")}`

export async function uploadToIPFS(fileContent: string | Blob, filename: string) {
  let file
  if (typeof fileContent === "string") {
    const response = await fetch(fileContent)
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status} - ${response.statusText}`)
    const arrayBuffer = await response.arrayBuffer()
    file = new Blob([arrayBuffer], { type: response.headers.get("content-type") || "application/octet-stream" })
  } else {
    file = fileContent
  }

  const formData = new FormData()
  formData.append("file", file, filename)

  console.log("Uploading file to Pinata:", { filename, size: file.size, type: file.type })
  try {
    const uploadResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: auth,
      },
      body: formData,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      throw new Error(`Pinata API error: ${uploadResponse.status} - ${errorText}`)
    }

    const result = await uploadResponse.json()
    console.log("Upload successful, CID:", result.IpfsHash)
    return result.IpfsHash
  } catch (error: any) {
    console.error("IPFS upload error:", {
      message: error.message,
      status: error.status,
      name: error.name,
      stack: error.stack,
    })
    throw new Error(`IPFS upload failed: ${error.message || "Unknown error"}`)
  }
}