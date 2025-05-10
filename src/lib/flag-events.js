/**
 * Helper functions for flag submission events
 */

// Track recently broadcast submissions to prevent duplicates
const recentSubmissions = new Set();

// Clean up old submissions (older than 10 seconds)
setInterval(() => {
  const now = Date.now();
  for (const submission of recentSubmissions) {
    if (now - submission.timestamp > 10000) {
      recentSubmissions.delete(submission);
    }
  }
}, 30000); // Clean every 30 seconds

// Utility functions for standardizing flag submission and broadcasting
import { createSocket } from "./socket-client";

// Tracking to avoid duplicate broadcasts
const recentBroadcasts = new Map();

/**
 * Broadcast a flag submission event through multiple channels:
 * 1. Direct socket.io emit
 * 2. Window DOM event for local components
 * 3. API call to broadcast-activity endpoint for SSE clients
 */
export async function broadcastFlagSubmission(payload, forceRefresh = false) {
  if (!payload) {
    console.error("[FLAG-EVENTS] Missing payload for flag submission");
    return false;
  }

  // Extract necessary fields with fallbacks
  const eventId = payload.eventId || payload.event_id;
  const challengeId = payload.challengeId || payload.challenge_id;
  const username = payload.username || payload.user_name;
  const teamUuid = payload.teamUuid || payload.team_uuid;

  // Generate broadcast ID if not provided
  const broadcastId =
    payload.broadcast_id || `${username}_${challengeId}_${Date.now()}`;

  // Ensure consistent field names by normalizing the payload
  const normalizedPayload = {
    // Use consistent field names for all broadcast channels
    eventId: eventId,
    event_id: eventId, // Include both formats for compatibility
    challengeId: challengeId,
    challenge_id: challengeId,
    challenge_name:
      payload.challenge_name || payload.challengeName || "Challenge",
    challengeName:
      payload.challenge_name || payload.challengeName || "Challenge",
    username: username,
    user_name: username,
    teamUuid: teamUuid,
    team_uuid: teamUuid,
    teamName: payload.teamName || payload.team_name || "Team",
    team_name: payload.teamName || payload.team_name || "Team",

    // CRITICAL: Use a single source of truth for points
    // Prioritize total_bytes as that's what the API uses
    total_bytes: payload.total_bytes || payload.points || 0,
    points: payload.total_bytes || payload.points || 0,

    isFirstBlood: payload.isFirstBlood || payload.is_first_blood || false,
    is_first_blood: payload.isFirstBlood || payload.is_first_blood || false,
    profile_image:
      payload.profile_image || payload.userProfileImage || "/icon1.png",
    userProfileImage:
      payload.profile_image || payload.userProfileImage || "/icon1.png",
    timestamp: payload.timestamp || Date.now(),
    broadcast_id: broadcastId,
  };

  // Check for duplicates unless forced refresh
  if (!forceRefresh && isDuplicateBroadcast(eventId, broadcastId)) {
    console.log(
      `[FLAG-EVENTS] Skipping duplicate flag submission: ${broadcastId}`
    );
    return false;
  }

  try {
    // 1. Emit via Socket.io if available
    console.log(`[FLAG-EVENTS] Broadcasting flag submission via Socket.io`);
    const socket = createSocket();
    if (socket && socket.connected) {
      if (normalizedPayload.isFirstBlood) {
        socket.emit("flagFirstBlood", normalizedPayload);
      } else {
        socket.emit("flagSubmitted", normalizedPayload);
      }
    } else {
      console.log(
        `[FLAG-EVENTS] Socket not connected, skipping Socket.io broadcast`
      );
    }

    // 2. Broadcast via the API (Server-Sent Events)
    console.log(`[FLAG-EVENTS] Broadcasting flag submission via SSE API`);
    try {
      const response = await fetch("/api/broadcast-activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedPayload),
      });

      if (!response.ok) {
        console.error(
          `[FLAG-EVENTS] API broadcast failed: ${await response.text()}`
        );
      }
    } catch (error) {
      console.error(`[FLAG-EVENTS] Error broadcasting via API:`, error);
    }

    // 3. Dispatch DOM event for local communication between tabs
    if (typeof window !== "undefined") {
      console.log(`[FLAG-EVENTS] Broadcasting flag submission via DOM event`);
      const eventName = "flag_submitted";
      const event = new CustomEvent(eventName, {
        detail: normalizedPayload,
      });
      window.dispatchEvent(event);
    }

    // Track this broadcast to prevent duplicates
    trackBroadcast(eventId, broadcastId);

    return true;
  } catch (error) {
    console.error(`[FLAG-EVENTS] Error broadcasting flag submission:`, error);
    return false;
  }
}

/**
 * Check if this is a duplicate broadcast that happened recently
 */
function isDuplicateBroadcast(eventId, broadcastId) {
  if (!eventId || !broadcastId) return false;

  // Get the set of recent broadcasts for this event
  const recentEventBroadcasts = recentBroadcasts.get(eventId) || new Set();

  // Check if this broadcast ID exists in the set
  return recentEventBroadcasts.has(broadcastId);
}

/**
 * Tracks a broadcast to prevent duplicates
 *
 * @param {string} eventId The event ID
 * @param {string} broadcastId The broadcast ID
 */
