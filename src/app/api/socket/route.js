import { NextResponse } from "next/server";

// Edge runtime for better performance on Vercel
export const runtime = "edge";
export const dynamic = "force-dynamic";

// In-memory store for this instance (note: will reset on cold starts)
let onlineUsers = [];
let onlineCount = 0;

// Track system state - synchronize with global value if available
let systemFrozen = false;
try {
  // Try to access the global value
  systemFrozen = global.systemFrozen || false;
} catch (e) {
  // Ignore errors accessing global
}

// Track event-specific freeze states
const eventFreezeStates = new Map();

// Track last activity timestamps with user metadata
const connectionTimestamps = new Map(); // userName -> { timestamp, tabIds: Set(), socketIds: Set() }

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

// Function to clean up stale connections (older than 3 minutes)
function cleanupStaleConnections() {
  const now = Date.now();
  const staleThreshold = 3 * 60 * 1000; // 3 minutes (more aggressive for serverless)
  let removed = 0;
  let initialCount = onlineUsers.length + anonymousUsers.size;

  // Filter out stale connections
  connectionTimestamps.forEach((data, userName) => {
    if (now - data.timestamp > staleThreshold) {
      connectionTimestamps.delete(userName);
      if (onlineUsers.includes(userName)) {
        onlineUsers = onlineUsers.filter((user) => user !== userName);
        removed++;
      }
    }
  });

  // Clean up stale anonymous users
  for (const anonId of anonymousUsers) {
    const parts = anonId.split("_");
    if (parts.length > 1) {
      // If the ID contains a timestamp part, check if it's stale
      const timestampPart = parts[parts.length - 1];
      const timestamp = parseInt(timestampPart, 10);
      if (!isNaN(timestamp) && now - timestamp > staleThreshold) {
        anonymousUsers.delete(anonId);
        removed++;
      }
    }
  }

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
      `Cleaned up ${removed} stale connections. Initial count: ${initialCount}, Current user count: ${onlineCount}`
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

// Function to get freeze state for an event or global
function getFreezeState(eventId = null) {
  if (eventId && eventFreezeStates.has(eventId)) {
    return eventFreezeStates.get(eventId);
  }
  return systemFrozen;
}

// Function to set freeze state for an event or global
function setFreezeState(value, eventId = null) {
  if (eventId) {
    eventFreezeStates.set(eventId, value);
    return value;
  }
  systemFrozen = value;
  return systemFrozen;
}

// Helper function to update a user's connection timestamp and metadata
function updateUserConnection(userName, metadata = {}) {
  if (!userName) return;

  // Get existing data or create new record
  const existingData = connectionTimestamps.get(userName) || {
    timestamp: Date.now(),
    tabIds: new Set(),
    socketIds: new Set(),
  };

  // Update timestamp
  existingData.timestamp = Date.now();

  // Add new tab ID if provided
  if (metadata.tabId) {
    existingData.tabIds.add(metadata.tabId);
  }

  // Add new socket ID if provided
  if (metadata.socketId) {
    existingData.socketIds.add(metadata.socketId);
  }

  // Update the map
  connectionTimestamps.set(userName, existingData);

  // Make sure this user is in the onlineUsers array
  if (!onlineUsers.includes(userName)) {
    onlineUsers.push(userName);
    // Update count
    onlineCount = onlineUsers.length + anonymousUsers.size;
  }
}

// Helper function to disconnect a user
function disconnectUser(userName, metadata = {}) {
  if (!userName) return false;

  let removed = false;

  // Handle regular users
  if (onlineUsers.includes(userName)) {
    // If tabId provided, just remove that tab
    if (metadata.tabId && connectionTimestamps.has(userName)) {
      const userData = connectionTimestamps.get(userName);
      if (userData.tabIds) {
        userData.tabIds.delete(metadata.tabId);

        // If user has no more tabs, remove them completely
        if (userData.tabIds.size === 0) {
          connectionTimestamps.delete(userName);
          onlineUsers = onlineUsers.filter((user) => user !== userName);
          removed = true;
        } else {
          // Otherwise update the timestamp
          userData.timestamp = Date.now();
          connectionTimestamps.set(userName, userData);
        }
      }
    } else {
      // No specific tab, remove user completely
      connectionTimestamps.delete(userName);
      onlineUsers = onlineUsers.filter((user) => user !== userName);
      removed = true;
    }
  }

  // Handle anonymous users
  if (metadata.id && anonymousUsers.has(metadata.id)) {
    anonymousUsers.delete(metadata.id);
    removed = true;
  }

  if (removed) {
    // Update count
    onlineCount = onlineUsers.length + anonymousUsers.size;
  }

  return removed;
}

// Get the true online count from the Socket.IO server if available
function getTrueOnlineCount() {
  try {
    // Try to get count from the global server instance
    if (global.server && global.server.io) {
      // Use the server's count function if available
      const serverCount = global.getUniqueUserCount
        ? global.getUniqueUserCount()
        : onlineUsers.length + anonymousUsers.size;

      return Math.max(1, serverCount); // Ensure at least 1 user
    }
  } catch (e) {
    console.warn("Error getting global online count:", e.message);
  }

  // Fall back to our local count
  return Math.max(1, onlineUsers.length + anonymousUsers.size);
}

// Check the server for more accurate frozen state
function getServerFrozenState() {
  try {
    if (global.systemFrozen !== undefined) {
      return global.systemFrozen;
    }
  } catch (e) {
    // Ignore errors accessing global
  }
  return systemFrozen;
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
  const freezeStatusParam = url.searchParams.get("freeze_status");
  const debugParam = url.searchParams.get("debug");

  // Handle debug request to see connection stats
  if (debugParam === "true") {
    return NextResponse.json({
      total: getTrueOnlineCount(),
      local: onlineCount,
      registered: onlineUsers.length,
      anonymous: anonymousUsers.size,
      users: onlineUsers,
      anonymousIds: Array.from(anonymousUsers),
      connections: Object.fromEntries(
        Array.from(connectionTimestamps.entries()).map(([key, value]) => [
          key,
          {
            timestamp: value.timestamp,
            tabCount: value.tabIds ? value.tabIds.size : 0,
            socketCount: value.socketIds ? value.socketIds.size : 0,
          },
        ])
      ),
      message: "Debug information retrieved",
    });
  }

  // Handle reset request
  if (resetParam === "true") {
    resetAllConnections();
    return NextResponse.json({
      online: 0,
      message: "All connection data reset",
    });
  }

  // Handle freeze status request
  if (freezeStatusParam === "true") {
    const specificEventId = url.searchParams.get("eventId");
    const freezeState = getFreezeState(specificEventId);

    return NextResponse.json({
      frozen: freezeState,
      eventId: specificEventId || null,
      message: specificEventId
        ? `Freeze status for event ${specificEventId} retrieved`
        : "Global system freeze status retrieved",
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
      frozen: getFreezeState(eventId), // Include freeze state for this event
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

  // Return general online count data - always use the most accurate count available
  const trueOnlineCount = getTrueOnlineCount();
  console.log("GET /api/socket - returning online count:", trueOnlineCount);
  return NextResponse.json({
    online: trueOnlineCount,
    frozen: getServerFrozenState(),
    message: "Socket.IO serverless endpoint active",
  });
}

// POST handler for connect/disconnect events and challenge events
export async function POST(req) {
  try {
    const data = await req.json();
    const {
      action,
      userName,
      challenge_id,
      event_id,
      flag_data,
      tabId,
      socketId,
    } = data;

    console.log(
      `Socket API: ${action} request for user ${userName || "anonymous"}`
    );

    // Clean up stale connections on every request
    cleanupStaleConnections();

    // Handle connection events
    if (action === "connect" && userName) {
      // Update user connection
      updateUserConnection(userName, { tabId, socketId });
      console.log(`User ${userName} connected, total: ${onlineCount}`);

      return NextResponse.json({ count: onlineCount });
    }
    // Handle anonymous connections
    else if (action === "connect") {
      // Generate a random ID for this anonymous connection
      const anonId = `anon_${Math.random()
        .toString(36)
        .substring(2, 10)}_${Date.now()}`;
      anonymousUsers.add(anonId);

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
        if (userName) {
          // Update user connection with current timestamp
          updateUserConnection(userName, { tabId, socketId });
        } else if (anonymousUsers.has(id)) {
          // Keep the anonymous connection alive
          // Create a new ID with current timestamp
          const newAnonId = `anon_${id.split("_")[1]}_${Date.now()}`;
          anonymousUsers.delete(id);
          anonymousUsers.add(newAnonId);
        }

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
    // Handle user reconnected/identified
    else if (action === "userConnected" && userName) {
      // User might have connected anonymously first, now identifying themselves
      updateUserConnection(userName, { tabId, socketId });
      console.log(`User identified: ${userName}, total: ${onlineCount}`);

      return NextResponse.json({
        status: "success",
        message: "User identified",
        count: onlineCount,
      });
    }
    // Handle explicit userDisconnected event
    else if (action === "userDisconnected" && userName) {
      const removed = disconnectUser(userName, { tabId, id: data.id });
      console.log(
        `User ${userName} explicitly disconnected, removed: ${removed}, total: ${onlineCount}`
      );

      return NextResponse.json({
        status: "success",
        message: "User explicitly disconnected",
        count: onlineCount,
      });
    }
    // Handle disconnection events
    else if (action === "disconnect") {
      const id = userName || data.id;
      if (id) {
        // Remove user using our helper function
        const removed = disconnectUser(id, { tabId, id: data.id, socketId });
        console.log(
          `User ${id} disconnected, removed: ${removed}, total: ${onlineCount}`
        );

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
      // Keep user connection fresh
      if (userName) {
        updateUserConnection(userName, { tabId, socketId });
      }

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
      // Keep user connection fresh
      if (userName) {
        updateUserConnection(userName, { tabId, socketId });
      }

      console.log(
        `User ${userName || "anonymous"} joined team room for event ${event_id}`
      );
      return NextResponse.json({
        status: "success",
        message: "Joined team room",
        event_id,
        frozen: getFreezeState(event_id), // Include freeze state for this event
      });
    }
    // Handle flag submission events
    else if (action === "flagSubmitted" && challenge_id && userName) {
      // Keep user connection fresh
      updateUserConnection(userName, { tabId, socketId });

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
      // Keep user connection fresh
      updateUserConnection(userName, { tabId, socketId });

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
      // Keep user connection fresh
      if (userName) {
        updateUserConnection(userName, { tabId, socketId });
      }

      console.log(
        `User ${userName || "anonymous"} joined challenge room ${challenge_id}`
      );
      return NextResponse.json({
        status: "success",
        message: "Joined challenge room",
        challenge_id,
      });
    }
    // Handle admin freeze control
    else if (
      action === "admin_freeze_control" &&
      typeof data.freeze === "boolean"
    ) {
      // Validate control key if provided
      const CONTROL_KEY = "cb209876540331298765"; // Same key as in freeze API
      if (data.key && data.key !== CONTROL_KEY) {
        return NextResponse.json(
          {
            status: "error",
            success: false,
            message: "Invalid control key",
          },
          { status: 403 }
        );
      }

      // Set freeze state in our local storage
      const eventId = data.eventId || null;
      const frozen = data.freeze;

      setFreezeState(frozen, eventId);

      // Create the notification payload
      const freezePayload = {
        frozen: frozen,
        timestamp: new Date().toISOString(),
        source: "socket_api_control",
      };

      // Add eventId if event-specific
      if (eventId) {
        freezePayload.eventId = eventId;
        console.log(
          `Socket API: Setting event ${eventId} freeze state to ${frozen}`
        );
      } else {
        console.log(`Socket API: Setting global freeze state to ${frozen}`);
      }

      // Try to broadcast directly if we have access to Socket.IO server
      let broadcastSuccess = false;

      try {
        if (global.io) {
          // Broadcast to all clients
          global.io.emit("system_freeze", freezePayload);

          // If event-specific, also broadcast to that event's team room
          if (eventId) {
            global.io
              .to(`team_${eventId}`)
              .emit("system_freeze", freezePayload);
          }

          broadcastSuccess = true;
          console.log(`Socket API: Broadcast freeze state via global.io`);
        }
        // Try alternative global.server.io
        else if (global.server && global.server.io) {
          global.server.io.emit("system_freeze", freezePayload);

          if (eventId) {
            global.server.io
              .to(`team_${eventId}`)
              .emit("system_freeze", freezePayload);
          }

          broadcastSuccess = true;
          console.log(
            `Socket API: Broadcast freeze state via global.server.io`
          );
        }
      } catch (error) {
        console.error("Socket API: Error broadcasting freeze state:", error);
      }

      return NextResponse.json({
        status: "success",
        success: true,
        frozen: frozen,
        eventId: eventId || null,
        broadcast: broadcastSuccess,
        message: `${eventId ? "Event" : "System"} ${
          frozen ? "frozen" : "unfrozen"
        } successfully`,
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
        frozen: systemFrozen,
        error: "Failed to process request",
        message: error.message,
      },
      { status: 200 }
    ); // Return 200 even on error to prevent client failures
  }
}
