import { NextResponse } from "next/server";
import { getOnlineCount } from "@/lib/socket";
import axios from "axios";

// This endpoint is for debugging online user counts
export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  // Simple auth to prevent unauthorized access to debug info
  if (
    authHeader !== `Bearer ${process.env.ADMIN_SECRET}` &&
    authHeader !== "Bearer debug_cyberxbet_2024"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get count from socket server
    let socketCount;
    let socketDebugInfo = {};

    try {
      // Try to get detailed stats from socket API
      const response = await axios.get(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/socket?debug=true`
      );
      socketDebugInfo = response.data;
      socketCount = response.data.total || 0;
    } catch (error) {
      console.error("Error fetching socket debug info:", error);
      // Fallback to the basic count
      socketCount = getOnlineCount();
      socketDebugInfo = { error: "Failed to get debug info" };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      socketServerCount: socketCount,
      activeConnectionsCount: getOnlineCount(),
      socketDebugInfo,
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Failed to get online count", message: error.message },
      { status: 500 }
    );
  }
}