function trackBroadcast(eventId, broadcastId) {
  if (!eventId || !broadcastId) return;

  // Get or create the set of recent broadcasts for this event
  const recentEventBroadcasts = recentBroadcasts.get(eventId) || new Set();

  // Add this broadcast ID to the set
  recentEventBroadcasts.add(broadcastId);

  // Store the updated set
  recentBroadcasts.set(eventId, recentEventBroadcasts);

  // Set up cleanup after 5 minutes to prevent memory leaks
  setTimeout(() => {
    const broadcasts = recentBroadcasts.get(eventId);
    if (broadcasts) {
      broadcasts.delete(broadcastId);
      // If empty, remove the entire event entry
      if (broadcasts.size === 0) {
        recentBroadcasts.delete(eventId);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Sets up a listener for flag submissions
 *
 * @param {string} eventId The event ID to listen for
 * @param {Function} callback Function to call when flag is submitted
 * @returns {Function} Cleanup function to remove the listener
 */
export const listenForFlagSubmissions = (eventId, callback) => {
  if (!eventId || typeof callback !== "function") {
    console.error(
      "[FLAG-EVENTS] Invalid parameters for listenForFlagSubmissions"
    );
    return () => {}; // Return empty cleanup function
  }

  console.log(`[FLAG-EVENTS] Setting up listeners for event ${eventId}`);

  // We'll set up multiple event listeners to catch events from different sources
  const listeners = [];

  // 1. DOM Event listener for flag_submitted events
  const handleFlagEvent = (event) => {
    try {
      const data = event.detail;

      // Skip if no data or if for a different event
      if (!data || (data.eventId !== eventId && data.event_id !== eventId)) {
        return;
      }

      // Skip test mode events
      if (data.testMode === true) {
        console.log("[FLAG-EVENTS] Skipping test mode event");
        return;
      }

      console.log(
        `[FLAG-EVENTS] DOM Event received flag submission for event ${eventId}:`,
        data
      );
      callback(data);
    } catch (error) {
      console.error(
        "[FLAG-EVENTS] Error handling flag_submitted DOM event:",
        error
      );
    }
  };

  // 2. DOM Event listener for team_update events
  const handleTeamUpdateEvent = (event) => {
    try {
      const data = event.detail;

      // Skip if no data or if for a different event
      if (!data || (data.eventId !== eventId && data.event_id !== eventId)) {
        return;
      }

      // Only forward events that have point updates
      if (data.points || data.total_bytes) {
        console.log(
          `[FLAG-EVENTS] DOM Event received team update with points for event ${eventId}:`,
          data
        );
        callback(data);
      }
    } catch (error) {
      console.error(
        "[FLAG-EVENTS] Error handling team_update DOM event:",
        error
      );
    }
  };

  // 3. SSE event listener for server-sent events
  const setupSSE = () => {
    try {
      const eventSource = new EventSource(
        `/api/broadcast-activity?eventId=${eventId}&listen=true&_=${Date.now()}`
      );

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Skip if for a different event
          if (data.eventId !== eventId && data.event_id !== eventId) {
            return;
          }

          console.log(`[FLAG-EVENTS] SSE received event for ${eventId}:`, data);
          callback(data);
        } catch (error) {
          console.error("[FLAG-EVENTS] Error parsing SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(
          `[FLAG-EVENTS] SSE connection error for event ${eventId}:`,
          error
        );
      };

      return eventSource;
    } catch (error) {
      console.error("[FLAG-EVENTS] Error setting up SSE:", error);
      return null;
    }
  };

  // Register DOM event listeners if we're in a browser
  if (typeof window !== "undefined") {
    window.addEventListener("flag_submitted", handleFlagEvent);
    window.addEventListener("team_update", handleTeamUpdateEvent);
    listeners.push({ type: "dom", events: ["flag_submitted", "team_update"] });

    // Set up SSE connection
    const eventSource = setupSSE();
    if (eventSource) {
      listeners.push({ type: "sse", source: eventSource });
    }
  }

  // Return cleanup function
  return () => {
    console.log(`[FLAG-EVENTS] Cleaning up listeners for event ${eventId}`);

    listeners.forEach((listener) => {
      if (listener.type === "dom") {
        // Remove DOM event listeners
        window.removeEventListener("flag_submitted", handleFlagEvent);
        window.removeEventListener("team_update", handleTeamUpdateEvent);
      } else if (listener.type === "sse" && listener.source) {
        // Close SSE connection
        listener.source.close();
      }
    });
  };
};

/**
 * Testing utility for flag submission
 *
 * @param {Object} testData Test data for the flag submission
 * @returns {Promise<boolean>} Success status
 */
export const testFlagSubmission = async (testData = {}) => {
  const testPayload = {
    eventId: testData.eventId || "test-event",
    challengeId: testData.challengeId || `test-challenge-${Date.now()}`,
    username: testData.username || "test-user",
    teamUuid: testData.teamUuid || "test-team",
    teamName: testData.teamName || "Test Team",
    challenge_name: testData.challenge_name || "Test Challenge",
    profile_image: testData.profile_image || "/icon1.png",
    total_bytes: testData.total_bytes || 10,
    isFirstBlood: testData.isFirstBlood || false,
    testMode: true,
    timestamp: Date.now(),
  };

  return broadcastFlagSubmission(testPayload, true);
};

/**
 * Utility to debug event listeners
 */
export const debugEventListeners = () => {
  if (typeof window === "undefined") return;

  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;

  window.addEventListener = function (type, listener, options) {
    console.log(`[DEBUG] Adding event listener for: ${type}`);
    return originalAddEventListener.call(this, type, listener, options);
  };

  window.removeEventListener = function (type, listener, options) {
    console.log(`[DEBUG] Removing event listener for: ${type}`);
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  console.log("[DEBUG] Event listener debugging enabled");
};
