import { NextResponse } from "next/server";

// Force dynamic to avoid caching
export const dynamic = "force-dynamic";

// Control key for admin operations
const CONTROL_KEY = "cb209876540331298765";

/**
 * GET handler - Retrieve current freeze state
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  // Set up the response with current system state
  const frozen =
    typeof global.systemFrozen !== "undefined" ? global.systemFrozen : false;

  // For event-specific state, check global.eventFreezeStates
  let eventSpecificFrozen = false;
  if (eventId && typeof global.eventFreezeStates !== "undefined") {
    eventSpecificFrozen = !!global.eventFreezeStates[eventId];
  }

  return NextResponse.json({
    frozen: eventId ? eventSpecificFrozen : frozen,
    eventId: eventId || null,
    source: "broadcast-api",
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST handler - Force broadcast freeze state
 * This endpoint forces a broadcast to all connected clients
 */
export async function POST(req) {
  try {
    const data = await req.json();

    // Validate control key
    if (data.key !== CONTROL_KEY) {
      return NextResponse.json(
        { error: "Invalid control key" },
        { status: 403 }
      );
    }

    // Ensure we have a freeze state to broadcast
    if (typeof data.frozen !== "boolean" && typeof data.freeze !== "boolean") {
      return NextResponse.json(
        { error: "Missing freeze state (frozen or freeze)" },
        { status: 400 }
      );
    }

    // Get the freeze state value
    const frozen = typeof data.frozen === "boolean" ? data.frozen : data.freeze;
    const eventId = data.eventId || null;

    // Update global state if available
    if (typeof global !== "undefined") {
      if (eventId) {
        if (!global.eventFreezeStates) global.eventFreezeStates = {};
        global.eventFreezeStates[eventId] = frozen;
      } else {
        global.systemFrozen = frozen;
      }
    }

    // Create payload for broadcast
    const payload = {
      frozen,
      timestamp: new Date().toISOString(),
      source: "broadcast-api",
    };

    if (eventId) {
      payload.eventId = eventId;
    }

    // Broadcast using all available methods
    const broadcastResults = {
      globalIo: false,
      serverIo: false,
      ioEmit: false,
    };

    // Method 1: Use global.io if available
    try {
      if (global.io) {
        global.io.emit("system_freeze", payload);

        if (eventId) {
          global.io.to(`team_${eventId}`).emit("system_freeze", payload);
        }

        broadcastResults.globalIo = true;
      }
    } catch (error) {
      console.error("Error broadcasting via global.io:", error);
    }

    // Method 2: Use global.server.io if available
    try {
      if (global.server && global.server.io) {
        global.server.io.emit("system_freeze", payload);

        if (eventId) {
          global.server.io.to(`team_${eventId}`).emit("system_freeze", payload);
        }

        broadcastResults.serverIo = true;
      }
    } catch (error) {
      console.error("Error broadcasting via global.server.io:", error);
    }

    // Method 3: Try direct access to io instance (for edge cases)
    try {
      if (typeof io !== "undefined") {
        io.emit("system_freeze", payload);
        broadcastResults.ioEmit = true;
      }
    } catch (error) {
      console.error("Error broadcasting via direct io:", error);
    }

    // Also call the socket API to ensure the broadcast
    try {
      const origin =
        req.headers.get("origin") ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
      const socketApiUrl = `${origin}/api/socket`;

      await fetch(socketApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "admin_freeze_control",
          freeze: frozen,
          eventId: eventId,
          key: CONTROL_KEY,
        }),
      });
    } catch (error) {
      console.error("Error calling socket API:", error);
    }

    return NextResponse.json({
      success: true,
      frozen,
      eventId: eventId || null,
      broadcastResults,
      message: `Broadcast ${
        eventId ? "event" : "global"
      } freeze state: ${frozen}`,
    });
  } catch (error) {
    console.error("Error in broadcast-freeze API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
