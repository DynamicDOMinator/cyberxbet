// Test utility for flag submission broadcasting
// This file can be imported in the browser console to test real-time updates

import { broadcastFlagSubmission } from "./flag-events";
import Cookies from "js-cookie";

// Function to generate a test flag submission
export function testFlagSubmission(eventId, challengeId, isFirstBlood = false) {
  // Get current user from cookies
  const username = Cookies.get("username") || "test-user";

  // Create a test payload
  const testPayload = {
    challenge_id: challengeId || `test-challenge-${Date.now()}`,
    username: username,
    user_name: username,
    eventId: eventId || "test-event",
    teamUuid: "test-team-uuid",
    teamName: "Test Team",
    points: Math.floor(Math.random() * 50) + 1,
    newPoints: Math.floor(Math.random() * 1000),
    newTeamTotal: Math.floor(Math.random() * 5000),
    isFirstBlood: isFirstBlood,
    solvedCount: Math.floor(Math.random() * 10),
    challenge_name: `Test Challenge ${Date.now()}`,
    profile_image: "/icon1.png",
    timestamp: new Date().toISOString(),
  };

  console.log("Sending test flag submission:", testPayload);

  // Broadcast with force refresh to bypass duplicate checking
  return broadcastFlagSubmission(testPayload, true);
}

// Make the function available globally in the browser
if (typeof window !== "undefined") {
  window.testFlagSubmission = testFlagSubmission;
}

// Export a function to debug current event listeners
export function debugEventListeners() {
  if (typeof window === "undefined") return "Not in browser";

  try {
    // Create a temporary test event
    const testEvent = new CustomEvent("flag_submitted", {
      detail: { testMode: true },
    });

    // Check if there are any listeners
    const hasListeners = window.dispatchEvent(testEvent);

    console.log("Event listeners debug:", {
      hasListeners: !hasListeners, // dispatchEvent returns false if event was canceled
      eventTarget: "window",
      eventType: "flag_submitted",
      testMode: true,
    });

    return !hasListeners
      ? "Listeners found for flag_submitted"
      : "No listeners found";
  } catch (error) {
    console.error("Error debugging event listeners:", error);
    return `Error: ${error.message}`;
  }
}

// Make debug function available globally
if (typeof window !== "undefined") {
  window.debugEventListeners = debugEventListeners;
}

// Export a function to check SSE connection status
export async function checkSSEStatus(eventId) {
  if (typeof window === "undefined") return "Not in browser";

  try {
    const response = await fetch(
      `/api/broadcast-activity/status?eventId=${eventId}`
    );
    const data = await response.json();
    console.log("SSE status:", data);
    return data;
  } catch (error) {
    console.error("Error checking SSE status:", error);
    return `Error: ${error.message}`;
  }
}

// Make SSE check function available globally
if (typeof window !== "undefined") {
  window.checkSSEStatus = checkSSEStatus;
}
