import { Server } from "socket.io";

let io;
let onlineUsers = new Set();

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

      // Handle user disconnection
      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        onlineUsers.delete(socket.id);
        io.emit("onlineCount", onlineUsers.size);
      });
    });
  }

  return io;
}

export function getOnlineCount() {
  return onlineUsers.size;
}

export function getIO() {
  return io;
}
