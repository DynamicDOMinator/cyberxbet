import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Control key for admin operations
const CONTROL_KEY = "cb209876540331298765";

// This is a direct API endpoint to force a WebSocket update
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const state = url.searchParams.get("state") === "true";
    const eventId = url.searchParams.get("eventId");
    const key = url.searchParams.get("key");

    // Simple security check
    if (key !== CONTROL_KEY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update global state
    if (typeof global !== "undefined") {
      if (eventId) {
        // Initialize event freeze states if needed
        if (!global.eventFreezeStates) {
          global.eventFreezeStates = {};
        }
        global.eventFreezeStates[eventId] = state;
        console.log(
          `Direct API: Set event ${eventId} freeze state to ${state}`
        );
      } else {
        global.systemFrozen = state;
        console.log(`Direct API: Set global freeze state to ${state}`);
      }
    }

    // Call the main freeze API to ensure consistency
    const freezeResponse = await fetch(`${url.origin}/api/freeze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        freeze: state,
        eventId: eventId || null,
        key: CONTROL_KEY,
      }),
    });

    const freezeResult = await freezeResponse.json();

    return NextResponse.json({
      success: true,
      state: state,
      eventId: eventId || null,
      freezeApiResponse: freezeResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Direct freeze API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Direct POST endpoint for testing
export async function POST(req) {
  try {
    const data = await req.json();
    const { freeze, eventId, key } = data;

    // Validate required fields
    if (typeof freeze !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Missing or invalid freeze parameter" },
        { status: 400 }
      );
    }

    // Simple security check
    if (key !== CONTROL_KEY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      );
    }

    console.log(
      `Direct POST API: Setting ${
        eventId ? `event ${eventId}` : "global"
      } freeze state to ${freeze}`
    );

    // Update global state
    if (typeof global !== "undefined") {
      if (eventId) {
        // Initialize event freeze states if needed
        if (!global.eventFreezeStates) {
          global.eventFreezeStates = {};
        }
        global.eventFreezeStates[eventId] = freeze;
      } else {
        global.systemFrozen = freeze;
      }
    }

    // Get the origin for making requests to other APIs
    const origin = new URL(req.url).origin;

    // Call the main freeze API to ensure consistency
    const freezeResponse = await fetch(`${origin}/api/freeze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        freeze,
        eventId: eventId || null,
        key: CONTROL_KEY,
      }),
    });

    const freezeResult = await freezeResponse.json();

    // Also call the socket API directly
    const socketResponse = await fetch(`${origin}/api/socket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "admin_freeze_control",
        freeze,
        eventId: eventId || null,
        key: CONTROL_KEY,
      }),
    });

    const socketResult = await socketResponse.json();

    // Verify the current state
    const verifyResponse = await fetch(
      `${origin}/api/freeze?${eventId ? `eventId=${eventId}` : ""}`
    );
    const verifyData = await verifyResponse.json();

    return NextResponse.json({
      success: true,
      requested_state: freeze,
      current_state: verifyData.frozen,
      eventId: eventId || null,
      freezeApiResponse: freezeResult,
      socketApiResponse: socketResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Direct freeze POST API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
