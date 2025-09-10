import { NextRequest, NextResponse } from "next/server";
import { uploadFileToIPFS } from "@/lib/services/ipfs-service";
import fetch from "node-fetch";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;
    const groupId = (formData.get("groupId") as string) || process.env.NEXT_PUBLIC_PINATA_FOLDER_CNIC;

    if (!file || !filename || !groupId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: file, filename, or groupId" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Only JPEG, PNG, GIF, and WebP allowed" },
        { status: 400 }
      );
    }

    // Upload to Pinata
    const { cid, fileId } = await uploadFileToIPFS(file, filename, groupId);
    const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";
    const url = `https://${gateway}/ipfs/${cid}`;

    // Verify group assignment
    let groupStatus = "pending";
    try {
      const pinataJwt = process.env.PINATA_JWT;
      if (!pinataJwt) {
        throw new Error("Pinata JWT is missing");
      }
      const response = await fetch(`https://api.pinata.cloud/v3/files?groupId=${groupId}`, {
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to verify group: ${response.statusText}`);
      }
      const data = await response.json();
      const files = data.data?.files || [];
      groupStatus = files.some((f: any) => f.id === fileId) ? "success" : "failed";
    } catch (error: any) {
      console.error("Error verifying group assignment:", {
        message: error.message,
        groupId,
        fileId,
      });
      groupStatus = `failed: ${error.message}`;
    }

    // Test fetching the image
    let fetchStatus = "pending";
    try {
      const fetchResponse = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.PINATA_JWT}`,
        },
      });
      fetchStatus = fetchResponse.ok ? "success" : `failed: ${fetchResponse.status}`;
    } catch (error: any) {
      console.error("Error fetching image:", {
        message: error.message,
        url,
      });
      fetchStatus = `failed: ${error.message}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        cid,
        fileId,
        url,
        filename,
        groupId,
        groupStatus,
        fetchStatus,
      },
    });
  } catch (error: any) {
    console.error("Error in debug upload:", {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}