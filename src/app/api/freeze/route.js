import { NextResponse } from "next/server";

// Completely remove Edge runtime
// export const runtime = "edge";
export const dynamic = "force-dynamic";

// Control key for admin operations
const CONTROL_KEY = "cb209876540331298765";

// Stores the global freeze state
let globalFrozen = false;

// Stores event-specific freeze states
const eventFreezeStates = new Map();

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

// Debug logger function
function debugLog(...args) {
  if (DEBUG) {
    console.log(`[FREEZE API ${new Date().toISOString()}]`, ...args);
  }
}

// Initialize global state if it doesn't exist
if (typeof global !== "undefined") {
  if (!global.eventFreezeStates) {
    global.eventFreezeStates = {};
  }
  if (global.systemFrozen === undefined) {
    global.systemFrozen = false;
  }
}

// Helper to get the current system frozen state
function getSystemFrozenState(eventId = null) {
  // If an eventId is provided, check for event-specific state
  if (eventId) {
    // First check in global state if available (preferred storage)
    if (
      typeof global !== "undefined" &&
      global.eventFreezeStates &&
      global.eventFreezeStates[eventId] !== undefined
    ) {
      debugLog(
        `Found event freeze state in global state for ${eventId}: ${global.eventFreezeStates[eventId]}`
      );
      return global.eventFreezeStates[eventId];
    }

    // Then check in our local map as fallback
    if (eventFreezeStates.has(eventId)) {
      debugLog(
        `Found event freeze state in local map for ${eventId}: ${eventFreezeStates.get(
          eventId
        )}`
      );
      return eventFreezeStates.get(eventId);
    }

    debugLog(`No freeze state found for event ${eventId}, returning false`);
    return false;
  }

  // Fallback to global system freeze state
  if (typeof global !== "undefined" && "systemFrozen" in global) {
    debugLog(`Using global systemFrozen: ${global.systemFrozen}`);
    return global.systemFrozen;
  }

  // Fallback to local state if global is not available
  debugLog(`No global state available, returning false`);
  return false;
}

// Helper to set the system frozen state
function setSystemFrozenState(value, eventId = null) {
  // If an eventId is provided, set event-specific state
  if (eventId) {
    // Set in global state first (primary storage)
    if (typeof global !== "undefined") {
      if (!global.eventFreezeStates) {
        global.eventFreezeStates = {};
      }
      debugLog(
        `Setting event freeze state in global state for ${eventId}: ${value}`
      );
      global.eventFreezeStates[eventId] = value;
    }

    // Set in local map as backup
    debugLog(
      `Setting event freeze state in local map for ${eventId}: ${value}`
    );
    eventFreezeStates.set(eventId, value);
  } else {
    // Set global freeze state
    if (typeof global !== "undefined") {
      debugLog(`Setting global systemFrozen: ${value}`);
      global.systemFrozen = value;
    }
  }

  // Always return the new value
  return value;
}

