import { NextResponse } from "next/server";

// Use dynamic rendering for this API route
export const dynamic = "force-dynamic";

// Access the global CLIENTS map from the parent module
let CLIENTS;
try {
  // Use a dynamic import to access the parent module's CLIENTS
  CLIENTS = require("../route").CLIENTS;
} catch (error) {
  // If we can't access it directly, create a stub for testing
  console.warn(
    "Could not access CLIENTS from broadcast-activity module, using stub"
  );
  CLIENTS = new Map();
}

export async function GET(req) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");

  // If no eventId specified, return stats for all events
  if (!eventId) {
    const stats = {
      totalEvents: CLIENTS?.size || 0,
      totalClients: Array.from(CLIENTS?.values() || []).reduce(
        (sum, clientMap) => sum + clientMap.size,
        0
      ),
      events: Array.from(CLIENTS?.entries() || []).map(([id, clients]) => ({
        eventId: id,
        clientCount: clients.size,
      })),
    };

    return NextResponse.json({
      status: "success",
      message: "SSE broadcast statistics",
      data: stats,
    });
  }

  // Return stats for a specific event
  const eventClients = CLIENTS?.get(eventId);
  const clientCount = eventClients?.size || 0;
  const clientIds = Array.from(eventClients?.keys() || []);

  return NextResponse.json({
    status: "success",
    message: `SSE broadcast statistics for event ${eventId}`,
    data: {
      eventId,
      clientCount,
      clientIds,
    },
  });
}
