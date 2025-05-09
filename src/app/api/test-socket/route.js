import { NextResponse } from "next/server";

// Don't use edge runtime for this test endpoint
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const eventName = url.searchParams.get("event") || "test_event";
    const message = url.searchParams.get("message") || "Test message";

    console.log(
      `Test socket endpoint called - Event: ${eventName}, Message: ${message}`
    );

    // Try to emit a WebSocket event
    let socketResult = "No WebSocket server available";

    if (typeof global !== "undefined" && global.io) {
      try {
        // Create event payload
        const eventPayload = {
          message,
          timestamp: new Date().toISOString(),
          source: "test_endpoint",
        };

        // Emit the event
        global.io.emit(eventName, eventPayload);

        // Try to get connected clients count
        let clientCount = "unknown";
        try {
          if (global.io.sockets && global.io.sockets.sockets) {
            clientCount = Object.keys(global.io.sockets.sockets).length;
          }
        } catch (countError) {
          clientCount = `Error: ${countError.message}`;
        }

        socketResult = `Event "${eventName}" emitted to ${clientCount} client(s)`;
        console.log(socketResult);
      } catch (wsError) {
        socketResult = `Error emitting event: ${wsError.message}`;
        console.error("Socket emission error:", wsError);
      }
    } else {
      console.warn("WebSocket server not available");
    }

    return NextResponse.json({
      success: true,
      message: "Test socket endpoint called",
      socketResult,
      eventName,
      eventMessage: message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in test socket endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test socket",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
