"use client";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Image from "next/image";
import ConfettiAnimation from "@/components/ConfettiAnimation";
import LoadingPage from "@/app/components/LoadingPage";
import { useLanguage } from "@/app/context/LanguageContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useRouter } from "next/navigation";
import { createSocket, disconnectSocket } from "@/lib/socket-client";
import { toast, Toaster } from "react-hot-toast";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { MdKeyboardArrowRight } from "react-icons/md";
import Link from "next/link";
import { HiOutlineUsers } from "react-icons/hi2";
import TeamRegistrationModal from "@/app/components/TeamRegistrationModal";
import { IoCopy } from "react-icons/io5";
import TeamDetailsModal from "@/app/components/TeamDetailsModal";
import { BiLoaderAlt } from "react-icons/bi";

export default function ChallengePage() {
  const [challenge, setChallenge] = useState(null);
  const [flags, setflags] = useState(false);
  const [flagInput, setFlagInput] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstBlood, setIsFirstBlood] = useState(false);
  const [isSubmitFlag, setIsSubmitFlag] = useState(false);
  const [points, setPoints] = useState(0);
  const [firstblood, setFirstblood] = useState(0);
  const [notfication, setNotfication] = useState(false);
  const [description, setDescription] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [activities, setActivities] = useState(false);
  const [details, setDetails] = useState(true);
  const [activitiesData, setActivitiesData] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [userData, setUserData] = useState(null);
  const [toast, setToast] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const { id } = useParams();
  const { isEnglish } = useLanguage();
  const { convertToUserTimezone, getCurrentDateInUserTimezone } =
    useUserProfile();
  const router = useRouter();

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");

        if (!token) {
          ("No token found, skipping user data fetch");
          return;
        }

        const response = await axios.get(`${apiUrl}/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000, // 5 second timeout
        });

        if (response.data && response.data.user) {
          setUserData(response.data.user);
          "User data loaded:", response.data.user.user_name;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Ensure socket is cleaned up on component unmount
  useEffect(() => {
    return () => {
      // Cleanup function - disconnect socket when component unmounts
      if (socket) {
        ("Cleaning up socket connection");
        // First leave the challenge room
        socket.emit("leaveChallengeRoom", id);
        // If there's event data with event UUID, also leave the team room
        if (challenge?.event_uuid) {
          socket.emit("leaveTeamRoom", challenge.event_uuid);
          `Left team room: ${challenge.event_uuid}`;
        }
        // Then disconnect the socket
        disconnectSocket();
      }
    };
  }, [id, socket, challenge]);

  // Initialize socket connection
  useEffect(() => {
    // Only create socket once and when we have user data
    if (!socket && userData) {
      // Create socket with best available user identifier
      const socketId =
        userData.user_name ||
        `event_visitor_${Math.random().toString(36).substring(2, 10)}`;
      `Creating new socket connection with ID: ${socketId}`;
      const newSocket = createSocket(socketId);

      // Join the challenge room
      newSocket.emit("joinChallengeRoom", id);
      `Joined challenge room: ${id}`;

      // Store the socket
      setSocket(newSocket);

      // Set up listeners
      newSocket.on("connect", () => {
        ("Socket connected successfully");
        setSocketConnected(true);
      });

      newSocket.on("disconnect", () => {
        ("Socket disconnected");
        setSocketConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setSocketConnected(false);
      });

      // Initial connection status
      setSocketConnected(newSocket.connected || false);

      // Setup heartbeat
      const heartbeatInterval = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit("heartbeat");
          setSocketConnected(true);
        } else {
          setSocketConnected(false);
        }
      }, 30000);

      // Clean up on unmount
      return () => {
        clearInterval(heartbeatInterval);
        newSocket.off("connect");
        newSocket.off("disconnect");
        newSocket.off("connect_error");
      };
    }
  }, [id, socket, userData]);

  // Set up socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Event listener for new solves - only updates challenge data, not activities
    const onNewSolve = async (data) => {
      "New solve event received:", data;

      // Show toast notification
      if (data.user_name && data.user_name !== userData?.user_name) {
        setToast({
          type: "solve",
          user: data.user_name,
          profileImage: data.profile_image || "/icon1.png",
          timestamp: new Date(),
        });

        // Auto-dismiss toast after 5 seconds
        setTimeout(() => setToast(null), 5000);
      }

      // Update challenge solve count only
      if (challenge?.solved_count !== undefined) {
        setChallenge((prev) => ({
          ...prev,
          solved_count: (prev.solved_count || 0) + 1,
        }));
      }

      // When someone solves a flag, refresh activities data for all users
      if (activities) {
        fetchActivitiesDataFromAPI();
      }
    };

    // Event listener for first blood - only updates challenge data, not activities
    const onFirstBlood = async (data) => {
      "First blood event received:", data;

      // Show toast notification
      if (data.user_name && data.user_name !== userData?.user_name) {
        setToast({
          type: "firstBlood",
          user: data.user_name,
          profileImage: data.profile_image || "/icon1.png",
          timestamp: new Date(),
        });

        // Auto-dismiss toast after 5 seconds
        setTimeout(() => setToast(null), 5000);
      }

      // Update first blood information immediately
      if (challenge?.flags_data && challenge.flags_data.length > 0) {
        setChallenge((prev) => {
          const updatedFlags = [...prev.flags_data];
          if (updatedFlags[0]) {
            updatedFlags[0] = {
              ...updatedFlags[0],
              first_blood: {
                user_name: data.user_name,
                profile_image: data.profile_image || "/icon1.png",
              },
            };
          }
          return {
            ...prev,
            flags_data: updatedFlags,
          };
        });
      }

      // When someone gets first blood, refresh activities data for all users
      if (activities) {
        fetchActivitiesDataFromAPI();
      }
    };

    // Event listener for team updates
    const onTeamUpdate = (data) => {
      "Team update received:", data;

      // If we have the team data and it matches our team
      if (
        teamData &&
        data.teamUuid === teamData.uuid &&
        challenge?.event_uuid
      ) {
        // Refresh team data using the fetchTeamInfo function that will be defined later
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");

        // Inline fetch team info to avoid dependency on fetchTeamInfo
        axios
          .get(`${apiUrl}/${challenge.event_uuid}/my-team`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((response) => {
            if (response.data?.data) {
              setTeamData(response.data.data);
            }
          })
          .catch((error) => {
            console.error("Error fetching team information:", error);
          });
      }
    };

    // Event listener for when activities data should be refreshed
    const onRefreshActivities = () => {
      ("Received signal to refresh activities data");

      // Only fetch if the user is currently on the activities tab
      if (activities) {
        fetchActivitiesDataFromAPI();
      }
    };

    // Set up event listeners
    socket.on("newSolve", onNewSolve);
    socket.on("firstBlood", onFirstBlood);
    socket.on("teamUpdate", onTeamUpdate);
    socket.on("refreshActivitiesSignal", onRefreshActivities);

    // Clean up event listeners when component unmounts
    return () => {
      socket.off("newSolve", onNewSolve);
      socket.off("firstBlood", onFirstBlood);
      socket.off("teamUpdate", onTeamUpdate);
      socket.off("refreshActivitiesSignal", onRefreshActivities);
    };
  }, [id, socket, teamData, userData, challenge, activities]);

  // Function to fetch activities data from API
  const fetchActivitiesDataFromAPI = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.get(`${apiUrl}/challenges/${id}/team-`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success" && response.data.data?.members) {
        setActivitiesData(response.data.data.members);
        ("Activities data refreshed via direct API call");

        // Set empty state flag if needed
        if (response.data.data.members.length === 0) {
          setShowEmptyState(true);
        } else {
          setShowEmptyState(false);
        }
      }
    } catch (error) {
      console.error("Error fetching activities data:", error);
      setShowEmptyState(true);
    }
  };

  // Handle parsing API date strings correctly
  const parseApiDate = (dateString) => {
    if (!dateString) return null;

    try {
      // Special handling for dates that are in the future (2025-*)
      // This is a workaround for the API returning future dates
      if (dateString.includes("2025-")) {
        // Replace 2025 with current year
        const currentYear = new Date().getFullYear();
        const adjustedDateString = dateString.replace(
          "2025-",
          `${currentYear}-`
        );

        // For ISO format dates
        if (adjustedDateString.includes("T")) {
          return new Date(adjustedDateString);
        }

        // For SQL-style dates (YYYY-MM-DD HH:MM:SS)
        const [datePart, timePart] = adjustedDateString.split(" ");
        if (!datePart || !timePart) return new Date(adjustedDateString);

        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split(":").map(Number);

        // Create date object using local time
        const date = new Date();
        date.setFullYear(year);
        date.setMonth(month - 1); // JavaScript months are 0-indexed
        date.setDate(day);
        date.setHours(hour);
        date.setMinutes(minute);
        date.setSeconds(second);

        return date;
      }

      // Normal date handling for non-future dates
      // For ISO format dates
      if (dateString.includes("T")) {
        return new Date(dateString);
      }

      // For SQL-style dates (YYYY-MM-DD HH:MM:SS)
      const [datePart, timePart] = dateString.split(" ");
      if (!datePart || !timePart) return new Date(dateString);

      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);

      // Create date object using local time
      const date = new Date();
      date.setFullYear(year);
      date.setMonth(month - 1); // JavaScript months are 0-indexed
      date.setDate(day);
      date.setHours(hour);
      date.setMinutes(minute);
      date.setSeconds(second);

      return date;
    } catch (error) {
      console.error("Error parsing date:", error, dateString);
      return new Date(dateString); // Fallback to native parsing
    }
  };

  // Initial data fetch with polling
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = Cookies.get("token");

    // Single function to fetch challenge data and associated data
    const fetchAllData = async () => {
      try {
        // Step 1: Fetch challenge data
        const challengeResponse = await axios.get(
          `${apiUrl}/event-challenges/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const challengeData = challengeResponse.data.data;
        // Add event_name from the response if available
        if (challengeResponse.data.event_name) {
          challengeData.event_name = challengeResponse.data.event_name;
        }
        setChallenge(challengeData);
        setNotFound(false);

        // Step 2: Fetch team data (if challenge data contains event_uuid)
        if (challengeData?.event_uuid) {
          try {
            const teamResponse = await axios.get(
              `${apiUrl}/${challengeData.event_uuid}/my-team`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (teamResponse.data.data) {
              setTeamData(teamResponse.data.data);
            }
          } catch (teamError) {
            console.error("Error fetching team data:", teamError);
          }
        }

        // Step 3: Fetch solved flags data
        try {
          const solvedResponse = await axios.get(
            `${apiUrl}/challenges/${id}/check`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (error) {
          console.error("Error checking solved flags:", error);
        }
      } catch (error) {
        console.error("Error fetching challenge data:", error);
        // If we get a 404 or any error, set notFound to true
        setNotFound(true);
      } finally {
        // ALWAYS set loading page to false when we're done
        setLoadingPage(false);
      }
    };

    // Initial fetch - this will set loadingPage to false when done
    fetchAllData();

    // Setup polling for just the challenge data (not the complete data)
    const pollChallengeData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/event-challenges/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const newChallengeData = response.data.data;
        // Preserve event_name during polling updates
        if (challenge?.event_name) {
          newChallengeData.event_name = challenge.event_name;
        } else if (response.data.event_name) {
          newChallengeData.event_name = response.data.event_name;
        }
        setChallenge(newChallengeData);
      } catch (error) {
        console.error("Error polling challenge data:", error);
      }
    };

    // Set up interval for polling (just the challenge, not all data)
    const intervalId = setInterval(pollChallengeData, 5000);

    // Cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }, [id]);

  // Redirect to not-found page when challenge doesn't exist
  useEffect(() => {
    if (notFound && !loadingPage) {
      router.push("/not-found");
    }
  }, [notFound, router, loadingPage]);

  const checkSolvedFlags = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.get(
        `${apiUrl}/challenges/${id}/check`,
        {
          challange_uuid: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.data?.solved_flags_data) {
        setDescription(response.data.data.solved_flags_data);
      } else {
        setDescription([]);
      }
    } catch (error) {
      setDescription([]);
    }
  };

  useEffect(() => {
    if (flags) {
      checkSolvedFlags();
    }
  }, [flags]);

  // Memoize fetchActivitiesData to prevent recreation
  const fetchActivitiesData = useCallback(async (id) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.get(`${apiUrl}/challenges/${id}/team-`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === "success" && response.data.data?.members) {
        return response.data.data.members;
      }
      return [];
    } catch (error) {
      console.error(
        "Error fetching activities data:",
        error.response?.data || error.message
      );
      return [];
    }
  }, []);

  // Fetch team information
  const fetchTeamInfo = useCallback(async (eventUuid) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.get(`${apiUrl}/${eventUuid}/my-team`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.data) {
        setTeamData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching team information:", error);
    }
  }, []);

  // Update for fetching activities when tab becomes active
  useEffect(() => {
    if (activities) {
      // Load activities data when the activities tab is active
      fetchActivitiesDataFromAPI();
    }
  }, [activities, id]);

  // Fetch team information when challenge data is loaded
  useEffect(() => {
    if (challenge?.event_uuid) {
      fetchTeamInfo(challenge.event_uuid);
    }
  }, [challenge?.event_uuid, fetchTeamInfo]);

  // Modified submitFlag function with direct broadcast integration
  const submitFlag = async () => {
    try {
      setIsLoading(true);
      setError("");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.post(
        `${apiUrl}/challenges/${id}/submit`,
        { submission: flagInput, eventChallengeUuid: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "error") {
        setError(response.data.message);
        return;
      }

      // Check for solved flags after successful submission
      await checkSolvedFlags();

      // ADDED: Check if all flags are solved
      try {
        const allFlagsCheck = await axios.get(
          `${apiUrl}/challenges/${id}/check`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (allFlagsCheck.data.data.all_flags_solved === true) {
          setIsLocked(true);
        }
      } catch (error) {
        console.error("Error checking if all flags are solved:", error);
      }

      if (response.status === 200 && response.data.status === "success") {
        try {
          // Try to get the latest team data first to ensure we have team UUID
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          const token = Cookies.get("token");

          // Get event ID from challenge
          const eventId = challenge?.event_uuid || "";

          if (eventId) {
            // Get latest team data
            const teamResponse = await axios.get(
              `${apiUrl}/${eventId}/my-team`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (teamResponse.data?.data) {
              setTeamData(teamResponse.data.data);

              // Now we have fresh team data, prepare event data
              const username =
                userData?.user_name || Cookies.get("username") || "";
              const isFirstBlood = response.data.data.is_first_blood || false;

              // CRITICAL: Use total_bytes as primary point source for consistency with API
              // Find the user's total points in the team members array
              let userPoints = 0;
              let earnedPoints = 0;

              if (
                username &&
                teamResponse.data.data.members &&
                Array.isArray(teamResponse.data.data.members)
              ) {
                const userMember = teamResponse.data.data.members.find(
                  (m) =>
                    m.username &&
                    username &&
                    m.username.toLowerCase() === username.toLowerCase()
                );
                // Use total_bytes as our primary source of truth for points
                userPoints = userMember?.total_bytes || 0;

                // Calculate earned points from what the API returns
                earnedPoints = response.data.data.points || 0;
              }

              // REMOVED: No longer broadcasting flag submission with data
              "[FLAG-SUBMIT] Signaling flag submission event:", earnedPoints;

              // Signal to all connected clients to refresh their activities data
              // This doesn't send the data itself, just tells everyone to make their own API call
              if (socket && socket.connected) {
                socket.emit("refreshActivitiesSignal", {
                  challengeId: id,
                  timestamp: Date.now(),
                });
                ("Sent signal to all users to refresh activities data");
              }

              // Now show appropriate notification
              if (isFirstBlood) {
                setIsFirstBlood(true);
                setFirstblood(earnedPoints); // Use consistent point value
              } else {
                setIsSubmitFlag(true);
                setPoints(earnedPoints); // Use consistent point value
              }

              // Direct API call to fetch and update the activities data for the current user
              if (activities) {
                fetchActivitiesDataFromAPI();
              }

              // Fetch updated team data after a short delay
              setTimeout(async () => {
                try {
                  const refreshTeamResponse = await axios.get(
                    `${apiUrl}/${eventId}/my-team`,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );
                  if (refreshTeamResponse.data?.data) {
                    setTeamData(refreshTeamResponse.data.data);
                  }
                } catch (error) {
                  console.error("Error refreshing team data:", error);
                }
              }, 1000);
            }
          }
        } catch (error) {
          console.error("Error handling flag submission after success:", error);
        }
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
      setFlagInput("");
    }
  };

  useEffect(() => {
    const solvedFlags = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(`${apiUrl}/challenges/${id}/check`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.data.all_flags_solved === true) {
          setIsLocked(true);
        }
      } catch (error) {
        console.error(
          "Error fetching activities:",
          error.response?.data || error.message
        );
      }
    };
    solvedFlags();
  }, [id]);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(`${apiUrl}/challenges/${id}/team-`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.status === "success") {
          setTeamData(response.data.data);
          // Set activities data to members array from team response
          if (response.data.data.members) {
            setActivitiesData(response.data.data.members);
          }
        } else {
          console.error("API returned non-success status:", response.data);
        }
      } catch (error) {
        console.error(
          "Error fetching team data:",
          error.response?.data || error.message
        );
      }
    };
    fetchTeamData();
  }, [id]);

  // Join or leave team rooms when challenge data changes
  useEffect(() => {
    if (socket && challenge?.event_uuid) {
      // Join the team room for this event
      socket.emit("joinTeamRoom", challenge.event_uuid);
      `Joined team room: ${challenge.event_uuid}`;

      // Clean up when component unmounts or challenge changes
      return () => {
        socket.emit("leaveTeamRoom", challenge.event_uuid);
        `Left team room: ${challenge.event_uuid}`;
      };
    }
  }, [socket, challenge?.event_uuid]);

  // Function to load activities with consistent point values
  const loadActivities = useCallback(async () => {
    if (!activities) return;
    if (!challenge?.event_uuid) return;

    try {
      setIsLoading(true);

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Data is already normalized with consistent field names in our API route
        setActivitiesData(result.data);
        `[ACTIVITIES] Loaded ${result.data.length} activities with consistent point values`;
      }
    } catch (error) {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [activities, challenge, id]);

  // Load activities whenever tab or challenge changes
  useEffect(() => {
    if (activities) {
      loadActivities();
    }
  }, [activities, loadActivities]);

  // Use SSE for another source of real-time updates
  useEffect(() => {
    if (!challenge?.event_uuid || !activities) return;

    let eventSource = null;

    try {
      // Create SSE connection
      `[SSE] Setting up connection for event ${challenge.event_uuid}`;
      eventSource = new EventSource(
        `/api/broadcast-activity?eventId=${challenge.event_uuid}`
      );

      eventSource.onopen = () => {
        `[SSE] Connection established for event ${challenge.event_uuid}`;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Skip connection establishment messages
          if (data.type === "connection_established") {
            `[SSE] Connection confirmed: ${data.clientCount} clients connected`;
            return;
          }

          // Just log the activity message but don't update state directly
          // We'll use our direct API call for that
          `[SSE] Received activity:`, data;

          // If we're on the activities tab, refresh activities data via API
          if (activities) {
            fetchActivitiesDataFromAPI();
          }

          // Show toast notification for other users' submissions
          if ((data.username || data.user_name) !== userData?.user_name) {
            toast.success(
              `${
                data.username || data.user_name || "Someone"
              } solved the challenge!`
            );
          }
        } catch (error) {
          console.error(`[SSE] Error processing event:`, error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[SSE] Error:`, error);

        // Reconnect after a short delay
        setTimeout(() => {
          if (eventSource) {
            eventSource.close();
            // The next render will recreate the connection
          }
        }, 5000);
      };
    } catch (error) {
      console.error(`[SSE] Failed to establish connection:`, error);
    }

    // Clean up the SSE connection when the component unmounts
    return () => {
      if (eventSource) {
        `[SSE] Closing connection for event ${challenge.event_uuid}`;
        eventSource.close();
      }
    };
  }, [challenge, id, activities, userData]);

  return (
    <>
      {loadingPage ? (
        <LoadingPage />
      ) : (
        <div className="max-w-[2000px] pt-36 mx-auto pb-5 relative">
          {/* Breadcrumb Navigation */}
          <div
            dir={isEnglish ? "ltr" : "rtl"}
            className="flex items-center gap-2 px-10 mb-8 text-xl"
          >
            <Link href="/events">{isEnglish ? "Events" : "الفعاليات"}</Link>
            <span className="text-gray-400 text-xl">›</span>
            {challenge?.event_uuid && (
              <>
                <Link href={`/events/${challenge.event_uuid}`}>
                  {challenge?.event_name || (isEnglish ? "Event" : "الفعالية")}
                </Link>
                <span className="text-gray-400 text-xl">›</span>
              </>
            )}
            <span className="font-medium text-[#38FFE5] text-xl">
              {challenge?.title}
            </span>
          </div>

          {/* Socket connection status indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-1 text-xs">
            <div
              className={`h-2 w-2 rounded-full ${
                socketConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-gray-400">
              {socketConnected
                ? isEnglish
                  ? "Connected"
                  : "متصل"
                : isEnglish
                ? "Disconnected"
                : "غير متصل"}
            </span>
          </div>

          {challenge?.flag_type === "multiple_individual" ? (
            challenge?.flags_data?.map((flag, index) => (
              <div key={index} className="mb-8">
                <div
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="grid grid-cols-1 px-10 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-2xl gap-4">
                    <div>
                      <Image
                        src="/blood.png"
                        alt="First Blood"
                        width={32}
                        height={32}
                        className="w-7 h-9"
                      />
                    </div>
                    <div>
                      <p>
                        {isEnglish ? "First Bytes" : "البايتس الأول"}{" "}
                        <span>{flag.name}</span>
                      </p>
                      {flag.first_blood != null ? (
                        <div className="flex mt-2 items-center gap-1">
                          {" "}
                          <Image
                            src={
                              flag.first_blood?.profile_image || "/icon1.png"
                            }
                            alt="First Blood"
                            width={30}
                            height={30}
                            className={
                              flag.first_blood?.profile_image
                                ? "rounded-full w-[30px] h-[30px]"
                                : "w-[30px] h-[30px]"
                            }
                          />
                          <p
                            onClick={() =>
                              router.push(
                                `/profile/${flag.first_blood?.user_name}`
                              )
                            }
                            className="text-white font-semibold cursor-pointer"
                          >
                            {flag.first_blood?.user_name}
                          </p>
                        </div>
                      ) : isEnglish ? (
                        "Not yet"
                      ) : (
                        "لا يوجد حتي الان"
                      )}
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-2xl gap-4">
                    <div>
                      <Image
                        src="/byte.png"
                        alt="Challenge Bytes"
                        width={32}
                        height={32}
                        className="w-9 h-9"
                      />
                    </div>
                    <div>
                      <p>
                        {isEnglish ? "Bytes" : "بايتس"} <span>{flag.name}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-white">{flag.bytes}</span>
                        {isEnglish ? "Bytes" : "بايتس"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-2xl gap-4">
                    <div>
                      <Image
                        src="/icon20.png"
                        alt="Hacks"
                        width={32}
                        height={32}
                        className="w-9 h-10"
                      />
                    </div>
                    <div>
                      <p>{isEnglish ? "Hacks" : "الأختراقات"}</p>
                      <p className="flex items-center gap-1">
                        <span className="text-white">{flag.solved_count}</span>
                        {isEnglish ? "Hack" : "أختراق"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : challenge?.flags_data || challenge?.flag_data ? (
            <div className="mb-8">
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="grid grid-cols-1 px-10 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-2xl gap-4">
                  <div>
                    <Image
                      src="/blood.png"
                      alt="First Blood"
                      width={32}
                      height={32}
                      className="w-7 h-9"
                    />
                  </div>
                  <div>
                    <p>{isEnglish ? "First Bytes" : "البايتس الأول"}</p>
                    {challenge?.flags_data?.[0]?.first_blood != null ? (
                      <div className="flex mt-2 items-center gap-1">
                        <Image
                          src={
                            challenge?.flags_data?.[0]?.first_blood
                              ?.profile_image || "/icon1.png"
                          }
                          alt="First Blood"
                          width={30}
                          height={30}
                          className={
                            challenge?.flags_data?.[0]?.first_blood
                              ?.profile_image
                              ? "rounded-full w-[30px] h-[30px]"
                              : "w-[30px] h-[30px]"
                          }
                        />
                        <p
                          onClick={() =>
                            router.push(
                              `/profile/${challenge?.flags_data?.[0]?.first_blood?.user_name}`
                            )
                          }
                          className="text-white font-semibold cursor-pointer"
                        >
                          {challenge?.flags_data?.[0]?.first_blood?.user_name}
                        </p>
                      </div>
                    ) : isEnglish ? (
                      "Not yet"
                    ) : (
                      "لا يوجد حتي الان"
                    )}
                  </div>
                </div>

                <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-2xl gap-4">
                  <div>
                    <Image
                      src="/byte.png"
                      alt="Challenge Bytes"
                      width={32}
                      height={32}
                      className="w-9 h-9"
                    />
                  </div>
                  <div>
                    <p>{isEnglish ? "Challenge Bytes" : "بايتس التحدي"}</p>
                    <p className="flex items-center gap-1">
                      <span className="text-white">{challenge?.bytes}</span>
                      {isEnglish ? "Bytes" : "بايتس"}
                    </p>
                  </div>
                </div>

                <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-2xl gap-4">
                  <div>
                    <Image
                      src="/icon20.png"
                      alt="Hacks"
                      width={32}
                      height={32}
                      className="w-9 h-10"
                    />
                  </div>
                  <div>
                    <p>{isEnglish ? "Hacks" : "الأختراقات"}</p>
                    <p className="flex items-center gap-1">
                      <span className="text-white">
                        {challenge?.solved_count}
                      </span>
                      {isEnglish ? "Hack" : "أختراق"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div
            dir={isEnglish ? "ltr" : "rtl"}
            className="pt-10 pb-5 px-5 bg-[#FFFFFF0D] rounded-2xl mx-10"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Image
                  src={challenge?.category_icon_url || "/challnge3.png"}
                  height={32}
                  width={32}
                  alt={`${challenge?.title || "Challenge"} icon`}
                />
                <p className="text-lg font-semibold">{challenge?.title}</p>
              </div>
              <div>
                <p className="font-bold">
                  {isEnglish ? "By" : "بواسطة"}{" "}
                  {challenge?.made_by_url ? (
                    <a
                      href={challenge.made_by_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#38FFE5] hover:underline"
                    >
                      {challenge?.made_by}
                    </a>
                  ) : (
                    challenge?.made_by
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-gray-300 text-[18px]">
                {challenge?.description}
              </p>
              {challenge?.keywords && challenge?.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {challenge.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="bg-zinc-800 text-white text-sm px-4 py-2 rounded-full w-fit"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-10">
                {isEnglish ? "Difficulty Level" : "مستوى الصعوبة"}:
                {challenge?.difficulty === "سهل" && (
                  <span className="text-[#00D0FF] font-semibold">
                    {isEnglish ? "Easy" : "سهل"}
                  </span>
                )}
                {challenge?.difficulty === "متوسط" && (
                  <span className="text-[#9DFF00] font-semibold">
                    {isEnglish ? "Medium" : "متوسط"}
                  </span>
                )}
                {challenge?.difficulty === "صعب" && (
                  <span className="text-red-500 font-semibold">
                    {isEnglish ? "Hard" : "صعب"}
                  </span>
                )}
                {challenge?.difficulty === "صعب جدا" && (
                  <span className="text-red-700 font-semibold">
                    {isEnglish ? "Very Hard" : "صعب جدا"}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="relative">
            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex mx-10 pt-10 items-center gap-4"
            >
              <button
                onClick={() => {
                  setDetails(true);
                  setActivities(false);
                }}
                className={`text-lg font-semibold pb-2 cursor-pointer ${
                  details ? "border-b-4 border-[#38FFE5]" : ""
                }`}
              >
                {isEnglish ? "Challenge Details" : "تفاصيل التحدي"}
              </button>

              <button
                onClick={async () => {
                  setDetails(false);
                  setActivities(true);
                }}
                className={`text-lg font-semibold pb-2 cursor-pointer ${
                  activities ? "border-b-4 border-[#38FFE5]" : ""
                }`}
              >
                {isEnglish ? "Activities" : "الأنشطة"}
              </button>
            </div>

            {details && (
              <div
                dir={isEnglish ? "rtl" : "ltr"}
                className={`grid grid-cols-1 md:grid-cols-${
                  challenge?.file && challenge?.link ? "3" : "2"
                } gap-6 mx-10 mt-10`}
              >
                {/* Flag Submission Section */}
                <div
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="bg-[#FFFFFF0D] relative rounded-2xl p-6 flex flex-col min-h-[250px]"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <Image
                      src="/flag.png"
                      alt="Flag"
                      width={32}
                      height={32}
                      priority
                    />
                    <h3 className="text-lg font-semibold">
                      {isEnglish ? "Submit Flag" : "تسليم العلم"}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    {isEnglish
                      ? "Found the flag? Enter it below"
                      : "هل وجدت العلم؟ أدخله بالأسفل"}
                  </p>
                  {challenge?.flag_type === "multiple_all" && (
                    <button
                      onClick={() => {
                        setflags(true);
                      }}
                      className={`text-[#38FFE5] ${
                        isEnglish ? "text-left" : "text-right"
                      } pt-1 cursor-pointer`}
                    >
                      {isEnglish ? "See More" : "see more"}
                    </button>
                  )}

                  {isLocked ? (
                    <div className="absolute bottom-7 w-full  right-1/2 translate-x-1/2">
                      <Image
                        className="mx-auto"
                        src="/lock2.png"
                        alt="Lock"
                        width={48}
                        height={48}
                      />
                      <p className="text-white text-[20px] text-center ">
                        {isEnglish
                          ? "Congratulations! You have completed the challenge"
                          : "تهانينا! لقد أتممت التحدي بنجاح"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center lg:flex-row flex-col gap-4 mt-auto">
                        <div className=" w-full lg:w-2/3">
                          <input
                            type="text"
                            placeholder={isEnglish ? "Flag" : "العلم"}
                            className="bg-[#0B0D0F] w-full border border-gray-700 rounded-lg p-3 text-white"
                            value={flagInput}
                            onChange={(e) => setFlagInput(e.target.value)}
                          />
                        </div>

                        <button
                          onClick={submitFlag}
                          disabled={isLoading}
                          className="bg-[#38FFE5] w-full lg:w-1/3 py-3 cursor-pointer hover:bg-[#38FFE5]/90 text-black font-semibold px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : isEnglish ? (
                            "Submit"
                          ) : (
                            "تسليم"
                          )}
                        </button>
                      </div>

                      {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Challenge Files Section */}
                {challenge?.file && (
                  <div
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="bg-[#FFFFFF0D] rounded-2xl p-6 flex flex-col min-h-[250px]"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <Image
                        src="/files.png"
                        alt="Files"
                        width={32}
                        height={32}
                        priority
                      />
                      <h3 className="text-lg font-semibold">
                        {isEnglish ? "Challenge Files" : "ملفات التحدي"}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      {isEnglish
                        ? "Download required challenge files"
                        : "تحميل الملفات المطلوبة للتحدي"}
                    </p>
                    <div className="mt-auto">
                      <a
                        href={challenge.file}
                        download
                        className="lg:w-1/2 bg-transparent w-full cursor-pointer border border-[#38FFE5] hover:bg-[#38FFE5]/10 text-[#38FFE5] font-semibold py-3 rounded-xl transition-all inline-block text-center"
                      >
                        {isEnglish ? "Download File" : "تحميل الملف"}
                      </a>
                    </div>
                  </div>
                )}

                {/* Challenge Link Section */}
                {challenge?.link && (
                  <div
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="bg-[#FFFFFF0D] rounded-2xl p-6 flex flex-col min-h-[250px]"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <Image
                        src="/links.png"
                        alt="Link"
                        width={32}
                        height={32}
                        priority
                      />
                      <h3 className="text-lg font-semibold">
                        {isEnglish
                          ? "Click to go to challenge page"
                          : "اضغط للانتقال إلى صفحة التحدي"}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-400">
                      {isEnglish
                        ? "Click to go to challenge page"
                        : "اضغط للانتقال إلى صفحة التحدي"}
                    </p>
                    <div className="mt-auto">
                      <button
                        onClick={() => window.open(challenge.link, "_blank")}
                        className="lg:w-1/2 w-full bg-transparent cursor-pointer border border-[#38FFE5] hover:bg-[#38FFE5]/10 text-[#38FFE5] font-semibold py-3 rounded-xl transition-all"
                      >
                        {isEnglish ? "Start Challenge" : "ابدأ التحدي"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* activities table  */}
            {activities && (
              <div>
                <div
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="pt-10 pb-2 mx-10"
                >
                  <h2 className="text-white text-2xl font-semibold">
                    {isEnglish ? "Challenge Hackers" : "مخترقو التحدي"}
                  </h2>
                  <p className="text-[#BCC9DB] pt-2 text-[18px]">
                    {isEnglish
                      ? "All players who hacked the challenge"
                      : "جميع اللاعبون الذين اخترقوا التحدي"}
                  </p>
                </div>

                {activitiesData && activitiesData.length > 0 ? (
                  <div
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="mx-10 mb-5 pb-5 mt-10 bg-[#06373F26] px-5 rounded-2xl"
                  >
                    {activitiesData.map((user, index) => {
                      // Generate a guaranteed unique key that won't be NaN
                      const userKey = `${index}-${
                        user.username ||
                        user.user_name ||
                        user.userName ||
                        "unknown"
                      }-${Date.now()}`;

                      // Get the most recent solved_at time
                      const latestSolvedAt = user.solved_at
                        ? convertToUserTimezone(parseApiDate(user.solved_at))
                        : user.solved_flags?.length > 0
                        ? convertToUserTimezone(
                            parseApiDate(
                              user.solved_flags.reduce((latest, flag) => {
                                const flagDate = parseApiDate(flag.solved_at);
                                const latestDate = parseApiDate(latest);
                                return flagDate > latestDate
                                  ? flag.solved_at
                                  : latest;
                              }, user.solved_flags[0].solved_at)
                            )
                          )
                        : null;

                      // Format the time difference
                      const formatTimeAgo = (date) => {
                        if (!date)
                          return isEnglish
                            ? "Not solved yet"
                            : "لم يتم الحل بعد";

                        try {
                          // Get current time
                          const now = new Date();

                          // Get hours and minutes from both dates
                          const nowHours = now.getHours();
                          const nowMinutes = now.getMinutes();
                          const solvedHours = date.getHours();
                          const solvedMinutes = date.getMinutes();

                          // Calculate time difference directly (simplified approach)
                          // If the solved time is greater than current time, assume it was from previous day
                          let hourDiff, minuteDiff;

                          if (
                            solvedHours > nowHours ||
                            (solvedHours === nowHours &&
                              solvedMinutes > nowMinutes)
                          ) {
                            // Time is from previous day, e.g. solved at 20:00, now is 16:00
                            hourDiff = 24 - solvedHours + nowHours;

                            // Adjust for minutes
                            if (nowMinutes < solvedMinutes) {
                              hourDiff--;
                              minuteDiff = 60 - solvedMinutes + nowMinutes;
                            } else {
                              minuteDiff = nowMinutes - solvedMinutes;
                            }
                          } else {
                            // Same day
                            hourDiff = nowHours - solvedHours;

                            // Adjust for minutes
                            if (nowMinutes < solvedMinutes) {
                              hourDiff--;
                              minuteDiff = 60 - solvedMinutes + nowMinutes;
                            } else {
                              minuteDiff = nowMinutes - solvedMinutes;
                            }
                          }

                          // Show minutes if less than an hour
                          if (hourDiff === 0) {
                            // If very recent (less than 5 minutes)
                            if (minuteDiff < 5) {
                              return isEnglish ? "Just now" : "الآن";
                            }

                            return isEnglish
                              ? `${minuteDiff} minute${
                                  minuteDiff !== 1 ? "s" : ""
                                } ago`
                              : `منذ ${minuteDiff} دقيقة`;
                          }

                          // Show hours
                          return isEnglish
                            ? `${hourDiff} hour${hourDiff !== 1 ? "s" : ""} ago`
                            : `منذ ${hourDiff} ساعة`;
                        } catch (error) {
                          console.error("Error calculating time:", error);
                          return isEnglish ? "Recently" : "حديثا";
                        }
                      };

                      return (
                        <div
                          key={userKey}
                          className={`flex items-center justify-between flex-wrap py-5 rounded-2xl px-5 ${
                            index % 2 === 0 ? "bg-transparent" : "bg-[#06373F]"
                          }`}
                        >
                          <div className="flex items-center gap-8">
                            <div>
                              <Image
                                src={
                                  user.is_first_blood
                                    ? "/blood.png"
                                    : "/flag.png"
                                }
                                alt="flag"
                                width={32}
                                height={32}
                                className="w-7 h-9"
                              />
                            </div>
                            <div
                              onClick={() => {
                                // Handle different possible username fields
                                const displayUsername =
                                  user.username ||
                                  user.user_name ||
                                  user.userName ||
                                  "Unknown User";
                                router.push(`/profile/${displayUsername}`);
                              }}
                              className="flex items-center gap-4 cursor-pointer"
                            >
                              <Image
                                src={user.profile_image || "/icon1.png"}
                                alt="profile"
                                width={32}
                                height={32}
                              />
                              <p className="text-xl font-semibold">
                                {/* Display username with fallbacks for different field names */}
                                {user.username ||
                                  user.user_name ||
                                  user.userName ||
                                  "Unknown User"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <p
                              className="text-[#BCC9DB] text-[18px]"
                              title={
                                latestSolvedAt
                                  ? latestSolvedAt.toLocaleString(
                                      isEnglish ? "en-US" : "ar-SA"
                                    )
                                  : ""
                              }
                            >
                              {formatTimeAgo(latestSolvedAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#FFFFFF0D] rounded-2xl p-4 sm:p-6 mt-4 mx-10">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Image
                        src="/ranking.png"
                        height={80}
                        width={80}
                        alt="activities"
                        className="w-16 h-16 sm:w-20 sm:h-20 mb-4"
                      />
                      <h3 className="text-lg sm:text-xl font-medium text-center">
                        {isEnglish
                          ? "No activities to show yet"
                          : "لا توجد أنشطة لعرضها حتى الآن"}
                      </h3>
                      <p className="text-sm text-gray-400 mt-2 text-center max-w-md">
                        {isEnglish
                          ? "Team activities will appear here once the event starts"
                          : "ستظهر أنشطة الفريق هنا بمجرد بدء الفعالية"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* flag pop up  */}
          {challenge?.flag_type === "multiple_all" && flags && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                onClick={() => setflags(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
              />
              <div className="relative z-10 bg-[#131619] rounded-2xl p-6 w-full max-w-[600px] mx-4">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <Image
                    src="/flag.png"
                    width={50}
                    height={50}
                    alt="flag"
                    priority
                  />
                  <h3 className="text-xl font-semibold text-white">
                    {isEnglish ? "Challenge Flags" : "أعلام التحدي"}
                  </h3>
                  <p className="text-gray-400">
                    {isEnglish
                      ? "Flags for this challenge"
                      : "الأعلام الخاصة بهذا التحدي"}
                  </p>
                </div>

                {Array.isArray(description) && description.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {challenge?.flags_data?.map((flag, index) => {
                      const solvedFlag = description.find(
                        (solved) => solved.id === flag.id
                      );
                      return (
                        <div
                          key={index}
                          className="flex flex-col items-center gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-center text-gray-400">
                              {flag.description}
                            </p>
                            {solvedFlag && (
                              <Image
                                src="/right1.png"
                                alt="check"
                                width={20}
                                height={20}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {challenge?.flags_data?.map((flag, index) => (
                      <div
                        key={index}
                        className="flex flex-col items-center gap-2"
                      >
                        <p className="text-center text-gray-400">
                          {flag.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setflags(false)}
                    className="bg-[#38FFE5] cursor-pointer text-black font-semibold px-8 py-2 rounded-xl hover:bg-[#38FFE5]/90 transition-all"
                  >
                    {isEnglish ? "Go Back" : "الرجوع للخلف"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* First blood animation card  */}
          {isFirstBlood && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] ">
              <div
                onClick={() => setIsFirstBlood(false)}
                className="blood-bg relative flex items-center w-[600px] h-[600px] justify-center overflow-hidden"
              >
                <div className="flex items-center justify-center bg-[#131619] min-w-[300px] md:min-w-[600px] relative z-10 min-h-[300px] rounded-lg p-4">
                  <div>
                    <div className="flex items-center justify-center gap-4 pb-16">
                      <h3 className="text-white text-xl md:text-2xl font-semibold">
                        {isEnglish ? "First Blood" : "الدم الأول"}
                      </h3>
                      <Image
                        src="/blood.png"
                        alt="First Blood"
                        width={32}
                        height={32}
                        priority
                        className="w-7 h-9"
                      />
                    </div>

                    <div>
                      <p className="text-white text-xl md:text-2xl text-center font-semibold">
                        {isEnglish
                          ? "Congratulations! You got the first blood"
                          : "تهانينا! لقد حزت على العلم الأول"}
                      </p>
                      <p
                        dir="rtl"
                        className="text-white text-center text-xl md:text-2xl font-semibold"
                      >
                        <span className="text-red-500"> {firstblood} </span>
                        <span dir="rtl" className="text-red-500">
                          {isEnglish ? "Bytes" : "بايتس"}{" "}
                        </span>
                        {isEnglish
                          ? "will be added to your account"
                          : "ستضاف إلى حسابك"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Submit flag animation  */}
          {isSubmitFlag && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center"
              onClick={() => setIsSubmitFlag(false)}
            >
              <ConfettiAnimation />
              <div className="flex items-center justify-center bg-[#131619] min-w-[300px] md:min-w-[600px] min-h-[300px] rounded-2xl p-4">
                <div>
                  <div className="flex items-center justify-center gap-4 pb-16">
                    <h3 className="text-white text-xl md:text-2xl font-semibold">
                      {isEnglish ? "Correct Flag" : "العلم صحيح"}
                    </h3>
                    <Image
                      src="/flag.png"
                      alt="First Blood"
                      width={32}
                      height={32}
                    />
                  </div>

                  <div>
                    <p className="text-white text-xl md:text-2xl text-center font-semibold">
                      {isEnglish
                        ? "Congratulations! You captured the flag"
                        : "تهانينا! لقد التقط العلم"}
                    </p>
                    <p
                      dir="rtl"
                      className="text-white text-center text-xl md:text-2xl font-semibold"
                    >
                      <span className="text-[#38FFE5]">{points}</span>
                      <span dir="rtl" className="text-[#38FFE5]">
                        {isEnglish ? "Bytes" : "بايتس"}{" "}
                      </span>
                      {isEnglish
                        ? "will be added to your account"
                        : "ستضاف إلي حسابك"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Notification flag  */}
          {notfication && (
            <div className="w-full h-full fixed inset-0 z-50">
              <div className="absolute bottom-4 right-4 w-fit z-50">
                <div className="bg-[#131619] border border-[#38FFE5] rounded-2xl p-4 shadow-lg slide-in-animation">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-white text-lg font-semibold">
                        {isEnglish
                          ? "Congratulations! You captured the flag"
                          : "تهانينا! لقد التقط العلم"}
                      </h3>
                    </div>
                    <Image src="/flag.png" alt="Flag" width={24} height={24} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <style jsx global>{`
            @keyframes slideInFromLeft {
              0% {
                transform: translateX(100%);
                opacity: 0;
              }
              100% {
                transform: translateX(0);
                opacity: 1;
              }
            }

            .slide-in-animation {
              animation: slideInFromLeft 0.5s ease-out forwards;
            }

            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }

            @keyframes pulse {
              0% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.05);
              }
              100% {
                transform: scale(1);
              }
            }

            @keyframes scaleIn {
              from {
                transform: scale(0.9);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }

            .animate-fadeIn {
              animation: fadeIn 0.3s ease-in forwards;
            }

            .animate-pulse {
              animation: pulse 3s infinite ease-in-out;
            }

            .animate-scaleIn {
              animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)
                forwards;
            }

            .blood-bg::before {
              content: "";
              position: absolute;
              inset: 0;
              background: url("/blooda.png") center/cover no-repeat;
              z-index: 0;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
