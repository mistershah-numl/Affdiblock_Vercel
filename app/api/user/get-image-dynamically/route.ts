import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// GET handler to fetch images dynamically from the public folder
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get("path"); // Get the image path from query parameter (e.g., /uploads/id-cards/xxx.jpg)

    if (!imagePath) {
      return NextResponse.json({ success: false, error: "Image path is required" }, { status: 400 });
    }

    // Resolve the absolute path to the image file in the public folder
    const publicDir = path.join(process.cwd(), "public");
    const absolutePath = path.join(publicDir, imagePath);

    // Ensure the path is within the public directory to prevent directory traversal attacks
    if (!absolutePath.startsWith(publicDir)) {
      return NextResponse.json({ success: false, error: "Invalid image path" }, { status: 403 });
    }

    // Check if the file exists
    try {
      await fs.access(absolutePath);
    } catch (error) {
      return NextResponse.json({ success: false, error: "Image not found" }, { status: 404 });
    }

    // Read the image file
    const imageBuffer = await fs.readFile(absolutePath);

    // Determine the MIME type based on file extension
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
    };
    const mimeType = mimeTypes[ext] || "application/octet-stream";

    // Set response headers
    const headers = {
      "Content-Type": mimeType,
      "Content-Length": imageBuffer.length.toString(),
      "Access-Control-Allow-Origin": "*", // Allow CORS for all origins
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate", // Disable caching
      "Pragma": "no-cache",
      "Expires": "0",
    };

    // Return the image as a response
    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}