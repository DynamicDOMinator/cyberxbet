import { NextResponse } from "next/server";

// Edge runtime for better performance on Vercel
export const runtime = "edge";
export const dynamic = "force-dynamic";

// In-memory store for this instance (note: will reset on cold starts)
let onlineUsers = [];
let onlineCount = 0;

// Track last activity timestamps
const connectionTimestamps = new Map(); // userName -> timestamp

// Track anonymous users by ID
const anonymousUsers = new Set();

// Store for challenge data
let challengeData = new Map(); // Map of challenge_id -> { solvers: [], lastUpdated: timestamp }

// Store for team updates
let teamUpdates = new Map(); // Map of event_id -> { updates: [], lastUpdated: timestamp }

// Function to reset all connection data
function resetAllConnections() {
  onlineUsers = [];
  onlineCount = 0;
  connectionTimestamps.clear();
  anonymousUsers.clear();
  console.log("Socket API: Reset all connection data");
}

// Function to clean up stale connections (older than 5 minutes)
function cleanupStaleConnections() {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes (more aggressive for serverless)
  let removed = 0;

  // Filter out stale connections
  connectionTimestamps.forEach((timestamp, userName) => {
    if (now - timestamp > staleThreshold) {
      connectionTimestamps.delete(userName);
      if (onlineUsers.includes(userName)) {
        onlineUsers = onlineUsers.filter((user) => user !== userName);
        removed++;
      }
    }
  });

  // Check if there's a significant discrepancy between tracked users and timestamps
  if (Math.abs(onlineUsers.length - connectionTimestamps.size) > 2) {
    console.log("Significant discrepancy detected, resetting connection data");
    // Keep only users with valid timestamps
    onlineUsers = onlineUsers.filter((user) => connectionTimestamps.has(user));
    removed = 1; // Force count update
  }

  if (removed > 0) {
    onlineCount = onlineUsers.length + anonymousUsers.size;
    console.log(
      `Cleaned up ${removed} stale connections. Current user count: ${onlineCount}`
    );
  }
}

// Function to clean up old team updates (older than 1 hour)
function cleanupOldTeamUpdates() {
  const now = Date.now();
  const oldThreshold = 60 * 60 * 1000; // 1 hour

  teamUpdates.forEach((data, eventId) => {
    // Remove updates older than the threshold
    data.updates = data.updates.filter(
      (update) => now - update.timestamp < oldThreshold
    );

    // If no updates left, remove the event entry
    if (data.updates.length === 0) {
      teamUpdates.delete(eventId);
    }
  });
}

// GET handler for polling
export async function GET(req) {
  // Clean up stale connections
  cleanupStaleConnections();

  // Clean up old team updates
  cleanupOldTeamUpdates();

  const url = new URL(req.url);
  const challengeId = url.searchParams.get("challenge_id");
  const eventId = url.searchParams.get("event_id");
  const teamUpdatesParam = url.searchParams.get("team_updates");
  const resetParam = url.searchParams.get("reset");

  // Handle reset request
  if (resetParam === "true") {
    resetAllConnections();
    return NextResponse.json({
      online: 0,
      message: "All connection data reset",
    });
  }

  // Handle team updates request
  if (eventId && teamUpdatesParam === "true") {
    const eventTeamData = teamUpdates.get(eventId) || {
      updates: [],
      lastTeamUpdate: Date.now(),
    };

    console.log(
      `GET /api/socket - returning team updates for event ${eventId}`
    );
    return NextResponse.json({
      event_id: eventId,
      teamUpdates: eventTeamData.updates,
      lastTeamUpdate: eventTeamData.lastTeamUpdate,
      message: "Team updates retrieved",
    });
  }

  if (challengeId) {
    // Return challenge-specific data
    const challenge = challengeData.get(challengeId) || {
      solvers: [],
      lastUpdated: Date.now(),
    };
    console.log(
      `GET /api/socket - returning challenge data for ${challengeId}`
    );
    return NextResponse.json({
      challenge_id: challengeId,
      solvers: challenge.solvers,
      lastUpdated: challenge.lastUpdated,
      message: "Challenge data retrieved",
    });
  }

  // Return general online count data
  console.log("GET /api/socket - returning online count:", onlineCount);
  return NextResponse.json({
    online: onlineCount,
    message: "Socket.IO serverless endpoint active",
  });
}

