/**
 * API Route for broadcasting activity updates to clients
 * This will be used primarily for flag submissions and team updates
 * It serves as an alternative to socket.io for Vercel deployments
 */

import { NextResponse } from "next/server";

// Store for active clients
const clients = new Map();
// Buffer for recent events (for new clients that connect)
const recentEvents = new Map();

// Maximum events to keep in buffer per event
const MAX_BUFFERED_EVENTS = 20;

/**
 * Helper to add a new event to the buffer
 */
function addToRecentEvents(eventId, data) {
  if (!eventId) return;

  // Initialize array if needed
  if (!recentEvents.has(eventId)) {
    recentEvents.set(eventId, []);
  }

  const events = recentEvents.get(eventId);
  events.push({
    data,
    timestamp: Date.now(),
  });

  // Trim to max size
  if (events.length > MAX_BUFFERED_EVENTS) {
    events.splice(0, events.length - MAX_BUFFERED_EVENTS);
  }

  recentEvents.set(eventId, events);
}

/**
 * Handle GET requests - sets up SSE connection
 */
export async function GET(req) {
  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId");

  // Validate event ID
  if (!eventId) {
    return NextResponse.json(
      { error: "Missing eventId parameter" },
      { status: 400 }
    );
  }

  // Set up SSE headers
  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Important for Nginx
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start: async (controller) => {
      // Generate a unique client ID
      const clientId = Math.random().toString(36).substring(2, 15);

      // Store the client controller
      if (!clients.has(eventId)) {
        clients.set(eventId, new Map());
      }
      clients.get(eventId).set(clientId, controller);

      console.log(`[SSE] Client ${clientId} connected to event ${eventId}`);

      // Send initial connection message
      const connectMsg = {
        type: "connection",
        clientId,
        message: "Connected to event stream",
        timestamp: Date.now(),
      };
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(connectMsg)}\n\n`)
      );

      // Send recent events from buffer
      if (recentEvents.has(eventId)) {
        const bufferedEvents = recentEvents.get(eventId);
        for (const event of bufferedEvents) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event.data)}\n\n`)
          );
        }
      }

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        console.log(
          `[SSE] Client ${clientId} disconnected from event ${eventId}`
        );
        if (clients.has(eventId)) {
          clients.get(eventId).delete(clientId);
          // Clean up empty maps
          if (clients.get(eventId).size === 0) {
            clients.delete(eventId);
          }
        }
      });
    },
  });

  return new Response(stream, { headers: responseHeaders });
}

/**
 * Handle POST requests - broadcast event to all clients
 */
export async function POST(req) {
  try {
    const payload = await req.json();
    const { eventId } = payload;

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId in request body" },
        { status: 400 }
      );
    }

    // Add a unique broadcast ID if not provided
    if (!payload.broadcast_id) {
      payload.broadcast_id = `broadcast_${Math.random()
        .toString(36)
        .substring(2, 10)}_${Date.now()}`;
    }

    // Add event to recent events buffer
    addToRecentEvents(eventId, payload);

    // Broadcast to all clients for this event
    let clientCount = 0;
    if (clients.has(eventId)) {
      const eventClients = clients.get(eventId);
      const encoder = new TextEncoder();
      const data = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);

      for (const [clientId, controller] of eventClients.entries()) {
        try {
          controller.enqueue(data);
          clientCount++;
        } catch (error) {
          console.error(`[SSE] Error sending to client ${clientId}:`, error);
          // Remove failed client
          eventClients.delete(clientId);
        }
      }

      // Clean up if no clients left
      if (eventClients.size === 0) {
        clients.delete(eventId);
      }
    }

    // Also dispatch a DOM event for direct in-page updates
    if (typeof window !== "undefined") {
      const event = new CustomEvent("flag_submitted", { detail: payload });
      window.dispatchEvent(event);

      // If it contains points, also dispatch as team_update
      if (payload.points || payload.total_bytes) {
        const teamEvent = new CustomEvent("team_update", { detail: payload });
        window.dispatchEvent(teamEvent);
      }
    }

    return NextResponse.json({
      success: true,
      broadcast: {
        eventId,
        clientCount,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error("[SSE] Error broadcasting activity:", error);
    return NextResponse.json(
      { error: "Failed to broadcast activity" },
      { status: 500 }
    );
  }
}
