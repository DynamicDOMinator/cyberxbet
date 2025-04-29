const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Track online users by username with their socket IDs
const onlineUsers = new Map(); // userName -> Set of socket IDs

// Function to get unique user count
const getUniqueUserCount = () => {
  return onlineUsers.size;
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

  // Function to broadcast online count to all clients
  const broadcastOnlineCount = () => {
    const count = getUniqueUserCount();
    io.emit("onlinePlayers", count);
    io.emit("onlineCount", count);
    console.log(`Broadcasting online count: ${count}`);
  };

  // Socket.IO connection handling
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Get username from auth data or wait for userConnected event
    let userName = socket.handshake.auth.userName;

    // Function to add this user
    const addUser = (user) => {
      if (!user || user === "anonymous") return;

      // Initialize this user's socket set if it doesn't exist
      if (!onlineUsers.has(user)) {
        onlineUsers.set(user, new Set());
      }

      // Add this socket ID to the user's set
      onlineUsers.get(user).add(socket.id);

      console.log(`User ${user} connected with socket ${socket.id}`);
      console.log(`Total unique users: ${getUniqueUserCount()}`);

      // Save userName on the socket for disconnect handling
      socket.userName = user;

      // Broadcast updated count
      broadcastOnlineCount();
    };

    // If we got the username from auth, add them now
    if (userName && userName !== "anonymous") {
      addUser(userName);
    }

    // Or wait for the userConnected event
    socket.on("userConnected", (data) => {
      if (data && data.userName) {
        addUser(data.userName);
      }
    });

    socket.on("disconnect", () => {
      // Get the username associated with this socket
      const user = socket.userName;
      console.log(`Socket ${socket.id} disconnected`);

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
        broadcastOnlineCount();
      }
    });
  });

  // Start the server
  server.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Next.js ready on http://localhost:3000");
    console.log("> Socket.IO initialized with path: /api/socket");
    console.log("> Current unique users:", getUniqueUserCount());
  });
});
