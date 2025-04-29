// Dummy socket client that simulates Socket.IO functionality
// This is a temporary solution until we fix the WebSocket issues

import { io } from "socket.io-client";
import Cookies from "js-cookie";

export const createSocket = (userName = null) => {
  // Get username from parameter or try to get from cookie
  const user = userName || Cookies.get("userName");

  // Connect using the path the application is expecting
  return io({
    path: "/api/socket", // Use the path the client is trying to connect to
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ["polling", "websocket"], // Try polling first, then websocket
    auth: {
      userName: user || "anonymous", // Send username as auth data
    },
  });
};
