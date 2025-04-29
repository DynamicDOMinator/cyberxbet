// Socket.IO client with Vercel compatibility
import { io } from "socket.io-client";
import Cookies from "js-cookie";
import axios from "axios";

// Check if we're running on Vercel
const isVercel =
  process.env.NEXT_PUBLIC_VERCEL_ENV ||
  window?.location?.hostname?.includes("vercel.app");

// For non-Vercel environments, use the normal Socket.IO connection
export const createSocket = (userName = null) => {
  // Get username from parameter or try to get from cookie
  const user = userName || Cookies.get("userName");

  if (isVercel) {
    // Vercel deployment - use REST API instead of WebSockets
    return createVirtualSocket(user);
  } else {
    // Local or traditional hosting - use real Socket.IO
    return io({
      path: "/api/socket",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ["polling", "websocket"], // Try polling first, then websocket
      auth: {
        userName: user || "anonymous", // Send username as auth data
      },
    });
  }
};

// Create a virtual socket object that uses REST API instead of WebSockets
// This emulates the Socket.IO interface but works on Vercel
function createVirtualSocket(userName) {
  const eventHandlers = {};
  let online = 0;
  let connected = false;

  // Connect to the API immediately
  (async () => {
    try {
      // Signal connection
      const response = await axios.post("/api/socket", {
        action: "connect",
        userName,
      });

      online = response.data.count;
      connected = true;

      // Call connect handlers
      if (eventHandlers.connect) {
        eventHandlers.connect.forEach((handler) => handler());
      }

      // Emit online count
      if (eventHandlers.onlinePlayers) {
        eventHandlers.onlinePlayers.forEach((handler) => handler(online));
      }

      if (eventHandlers.onlineCount) {
        eventHandlers.onlineCount.forEach((handler) => handler(online));
      }

      // Poll for updates every 30 seconds
      const intervalId = setInterval(async () => {
        try {
          const response = await axios.get("/api/socket");
          online = response.data.online;

          // Emit online count
          if (eventHandlers.onlinePlayers) {
            eventHandlers.onlinePlayers.forEach((handler) => handler(online));
          }

          if (eventHandlers.onlineCount) {
            eventHandlers.onlineCount.forEach((handler) => handler(online));
          }
        } catch (error) {
          console.error("Error polling for online users:", error);
        }
      }, 30000);

      // Setup cleanup
      window.addEventListener("beforeunload", async () => {
        clearInterval(intervalId);
        await axios.post("/api/socket", {
          action: "disconnect",
          userName,
        });
      });
    } catch (error) {
      console.error("Error connecting to socket API:", error);
    }
  })();

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
    },

    disconnect() {
      (async () => {
        try {
          await axios.post("/api/socket", {
            action: "disconnect",
            userName,
          });
        } catch (error) {
          console.error("Error disconnecting:", error);
        }
      })();
    },
  };
}
