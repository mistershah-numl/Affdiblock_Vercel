import axios from "axios";
import FormData from "form-data";
import path from "path";

export const uploadFileToIPFSOnServer = async (filePath: string): Promise<string> => {
  try {
    const { readFile } = await import("fs/promises");
    // Resolve the file path relative to the project root
    const absolutePath = path.join(process.cwd(), "public", filePath);
    const file = await readFile(absolutePath);

    const formData = new FormData();
    formData.append("file", file, { filename: path.basename(filePath) });

    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

    if (!pinataApiKey || !pinataApiSecret) {
      throw new Error("Pinata API credentials are missing");
    }

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: Infinity,
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataApiSecret,
        ...formData.getHeaders(),
      },
    });

    if (response.data && response.data.IpfsHash) {
      return response.data.IpfsHash;
    } else {
      throw new Error("Failed to upload file to IPFS: No IPFS hash returned");
    }
  } catch (error: any) {
    console.error("Error uploading file to IPFS on server:", error.message);
    throw new Error(`Failed to upload file to IPFS: ${error.message}`);
  }
};

export const uploadFileToIPFS = async (file: File, metadata?: { name: string; folderId: string }): Promise<string> => {
  try {
    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    const formData = new FormData();
    formData.append("file", buffer, { filename: file.name });
    if (metadata) {
      formData.append("pinataMetadata", JSON.stringify(metadata));
    }

    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

    if (!pinataApiKey || !pinataApiSecret) {
      throw new Error("Pinata API credentials are missing");
    }

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: Infinity,
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataApiSecret,
        ...formData.getHeaders(),
      },
    });

    if (response.data && response.data.IpfsHash) {
      return response.data.IpfsHash;
    } else {
      throw new Error("Failed to upload file to IPFS: No IPFS hash returned");
    }
  } catch (error: any) {
    console.error("Error uploading file to IPFS:", error.message);
    throw new Error(`Failed to upload file to IPFS: ${error.message}`);
  }
};

export const uploadJSONToIPFS = async (jsonData: object, name: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", Buffer.from(JSON.stringify(jsonData)), name);

    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

    if (!pinataApiKey || !pinataApiSecret) {
      throw new Error("Pinata API credentials are missing");
    }

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: Infinity,
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataApiSecret,
        ...formData.getHeaders(),
      },
    });

    if (response.data && response.data.IpfsHash) {
      return response.data.IpfsHash;
    } else {
      throw new Error("Failed to upload JSON to IPFS: No IPFS hash returned");
    }
  } catch (error: any) {
    console.error("Error uploading JSON to IPFS:", error.message);
    throw new Error(`Failed to upload JSON to IPFS: ${error.message}`);
  }
};