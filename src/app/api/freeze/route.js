import { NextResponse } from "next/server";

// Completely remove Edge runtime
// export const runtime = "edge";
export const dynamic = "force-dynamic";

// Control key for admin operations
const CONTROL_KEY = "cb209876540331298765";

// In-memory state (will reset on server restart)
// Instead of local state, use global state from server.js
// let systemFrozen = false;

// Helper to get the current system frozen state
function getSystemFrozenState() {
  // Try to get from global state first
  if (typeof global !== "undefined" && "systemFrozen" in global) {
    return global.systemFrozen;
  }
  // Fallback to local state if global is not available
  return false;
}

// Helper to set the system frozen state
function setSystemFrozenState(value) {
  // Set in global state if available
  if (typeof global !== "undefined") {
    global.systemFrozen = value;
  }
  // Always return the new value
  return value;
}

// GET handler for retrieving system freeze state as a simple boolean
export async function GET() {
  const currentState = getSystemFrozenState();
  return NextResponse.json(currentState);
}

// POST handler for updating system freeze state
export async function POST(req) {
  try {
    const data = await req.json();

    // Validate authorization
    let isAuthorized =
      data.key === CONTROL_KEY ||
      (data.userName && data.userName.includes("admin"));

    // Check authorization header as well
    const authHeader = req.headers.get("authorization");
    if (
      authHeader &&
      authHeader.startsWith("Bearer ") &&
      authHeader.slice(7) === CONTROL_KEY
    ) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 403 }
      );
    }

    // Check if freeze state is provided
    if (typeof data.freeze !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          message: "Missing or invalid freeze parameter",
        },
        { status: 400 }
      );
    }

    // Update the freeze state
    const systemFrozen = setSystemFrozenState(data.freeze);

    // Emit WebSocket event through the global IO instance
    try {
      // Try all possible ways to access the io instance
      let emitted = false;

      // Method 1: Direct global.io
      if (typeof global !== "undefined" && global.io) {
        global.io.emit("system_freeze", {
          frozen: systemFrozen,
          message: `System ${systemFrozen ? "frozen" : "unfrozen"}`,
          timestamp: new Date().toISOString(),
          source: "api_direct",
        });

        // Try broadcasting to all sockets directly as well
        if (global.io.sockets) {
          global.io.sockets.emit("system_freeze", {
            frozen: systemFrozen,
            message: `System ${
              systemFrozen ? "frozen" : "unfrozen"
            } (broadcast)`,
            timestamp: new Date().toISOString(),
            source: "api_broadcast",
          });
        }

        emitted = true;
      }

      // Method 2: Through global.server
      if (
        !emitted &&
        typeof global !== "undefined" &&
        global.server &&
        global.server.io
      ) {
        global.server.io.emit("system_freeze", {
          frozen: systemFrozen,
          message: `System ${systemFrozen ? "frozen" : "unfrozen"}`,
          timestamp: new Date().toISOString(),
          source: "api_server_io",
        });

        // Try broadcasting to all sockets directly as well
        if (global.server.io.sockets) {
          global.server.io.sockets.emit("system_freeze", {
            frozen: systemFrozen,
            message: `System ${
              systemFrozen ? "frozen" : "unfrozen"
            } (server broadcast)`,
            timestamp: new Date().toISOString(),
            source: "api_server_broadcast",
          });
        }

        emitted = true;
      }

      // Method 3: Try to find any connected sockets and emit to them directly
      if (!emitted && typeof global !== "undefined") {
        try {
          // Try to access sockets through any available path
          const possibleSocketPaths = [
            global.io?.sockets?.sockets,
            global.server?.io?.sockets?.sockets,
            global.io?.of("/")?.sockets,
            global.server?.io?.of("/")?.sockets,
          ];

          for (const socketMap of possibleSocketPaths) {
            if (socketMap && typeof socketMap.forEach === "function") {
              socketMap.forEach((socket) => {
                socket.emit("system_freeze", {
                  frozen: systemFrozen,
                  message: `System ${
                    systemFrozen ? "frozen" : "unfrozen"
                  } (direct)`,
                  timestamp: new Date().toISOString(),
                  source: "api_direct_socket",
                });
              });
              emitted = true;
              break;
            }
          }
        } catch (directError) {
          // Error handling silently
        }
      }
    } catch (wsError) {
      // Error handling silently
    }

    return NextResponse.json({
      success: true,
      frozen: systemFrozen,
      message: `System ${systemFrozen ? "frozen" : "unfrozen"}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update system freeze state",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
