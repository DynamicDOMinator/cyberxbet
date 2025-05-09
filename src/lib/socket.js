import { Server } from "socket.io";

let io;
let onlineUsers = new Set();
// Track users in challenge rooms
let challengeRooms = {};
// Track users in team rooms
let teamRooms = {};
// Track last activity timestamps for each challenge
let challengeActivities = new Map();
// Track team updates
let teamActivities = new Map();
// System state
let systemFrozen = false;

export function initializeSocket(server) {
  if (!io) {
    io = new Server(server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Add user to online users set
      onlineUsers.add(socket.id);

      // Send initial online count to all clients
      io.emit("onlineCount", onlineUsers.size);

      // Send initial freeze state to the client
      socket.emit("system_freeze", { frozen: systemFrozen });

      // Handle user joining a team room
      socket.on("joinTeamRoom", (eventId) => {
        console.log(`User ${socket.id} joined team room for event: ${eventId}`);
        socket.join(`team_${eventId}`);

        // Store user info on the socket if it's available
        if (!socket.userData && socket.handshake.auth.userName) {
          socket.userData = {
            userName: socket.handshake.auth.userName,
          };
        }

        // Track users in team rooms
        if (!teamRooms[eventId]) {
          teamRooms[eventId] = new Set();
        }
        teamRooms[eventId].add(socket.id);

        // If there's recent team activity for this event, send it to the newly joined user
        if (teamActivities.has(eventId)) {
          const activities = teamActivities.get(eventId);
          // Only send activities from the last hour
          const recentActivities = activities.filter(
            (activity) => Date.now() - activity.timestamp < 60 * 60 * 1000
          );

          if (recentActivities.length > 0) {
            socket.emit("recentTeamUpdates", {
              eventId,
              updates: recentActivities,
            });
          }
        }
      });

      // Handle user leaving a team room
      socket.on("leaveTeamRoom", (eventId) => {
        console.log(`User ${socket.id} left team room for event: ${eventId}`);
        socket.leave(`team_${eventId}`);

        // Remove from tracking
        if (teamRooms[eventId]) {
          teamRooms[eventId].delete(socket.id);

          if (teamRooms[eventId].size === 0) {
            delete teamRooms[eventId];
          }
        }
      });

      // Handle team updates
      socket.on("teamUpdate", (data) => {
        if (!data || !data.eventId) return;

        console.log(
          `Team update for event ${data.eventId} by ${
            socket.userData?.userName || "anonymous"
          }: ${data.action}`
        );

        // Store the activity for new joiners
        if (!teamActivities.has(data.eventId)) {
          teamActivities.set(data.eventId, []);
        }

        const activityList = teamActivities.get(data.eventId);
        // Add timestamp if not present
        const activityData = {
          ...data,
          timestamp: data.timestamp || Date.now(),
        };
        activityList.push(activityData);

        // Limit to 100 most recent activities
        if (activityList.length > 100) {
          teamActivities.set(data.eventId, activityList.slice(-100));
        }

        // Broadcast to all users in the team room
        io.to(`team_${data.eventId}`).emit("teamUpdate", activityData);
      });

      // Handle user joining a challenge room
      socket.on("joinChallengeRoom", (challengeId) => {
        console.log(`User ${socket.id} joined challenge room: ${challengeId}`);
        socket.join(`challenge_${challengeId}`);

        // Store user info on the socket if it's available
        if (!socket.userData && socket.handshake.auth.userName) {
          socket.userData = {
            userName: socket.handshake.auth.userName,
          };
        }

        // Track users in challenge rooms
        if (!challengeRooms[challengeId]) {
          challengeRooms[challengeId] = new Set();
        }
        challengeRooms[challengeId].add(socket.id);

        // Emit the count of users in this challenge room
        io.to(`challenge_${challengeId}`).emit("challengeRoomCount", {
          challenge_id: challengeId,
          count: challengeRooms[challengeId].size,
        });

        // If there's recent activity for this challenge, send it to the newly joined user
        if (challengeActivities.has(challengeId)) {
          const activity = challengeActivities.get(challengeId);
          // Only send if activity is from the last 60 seconds (avoid sending old data)
          if (Date.now() - activity.timestamp < 60000) {
            socket.emit(activity.type, activity.data);
          }
        }
      });

      // Handle user leaving a challenge room
      socket.on("leaveChallengeRoom", (challengeId) => {
        console.log(`User ${socket.id} left challenge room: ${challengeId}`);
        socket.leave(`challenge_${challengeId}`);

        // Remove from tracking
        if (challengeRooms[challengeId]) {
          challengeRooms[challengeId].delete(socket.id);

          if (challengeRooms[challengeId].size === 0) {
            delete challengeRooms[challengeId];
          } else {
            // Emit updated count
            io.to(`challenge_${challengeId}`).emit("challengeRoomCount", {
              challenge_id: challengeId,
              count: challengeRooms[challengeId].size,
            });
          }
        }
      });

      // Handle flag submission
      socket.on("flagSubmitted", (data) => {
        console.log(`Flag submitted in challenge: ${data.challenge_id}`);

        // Store the activity for new joiners
        challengeActivities.set(data.challenge_id, {
          type: "newSolve",
          data: {
            ...data,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        });

        // Broadcast to all users in the challenge room except the sender
        socket.broadcast.to(`challenge_${data.challenge_id}`).emit("newSolve", {
          ...data,
          timestamp: Date.now(),
        });

        // If event ID and team UUID are included, also broadcast to the team room
        if (data.eventId && data.teamUuid) {
          console.log(
            `Broadcasting flag submission to team room: ${data.eventId}`
          );
          io.to(`team_${data.eventId}`).emit("flagSubmitted", {
            ...data,
            timestamp: Date.now(),
          });
        }
      });

      // Handle first blood
      socket.on("flagFirstBlood", (data) => {
        console.log(`First blood in challenge: ${data.challenge_id}`);

        // Store the activity for new joiners
        challengeActivities.set(data.challenge_id, {
          type: "firstBlood",
          data: {
            ...data,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        });

        // Broadcast to all users in the challenge room including the sender
        io.to(`challenge_${data.challenge_id}`).emit("firstBlood", {
          ...data,
          timestamp: Date.now(),
        });

        // If event ID and team UUID are included, also broadcast to the team room
        if (data.eventId && data.teamUuid) {
          console.log(`Broadcasting first blood to team room: ${data.eventId}`);
          io.to(`team_${data.eventId}`).emit("flagFirstBlood", {
            ...data,
            timestamp: Date.now(),
          });
        }
      });

      // Handle admin freeze control
      socket.on("admin_freeze_control", (data) => {
        try {
          // Check if the user has admin privileges
          if (socket.userData && socket.userData.isAdmin) {
            console.log(
              `Admin freeze control: ${data.freeze ? "freeze" : "unfreeze"}`
            );
            systemFrozen = data.freeze;

            // Broadcast to all clients
            io.emit("system_freeze", { frozen: systemFrozen });

            // Send confirmation to the admin
            socket.emit("admin_freeze_response", {
              success: true,
              frozen: systemFrozen,
            });
          } else {
            // Unauthorized attempt
            console.log(
              `Unauthorized freeze control attempt by socket ${socket.id}`
            );
            socket.emit("admin_freeze_response", {
              success: false,
              message: "Unauthorized",
            });
          }
        } catch (error) {
          console.error("Error in freeze control handler:", error);
          socket.emit("admin_freeze_response", {
            success: false,
            message: "Error processing request",
          });
        }
      });

      // Handle user disconnection
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        onlineUsers.delete(socket.id);
        io.emit("onlineCount", onlineUsers.size);

        // Remove from any challenge rooms
        for (const [challengeId, users] of Object.entries(challengeRooms)) {
          if (users.has(socket.id)) {
            users.delete(socket.id);

            if (users.size === 0) {
              delete challengeRooms[challengeId];
            } else {
              // Emit updated count
              io.to(`challenge_${challengeId}`).emit("challengeRoomCount", {
                challenge_id: challengeId,
                count: users.size,
              });
            }
          }
        }

        // Remove from any team rooms
        for (const [eventId, users] of Object.entries(teamRooms)) {
          if (users.has(socket.id)) {
            users.delete(socket.id);

            if (users.size === 0) {
              delete teamRooms[eventId];
            }
          }
        }
      });
    });
  }

  return io;
}