// POST handler for connect/disconnect events and challenge events
export async function POST(req) {
  try {
    const data = await req.json();
    const { action, userName, challenge_id, event_id, flag_data } = data;

    console.log(
      `Socket API: ${action} request for user ${userName || "anonymous"}`
    );

    // Clean up stale connections on every request
    cleanupStaleConnections();

    // Handle connection events
    if (action === "connect" && userName) {
      // Only add user if not already in the list
      if (!onlineUsers.includes(userName)) {
        onlineUsers.push(userName);
        onlineCount = onlineUsers.length + anonymousUsers.size;
        console.log(`User ${userName} connected, total: ${onlineCount}`);
      }

      // Update connection timestamp
      connectionTimestamps.set(userName, Date.now());
      return NextResponse.json({ count: onlineCount });
    }
    // Handle anonymous connections
    else if (action === "connect") {
      // Generate a random ID for this anonymous connection
      const anonId = `anon_${Math.random().toString(36).substring(2, 10)}`;
      anonymousUsers.add(anonId);
      connectionTimestamps.set(anonId, Date.now());

      onlineCount = onlineUsers.length + anonymousUsers.size;
      console.log(
        `Anonymous user connected (${anonId}), total: ${onlineCount}`
      );
      return NextResponse.json({ count: onlineCount, id: anonId });
    }
    // Handle heartbeat to keep connection alive
    else if (action === "heartbeat") {
      const id = userName || data.id;
      if (id) {
        // Update connection timestamp
        connectionTimestamps.set(id, Date.now());
        return NextResponse.json({
          status: "success",
          message: "Heartbeat received",
        });
      }
      return NextResponse.json({
        status: "error",
        message: "No ID provided for heartbeat",
      });
    }
    // Handle disconnection events
    else if (action === "disconnect") {
      const id = userName || data.id;
      if (id) {
        // Remove user from the appropriate list
        if (onlineUsers.includes(id)) {
          onlineUsers = onlineUsers.filter((user) => user !== id);
        } else if (anonymousUsers.has(id)) {
          anonymousUsers.delete(id);
        }

        // Remove connection timestamp
        connectionTimestamps.delete(id);

        onlineCount = onlineUsers.length + anonymousUsers.size;
        console.log(`User ${id} disconnected, total: ${onlineCount}`);
        return NextResponse.json({ count: onlineCount });
      }
      return NextResponse.json({
        status: "error",
        message: "No ID provided for disconnect",
      });
    }
    // Handle reset command
    else if (action === "reset") {
      resetAllConnections();
      return NextResponse.json({
        status: "success",
        message: "All connection data reset",
        count: 0,
      });
    }
    // Handle team update events
    else if (action === "teamUpdate" && event_id) {
      // Get or initialize team updates for this event
      if (!teamUpdates.has(event_id)) {
        teamUpdates.set(event_id, {
          updates: [],
          lastTeamUpdate: Date.now(),
        });
      }

      const eventTeamData = teamUpdates.get(event_id);

      // Create the update object
      const updateData = {
        ...data,
        timestamp: Date.now(),
      };

      // Add update to the list (keep max 100 updates)
      eventTeamData.updates.push(updateData);
      if (eventTeamData.updates.length > 100) {
        eventTeamData.updates = eventTeamData.updates.slice(-100);
      }

      // Update timestamp
      eventTeamData.lastTeamUpdate = Date.now();

      // Update connection timestamp
      if (userName) connectionTimestamps.set(userName, Date.now());

      console.log(
        `Team update in event ${event_id} by ${userName || "anonymous"}: ${
          data.action
        }`
      );
      return NextResponse.json({
        status: "success",
        message: "Team update recorded",
        event_id,
      });
    }
    // Handle joining team room
    else if (action === "joinTeamRoom" && event_id) {
      // Update connection timestamp
      if (userName) connectionTimestamps.set(userName, Date.now());

      console.log(
        `User ${userName || "anonymous"} joined team room for event ${event_id}`
      );
      return NextResponse.json({
        status: "success",
        message: "Joined team room",
        event_id,
      });
    }
    // Handle flag submission events
    else if (action === "flagSubmitted" && challenge_id && userName) {
      // Get or initialize challenge data
      if (!challengeData.has(challenge_id)) {
        challengeData.set(challenge_id, {
          solvers: [],
          lastUpdated: Date.now(),
        });
      }

      const challenge = challengeData.get(challenge_id);

      // Add solver if not already in the list
      if (!challenge.solvers.some((solver) => solver.userName === userName)) {
        challenge.solvers.push({
          userName,
          timestamp: Date.now(),
          eventId: data.eventId || flag_data?.eventId,
          teamUuid: data.teamUuid || flag_data?.teamUuid,
          newPoints: data.newPoints || flag_data?.newPoints,
          newTeamTotal: data.newTeamTotal || flag_data?.newTeamTotal,
          points: data.points || flag_data?.points,
          isFirstBlood: data.isFirstBlood || flag_data?.isFirstBlood || false,
          ...flag_data,
        });
      }

      challenge.lastUpdated = Date.now();

      // Update connection timestamp
      if (userName) connectionTimestamps.set(userName, Date.now());

      console.log(
        `Flag submitted by ${userName} for challenge ${challenge_id}`
      );

      return NextResponse.json({
        status: "success",
        message: "Flag submission recorded",
        challenge_id,
        eventId: data.eventId || flag_data?.eventId,
        teamUuid: data.teamUuid || flag_data?.teamUuid,
        solvers: challenge.solvers.length,
      });
    }
    // Handle first blood events
    else if (action === "flagFirstBlood" && challenge_id && userName) {
      // Get or initialize challenge data
      if (!challengeData.has(challenge_id)) {
        challengeData.set(challenge_id, {
          solvers: [],
          firstBlood: null,
          lastUpdated: Date.now(),
        });
      }

      const challenge = challengeData.get(challenge_id);

      // Record first blood
      if (!challenge.firstBlood) {
        challenge.firstBlood = {
          userName,
          timestamp: Date.now(),
          eventId: data.eventId || flag_data?.eventId,
          teamUuid: data.teamUuid || flag_data?.teamUuid,
          newPoints: data.newPoints || flag_data?.newPoints,
          newTeamTotal: data.newTeamTotal || flag_data?.newTeamTotal,
          points: data.points || flag_data?.points,
          isFirstBlood: true,
          ...flag_data,
        };
      }

      challenge.lastUpdated = Date.now();

      // Update connection timestamp
      if (userName) connectionTimestamps.set(userName, Date.now());

      console.log(`First blood by ${userName} for challenge ${challenge_id}`);

      return NextResponse.json({
        status: "success",
        message: "First blood recorded",
        challenge_id,
        eventId: data.eventId || flag_data?.eventId,
        teamUuid: data.teamUuid || flag_data?.teamUuid,
      });
    }
    // Handle join challenge room events
    else if (action === "joinChallengeRoom" && challenge_id) {
      // Update connection timestamp
      if (userName) connectionTimestamps.set(userName, Date.now());

      console.log(
        `User ${userName || "anonymous"} joined challenge room ${challenge_id}`
      );
      return NextResponse.json({
        status: "success",
        message: "Joined challenge room",
        challenge_id,
      });
    }
    // Handle unknown actions
    else {
      return NextResponse.json(
        {
          status: "error",
          message: "Unknown action or missing required parameters",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Socket API error:", error.message);
    // Still return a valid response with a default count
    return NextResponse.json(
      {
        count: onlineCount || 0,
        error: "Failed to process request",
        message: error.message,
      },
      { status: 200 }
    ); // Return 200 even on error to prevent client failures
  }
}
