import { NextResponse } from "next/server";

// Edge runtime for better performance on Vercel
export const runtime = "edge";
export const dynamic = "force-dynamic";

// Control key for admin operations
const CONTROL_KEY = "cb209876540331298765";

// GET handler for syncing system freeze state between API and WebSocket server
export async function GET(req) {
  // Only allow requests with the correct admin key
  const authHeader = req.headers.get("authorization");
  const isAuthorized =
    authHeader &&
    authHeader.startsWith("Bearer ") &&
    authHeader.slice(7) === CONTROL_KEY;

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    // This endpoint is used to emit a WebSocket event with the current state
    // It's useful when the API and WebSocket server might be out of sync

    // Get the current state from the main API endpoint
    const response = await fetch(new URL("/api/freeze", req.url).toString());
    const currentState = await response.json();

    // Emit WebSocket event through the global IO instance
    try {
      // Access the global io instance from server.js
      if (global.io) {
        global.io.emit("system_freeze", {
          frozen: currentState,
          message: `System ${currentState ? "frozen" : "unfrozen"}`,
          timestamp: new Date().toISOString(),
          source: "sync_endpoint",
        });
        console.log("WebSocket event emitted for freeze state sync");
      } else {
        console.warn(
          "WebSocket server not available to emit freeze state sync"
        );
      }
    } catch (wsError) {
      console.error("Error emitting WebSocket event during sync:", wsError);
    }

    return NextResponse.json({
      success: true,
      message: "Sync completed. WebSocket clients notified.",
      currentState,
    });
  } catch (error) {
    console.error("Error in freeze sync endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync freeze state",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
