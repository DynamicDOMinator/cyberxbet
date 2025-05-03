const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Track online users by username with their socket IDs
const onlineUsers = new Map(); // userName -> Set of socket IDs

// Track anonymous connections
const anonymousConnections = new Set();

// Track tab IDs to usernames for better multi-tab handling
const tabToUser = new Map(); // tabId -> userName

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

// Function to get unique user count
const getUniqueUserCount = () => {
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

// Call this at the start to clear any stale data from server restarts
resetAllTrackers();

// Function to clean up stale connections (connections older than 30 minutes without activity)
const cleanupStaleConnections = (io) => {
  const now = Date.now();
  const staleThreshold = 10 * 60 * 1000; // 10 minutes instead of 30

  let cleanedCount = 0;
  let activeCount = 0;

  // Keep track of tab IDs to remove
  const tabIdsToRemove = new Set();

  // Check all connection timestamps
  for (const [socketId, timestamp] of connectionTimestamps.entries()) {
    if (now - timestamp > staleThreshold) {
      // Find the socket and get its tab ID
      for (const [userName, socketSet] of onlineUsers.entries()) {
        if (socketSet.has(socketId)) {
          socketSet.delete(socketId);

          // Find associated tab ID for this socket
          for (const [tabId, user] of tabToUser.entries()) {
            if (user === userName) {
              tabIdsToRemove.add(tabId);
            }
          }

          if (socketSet.size === 0) {
            onlineUsers.delete(userName);
          }
          cleanedCount++;
          break;
        }
      }

      // Remove from anonymous connections
      if (anonymousConnections.has(socketId)) {
        anonymousConnections.delete(socketId);
        cleanedCount++;
      }

      // Remove from challenge rooms
      for (const [challengeId, socketSet] of challengeRooms.entries()) {
        if (socketSet.has(socketId)) {
          socketSet.delete(socketId);
          if (socketSet.size === 0) {
            challengeRooms.delete(challengeId);
          }
        }
      }

      // Remove from team rooms
      for (const [eventId, socketSet] of teamRooms.entries()) {
        if (socketSet.has(socketId)) {
          socketSet.delete(socketId);
          if (socketSet.size === 0) {
            teamRooms.delete(eventId);
          }
        }
      }

      // Remove the timestamp
      connectionTimestamps.delete(socketId);
    } else {
      activeCount++;
    }
  }

  // Remove stale tab IDs
  for (const tabId of tabIdsToRemove) {
    tabToUser.delete(tabId);
  }

  // Clean up stale leaderboard subscriptions
  for (const socketId of connectionTimestamps.keys()) {
    if (now - connectionTimestamps.get(socketId) > staleThreshold) {
      if (leaderboardSubscribers.has(socketId)) {
        leaderboardSubscribers.delete(socketId);
        console.log(`Removed stale leaderboard subscription: ${socketId}`);
      }

      if (activitySubscribers.has(socketId)) {
        activitySubscribers.delete(socketId);
        console.log(`Removed stale activity subscription: ${socketId}`);
      }
    }
  }

  // Clean up old team updates (keep only last 24 hours)
  const oldUpdateThreshold = 24 * 60 * 60 * 1000; // 24 hours
  for (const [eventId, updates] of recentTeamUpdates.entries()) {
    const filteredUpdates = updates.filter(
      (update) => now - update.timestamp < oldUpdateThreshold
    );

    if (filteredUpdates.length === 0) {
      recentTeamUpdates.delete(eventId);
    } else {
      recentTeamUpdates.set(eventId, filteredUpdates);
    }
  }

  if (
    cleanedCount > 0 ||
    onlineUsers.size + anonymousConnections.size !== activeCount
  ) {
    console.log(`Cleaned up ${cleanedCount} stale connections.`);
    console.log(
      `Active connections: ${activeCount}, Tracked users: ${
        onlineUsers.size + anonymousConnections.size
      }`
    );

    // If there's a mismatch between active connections and tracked users,
    // perform an aggressive reset to fix tracking issues
    if (
      Math.abs(onlineUsers.size + anonymousConnections.size - activeCount) > 1
    ) {
      console.log("Detected tracking inconsistency. Performing repairs...");

      // Remove all users without active connections
      for (const [userName, socketSet] of onlineUsers.entries()) {
        const hasActiveSocket = Array.from(socketSet).some((id) =>
          connectionTimestamps.has(id)
        );
        if (!hasActiveSocket) {
          onlineUsers.delete(userName);

          // Remove associated tab IDs
          for (const [tabId, user] of tabToUser.entries()) {
            if (user === userName) {
              tabToUser.delete(tabId);
            }
          }

          console.log(`Removed stale user: ${userName}`);
        }
      }

      // Remove all anonymous connections without timestamps
      for (const socketId of anonymousConnections) {
        if (!connectionTimestamps.has(socketId)) {
          anonymousConnections.delete(socketId);
          console.log(`Removed stale anonymous connection: ${socketId}`);
        }
      }
    }

    // Broadcast updated counts
    if (io) {
      broadcastOnlineCount(io);
    }
  }
};

app.prepare().then(() => {
  // Create a single HTTP server for both Next.js and Socket.IO
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);

    // Add a simple API endpoint for online players
    if (parsedUrl.pathname === "/api/online-players") {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ count: getUniqueUserCount() }));
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

    // Force a cleanup of stale connections on each new connection
    cleanupStaleConnections(io);

    // Set a shorter timeout for stale connections (10 minutes instead of 30)
    const staleThreshold = 10 * 60 * 1000; // 10 minutes

    // Record connection timestamp
    connectionTimestamps.set(socket.id, Date.now());

    // Get username from auth data or wait for userConnected event
    let userName = socket.handshake.auth.userName;

    // Get tab ID if provided
    const tabId = socket.handshake.auth.tabId || `default_${socket.id}`;

    // Store the tab ID on the socket for later reference
    socket.tabId = tabId;

    // Function to add this user
    const addUser = (user) => {
      if (!user) {
        // For anonymous users, just record the socket connection
        console.log(`Anonymous user connected with socket ${socket.id}`);
        socket.userName = `anon_${socket.id.substring(0, 8)}`;
        anonymousConnections.add(socket.id);
        broadcastOnlineCount(io);
        return;
      }

      // Initialize this user's socket set if it doesn't exist
      if (!onlineUsers.has(user)) {
        onlineUsers.set(user, new Set());
      }

      // Add this socket ID to the user's set
      onlineUsers.get(user).add(socket.id);

      // Track which tab belongs to which user
      tabToUser.set(tabId, user);

      console.log(
        `User ${user} connected with socket ${socket.id} (Tab ID: ${tabId})`
      );
      console.log(`Total unique users: ${getUniqueUserCount()}`);

      // Save userName on the socket for disconnect handling
      socket.userName = user;

      // Broadcast updated count
      broadcastOnlineCount(io);
    };

    // If we got the username from auth, add them now
    if (userName) {
      addUser(userName);
    } else {
      // For users without username, generate a random identifier
      addUser(`anon_${socket.id.substring(0, 8)}`);
    }

    // Set up heartbeat to update connection timestamp
    socket.on("heartbeat", (data) => {
      // Update the timestamp to keep this connection active
      connectionTimestamps.set(socket.id, Date.now());

      // Log heartbeat with tab ID if available
      if (data && data.tabId) {
        console.log(
          `Heartbeat from ${socket.userName || "anonymous"} (Tab ID: ${
            data.tabId
          })`
        );
      }
    });

    // Or wait for the userConnected event
    socket.on("userConnected", (data) => {
      if (data && data.userName) {
        // If this was an anonymous connection before, remove it from anonymous tracking
        if (anonymousConnections.has(socket.id)) {
          anonymousConnections.delete(socket.id);
        }

        addUser(data.userName);
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
      }
    });

    // Handle first blood
    socket.on("flagFirstBlood", (data) => {
      if (!data || !data.challenge_id) return;

      // Update connection timestamp
      connectionTimestamps.set(socket.id, Date.now());

      console.log(
        `FIRST BLOOD! Challenge ${data.challenge_id} by ${
          socket.userName || data.username || "anonymous"
        }`
      );

      // Add additional data for the socket broadcast
      const broadcastData = {
        ...data,
        username: data.username || socket.userName,
        profile_image: data.profile_image || null,
        timestamp: Date.now(),
        is_first_blood: true,
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
        });
      }
    });

    socket.on("disconnect", () => {
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
        broadcastOnlineCount(io);
      }

      if (user && onlineUsers.has(user)) {
        // Remove this socket ID from the user's set
        onlineUsers.get(user).delete(socket.id);

        // If this was the user's last connection, remove them from the map
        if (onlineUsers.get(user).size === 0) {
          onlineUsers.delete(user);
          console.log(`User ${user} fully disconnected (no more tabs open)`);
        } else {
          console.log(
            `User ${user} still has ${onlineUsers.get(user).size} connections`
          );
        }

        // Broadcast updated count
        broadcastOnlineCount(io);
      }

      // Clean up leaderboard subscription if applicable
      if (socket.isInLeaderboardRoom) {
        leaderboardSubscribers.delete(socket.id);
        console.log(
          `Removed from leaderboard subscribers, remaining: ${leaderboardSubscribers.size}`
        );
      }

      // Clean up activity subscription if applicable
      if (socket.isInActivityRoom) {
        activitySubscribers.delete(socket.id);
        console.log(
          `Removed from activity subscribers, remaining: ${activitySubscribers.size}`
        );
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

      // Remove connection timestamp
      connectionTimestamps.delete(socket.id);

      // Log the current state after disconnect
      console.log(
        `Current state after disconnect - Users: ${
          onlineUsers.size
        }, Anonymous: ${
          anonymousConnections.size
        }, Total: ${getUniqueUserCount()}`
      );
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
