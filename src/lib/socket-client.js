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

// Track system freeze state
let systemFrozenState = false;
// Track event-specific freeze states
const eventFrozenStates = new Map();

// For non-Vercel environments, use the normal Socket.IO connection
export const createSocket = (userName = null) => {
  // If we already have a socket instance, return it
  if (socketInstance) {
    console.log("Reusing existing socket connection");

    // If username is now provided but wasn't before, update it
    if (userName && socketInstance._userName !== userName) {
      console.log(
        `Updating socket user from ${socketInstance._userName} to ${userName}`
      );
      socketInstance.emit("userConnected", { userName });
      socketInstance._userName = userName;
    }

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

    // Store username on the socket instance for reference
    socketInstance._userName = user;

    // Setup system freeze state handler
    socketInstance.on("system_freeze", (data) => {
      // If this is an event-specific freeze state
      if (data.eventId) {
        eventFrozenStates.set(data.eventId, data.frozen);
        console.log(
          `Event ${data.eventId} freeze state updated: ${data.frozen}`
        );
      } else {
        // This is a global freeze state
        systemFrozenState = data.frozen;
        console.log(`Global system freeze state updated: ${systemFrozenState}`);
      }

      // Dispatch custom event for components to listen to
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("system_freeze_update", {
            detail: {
              frozen: data.frozen,
              eventId: data.eventId || null,
              isGlobal: !data.eventId,
            },
          })
        );
      }
    });

    // Immediately send userConnected event for better tracking
    if (user) {
      socketInstance.on("connect", () => {
        console.log(
          `Socket connected, sending userConnected event for: ${user}`
        );
        socketInstance.emit("userConnected", { userName: user });
      });
    }

    // Add a manual heartbeat to help track active connections
    if (typeof window !== "undefined") {
      const heartbeatInterval = setInterval(() => {
        if (socketInstance && socketInstance.connected) {
          socketInstance.emit("heartbeat", { tabId, userName: user });
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Clean up on page unload
      window.addEventListener("beforeunload", () => {
        clearInterval(heartbeatInterval);

        // Attempt to disconnect properly on page unload
        if (socketInstance) {
          try {
            // Use a synchronous approach on unload to ensure it completes
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/socket", false); // false makes it synchronous
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(
              JSON.stringify({
                action: "disconnect",
                userName: socketInstance._userName || user,
                id: socketInstance.id,
              })
            );
          } catch (e) {
            // Silently fail on error during unload
          }
        }
      });
    }
  }

  return socketInstance;
};

// Function to disconnect and clear the singleton instance
export const disconnectSocket = () => {
  if (socketInstance) {
    console.log("Disconnecting and clearing socket singleton instance");

    // Store username before clearing the instance
    const userName = socketInstance._userName;

    if (typeof socketInstance.disconnect === "function") {
      // For real socket.io connections
      try {
        // First emit a manual disconnect event to ensure server gets it
        socketInstance.emit("userDisconnected", {
          userName: userName,
          tabId: generateTabId(),
        });

        // Then actually disconnect
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

    // Also make an HTTP request to ensure the server knows about the disconnect
    try {
      const apiUrl = "/api/socket";
      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "disconnect",
          userName: userName,
          id: socketInstance.id,
          tabId: generateTabId(),
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Disconnect notification acknowledged:", data);
        })
        .catch((error) => {
          console.error("Error sending disconnect notification:", error);
        });
    } catch (e) {
      // Silently fail on fetch error
      console.error("Error with fetch for disconnect:", e);
    }

    // Clear the singleton instance
    socketInstance = null;
    console.log("Socket instance cleared");
  }
};

// Function to get current system freeze state
export const getSystemFreezeState = (eventId = null) => {
  // If eventId is provided, check for event-specific state first
  if (eventId && eventFrozenStates.has(eventId)) {
    return eventFrozenStates.get(eventId);
  }
  // Otherwise return global state
  return systemFrozenState;
};

// Function for admin to control system freeze state
export const adminControlFreeze = (freeze, eventId = null) => {
  if (!socketInstance) return false;

  socketInstance.emit("admin_freeze_control", { freeze, eventId });
  return true;
};

// Create a virtual socket object that uses REST API instead of WebSockets
// This emulates the Socket.IO interface but works on Vercel
function createVirtualSocket(userName, tabId) {
  const eventHandlers = {};
  let online = 0;
  let connected = false;
  let anonymousId = null;

  // Keep track of system freeze state
  let virtualSystemFrozen = false;
  // Keep track of event-specific freeze states
  const virtualEventFrozenStates = new Map();

  // Track challenge rooms this socket has joined
  const joinedRooms = new Set();

  // Track event rooms for team updates
  const joinedTeamRooms = new Set();

  // Map to track polling intervals by challenge ID
  const challengePollingIntervals = new Map();

  // Map to track polling intervals for team rooms
  const teamPollingIntervals = new Map();

  // Generate a unique ID for this client instance
  const clientId = `client_${Math.random()
    .toString(36)
    .substring(2, 10)}_${Date.now()}`;

  // Store socket metadata for server tracking
  const socketMetadata = {
    id: clientId,
    userName: userName || null,
    tabId: tabId,
    connected: false,
    lastActive: Date.now(),
  };

  // Function to keep the connection alive
  const heartbeat = async () => {
    try {
      const response = await axios.post("/api/socket", {
        action: "heartbeat",
        userName: socketMetadata.userName || undefined,
        id: socketMetadata.id || anonymousId,
        tabId: tabId,
      });

      // Update the last active timestamp
      socketMetadata.lastActive = Date.now();

      // During a heartbeat, it's a good time to also fetch the current online count
      updateOnlineCount();

      return response.data;
    } catch (error) {
      console.error("Heartbeat error:", error);
      return { status: "error", error: error.message };
    }
  };

  // Update online count function
  const updateOnlineCount = async () => {
    try {
      const response = await axios.get("/api/socket");
      if (response.data && typeof response.data.online === "number") {
        online = Math.max(1, response.data.online); // Ensure at least 1 player online

        // Emit events for any registered handlers
        if (eventHandlers.onlinePlayers) {
          eventHandlers.onlinePlayers.forEach((handler) => handler(online));
        }
        if (eventHandlers.onlineCount) {
          eventHandlers.onlineCount.forEach((handler) => handler(online));
        }
      }
    } catch (error) {
      console.error("Error updating online count:", error);
    }
  };

  // Function to connect to the server
  const connect = async () => {
    if (connected) return;

    try {
      console.log(
        `Connecting virtual socket for user: ${userName || "anonymous"}`
      );

      // Make the API request to register this connection
      const response = await axios.post("/api/socket", {
        action: "connect",
        userName: userName || undefined,
        tabId: tabId,
        socketId: socketMetadata.id,
      });

      // If this is an anonymous connection, store the ID
      if (response.data.id) {
        anonymousId = response.data.id;
        console.log(`Anonymous connection assigned ID: ${anonymousId}`);
      }

      // Store connection status
      connected = true;
      socketMetadata.connected = true;
      socketMetadata.lastActive = Date.now();

      // Update online count
      online = response.data.count || 0;

      // Trigger connect handlers
      if (eventHandlers.connect) {
        eventHandlers.connect.forEach((handler) => handler());
      }

      console.log(`Virtual socket connected. Current online count: ${online}`);

      // Set up periodic heartbeat to keep connection alive
      const heartbeatInterval = setInterval(heartbeat, 25000); // Every 25 seconds

      // Set up cleanup on page unload
      if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", async (event) => {
          clearInterval(heartbeatInterval);
          // Try to notify server about disconnect
          try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/socket", false); // Synchronous for unload
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(
              JSON.stringify({
                action: "disconnect",
                userName: socketMetadata.userName,
                id: anonymousId || socketMetadata.id,
                tabId: tabId,
              })
            );
          } catch (e) {
            // Silently fail on unload
          }
        });
      }

      return response.data;
    } catch (error) {
      console.error("Connection error:", error);
      connected = false;
      return { status: "error", error: error.message };
    }
  };

  // Call connect immediately to establish connection
  connect().then(() => {
    // If the user has an authenticated username, also send a userConnected event
    if (userName) {
      setTimeout(() => {
        const socket = {
          emit: emit,
        };
        socket.emit("userConnected", { userName });
      }, 500); // Slight delay to ensure connection is established
    }
  });

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

  // Function to poll for system state
  const setupSystemStatePolling = () => {
    const intervalId = setInterval(async () => {
      try {
        // Poll for global system freeze state
        const globalResponse = await axios.get("/api/freeze");

        if (globalResponse.data.frozen !== virtualSystemFrozen) {
          virtualSystemFrozen = globalResponse.data.frozen;

          // Notify listeners
          if (eventHandlers.system_freeze) {
            eventHandlers.system_freeze.forEach((handler) =>
              handler({ frozen: virtualSystemFrozen })
            );
          }

          // Dispatch custom event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("system_freeze_update", {
                detail: { frozen: virtualSystemFrozen, isGlobal: true },
              })
            );
          }
        }

        // Poll for event-specific freeze states for all joined team rooms
        for (const eventId of joinedTeamRooms) {
          try {
            const eventResponse = await axios.get(
              `/api/freeze?eventId=${eventId}`
            );

            if (
              eventResponse.data &&
              eventResponse.data.frozen !==
                virtualEventFrozenStates.get(eventId)
            ) {
              virtualEventFrozenStates.set(eventId, eventResponse.data.frozen);

              // Notify listeners
              if (eventHandlers.system_freeze) {
                eventHandlers.system_freeze.forEach((handler) =>
                  handler({
                    frozen: eventResponse.data.frozen,
                    eventId: eventId,
                  })
                );
              }

              // Dispatch custom event
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("system_freeze_update", {
                    detail: {
                      frozen: eventResponse.data.frozen,
                      eventId: eventId,
                      isGlobal: false,
                    },
                  })
                );
              }
            }
          } catch (eventError) {
            console.error(
              `Error polling freeze state for event ${eventId}:`,
              eventError
            );
          }
        }
      } catch (error) {
        console.error("Error polling for system freeze state:", error);
      }
    }, 5000); // Poll every 5 seconds

    return intervalId;
  };

  // Setup system state polling
  const systemStatePollingId = setupSystemStatePolling();

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

      // If this is a system freeze handler, call it with current state
      if (event === "system_freeze") {
        // Send global state
        handler({ frozen: virtualSystemFrozen });

        // Send event-specific states if any
        if (virtualEventFrozenStates.size > 0) {
          virtualEventFrozenStates.forEach((frozen, eventId) => {
            handler({ frozen, eventId });
          });
        }
      }
    },

    // Method to manually reset the connection
    reset: async function () {
      await connect();
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

          // Immediately check for event-specific freeze state
          (async () => {
            try {
              const response = await axios.get(
                `/api/freeze?eventId=${eventId}`
              );
              if (response.data && response.data.frozen !== undefined) {
                virtualEventFrozenStates.set(eventId, response.data.frozen);

                // Notify listeners
                if (eventHandlers.system_freeze) {
                  eventHandlers.system_freeze.forEach((handler) =>
                    handler({
                      frozen: response.data.frozen,
                      eventId: eventId,
                    })
                  );
                }
              }
            } catch (error) {
              console.error(
                `Error checking freeze state for event ${eventId}:`,
                error
              );
            }
          })();

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

          // Remove event-specific freeze state
          virtualEventFrozenStates.delete(eventId);

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
      // Handle admin freeze control
      else if (
        event === "admin_freeze_control" &&
        typeof data.freeze === "boolean"
      ) {
        (async () => {
          try {
            const response = await axios.post("/api/socket", {
              action: "admin_freeze_control",
              freeze: data.freeze,
              eventId: data.eventId || null,
              userName,
              id: anonymousId,
            });

            // Update local state
            if (response.data.success) {
              if (data.eventId) {
                virtualEventFrozenStates.set(data.eventId, data.freeze);
              } else {
                virtualSystemFrozen = data.freeze;
              }

              // Notify handlers
              if (eventHandlers.admin_freeze_response) {
                eventHandlers.admin_freeze_response.forEach((handler) =>
                  handler(response.data)
                );
              }
            }
          } catch (error) {
            console.error("Error sending admin freeze control:", error);

            // Notify handlers of error
            if (eventHandlers.admin_freeze_response) {
              eventHandlers.admin_freeze_response.forEach((handler) =>
                handler({ success: false, message: "Network error" })
              );
            }
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

      // Clear system state polling
      clearInterval(systemStatePollingId);

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
