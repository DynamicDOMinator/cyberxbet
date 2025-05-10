import { NextResponse } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

/**
 * GET handler for fetching the latest activities from the backend API
 * Ensures we always have the most up-to-date data with correct point values
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const challengeId = searchParams.get("challengeId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Get auth token
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Determine API endpoint based on whether we're looking at all activities or challenge-specific
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const endpoint = challengeId
      ? `${apiUrl}/challenges/${challengeId}/solvers`
      : `${apiUrl}/events/${eventId}/activities`;

    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000, // 5 second timeout
    });

    if (response.status !== 200) {
      return NextResponse.json(
        { error: "Failed to fetch activities from backend" },
        { status: response.status }
      );
    }

    // Format activities data with consistent field names
    const activities = response.data.data || [];

    // Normalize field names for consistency across the application
    const normalizedActivities = activities.map((activity) => ({
      ...activity,
      // Ensure we have consistent field names
      eventId: activity.event_id || activity.eventId || eventId,
      event_id: activity.event_id || activity.eventId || eventId,

      // For challenge-specific fields
      challenge_id:
        activity.challenge_id || activity.challengeId || challengeId,
      challengeId: activity.challenge_id || activity.challengeId || challengeId,

      // For user fields
      username: activity.username || activity.user_name || activity.userName,
      user_name: activity.username || activity.user_name || activity.userName,

      // CRITICAL: Ensure points are consistent by using total_bytes as primary source
      total_bytes: activity.total_bytes || activity.points || 0,
      points: activity.total_bytes || activity.points || 0,

      // For first blood flags
      isFirstBlood: activity.is_first_blood || activity.isFirstBlood || false,
      is_first_blood: activity.is_first_blood || activity.isFirstBlood || false,

      // For team fields
      teamName: activity.team_name || activity.teamName,
      team_name: activity.team_name || activity.teamName,
      teamUuid: activity.team_uuid || activity.teamUuid,
      team_uuid: activity.team_uuid || activity.teamUuid,

      // Ensure timestamp exists
      timestamp:
        activity.timestamp ||
        activity.created_at ||
        activity.solved_at ||
        Date.now(),
    }));

    return NextResponse.json({
      success: true,
      data: normalizedActivities,
      source: "backend-api",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[API] Error fetching activities:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch activities",
        message: error.message,
        source: "activities-api",
      },
      { status: 500 }
    );
  }
}
