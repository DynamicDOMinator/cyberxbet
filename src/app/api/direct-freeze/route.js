import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// This is a direct API endpoint to force a WebSocket update
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const state = url.searchParams.get("state") === "true";

    // Update global state
    if (typeof global !== "undefined") {
      global.systemFrozen = state;
    }

    // Try all possible ways to emit WebSocket events
    let emitSuccess = false;

    // Method 1: Using global.io directly
    try {
      if (typeof global !== "undefined" && global.io) {
        global.io.emit("system_freeze", {
          frozen: state,
          message: `DIRECT API: System ${state ? "FROZEN" : "UNFROZEN"}`,
          timestamp: new Date().toISOString(),
          source: "direct_api",
        });
        emitSuccess = true;
      }
    } catch (error) {
      // Silent error handling
    }

    // Method 2: Using global.server.io
    if (!emitSuccess) {
      try {
        if (
          typeof global !== "undefined" &&
          global.server &&
          global.server.io
        ) {
          global.server.io.emit("system_freeze", {
            frozen: state,
            message: `DIRECT API: System ${state ? "FROZEN" : "UNFROZEN"}`,
            timestamp: new Date().toISOString(),
            source: "direct_api_server",
          });
          emitSuccess = true;
        }
      } catch (error) {
        // Silent error handling
      }
    }

    // Method 3: Direct socket broadcast to all clients
    if (
      !emitSuccess &&
      typeof global !== "undefined" &&
      global.io &&
      global.io.sockets
    ) {
      try {
        global.io.sockets.emit("system_freeze", {
          frozen: state,
          message: `DIRECT API: System ${state ? "FROZEN" : "UNFROZEN"}`,
          timestamp: new Date().toISOString(),
          source: "direct_broadcast",
        });
        emitSuccess = true;
      } catch (error) {
        // Silent error handling
      }
    }

    return NextResponse.json({
      success: true,
      state: state,
      emitted: emitSuccess,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
