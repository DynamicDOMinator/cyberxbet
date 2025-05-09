import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const frozen = url.searchParams.get("frozen") === "true";
    const message = url.searchParams.get("message") || "Test message";

    console.log(
      `WebSocket test endpoint called - Frozen: ${frozen}, Message: ${message}`
    );

    // Try to emit a WebSocket event
    let emitted = false;

    // Try all possible ways to access the io instance
    if (typeof global !== "undefined" && global.io) {
      console.log("Using global.io to emit test event");
      global.io.emit("system_freeze", {
        frozen: frozen,
        message:
          message || `Test message - system ${frozen ? "frozen" : "unfrozen"}`,
        timestamp: new Date().toISOString(),
        source: "test_websocket_api",
      });
      emitted = true;
    }

    if (
      !emitted &&
      typeof global !== "undefined" &&
      global.server &&
      global.server.io
    ) {
      console.log("Using global.server.io to emit test event");
      global.server.io.emit("system_freeze", {
        frozen: frozen,
        message:
          message || `Test message - system ${frozen ? "frozen" : "unfrozen"}`,
        timestamp: new Date().toISOString(),
        source: "test_websocket_api_alt",
      });
      emitted = true;
    }

    // Update global state if we successfully emitted
    if (emitted && typeof global !== "undefined") {
      global.systemFrozen = frozen;
    }

    return NextResponse.json({
      success: true,
      emitted: emitted,
      frozen: frozen,
      message: message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in WebSocket test endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
