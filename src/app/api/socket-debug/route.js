import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check if WebSocket server is available
    let socketStatus = "Not available";
    let socketDetails = {};

    // Check global.io
    if (typeof global !== "undefined" && global.io) {
      socketStatus = "Available via global.io";

      try {
        // Get connected clients count
        const connectedSockets = Object.keys(
          global.io.sockets?.sockets || {}
        ).length;
        socketDetails.connectedClients = connectedSockets;
      } catch (error) {
        socketDetails.error = error.message;
      }
    }

    // Check global.server.io
    if (typeof global !== "undefined" && global.server && global.server.io) {
      socketStatus += " and global.server.io";
    }

    // Get system frozen state
    let systemFrozen = false;
    if (typeof global !== "undefined") {
      systemFrozen = global.systemFrozen || false;
    }

    // Try to emit a test event
    let emitResult = "Not attempted";
    try {
      if (typeof global !== "undefined" && global.io) {
        global.io.emit("debug_event", {
          message: "Debug event from socket-debug endpoint",
          timestamp: new Date().toISOString(),
        });
        emitResult = "Event emitted successfully";
      }
    } catch (error) {
      emitResult = `Error emitting event: ${error.message}`;
    }

    return NextResponse.json({
      success: true,
      socketStatus,
      socketDetails,
      systemFrozen,
      emitResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
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
