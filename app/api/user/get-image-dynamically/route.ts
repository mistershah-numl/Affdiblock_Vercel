import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import fetch from "node-fetch";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get("path");

    if (!imagePath) {
      console.error("Image path is missing in query parameters");
      return NextResponse.json({ success: false, error: "Image path is required" }, { status: 400 });
    }

    // Handle external URL (e.g., Pinata IPFS)
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      let url = imagePath;

      // Ensure public gateway
      if (!url.includes("gateway.pinata.cloud")) {
        url = url.replace(/^(https?:\/\/)[^\/]+/, "$1gateway.pinata.cloud");
        console.log("Using public Pinata gateway", { url });
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {},
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch image from Pinata:", {
          url,
          status: response.status,
          statusText: response.statusText,
          errorText,
          responseHeaders: Object.fromEntries(response.headers.entries()),
        });
        return NextResponse.json(
          { success: false, error: `Failed to fetch image: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      let mimeType = response.headers.get("content-type") || "application/octet-stream";

      if (mimeType === "application/octet-stream") {
        const urlPath = new URL(url).pathname;
        const ext = path.extname(urlPath).toLowerCase();
        const mimeTypes: { [key: string]: string } = {
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".png": "image/png",
          ".gif": "image/gif",
          ".webp": "image/webp",
        };
        mimeType = mimeTypes[ext] || "application/octet-stream";
      }

      const responseHeaders = {
        "Content-Type": mimeType,
        "Content-Length": imageBuffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      };

      return new NextResponse(imageBuffer, {
        status: 200,
        headers: responseHeaders,
      });
    }

    // Handle local file path
    const publicDir = path.join(process.cwd(), "public");
    const absolutePath = path.join(publicDir, imagePath);

    if (!absolutePath.startsWith(publicDir)) {
      console.error("Invalid local path attempted:", { absolutePath });
      return NextResponse.json({ success: false, error: "Invalid image path" }, { status: 403 });
    }

    try {
      await fs.access(absolutePath);
    } catch (error) {
      console.error("Local file not found:", { absolutePath });
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    const imageBuffer = await fs.readFile(absolutePath);
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    const responseHeaders = {
      "Content-Type": mimeType,
      "Content-Length": imageBuffer.length.toString(),
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Error in get-image-dynamically:", {
      message: error.message,
      stack: error.stack,
      imagePath,
    });
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}