export function getOnlineCount() {
  return onlineUsers.size;
}

export function getChallengeRoomCount(challengeId) {
  return challengeRooms[challengeId]?.size || 0;
}

export function getTeamRoomCount(eventId) {
  return teamRooms[eventId]?.size || 0;
}

export function getIO() {
  return io;
}

// Function to programmatically trigger a flag submission event
export function notifyFlagSubmission(challengeId, userData) {
  if (!io) return false;

  io.to(`challenge_${challengeId}`).emit("newSolve", {
    challenge_id: challengeId,
    ...userData,
    timestamp: Date.now(),
  });

  return true;
}

// Function to programmatically trigger a first blood event
export function notifyFirstBlood(challengeId, userData) {
  if (!io) return false;

  io.to(`challenge_${challengeId}`).emit("firstBlood", {
    challenge_id: challengeId,
    ...userData,
    timestamp: Date.now(),
  });

  return true;
}

// Function to programmatically trigger a team update event
export function notifyTeamUpdate(eventId, updateData) {
  if (!io) return false;

  // Add timestamp if not present
  const data = {
    ...updateData,
    timestamp: updateData.timestamp || Date.now(),
  };

  // Store the update
  if (!teamActivities.has(eventId)) {
    teamActivities.set(eventId, []);
  }

  const activities = teamActivities.get(eventId);
  activities.push(data);

  // Limit to 100 most recent activities
  if (activities.length > 100) {
    teamActivities.set(eventId, activities.slice(-100));
  }

  // Log team update type and event ID
  console.log(`Server: Team update [${data.action}] for event ${eventId}`);

  // Broadcast to everyone in the team room
  io.to(`team_${eventId}`).emit("teamUpdate", data);

  // For points updates, also broadcast a leaderboard update
  if (data.action === "points_update") {
    console.log(
      `Server: Broadcasting points update for leaderboard: ${data.points} points`
    );

    // Create a specialized scoreboard update payload
    const scoreboardData = {
      eventId,
      teamUuid: data.teamUuid,
      teamName: data.teamName || "Unknown Team",
      username: data.username,
      points: data.points || 0,
      isFirstBlood: data.isFirstBlood || false,
      solvedCount: data.solvedCount || 1,
      timestamp: data.timestamp || Date.now(),
      challenge_name: data.challenge_name || "Challenge",
    };

    // Broadcast a leaderboard-specific event
    io.to(`team_${eventId}`).emit("leaderboardUpdate", scoreboardData);
  }

  return true;
}

// Function to get system freeze state
export function getSystemFreezeState() {
  return systemFrozen;
}

// Function to set system freeze state and broadcast to all clients
export function setSystemFreezeState(frozen, broadcastUpdate = true) {
  systemFrozen = !!frozen;

  if (broadcastUpdate && io) {
    io.emit("system_freeze", { frozen: systemFrozen });
  }

  return systemFrozen;
}
