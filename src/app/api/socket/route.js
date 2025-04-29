import { NextResponse } from "next/server";

// Edge runtime for better performance on Vercel
export const runtime = "edge";
export const dynamic = "force-dynamic";

// In-memory store for this instance (note: will reset on cold starts)
let onlineUsers = [];
let onlineCount = 0;

// GET handler for polling
export async function GET(req) {
  console.log("GET /api/socket - returning online count:", onlineCount);
  return NextResponse.json({
    online: onlineCount,
    message: "Socket.IO serverless endpoint active",
  });
}

// POST handler for connect/disconnect events
export async function POST(req) {
  try {
    const data = await req.json();
    const { action, userName } = data;

    console.log(
      `Socket API: ${action} request for user ${userName || "anonymous"}`
    );

    if (action === "connect" && userName) {
      // Only add user if not already in the list
      if (!onlineUsers.includes(userName)) {
        onlineUsers.push(userName);
        onlineCount = onlineUsers.length;
        console.log(`User ${userName} connected, total: ${onlineCount}`);
      }
    } else if (action === "disconnect" && userName) {
      // Remove user from the list
      onlineUsers = onlineUsers.filter((user) => user !== userName);
      onlineCount = onlineUsers.length;
      console.log(`User ${userName} disconnected, total: ${onlineCount}`);
    }

    return NextResponse.json({ count: onlineCount });
  } catch (error) {
    console.error("Socket API error:", error.message);
    // Still return a valid response with a default count
    return NextResponse.json(
      {
        count: onlineCount || 0,
        error: "Failed to process request",
        message: error.message,
      },
      { status: 200 }
    ); // Return 200 even on error to prevent client failures
  }
}
