// Socket.IO client with Vercel compatibility
import { io } from "socket.io-client";
import Cookies from "js-cookie";
import axios from "axios";

// Safely check if we're running on Vercel (avoid window reference during SSR)
const isVercel = () => {
  if (typeof window === "undefined") return false;

  return (
    !!process.env.NEXT_PUBLIC_VERCEL_ENV ||
    window.location.hostname.includes("vercel.app")
  );
};

// Generate a browser tab ID that persists only for this tab
const generateTabId = () => {
  if (typeof window === "undefined") return null;

  // See if we already have a tab ID in sessionStorage
  let tabId = sessionStorage.getItem("socket_tab_id");

  // If not, create one and store it
  if (!tabId) {
    tabId = `tab_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    sessionStorage.setItem("socket_tab_id", tabId);
  }

  return tabId;
};

// Singleton socket instance
let socketInstance = null;

// For non-Vercel environments, use the normal Socket.IO connection
export const createSocket = (userName = null) => {
  // If we already have a socket instance, return it
  if (socketInstance) {
    console.log("Reusing existing socket connection");
    return socketInstance;
  }

  // Get username from parameter or generate a random one if not provided
  const user =
    userName || `user_${Math.random().toString(36).substring(2, 10)}`;
  console.log(`Creating new socket connection for user: ${user}`);

  // Get or create a tab ID
  const tabId = generateTabId();
  console.log(`Tab ID: ${tabId}`);

  if (isVercel()) {
    console.log("Using Vercel-compatible socket emulation");
    // Vercel deployment - use REST API instead of WebSockets
    socketInstance = createVirtualSocket(user, tabId);
  } else {
    console.log("Using standard Socket.IO connection");
    // Local or traditional hosting - use real Socket.IO
    socketInstance = io({
      path: "/api/socket",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ["polling", "websocket"], // Try polling first, then websocket
      auth: {
        userName: user || "anonymous", // Send username as auth data
        tabId: tabId, // Send tab ID to help server track connections
      },
    });

    // Add a manual heartbeat to help track active connections
    if (typeof window !== "undefined") {
      const heartbeatInterval = setInterval(() => {
        if (socketInstance && socketInstance.connected) {
          socketInstance.emit("heartbeat", { tabId });
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Clean up on page unload
      window.addEventListener("beforeunload", () => {
        clearInterval(heartbeatInterval);
      });
    }
  }

  return socketInstance;
};

// Function to disconnect and clear the singleton instance
export const disconnectSocket = () => {
  if (socketInstance) {
    console.log("Disconnecting and clearing socket singleton instance");

    if (typeof socketInstance.disconnect === "function") {
      // For real socket.io connections
      try {
        socketInstance.disconnect();
        console.log("Socket.IO connection terminated");
      } catch (error) {
        console.error("Error disconnecting socket:", error);
      }
    } else if (typeof socketInstance.emit === "function") {
      // For virtual socket, emit disconnect
      try {
        socketInstance.emit("disconnect");
        console.log("Virtual socket disconnect event emitted");
      } catch (error) {
        console.error("Error with virtual socket disconnect:", error);
      }
    }

    // Clear the singleton instance
    socketInstance = null;
    console.log("Socket instance cleared");

    // If we're running in a browser, we can try to fetch updated count
    if (typeof window !== "undefined") {
      try {
        fetch("/api/online-players")
          .then((response) => response.json())
          .then((data) => {
            console.log("Current online players after disconnect:", data.count);
          })
          .catch((error) => {
            console.error(
              "Error fetching online count after disconnect:",
              error
            );
          });
      } catch (e) {
        // Silently fail on fetch error
      }
    }
  }
};

// Create a virtual socket object that uses REST API instead of WebSockets
// This emulates the Socket.IO interface but works on Vercel
function createVirtualSocket(userName, tabId) {
  const eventHandlers = {};
  let online = 0;
  let connected = false;
  let anonymousId = null;

  // Track challenge rooms this socket has joined
  const joinedRooms = new Set();

  // Track event rooms for team updates
  const joinedTeamRooms = new Set();

  // Map to track polling intervals by challenge ID
  const challengePollingIntervals = new Map();

  // Map to track polling intervals for team rooms
  const teamPollingIntervals = new Map();

  // Function to reset the connection state
  const resetConnection = async () => {
    try {
      console.log("Resetting socket connection state...");
      await axios.get("/api/socket?reset=true");

      // Reconnect after reset
      const response = await axios.post("/api/socket", {
        action: "connect",
        userName: userName || undefined,
      });

      if (response.data.id) {
        anonymousId = response.data.id;
      }

      online = response.data.count;
      console.log("Connection reset complete. Current users:", online);

      // Emit updated count
      if (eventHandlers.onlinePlayers) {
        eventHandlers.onlinePlayers.forEach((handler) => handler(online));
      }

      if (eventHandlers.onlineCount) {
        eventHandlers.onlineCount.forEach((handler) => handler(online));
      }
    } catch (error) {
      console.error("Error resetting connection:", error);
    }
  };

  // Function to setup team update polling
  const setupTeamPolling = (eventId) => {
    // Don't set up duplicate polling
    if (teamPollingIntervals.has(eventId)) return;

    // Poll for team updates every 5 seconds
    let lastUpdateTime = Date.now();

    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(
          `/api/socket?event_id=${eventId}&team_updates=true`
        );

        // If there are team updates since our last check
        if (
          response.data.teamUpdates &&
          response.data.lastTeamUpdate > lastUpdateTime
        ) {
          lastUpdateTime = response.data.lastTeamUpdate;

          // Process each team update
          response.data.teamUpdates.forEach((update) => {
            if (eventHandlers.teamUpdate) {
              eventHandlers.teamUpdate.forEach((handler) => handler(update));
            }
          });
        }
      } catch (error) {
        console.error(
          `Error polling for team updates in event ${eventId}:`,
          error
        );
      }
    }, 3000); // Poll every 3 seconds

    teamPollingIntervals.set(eventId, intervalId);
  };

  // Function to setup challenge polling
  const setupChallengePolling = (challengeId) => {
    // Don't set up duplicate polling
    if (challengePollingIntervals.has(challengeId)) return;

    // Poll for challenge updates every 5 seconds
    let lastUpdateTime = Date.now();

    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(
          `/api/socket?challenge_id=${challengeId}`
        );

        // If the challenge data has been updated since our last check
        if (response.data.lastUpdated > lastUpdateTime) {
          lastUpdateTime = response.data.lastUpdated;

          // Check if this update includes a first blood
          if (response.data.firstBlood && eventHandlers.firstBlood) {
            eventHandlers.firstBlood.forEach((handler) =>
              handler({
                challenge_id: challengeId,
                ...response.data.firstBlood,
              })
            );
          }

          // Notify about new solves
          if (
            response.data.solvers &&
            response.data.solvers.length > 0 &&
            eventHandlers.newSolve
          ) {
            eventHandlers.newSolve.forEach((handler) =>
              handler({
                challenge_id: challengeId,
                solvers: response.data.solvers,
              })
            );
          }
        }
      } catch (error) {
        console.error(
          `Error polling for challenge ${challengeId} updates:`,
          error
        );
      }
    }, 5000);

    challengePollingIntervals.set(challengeId, intervalId);
  };

  // Create a virtual socket with the same API as Socket.IO
  return {
    id: `virtual-${Math.random().toString(36).substring(2, 9)}`,
    connected: true,

    // Event handling methods
    on(event, handler) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);

      // If we're already connected and this is the connect handler, call it
      if (event === "connect" && connected) {
        handler();
      }

      // If this is an online count handler and we already have data, call it
      if (
        (event === "onlinePlayers" || event === "onlineCount") &&
        online > 0
      ) {
        handler(online);
      }
    },

    // Method to manually reset the connection
    reset: async function () {
      await resetConnection();
    },

    emit(event, data) {
      // Handle userConnected event
      if (event === "userConnected") {
        (async () => {
          try {
            const response = await axios.post("/api/socket", {
              action: "connect",
              userName: data.userName,
            });
            online = response.data.count;
          } catch (error) {
            console.error("Error sending userConnected:", error);
          }
        })();
      }
      // Handle joining a team room
      else if (event === "joinTeamRoom" && data) {
        const eventId = typeof data === "string" ? data : data.eventId;

        if (eventId) {
          joinedTeamRooms.add(eventId);

          // Set up polling for team updates in this event
          setupTeamPolling(eventId);

          // Notify the server about joining the team room
          (async () => {
            try {
              await axios.post("/api/socket", {
                action: "joinTeamRoom",
                event_id: eventId,
                userName,
              });
            } catch (error) {
              console.error("Error joining team room:", error);
            }
          })();
        }
      }
      // Handle leaving a team room
      else if (event === "leaveTeamRoom" && data) {
        const eventId = typeof data === "string" ? data : data.eventId;

        if (eventId && joinedTeamRooms.has(eventId)) {
          joinedTeamRooms.delete(eventId);

          // Clear polling interval
          if (teamPollingIntervals.has(eventId)) {
            clearInterval(teamPollingIntervals.get(eventId));
            teamPollingIntervals.delete(eventId);
          }
        }
      }
      // Handle team updates
      else if (event === "teamUpdate" && data && data.action) {
        console.log("Handling teamUpdate in socket client:", data);
        (async () => {
          try {
            await axios.post("/api/socket", {
              action: "teamUpdate",
              eventId: data.eventId,
              teamUuid: data.teamUuid,
              teamName: data.teamName || "",
              username: data.username || userName,
              removedUser: data.removedUser,
              newPoints: data.newPoints,
              newTeamTotal: data.newTeamTotal,
              solvedCount: data.solvedCount,
              isFirstBlood: data.isFirstBlood || false,
              update_type: data.action,
              update_data: data,
            });
          } catch (error) {
            console.error("Error handling team update via socket:", error);
          }
        })();
      }
      // Handle joining a challenge room
      else if (event === "joinChallengeRoom" && data) {
        const challengeId = typeof data === "string" ? data : data.challenge_id;

        if (challengeId) {
          joinedRooms.add(challengeId);

          // Set up polling for this challenge room
          setupChallengePolling(challengeId);

          // Notify the server about joining the room
          (async () => {
            try {
              await axios.post("/api/socket", {
                action: "joinChallengeRoom",
                challenge_id: challengeId,
                userName,
              });
            } catch (error) {
              console.error("Error joining challenge room:", error);
            }
          })();
        }
      }
      // Handle leaving a challenge room
      else if (event === "leaveChallengeRoom" && data) {
        const challengeId = typeof data === "string" ? data : data.challenge_id;

        if (challengeId && joinedRooms.has(challengeId)) {
          joinedRooms.delete(challengeId);

          // Clear polling interval
          if (challengePollingIntervals.has(challengeId)) {
            clearInterval(challengePollingIntervals.get(challengeId));
            challengePollingIntervals.delete(challengeId);
          }
        }
      }
      // Handle flag submission
      else if (event === "flagSubmitted" && data && data.challenge_id) {
        console.log("Handling flagSubmitted in socket client:", data);
        (async () => {
          try {
            await axios.post("/api/socket", {
              action: "flagSubmitted",
              challenge_id: data.challenge_id,
              userName: data.username || userName,
              eventId: data.eventId,
              teamUuid: data.teamUuid,
              teamName: data.teamName || "",
              isFirstBlood: data.isFirstBlood || false,
              newPoints: data.newPoints,
              newTeamTotal: data.newTeamTotal,
              points: data.points,
              flag_data: data,
            });
          } catch (error) {
            console.error("Error submitting flag via socket:", error);
          }
        })();
      }
      // Handle first blood
      else if (event === "flagFirstBlood" && data && data.challenge_id) {
        console.log("Handling flagFirstBlood in socket client:", data);
        (async () => {
          try {
            await axios.post("/api/socket", {
              action: "flagFirstBlood",
              challenge_id: data.challenge_id,
              userName: data.username || userName,
              eventId: data.eventId,
              teamUuid: data.teamUuid,
              teamName: data.teamName || "",
              isFirstBlood: true,
              newPoints: data.newPoints,
              newTeamTotal: data.newTeamTotal,
              points: data.points,
              flag_data: data,
            });
          } catch (error) {
            console.error("Error submitting first blood via socket:", error);
          }
        })();
      }
      // Handle heartbeat
      else if (event === "heartbeat") {
        (async () => {
          try {
            await axios.post("/api/socket", {
              action: "heartbeat",
              userName,
              id: anonymousId,
            });
          } catch (error) {
            console.error("Error sending heartbeat:", error);
          }
        })();
      }
    },

    off(event) {
      if (eventHandlers[event]) {
        delete eventHandlers[event];
      }
    },

    disconnect() {
      // Clear all challenge polling intervals
      for (const intervalId of challengePollingIntervals.values()) {
        clearInterval(intervalId);
      }
      challengePollingIntervals.clear();

      // Clear all team polling intervals
      for (const intervalId of teamPollingIntervals.values()) {
        clearInterval(intervalId);
      }
      teamPollingIntervals.clear();

      (async () => {
        try {
          await axios.post("/api/socket", {
            action: "disconnect",
            userName,
            id: anonymousId,
          });
        } catch (error) {
          console.error("Error disconnecting:", error);
        }
      })();
    },
  };
}
