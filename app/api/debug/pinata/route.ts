// app/api/debug/pinata/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  verifyGroupSetup,
  listPinataGroups,
  listFilesInGroup,
  debugGroupInfo,
  setupRequiredGroups,
} from "@/lib/services/pinata-group-manager";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "verify";

    switch (action) {
      case "verify":
        const verification = await verifyGroupSetup();
        return NextResponse.json({
          success: true,
          action: "verify",
          data: verification,
        });

      case "list":
        const groups = await listPinataGroups();
        return NextResponse.json({
          success: true,
          action: "list",
          data: { groups },
        });

      case "debug":
        const debugInfo = await debugGroupInfo();
        return NextResponse.json({
          success: true,
          action: "debug",
          data: debugInfo,
        });

      case "files":
        const groupId = searchParams.get("groupId");
        if (!groupId) {
          return NextResponse.json({
            success: false,
            error: "groupId parameter is required for files action",
          }, { status: 400 });
        }
        
        const files = await listFilesInGroup(groupId);
        return NextResponse.json({
          success: true,
          action: "files",
          data: { groupId, files },
        });

      case "setup":
        const setupResult = await setupRequiredGroups();
        return NextResponse.json({
          success: setupResult.success,
          action: "setup",
          data: setupResult,
        });

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action. Available actions: verify, list, debug, files, test",
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in Pinata debug API:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json({
      success: false,
      error: `API Error: ${error.message}`,
      details: error.response?.data || null,
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, groupId, groupName } = body;

    switch (action) {
      case "test":
        if (!groupId || !groupName) {
          return NextResponse.json({
            success: false,
            error: "groupId and groupName are required for test action",
          }, { status: 400 });
        }
        
        const testResult = await testGroupUpload(groupId, groupName);
        return NextResponse.json({
          success: testResult.success,
          action: "test",
          data: testResult,
          message: testResult.success 
            ? "Test upload successful" 
            : `Test upload failed: ${testResult.error}`,
        });

      default:
        return NextResponse.json({
          success: false,
          error: "Invalid action for POST. Available actions: test",
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in Pinata debug API POST:", {
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json({
      success: false,
      error: `API Error: ${error.message}`,
      details: error.response?.data || null,
    }, { status: 500 });
  }
}