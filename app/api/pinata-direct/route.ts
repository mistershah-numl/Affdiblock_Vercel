// app/api/pinata-direct/route.ts
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId") || "b5c1a9e8-7cca-4f64-9570-86c49926d031";
    const method = searchParams.get("method") || "1";

    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

    if (!pinataApiKey || !pinataApiSecret) {
      return NextResponse.json({ error: "API credentials missing" }, { status: 500 });
    }

    const headers = {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataApiSecret,
    };

    let response;
    let methodDescription = "";

    switch (method) {
      case "1":
        methodDescription = "Direct group files endpoint";
        response = await axios.get(`https://api.pinata.cloud/groups/${groupId}/files`, {
          headers,
          params: { limit: 50 }
        });
        break;

      case "2":
        methodDescription = "Data API with groupId metadata filter";
        response = await axios.get(`https://api.pinata.cloud/data/pinList`, {
          headers,
          params: {
            'metadata[keyvalues][groupId]': groupId,
            status: 'pinned',
            pageLimit: 50,
          }
        });
        break;

      case "3":
        methodDescription = "V3 API with group_id parameter";
        response = await axios.get(`https://api.pinata.cloud/v3/files`, {
          headers: { ...headers, "Content-Type": "application/json" },
          params: {
            group_id: groupId,
            limit: 50
          }
        });
        break;

      case "4":
        methodDescription = "List all files (no filter)";
        response = await axios.get(`https://api.pinata.cloud/data/pinList`, {
          headers,
          params: {
            status: 'pinned',
            pageLimit: 10,
          }
        });
        break;

      case "5":
        methodDescription = "Get group info";
        response = await axios.get(`https://api.pinata.cloud/groups/${groupId}`, {
          headers
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid method. Use 1-7" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      method: method,
      methodDescription,
      groupId,
      status: response.status,
      data: response.data,
      headers: response.headers,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    }, { status: 500 });
  }
}

// POST method to test file upload directly
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId") || "b5c1a9e8-7cca-4f64-9570-86c49926d031";
    
    const pinataApiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const pinataApiSecret = process.env.NEXT_PUBLIC_PINATA_API_SECRET;

    if (!pinataApiKey || !pinataApiSecret) {
      return NextResponse.json({ error: "API credentials missing" }, { status: 500 });
    }

    // Create test file
    const testContent = JSON.stringify({
      test: true,
      groupId: groupId,
      timestamp: new Date().toISOString(),
      purpose: "Direct API test for CNIC group"
    });

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append("file", Buffer.from(testContent), {
      filename: `direct_test_${Date.now()}.json`,
    });

    // Method 1: Try with groupId in pinataOptions
    formData.append("pinataMetadata", JSON.stringify({
      name: `Direct API test for group ${groupId}`,
      keyvalues: {
        groupId: groupId,
        test: "direct_api",
        uploadMethod: "pinataOptions"
      }
    }));

    formData.append("pinataOptions", JSON.stringify({
      cidVersion: 1,
      groupId: groupId,
    }));

    const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
      maxBodyLength: Infinity,
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataApiSecret,
        ...formData.getHeaders(),
      },
    });

    return NextResponse.json({
      success: true,
      method: "upload_test",
      groupId,
      uploadResponse: response.data,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
      message: "File uploaded - check if it appears in your CNIC group"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    }, { status: 500 });
  }
}