// Function to notify other serverless instances via HTTP
async function notifyOtherInstances(value, eventId = null, origin) {
  try {
    // Call the socket API directly to update its state
    const socketApiUrl = `${origin}/api/socket`;

    debugLog(
      `Notifying socket API at ${socketApiUrl} about freeze state: ${value}, eventId: ${
        eventId || "global"
      }`
    );

    const response = await fetch(`${socketApiUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "admin_freeze_control",
        freeze: value,
        eventId: eventId,
        key: CONTROL_KEY,
      }),
    });

    const result = await response.json();
    debugLog(`Socket API notification result:`, result);

    return result;
  } catch (error) {
    debugLog(`Error notifying other instances: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * GET - Check freeze state for global or specific event
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  // If an event ID is provided, check for event-specific state first
  if (eventId) {
    // Return event-specific state if it exists, otherwise fall back to global state
    const frozen = eventFreezeStates.has(eventId)
      ? eventFreezeStates.get(eventId)
      : globalFrozen;

    return NextResponse.json({
      frozen,
      eventId,
      isEventSpecific: eventFreezeStates.has(eventId),
      timestamp: new Date().toISOString(),
    });
  }

  // Return global state
  return NextResponse.json({
    frozen: globalFrozen,
    isGlobal: true,
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST - Set freeze state for global or specific event
 * Requires admin authentication in a production environment
 */
export async function POST(req) {
  try {
    // Parse request data
    const data = await req.json();

    // Check for both 'freeze' and 'frozen' properties
    // This makes the API more robust by accepting either property name
    const frozenValue = data.hasOwnProperty("frozen")
      ? data.frozen
      : data.hasOwnProperty("freeze")
      ? data.freeze
      : undefined;

    // Validate that we have a boolean value
    if (typeof frozenValue !== "boolean") {
      return NextResponse.json(
        {
          error:
            "Missing or invalid 'frozen' boolean value. Please provide either 'frozen' or 'freeze' with a boolean value.",
        },
        { status: 400 }
      );
    }

    // Validate the control key if provided
    if (data.key && data.key !== CONTROL_KEY) {
      return NextResponse.json(
        { error: "Invalid control key" },
        { status: 403 }
      );
    }

    // If eventId is provided, set event-specific state
    if (data.eventId) {
      eventFreezeStates.set(data.eventId, frozenValue);

      // Log the change
      console.log(
        `[FREEZE] Event ${data.eventId} freeze state set to: ${frozenValue}`
      );

      // Try to access global.io (Socket.IO instance) to broadcast the freeze state
      try {
        if (typeof global !== "undefined" && global.io) {
          console.log(
            `[FREEZE] Broadcasting via Socket.IO for event ${data.eventId}`
          );

          // Broadcast to all sockets
          global.io.emit("system_freeze", {
            frozen: frozenValue,
            eventId: data.eventId,
            timestamp: new Date().toISOString(),
            source: "api_control",
          });

          // Also broadcast to the specific team room if available
          global.io.to(`team_${data.eventId}`).emit("system_freeze", {
            frozen: frozenValue,
            eventId: data.eventId,
            timestamp: new Date().toISOString(),
            source: "api_control",
          });
        } else {
          console.warn(
            "[FREEZE] Socket.IO instance not available for direct broadcast"
          );
        }
      } catch (socketError) {
        console.error(
          "[FREEZE] Error broadcasting via Socket.IO:",
          socketError
        );
      }

      // Also try the server instance if available
      try {
        if (
          typeof global !== "undefined" &&
          global.server &&
          global.server.io
        ) {
          console.log(
            `[FREEZE] Broadcasting via server.io for event ${data.eventId}`
          );
          global.server.io.emit("system_freeze", {
            frozen: frozenValue,
            eventId: data.eventId,
            timestamp: new Date().toISOString(),
            source: "api_control",
          });
        }
      } catch (serverSocketError) {
        console.error(
          "[FREEZE] Error broadcasting via server.io:",
          serverSocketError
        );
      }

      // Notify all clients about this change
      await notifyFreezeStateChange(data.eventId, frozenValue, false);

      return NextResponse.json({
        success: true,
        frozen: frozenValue,
        eventId: data.eventId,
        isEventSpecific: true,
        timestamp: new Date().toISOString(),
      });
    }

    // Otherwise set global state
    globalFrozen = frozenValue;

    // Log the change
    console.log(`[FREEZE] Global freeze state set to: ${frozenValue}`);

    // Try to access global.io (Socket.IO instance) to broadcast the freeze state
    try {
      if (typeof global !== "undefined" && global.io) {
        console.log(`[FREEZE] Broadcasting global freeze state via Socket.IO`);
        global.io.emit("system_freeze", {
          frozen: frozenValue,
          timestamp: new Date().toISOString(),
          source: "api_control",
        });
      } else {
        console.warn(
          "[FREEZE] Socket.IO instance not available for direct broadcast"
        );
      }
    } catch (socketError) {
      console.error("[FREEZE] Error broadcasting via Socket.IO:", socketError);
    }

    // Also try the server instance if available
    try {
      if (typeof global !== "undefined" && global.server && global.server.io) {
        console.log(`[FREEZE] Broadcasting global freeze state via server.io`);
        global.server.io.emit("system_freeze", {
          frozen: frozenValue,
          timestamp: new Date().toISOString(),
          source: "api_control",
        });
      }
    } catch (serverSocketError) {
      console.error(
        "[FREEZE] Error broadcasting via server.io:",
        serverSocketError
      );
    }

    // Notify all clients about this change
    await notifyFreezeStateChange(null, frozenValue, true);

    return NextResponse.json({
      success: true,
      frozen: globalFrozen,
      isGlobal: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[FREEZE] Error setting freeze state:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Notify clients of freeze state change via SSE endpoint
 */
async function notifyFreezeStateChange(eventId, frozen, isGlobal) {
  try {
    // Create the payload for the broadcast
    const payload = {
      type: "system_freeze",
      frozen,
      timestamp: new Date().toISOString(),
      source: "api_control",
      isGlobal,
    };

    // Add eventId if this is event-specific
    if (eventId) {
      payload.eventId = eventId;
    }

    // Broadcast to SSE clients through the broadcast-activity endpoint
    const response = await fetch(
      new URL(
        "/api/broadcast-activity",
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      ),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log(`[FREEZE] Broadcast result:`, result);

    return true;
  } catch (error) {
    console.error("[FREEZE] Error broadcasting freeze state change:", error);
    return false;
  }
}
