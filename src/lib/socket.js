import { Server } from "socket.io";

let io;
let onlineUsers = new Set();
// Track users in challenge rooms
let challengeRooms = {};
// Track last activity timestamps for each challenge
let challengeActivities = new Map();

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
