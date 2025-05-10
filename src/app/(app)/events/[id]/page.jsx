"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useLanguage } from "@/app/context/LanguageContext";
import { MdKeyboardArrowLeft } from "react-icons/md";
import { MdKeyboardArrowRight } from "react-icons/md";
import Link from "next/link";
import { HiOutlineUsers } from "react-icons/hi2";
import Cookies from "js-cookie";
import Image from "next/image";
import TeamRegistrationModal from "@/app/components/TeamRegistrationModal";
import { IoCopy } from "react-icons/io5";
import { toast, Toaster } from "react-hot-toast";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { createSocket } from "@/lib/socket-client";
import {
  broadcastFlagSubmission,
  listenForFlagSubmissions,
  testFlagSubmission,
  debugEventListeners,
} from "@/lib/flag-events";

import LoadingPage from "@/app/components/LoadingPage";
import { useRouter } from "next/navigation";
import TeamDetailsModal from "@/app/components/TeamDetailsModal";
import { BiLoaderAlt } from "react-icons/bi";

export default function EventPage() {
  const { isEnglish } = useLanguage();
  const { getCurrentDateInUserTimezone, timeZone, convertToUserTimezone } =
    useUserProfile();
  const router = useRouter();
  const [event, setEvent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [isEventStarted, setIsEventStarted] = useState(true);
  const [isChallengesStarted, setIsChallengesStarted] = useState(false);
  const [teams, setTeams] = useState([]);
  const [isRemove, setIsRemove] = useState(false);
  const [joinSecret, setJoinSecret] = useState(null);
  const [hasCheckedTeam, setHasCheckedTeam] = useState(false);
  const [buttonText, setButtonText] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showRegisterButton, setShowRegisterButton] = useState(true);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successIcon, setSuccessIcon] = useState(null);
  const [eventStartDate, setEventStartDate] = useState(null);
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("challenges");
  const [eventIsActive, setEveentIsActive] = useState(false);
  const [eventHasEnded, setEventHasEnded] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [isInTeam, setIsInTeam] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(null);
  const [teamView, setTeamView] = useState("members");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamImage, setNewTeamImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [isEventScoreBoard, setIsEventScoreBoard] = useState(false);
  const [scoreboardData, setScoreboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeamUuid, setSelectedTeamUuid] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isRemovedFromTeam, setIsRemovedFromTeam] = useState(false);
  const [eventEndDate, setEventEndDate] = useState(null);
  const [endTimeRemaining, setEndTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Add state for freeze status
  const [isLeaderboardFrozen, setIsLeaderboardFrozen] = useState(false);

  // Update the socket and event listener setup
  useEffect(() => {
    if (!id) return;
    console.log(`[SOCKET] Initializing socket connection for event ${id}`);

    // Use user name from cookies for a consistent connection
    const userName = Cookies.get("username");
    const newSocket = createSocket(userName);
    setSocket(newSocket);

    if (newSocket) {
      // Set up connection and event listeners
      console.log(`[SOCKET] Socket created, joining team room for event ${id}`);
      newSocket.emit("joinTeamRoom", id);

      // Set up flag submission handler with better debugging
      const handleFlagSubmission = (data) => {
        console.log(`[SOCKET] Received flag submission event:`, data);

        // Only process events for this event
        if (data.eventId === id || data.event_id === id) {
          // Handle the flag submission
          handleRealTimeActivity(data);

          // Also update the scoreboard immediately if we're viewing it
          if (activeTab === "leaderboard" && isEventScoreBoard) {
            updateScoreboardWithNewPoints(
              data.username || data.user_name,
              data.points || data.total_bytes || 0,
              data.isFirstBlood || data.is_first_blood || false,
              data.teamUuid || data.team_uuid
            );
          }
        }
      };

      // Set up team update handler with better debugging
      const handleTeamUpdate = (data) => {
        console.log(`[SOCKET] Received team update event:`, data);

        // Only process events for this event
        if (data.eventId === id || data.event_id === id) {
          // For activities tab, add the new activity
          handleRealTimeActivity(data);

          // For leaderboard, update points if applicable
          if (
            activeTab === "leaderboard" &&
            isEventScoreBoard &&
            (data.points || data.total_bytes)
          ) {
            updateScoreboardWithNewPoints(
              data.username || data.user_name,
              data.points || data.total_bytes || 0,
              data.isFirstBlood || data.is_first_blood || false,
              data.teamUuid || data.team_uuid
            );
          }

          // Force refresh team data for any team update
          setTimeout(() => {
            forceRefreshTeamData();
          }, 500);
        }
      };

      // Set up all event listeners
      newSocket.on("flagSubmitted", handleFlagSubmission);
      newSocket.on("teamUpdate", handleTeamUpdate);

      // Add connect/disconnect handlers
      newSocket.on("connect", () => {
        console.log(`[SOCKET] Socket connected successfully`);
        // Re-join room on reconnect
        newSocket.emit("joinTeamRoom", id);
      });

      // Also set up window event listener for flag submissions
      if (typeof window !== "undefined") {
        console.log("[DOM] Setting up flag_submitted event listener");

        // Function to handle DOM flag_submitted events
        const handleDomFlagEvent = (event) => {
          const data = event.detail;
          console.log("[DOM] Received flag_submitted event:", data);

          // Only process events for this event
          if ((data.eventId === id || data.event_id === id) && !data.testMode) {
            handleRealTimeActivity(data);

            // Also update the scoreboard immediately if we're viewing it
            if (activeTab === "leaderboard" && isEventScoreBoard) {
              updateScoreboardWithNewPoints(
                data.username || data.user_name,
                data.points || data.total_bytes || 0,
                data.isFirstBlood || data.is_first_blood || false,
                data.teamUuid || data.team_uuid
              );
            }
          }
        };

        // Add the event listener
        window.addEventListener("flag_submitted", handleDomFlagEvent);

        // Return cleanup function
        return () => {
          console.log(`[SOCKET+DOM] Cleaning up event listeners for ${id}`);

          // Remove socket event listeners
          if (newSocket) {
            newSocket.off("flagSubmitted", handleFlagSubmission);
            newSocket.off("teamUpdate", handleTeamUpdate);
            newSocket.emit("leaveTeamRoom", id);
          }

          // Remove DOM event listener
          window.removeEventListener("flag_submitted", handleDomFlagEvent);
        };
      }

      // If window is not defined (SSR), just return socket cleanup
      return () => {
        console.log(`[SOCKET] Cleaning up socket event listeners for ${id}`);
        if (newSocket) {
          newSocket.off("flagSubmitted", handleFlagSubmission);
          newSocket.off("teamUpdate", handleTeamUpdate);
          newSocket.emit("leaveTeamRoom", id);
        }
      };
    }
  }, [id, activeTab, isEventScoreBoard]); // Add activeTab and isEventScoreBoard to deps

  // Add a direct SSE connection as a reliable backup
  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    console.log(
      `[SSE] Setting up Server-Sent Events connection for event ${id}`
    );
    let eventSource = null;
    let reconnectAttempt = 0;
    const maxReconnectAttempts = 5;

    function setupSSE() {
      try {
        // Close existing connection if any
        if (eventSource) {
          eventSource.close();
        }

        console.log(`[SSE] Creating new SSE connection for event ${id}`);

        // Create a new connection with a random parameter to avoid caching
        eventSource = new EventSource(
          `/api/broadcast-activity?eventId=${id}&_=${Date.now()}`
        );

        eventSource.onopen = () => {
          console.log(`[SSE] Connection opened successfully for event ${id}`);
          reconnectAttempt = 0; // Reset reconnect counter on successful connection
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`[SSE] Received message for event ${id}:`, data);

            if (data.type === "connection") {
              console.log(
                `[SSE] Connection established with client ID: ${data.clientId}`
              );
            } else {
              // Process activity data
              console.log(`[SSE] Processing activity data:`, data);
              handleRealTimeActivity(data);
            }
          } catch (error) {
            console.error(`[SSE] Error parsing SSE message:`, error);
          }
        };

        eventSource.onerror = (error) => {
          console.error(`[SSE] Connection error for event ${id}:`, error);

          // Close current connection
          eventSource.close();
          console.log(`[SSE] Closed errored connection`);

          // Attempt to reconnect with backoff
          if (reconnectAttempt < maxReconnectAttempts) {
            reconnectAttempt++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
            console.log(
              `[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempt}/${maxReconnectAttempts})`
            );

            setTimeout(() => {
              console.log(`[SSE] Attempting to reconnect...`);
              setupSSE();
            }, delay);
          } else {
            console.log(`[SSE] Max reconnect attempts reached, giving up`);
          }
        };
      } catch (error) {
        console.error(`[SSE] Error setting up SSE:`, error);
      }
    }

    // Setup initial connection
    setupSSE();

    // Also add a periodic reconnect to ensure connection stays fresh
    const reconnectInterval = setInterval(() => {
      console.log(`[SSE] Performing scheduled reconnect for event ${id}`);
      setupSSE();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Clean up on unmount
    return () => {
      console.log(`[SSE] Cleaning up SSE connection for event ${id}`);
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(reconnectInterval);
    };
  }, [id]);

  // Define the event handler functions
  const handleTeamUpdate = (data) => {
    console.log("Received team update:", data);
    // Force refresh team data for any team update for this event
    if (data.eventId === id) {
      // Add small delay to ensure database has updated
      setTimeout(() => {
        forceRefreshTeamData();
      }, 500);

      // Also handle different team update events
      if (data.action === "join" || data.action === "create") {
        // Special handling for join/create events
        if (teams?.uuid === data.teamUuid) {
          getTeams();
        }
      } else if (data.action === "remove") {
        // If I was removed
        const myUsername = Cookies.get("username");
        if (data.removedUser === myUsername) {
          setTeams(null);
          setIsInTeam(false);
          setIsRemovedFromTeam(true);
          setHasCheckedTeam(true);
          setButtonText(isEnglish ? "Join Team" : "انضمام");

          // Show toast notification
          toast.error(
            isEnglish
              ? "You have been removed from the team"
              : "تمت إزالتك من الفريق"
          );
        }
      } else if (data.action === "points_update") {
        // For points updates, directly update scoreboard if we're viewing it
        if (isEventScoreBoard && activeTab === "leaderboard") {
          updateScoreboardWithNewPoints(
            data.username || data.user_name,
            data.points || 0,
            data.isFirstBlood || false,
            data.teamUuid
          );
        }

        // For activities tab, add the new activity
        handleRealTimeActivity(data);
      }
    }
  };

  const handleFlagSubmission = (data) => {
    console.log("Received flag submission:", data);

    // Ensure we have the eventId
    if (!data.eventId && data.event_id) {
      data.eventId = data.event_id;
    }

    if (data.eventId === id) {
      // Force refresh team data regardless of which team submitted
      setTimeout(() => {
        forceRefreshTeamData();
      }, 500);

      // Show a toast notification for the flag submission if it's my team
      if (teams?.uuid === data.teamUuid) {
        const username = data.username || data.user_name;
        toast.success(
          isEnglish
            ? `${username} solved a challenge for ${data.points} points!`
            : `حل ${username} تحديًا مقابل ${data.points} نقطة!`
        );
      }

      // Update scoreboard if we're viewing it
      if (isEventScoreBoard && activeTab === "leaderboard") {
        updateScoreboardWithNewPoints(
          data.username || data.user_name,
          data.points || 0,
          false,
          data.teamUuid
        );
      }

      // Always update activities regardless of active tab
      // This ensures the data is ready when user switches to activities tab
      handleRealTimeActivity(data);

      // If we're not on the activities tab, show a small notification
      if (activeTab !== "activities") {
        const username = data.username || data.user_name || "Someone";
        const challenge = data.challenge_name || "a challenge";
        toast.info(
          isEnglish
            ? `${username} just solved ${challenge}!`
            : `${username} حل للتو ${challenge}!`,
          { duration: 2000 }
        );
      }
    }
  };

  const handleFirstBlood = (data) => {
    console.log("Received first blood:", data);

    // Ensure we have the eventId
    if (!data.eventId && data.event_id) {
      data.eventId = data.event_id;
    }

    if (data.eventId === id) {
      // Force refresh team data regardless of which team got first blood
      setTimeout(() => {
        forceRefreshTeamData();
      }, 500);

      // Show a toast notification for the first blood if it's my team
      if (teams?.uuid === data.teamUuid) {
        const username = data.username || data.user_name;
        toast.success(
          isEnglish
            ? `${username} got first blood for ${data.points} points!`
            : `حصل ${username} على الدم الأول مقابل ${data.points} نقطة!`
        );
      }

      // Update scoreboard if we're viewing it
      if (isEventScoreBoard && activeTab === "leaderboard") {
        updateScoreboardWithNewPoints(
          data.username || data.user_name,
          data.points || 0,
          true,
          data.teamUuid
        );
      }

      // Always update activities regardless of active tab
      handleRealTimeActivity(data);

      // If we're not on the activities tab, show a notification about first blood
      if (activeTab !== "activities") {
        const username = data.username || data.user_name || "Someone";
        const challenge = data.challenge_name || "a challenge";
        toast.info(
          isEnglish
            ? `${username} got FIRST BLOOD on ${challenge}!`
            : `${username} حصل على الدم الأول في ${challenge}!`,
          {
            duration: 3000,
            icon: "🩸",
            style: {
              borderLeft: "4px solid red",
            },
          }
        );
      }
    }
  };

  const handleLeaderboardUpdate = (data) => {
    console.log("Received leaderboard update:", data);

    // Ensure we have the eventId
    if (!data.eventId && data.event_id) {
      data.eventId = data.event_id;
    }

    if (data.eventId === id) {
      if (isEventScoreBoard && activeTab === "leaderboard") {
        // Display a mini notification if some team scores
        if (data.teamUuid) {
          const teamName = data.teamName || "Unknown team";
          const points = data.points || 0;
          const challengeName = data.challenge_name || "a challenge";

          // Show a toast notification for all scoreboard participants
          toast.info(
            isEnglish
              ? `${teamName} solved ${challengeName} for ${points} points!`
              : `حل فريق ${teamName} التحدي ${challengeName} مقابل ${points} نقطة!`,
            { duration: 3000 }
          );
        }

        // Update the scoreboard immediately
        updateScoreboardWithNewPoints(
          data.username || data.user_name,
          data.points || 0,
          data.isFirstBlood || false,
          data.teamUuid
        );
      }

      // Always update activities regardless of active tab
      handleRealTimeActivity(data);
    }
  };

  // Add a function to force refresh team data
  const forceRefreshTeamData = async () => {
    try {
      await getTeams();
    } catch (error) {
      console.error("Error refreshing team data:", error);
    }
  };

  useEffect(() => {
    // Update the current date/time based on user's timezone
    const updateCurrentTime = () => {
      setCurrentDateTime(getCurrentDateInUserTimezone());
    };

    // Update initially
    updateCurrentTime();

    // Update every second
    const interval = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(interval);
  }, [getCurrentDateInUserTimezone]);

  const getChallenges = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/${id}/challenges`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      setChallenges(res.data.data);

      if (res.data.data.length > 0) {
        setIsChallengesStarted(true);
      }
    } catch (error) {
      if (
        error.response?.data?.message === "Event has not started yet" &&
        error.response?.data?.data?.start_date
      ) {
        setEventStartDate(error.response.data.data.start_date);
        setIsEventStarted(true);
      } else if (
        error.response?.data?.message ===
        "You are not part of any team in this event"
      ) {
        setTeams(null);
        setHasCheckedTeam(true);
        setActiveTab("team");
      }
    }
  };

  const checkIfInTeam = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/${id}/check-if-in-team`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (res.data.message === "You are in a team for this event") {
        setIsInTeam(true);
        if (currentPhase === "team_formation") {
          setButtonText(isEnglish ? "Already in Team" : "تم الانضمام");
        }

        // If the user is in a team but we don't have team data, fetch it
        if (!teams) {
          getTeams();
        }
      } else {
        setIsInTeam(false);
      }
    } catch (error) {
      console.error("Error checking team status:", error);
      setIsInTeam(false);
    }
  };

  useEffect(() => {
    // Initial data loading - only run once when component mounts or ID changes
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          getChallenges(),
          getTeams(),
          checkEventStatus(),
          getEvent(),
          eventScoreBoard(),
        ]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only re-run if the event ID changes

  useEffect(() => {
    if (!eventStartDate) return;

    const calculateTimeRemaining = () => {
      const startTime = new Date(eventStartDate).getTime();
      const now = getCurrentDateInUserTimezone().getTime();
      const difference = startTime - now;

      if (difference <= 0) {
        setIsEventStarted(false);
        // Remove the forced reload that causes infinite loop
        // window.location.reload();

        // Instead, update state properly to reflect event has started
        setIsEventStarted(false);
        getChallenges();
        checkEventStatus();

        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();

    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventStartDate, getCurrentDateInUserTimezone]); // Add getCurrentDateInUserTimezone to dependencies

  // New effect to calculate time remaining until event end
  useEffect(() => {
    if (!eventEndDate) return;

    const calculateEndTimeRemaining = () => {
      const endTime = new Date(eventEndDate).getTime();
      const now = getCurrentDateInUserTimezone().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setEventHasEnded(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      // Calculate total hours including days
      const totalHours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setEndTimeRemaining({ days, hours, totalHours, minutes, seconds });
    };

    calculateEndTimeRemaining();

    const interval = setInterval(calculateEndTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [eventEndDate, getCurrentDateInUserTimezone]);

  const formatDate = (dateString) => {
    try {
      if (!dateString)
        return isEnglish ? "Date not set" : "لم يتم تحديد التاريخ";

      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return isEnglish ? "Invalid date" : "تاريخ غير صالح";
      }

      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timeZone || undefined, // Use the user's timezone if available
      };

      return new Intl.DateTimeFormat(
        isEnglish ? "en-US" : "ar-EG",
        options
      ).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return isEnglish ? "Invalid date" : "تاريخ غير صالح";
    }
  };

  const checkEventStatus = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/${id}/check-if-event-started`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      // Default to hiding the button
      setShowRegisterButton(false);

      // Force team formation button if the message indicates team formation
      if (res.data.data && res.data.data.message === "Team formation is open") {
        setShowRegisterButton(true);
        setIsRegistering(true);
        setButtonText(isEnglish ? "Join Team" : "انضمام");
        setCurrentPhase("team_formation");

        // Check if user is already in a team
        await checkIfInTeam();

        // Skip registration check for team formation
        return;
      }

      // Handle different phases
      if (res.data.data && res.data.data.phase) {
        const phase = res.data.data.phase;
        setCurrentPhase(phase); // Store the current phase

        if (phase === "registration") {
          setShowRegisterButton(true);
          setIsRegistering(true);
          setButtonText(isEnglish ? "Register Now" : "سجل الآن");
        } else if (phase === "team_formation") {
          setShowRegisterButton(true);
          setIsRegistering(true);
          setButtonText(isEnglish ? "Join Team" : "انضمام");

          // Check if user is already in a team
          await checkIfInTeam();

          // Skip registration check for team formation
          return;
        } else if (phase === "ended") {
          setEventHasEnded(true);
          setIsEventStarted(false);
          setShowRegisterButton(false);
        } else if (phase === "event_active") {
          setEveentIsActive(true);
          setIsEventStarted(false);
          setShowRegisterButton(false);

          // Set event end date if available in the response
          if (
            res.data.data.current_phase_times &&
            res.data.data.current_phase_times.event_end
          ) {
            setEventEndDate(res.data.data.current_phase_times.event_end);
          }
        }
      }

      // For backwards compatibility
      if (
        res.data.data &&
        res.data.data.message === "Event is currently running"
      ) {
        setIsEventStarted(false);
        setShowRegisterButton(false); // Hide during event
        setEveentIsActive(true);

        // Set event end date if available in the response
        if (
          res.data.data.current_phase_times &&
          res.data.data.current_phase_times.event_end
        ) {
          setEventEndDate(res.data.data.current_phase_times.event_end);
        }
      }

      // Only check registration status if not in team formation
      await checkRegistrationStatus();
    } catch (error) {
      console.error("Error checking event status:", error);
    }
  };

  const getEvent = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/events/${id}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      setEvent(res.data.event);
    } catch (error) {
      console.error("Error fetching event:", error);
    }
  };

  const getTeams = async () => {
    // If we've already checked and there's no team, we still want to try again
    // when this is called from onSuccess where hasCheckedTeam is set to false

    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/${id}/my-team`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      setTeams(res.data.data);
      setNewTeamName(res.data.data?.name || ""); // Set current team name for edit modal
      setHasCheckedTeam(true);
      setIsInTeam(true);

      // Reset removed state if we successfully get team data
      if (isRemovedFromTeam) {
        setIsRemovedFromTeam(false);
      }

      return res;
    } catch (error) {
      console.error("Error fetching teams:", error);
      if (
        error.response?.data?.message === "You are not in a team for this event"
      ) {
        setTeams(null);
        setHasCheckedTeam(true);
        setIsInTeam(false);
      }
      throw error; // Propagate the error for proper promise handling
    }
  };

  const fetchJoinSecret = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.post(
        `${api}/teams/${teams?.uuid}/join-secrets`,
        {}, // Empty object as request body
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      setJoinSecret(res.data.data.secret);
    } catch (error) {
      console.error("Error fetching join secret:", error);
      toast.error(
        isEnglish
          ? "Failed to generate team password"
          : "فشل في إنشاء كلمة مرور الفريق"
      );
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const deleteMember = async (username) => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      await axios.delete(`${api}/teams/${teams?.uuid}/members`, {
        params: {
          username: username,
        },
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      // Emit socket event for member removal
      if (socket) {
        socket.emit("teamUpdate", {
          action: "remove",
          eventId: id,
          teamUuid: teams?.uuid,
          teamName: teams?.name,
          removedUser: username,
          removedBy: Cookies.get("username"),
        });
      }

      // Update the local state instead of full refresh
      setTeams((prevTeams) => {
        if (!prevTeams) return null;
        return {
          ...prevTeams,
          members: prevTeams.members.filter(
            (member) => member.username !== username
          ),
        };
      });

      // Show success notification
      toast.success(
        isEnglish
          ? `Removed ${username} from team`
          : `تمت إزالة ${username} من الفريق`
      );
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error(isEnglish ? "Failed to remove member" : "فشل في إزالة العضو");
    }
  };

  const registerNow = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.post(
        `${api}/${id}/register`,
        {}, // Empty request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // Update button state immediately
      setIsRegistering(false);
      setButtonText(isEnglish ? "Already Registered" : "تم التسجيل ");

      // Show success notification
      setSuccessMessage(
        isEnglish
          ? "Successfully registered for the event"
          : "تم التسجيل في الفعالية بنجاح"
      );
      setSuccessIcon(
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#38FFE5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      );
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      console.error("Error registering now:", error);
      // Show error toast
      toast.error(
        error.response?.data?.message ||
          (isEnglish ? "Registration failed" : "فشل التسجيل")
      );
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/${id}/check-registration`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (res.data.message === "You are registered for this event") {
        // If it's team formation phase, NEVER update the button
        if (currentPhase === "team_formation") {
          // Make sure button is enabled for team formation
          setIsRegistering(true);
          setButtonText(isEnglish ? "Join Team" : "انضمام");
        } else {
          // For other phases, show registered status
          setIsRegistering(false);
          setButtonText(isEnglish ? "Already Registered" : "تم التسجيل ");
        }
      }
    } catch (error) {
      console.error("Error checking registration status:", error);
    }
  };

  useEffect(() => {
    // This effect runs whenever currentPhase changes
    if (currentPhase === "team_formation") {
      setShowRegisterButton(true);
      setIsRegistering(true);

      // First update the button to انضمام
      setButtonText(isEnglish ? "Join Team" : "انضمام");

      // Then check if the user is already in a team
      checkIfInTeam();
    }
  }, [currentPhase, isEnglish]);

  // Show a notification when user is removed from team
  useEffect(() => {
    if (isRemovedFromTeam) {
      toast.error(
        isEnglish
          ? "You have been removed from the team"
          : "تمت إزالتك من الفريق"
      );
      // Reset the state to prevent duplicate notifications
      setIsRemovedFromTeam(false);
    }
  }, [isRemovedFromTeam, isEnglish]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match("image.*")) {
        toast.error(
          isEnglish ? "Please select an image file" : "الرجاء اختيار ملف صورة"
        );
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          isEnglish
            ? "Image size should be less than 5MB"
            : "يجب أن يكون حجم الصورة أقل من 5 ميجابايت"
        );
        return;
      }

      setNewTeamImage(file);

      // Preview the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.onerror = () => {
        toast.error(
          isEnglish ? "Failed to preview image" : "فشل في عرض معاينة الصورة"
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTeam = async () => {
    setIsUpdating(true);
    setUpdateError("");

    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      // Create form data for the request body
      const formData = new FormData();

      if (newTeamName && newTeamName !== teams?.name) {
        formData.append("name", newTeamName);
      }

      if (newTeamImage) {
        // Make sure we're using the correct field name expected by the API
        formData.append("icon", newTeamImage);

        // Log the image being uploaded for debugging
      }

      // Adding a static description field
      formData.append("description", "Team description placeholder");

      // Only make the request if there are changes
      if (formData.has("name") || formData.has("icon")) {
        // Using the correct endpoint structure with teamUuid in the URL
        const response = await axios({
          method: "post",
          url: `${api}/teams/${teams?.uuid}`,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          data: formData,
        });

        if (response.data?.data?.icon_url) {
          // Force a refresh of the teams data to ensure the new icon URL is loaded
          await getTeams();
        } else {
          // Refresh team data even if no icon_url in the response
          await getTeams();
        }

        // Show success notification
        setSuccessMessage(
          isEnglish ? "Team updated successfully" : "تم تحديث الفريق بنجاح"
        );
        setSuccessIcon(
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#38FFE5"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);

        setIsEditModalOpen(false);

        // Clear the image state after successful update
        setNewTeamImage(null);
        setImagePreview("");
      } else {
        setUpdateError(
          isEnglish ? "No changes to update" : "لا توجد تغييرات للتحديث"
        );
      }
    } catch (error) {
      console.error("Error updating team:", error);
      console.error("Error response:", error.response?.data);
      setUpdateError(
        error.response?.data?.message ||
          (isEnglish ? "Failed to update team" : "فشل في تحديث الفريق")
      );
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    eventScoreBoard();
  }, []);

  // Enhance the updateScoreboardWithNewPoints function to handle data more accurately
  const updateScoreboardWithNewPoints = (
    username,
    newPoints,
    isFirstBlood = false,
    teamUuid = null
  ) => {
    if (!teamUuid) {
      console.log("[LEADERBOARD] Missing team UUID for update, skipping");
      return;
    }

    newPoints = Number(newPoints);
    if (isNaN(newPoints) || newPoints <= 0) {
      console.log(
        `[LEADERBOARD] Invalid points value: ${newPoints}, skipping update`
      );
      return;
    }

    console.log(
      `[LEADERBOARD] Updating team ${teamUuid} with ${newPoints} points, first blood: ${isFirstBlood}`
    );

    // Check if we're getting too far out of sync with backend data
    // If a team is not found or data looks significantly off, refresh the entire scoreboard
    const currentData = [...scoreboardData];
    const teamIndex = currentData.findIndex(
      (team) => team.team_uuid === teamUuid
    );

    if (teamIndex === -1) {
      // If team isn't in our local data at all, refresh everything
      console.log(
        `[LEADERBOARD] Team ${teamUuid} not found in scoreboard, refreshing all data`
      );
      eventScoreBoard();
      return;
    }

    // Set up a periodic full refresh to ensure data stays in sync
    if (
      !window._lastFullRefresh ||
      Date.now() - window._lastFullRefresh > 30000
    ) {
      console.log(
        "[LEADERBOARD] Performing periodic full refresh to ensure data accuracy"
      );
      window._lastFullRefresh = Date.now();
      eventScoreBoard();
      return;
    }

    setScoreboardData((prevData) => {
      if (!prevData || prevData.length === 0) {
        console.log(
          "[LEADERBOARD] No existing scoreboard data, skipping update"
        );
        return prevData;
      }

      // Map the data to add the updated fields and calculate the new scores
      const updatedData = prevData.map((team) => {
        // If teamUuid is provided, we match by team UUID
        if (team.team_uuid === teamUuid) {
          // Update team stats
          const updatedPoints = Number(team.points) + newPoints;
          const updatedChallengesSolved = Number(team.challenges_solved) + 1;
          const updatedFirstBloodCount = isFirstBlood
            ? Number(team.first_blood_count) + 1
            : Number(team.first_blood_count);

          console.log(
            `[LEADERBOARD] Updating team ${team.team_name} with new points: ${newPoints}, total: ${updatedPoints}`
          );

          return {
            ...team,
            points: updatedPoints,
            challenges_solved: updatedChallengesSolved,
            first_blood_count: updatedFirstBloodCount,
          };
        }

        return team;
      });

      // Resort by points
      const sortedData = [...updatedData].sort((a, b) => b.points - a.points);

      // Assign new ranks
      return sortedData.map((team, index) => ({
        ...team,
        rank: index + 1,
      }));
    });
  };

  // Enhance the eventScoreBoard function to better handle data updates
  const eventScoreBoard = async () => {
    if (isLeaderboardFrozen) {
      console.log(
        "[LEADERBOARD] Skipping scoreboard refresh - board is frozen"
      );
      return;
    }

    try {
      console.log(`[LEADERBOARD] Fetching scoreboard for event ${id}`);
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/${id}/scoreboard`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (res.data.data.length > 0) {
        // Save previous data for comparison
        const previousData = scoreboardData;

        // Set the last refresh timestamp for our periodic refresh check
        if (typeof window !== "undefined") {
          window._lastFullRefresh = Date.now();
        }

        // Compare new data with old data to look for significant discrepancies
        let hasSignificantChanges = false;
        if (previousData.length > 0) {
          // Check if team counts differ
          if (previousData.length !== res.data.data.length) {
            hasSignificantChanges = true;
            console.log(
              "[LEADERBOARD] Team count changed, full refresh needed"
            );
          } else {
            // Check a sample of teams for data consistency
            for (let i = 0; i < Math.min(previousData.length, 5); i++) {
              const oldTeam = previousData[i];
              const newTeam = res.data.data.find(
                (t) => t.team_uuid === oldTeam.team_uuid
              );

              if (!newTeam) {
                hasSignificantChanges = true;
                break;
              }

              // Check if points are more than 10% different
              const pointDiff = Math.abs(oldTeam.points - newTeam.points);
              if (pointDiff > Math.max(oldTeam.points, newTeam.points) * 0.1) {
                console.log(
                  `[LEADERBOARD] Significant point difference for team ${oldTeam.team_name}: ${oldTeam.points} vs ${newTeam.points}`
                );
                hasSignificantChanges = true;
                break;
              }
            }
          }
        }

        // If we detected significant changes or this is initial load, use the backend data directly
        if (hasSignificantChanges || previousData.length === 0) {
          console.log("[LEADERBOARD] Using fresh data from backend");
          setScoreboardData(res.data.data);
        } else {
          // For smaller updates, ensure we don't lose real-time updates by merging data
          console.log(
            "[LEADERBOARD] Merging backend data with real-time updates"
          );
          setScoreboardData((prevData) => {
            const mergedData = res.data.data.map((newTeam) => {
              const existingTeam = prevData.find(
                (team) => team.team_uuid === newTeam.team_uuid
              );
              if (existingTeam) {
                // Use whichever points value is higher to avoid losing updates
                return {
                  ...newTeam,
                  points: Math.max(existingTeam.points, newTeam.points),
                  challenges_solved: Math.max(
                    existingTeam.challenges_solved,
                    newTeam.challenges_solved
                  ),
                  first_blood_count: Math.max(
                    existingTeam.first_blood_count,
                    newTeam.first_blood_count
                  ),
                };
              }
              return newTeam;
            });

            // Sort by points
            return mergedData
              .sort((a, b) => b.points - a.points)
              .map((team, index) => ({
                ...team,
                rank: index + 1,
              }));
          });
        }

        setIsEventScoreBoard(true);
      }
    } catch (error) {
      console.error("[LEADERBOARD] Error fetching scoreboard:", error);
      return null;
    }
  };

  // Add a refresh trigger whenever a team might be modified
  // This ensures we have accurate data even if some events are missed
  useEffect(() => {
    if (teams?.uuid && isEventScoreBoard) {
      // If user's team data changes, we should refresh the scoreboard to be safe
      eventScoreBoard();
    }
  }, [teams, isEventScoreBoard]);

  // Add an effect to periodically validate scoreboard data
  useEffect(() => {
    if (!id || !isEventScoreBoard || isLeaderboardFrozen) return;

    // Refresh on initial load and tab switch
    if (activeTab === "leaderboard") {
      eventScoreBoard();
    }
  }, [id, isEventScoreBoard, isLeaderboardFrozen, activeTab]);

  // Replace flag submission listener with a more robust one
  useEffect(() => {
    if (!id || !isEventScoreBoard) return;

    console.log(
      `[FLAG-EVENTS] Setting up robust flag submission listener for event ${id}`
    );

    // Set up a dedicated listener for flag submissions with data validation
    const cleanup = listenForFlagSubmissions(id, (data) => {
      console.log(
        `[FLAG-EVENTS] Received flag submission for leaderboard:`,
        data
      );

      // First apply the update locally
      if (data.teamUuid || data.team_uuid) {
        const teamUuid = data.teamUuid || data.team_uuid;
        updateScoreboardWithNewPoints(
          data.username || data.user_name,
          data.points || data.total_bytes || 0,
          data.isFirstBlood || data.is_first_blood || false,
          teamUuid
        );

        // Schedule a validation check shortly after
        // This ensures our local state eventually converges with backend state
        setTimeout(() => {
          if (activeTab === "leaderboard" && !isLeaderboardFrozen) {
            console.log(
              "[LEADERBOARD] Running post-submission validation check"
            );
            eventScoreBoard();
          }
        }, 3000); // 3 seconds after submission
      }
    });

    return cleanup;
  }, [id, isEventScoreBoard]);

  useEffect(() => {
    // If we're in team tab, we're marked as in a team, but don't have team data
    // This is a safety mechanism to handle race conditions
    if (activeTab === "team" && isInTeam && !teams) {
      getTeams().catch((err) => {
        console.error("Failed to load team data after retry:", err);
        // If still failing after a retry, notify user
        toast.error(
          isEnglish
            ? "Could not load team data. Please refresh the page."
            : "تعذر تحميل بيانات الفريق. يرجى تحديث الصفحة."
        );
      });
    }
  }, [activeTab, isInTeam, teams]);

  // Function to determine difficulty color
  const getDifficultyColor = (difficulty) => {
    if (
      difficulty === "صعب" ||
      difficulty === "صعب جدا" ||
      difficulty === "Hard" ||
      difficulty === "Very Hard"
    ) {
      return "text-red-500";
    } else if (difficulty === "متوسط" || difficulty === "Medium") {
      return "text-[#9DFF00]";
    } else {
      return "text-[#38FFE5]"; // Easy
    }
  };

  // Update the fetchActivities function to support real-time updates
  const fetchActivities = async () => {
    try {
      setIsActivitiesLoading(true);
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/events/activities/${id}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (res.data && res.data.activities) {
        // Store the fetched activities
        setActivities(res.data.activities);

        // Update the timestamp of the last activities fetch
        if (typeof window !== "undefined") {
          window._lastActivitiesFetch = Date.now();
        }

        console.log(
          `[ACTIVITIES] Fetched ${res.data.activities.length} activities from API`
        );
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  // Add a dedicated effect to handle real-time updates for activities
  useEffect(() => {
    if (!id || !socket) return;

    console.log(
      `[ACTIVITIES] Setting up real-time listeners for activities in event ${id}`
    );

    // Function to handle new activity updates
    const handleNewActivity = (data) => {
      // Skip if not for this event
      if (data.eventId !== id && data.event_id !== id) return;

      console.log(`[ACTIVITIES] Received new activity for event ${id}:`, data);

      // Process the activity
      handleRealTimeActivity(data);
    };

    // Register event listeners for activities
    socket.on("flagSubmitted", handleNewActivity);
    socket.on("teamUpdate", handleNewActivity);
    socket.on("activityUpdate", handleNewActivity);

    // Also set up a DOM event listener for flag submissions
    if (typeof window !== "undefined") {
      window.addEventListener("flag_submitted", (event) =>
        handleNewActivity(event.detail)
      );
      window.addEventListener("team_update", (event) =>
        handleNewActivity(event.detail)
      );
    }

    // Clean up on unmount
    return () => {
      console.log(
        `[ACTIVITIES] Cleaning up activity listeners for event ${id}`
      );

      if (socket) {
        socket.off("flagSubmitted", handleNewActivity);
        socket.off("teamUpdate", handleNewActivity);
        socket.off("activityUpdate", handleNewActivity);
      }

      if (typeof window !== "undefined") {
        window.removeEventListener("flag_submitted", (event) =>
          handleNewActivity(event.detail)
        );
        window.removeEventListener("team_update", (event) =>
          handleNewActivity(event.detail)
        );
      }
    };
  }, [id, socket]);

  // Add back the useEffect to load activities when tab changes
  useEffect(() => {
    if (activeTab === "activities") {
      fetchActivities();
    }
  }, [activeTab, id]);

  // Update the handleRealTimeActivity function to better handle activities
  const handleRealTimeActivity = (data) => {
    if (!data) {
      console.log("[ACTIVITIES] Skipping empty activity update");
      return;
    }

    // Check if this event is for our event
    const dataEventId = data.eventId || data.event_id;
    if (!dataEventId || dataEventId !== id) {
      console.log("[ACTIVITIES] Skipping activity update - event ID mismatch", {
        dataEventId,
        currentEventId: id,
      });
      return;
    }

    // Create a consistent activity ID for deduplication
    const activityId =
      data.broadcast_id ||
      `${data.username || data.user_name || ""}_${
        data.challenge_id || data.challengeId || ""
      }_${data.timestamp || Date.now()}`;

    console.log(
      `[ACTIVITIES] Processing activity update with ID: ${activityId}`
    );

    // Use session storage to track recently processed activities
    if (typeof window !== "undefined") {
      try {
        // Get recently processed activities from session storage
        const recentActivities = JSON.parse(
          sessionStorage.getItem(`recent_activities_${id}`) || "[]"
        );

        // Check if we've already processed this activity
        if (recentActivities.includes(activityId)) {
          console.log(
            `[ACTIVITIES] Skipping duplicate activity with ID: ${activityId}`
          );
          return;
        }

        // Add this activity to recent ones
        recentActivities.push(activityId);

        // Keep only the last 50 activities to avoid memory issues
        if (recentActivities.length > 50) {
          recentActivities.splice(0, recentActivities.length - 50);
        }

        // Save back to session storage
        sessionStorage.setItem(
          `recent_activities_${id}`,
          JSON.stringify(recentActivities)
        );
      } catch (error) {
        console.error("[ACTIVITIES] Error tracking recent activities:", error);
      }
    }

    // CRITICAL FIX: Ensure consistent point values by prioritizing total_bytes
    // Use a single calculation to ensure the same value is used throughout
    const pointValue = data.total_bytes || data.points || 0;

    // Create a new activity object with flexible field mapping
    const newActivity = {
      user_name: data.username || data.user_name || "Unknown",
      user_profile_image:
        data.profile_image || data.userProfileImage || "/icon1.png",
      challenge_title: data.challenge_name || data.challengeName || "Challenge",
      challenge_uuid: data.challengeId || data.challenge_id,
      total_bytes: pointValue, // Use our consistent point value
      points: pointValue, // Include both field formats
      is_first_blood: data.isFirstBlood || data.is_first_blood || false,
      solved_at: data.timestamp || Date.now(),
      // Store the activity ID for future reference
      activity_id: activityId,
    };

    console.log("[ACTIVITIES] Created new activity object:", newActivity);

    // Add the new activity to the beginning of the list
    setActivities((prevActivities) => {
      if (!Array.isArray(prevActivities)) return [newActivity];

      // If we already have an identical activity, don't add a duplicate
      const activityExists = prevActivities.some(
        (act) =>
          // Check for activity_id first (most reliable)
          (act.activity_id && act.activity_id === activityId) ||
          // Fallback to checking other fields
          (act.user_name === newActivity.user_name &&
            act.challenge_uuid === newActivity.challenge_uuid &&
            // Use approximate timestamp matching (within 5 seconds)
            Math.abs(
              new Date(act.solved_at).getTime() -
                new Date(newActivity.solved_at).getTime()
            ) < 5000)
      );

      if (activityExists) {
        console.log(
          "[ACTIVITIES] Activity already exists in the list, not adding duplicate"
        );
        return prevActivities;
      }

      console.log("[ACTIVITIES] Adding new activity to the list");
      return [newActivity, ...prevActivities];
    });

    // Also update the scoreboard if we're on the leaderboard tab
    if (activeTab === "leaderboard" && isEventScoreBoard) {
      const teamUuid = data.teamUuid || data.team_uuid;
      if (teamUuid) {
        console.log("[ACTIVITIES] Updating scoreboard based on activity");
        updateScoreboardWithNewPoints(
          data.username || data.user_name,
          pointValue,
          data.isFirstBlood || data.is_first_blood || false,
          teamUuid
        );
      }
    }
  };

  // Add back the useEffects for fetching activities and scoreboard
  // Add an effect to fetch activities when switching to the activities tab
  useEffect(() => {
    if (activeTab === "activities") {
      fetchActivities();
    }
  }, [activeTab, id]);

  // Additional effect to trigger scoreboard fetch when switching to leaderboard tab
  useEffect(() => {
    if (activeTab === "leaderboard" && isEventScoreBoard) {
      eventScoreBoard();
    }
  }, [activeTab, isEventScoreBoard]);

  // Add a direct broadcast function to handle flag submissions
  const broadcastActivity = async (data) => {
    try {
      console.log("Broadcasting activity directly:", data);

      // Prepare the payload
      const payload = {
        eventId: id,
        challengeId: data.challenge_id || data.challengeId,
        challenge_id: data.challenge_id || data.challengeId,
        username: data.username || data.user_name,
        user_name: data.username || data.user_name,
        teamUuid: data.teamUuid,
        teamName: data.teamName,
        points: data.points,
        isFirstBlood: data.isFirstBlood || false,
        challenge_name: data.challenge_name,
        profile_image: data.profile_image,
        timestamp: Date.now(),
        broadcast_id: Math.random().toString(36).substring(2, 15),
      };

      // Post to our broadcast API
      const response = await fetch("/api/broadcast-activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to broadcast activity:", await response.text());
      } else {
        console.log("Activity broadcast successful");
      }

      // Also update our local state immediately
      handleRealTimeActivity(payload);
    } catch (error) {
      console.error("Error broadcasting activity:", error);
    }
  };

  // Add a global listener for flag submissions
  useEffect(() => {
    // Define event handler for flag submissions
    const handleGlobalFlagSubmit = (event) => {
      // Check if this event is relevant to us
      if (event && event.detail && event.detail.eventId === id) {
        console.log("Caught global flag submission event:", event.detail);
        broadcastActivity(event.detail);
      }
    };

    // Add global event listener
    if (typeof window !== "undefined") {
      window.addEventListener("flag_submitted", handleGlobalFlagSubmit);
    }

    // Clean up
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("flag_submitted", handleGlobalFlagSubmit);
      }
    };
  }, [id]);

  // Introduce a testing function that simulates a flag submission (for development)
  const simulateSubmission = () => {
    const simulatedData = {
      challenge_id: `sim-${Math.random().toString(36).substring(2, 7)}`,
      username: Cookies.get("username") || "TestUser",
      user_name: Cookies.get("username") || "TestUser",
      eventId: id,
      teamUuid: teams?.uuid || "test-team",
      teamName: teams?.name || "Test Team",
      points: Math.floor(Math.random() * 100) + 1,
      isFirstBlood: Math.random() > 0.8,
      challenge_name: "Test Challenge",
      profile_image: "/icon1.png",
      timestamp: new Date().toISOString(),
    };

    // Dispatch a DOM event that will be caught by our listener
    if (typeof window !== "undefined") {
      const event = new CustomEvent("flag_submitted", {
        detail: simulatedData,
      });
      window.dispatchEvent(event);
    }
  };

  // Add back the WebSocket freeze event listener
  useEffect(() => {
    if (!id) return;

    // Check initial freeze state
    const checkFreezeState = async () => {
      try {
        const response = await fetch(`/api/freeze?eventId=${id}`);
        const data = await response.json();
        if (data && typeof data.frozen === "boolean") {
          setIsLeaderboardFrozen(data.frozen);
        }
      } catch (error) {
        console.error("Error checking freeze state:", error);
      }
    };

    checkFreezeState();

    // Listen for system freeze updates that affect this event
    const handleFreezeUpdate = (event) => {
      const { frozen, eventId, isGlobal } = event.detail;

      // Apply freeze state if it's for this specific event or it's global
      if ((eventId && eventId === id) || isGlobal) {
        setIsLeaderboardFrozen(frozen);
        console.log(
          `Leaderboard freeze state updated for event ${id}: ${frozen}`
        );
      }
    };

    // Add event listener
    window.addEventListener("system_freeze_update", handleFreezeUpdate);

    // Clean up
    return () => {
      window.removeEventListener("system_freeze_update", handleFreezeUpdate);
    };
  }, [id]);

  return isLoading ? (
    <LoadingPage />
  ) : (
    <div className="mt-28 lg:mt-36 px-4 sm:px-6 md:px-8 lg:px-10 max-w-[2000px] mx-auto">
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

        @keyframes pulse {
          0% {
            opacity: 0.5;
            transform: scale(0.8);
            box-shadow: 0 0 0 0 rgba(56, 255, 229, 0.7);
          }
          70% {
            opacity: 1;
            transform: scale(1.1);
            box-shadow: 0 0 0 10px rgba(56, 255, 229, 0);
          }
          100% {
            opacity: 0.5;
            transform: scale(0.8);
            box-shadow: 0 0 0 0 rgba(56, 255, 229, 0);
          }
        }
      `}</style>

      {/* Custom notification component */}
      {showCopiedToast && (
        <div className="w-full h-full fixed inset-0 z-50">
          <div className="absolute bottom-4 right-4 w-fit z-50">
            <div className="bg-[#131619] border border-[#38FFE5] rounded-lg p-4 shadow-lg slide-in-animation">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-white text-lg font-semibold">
                    {isEnglish
                      ? "Copied to clipboard successfully!"
                      : "تم النسخ إلى الحافظة بنجاح!"}
                  </h3>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#38FFE5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success notification component */}
      {showSuccessToast && (
        <div className="w-full h-full fixed inset-0 z-50">
          <div className="absolute bottom-4 right-4 w-fit z-50">
            <div className="bg-[#131619] border border-[#38FFE5] rounded-lg p-4 shadow-lg slide-in-animation">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-white text-lg font-semibold">
                    {successMessage}
                  </h3>
                </div>
                {successIcon}
              </div>
            </div>
          </div>
        </div>
      )}

      <div dir={isEnglish ? "ltr" : "rtl"}>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-1">
          <Link href="/events">{isEnglish ? "Events" : "الفعاليات"}</Link>
          <span>
            {isEnglish ? <MdKeyboardArrowRight /> : <MdKeyboardArrowLeft />}
          </span>
          <span className="text-[#38FFE5]">{event.title}</span>
        </h1>
      </div>
      <div
        className={`bg-cover bg-no-repeat bg-center relative  rounded-xl mt-6 md:mt-8 lg:mt-12 h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] w-full`}
        style={{
          backgroundImage: `url(${event.background_image})`,
        }}
      >
        {eventIsActive && (
          <div className="absolute flex flex-co rounded-xl  items-center justify-center w-full h-full bg-[#040405CC]">
            <div>
              <p className="text-xl sm:text-[33px] font-bold flex items-center gap-4">
                تقام حالياً
                <span
                  style={{
                    animation: "pulse 3s ease-in-out infinite",
                    boxShadow: "0 0 5px #38FFE5",
                  }}
                  className="w-2 sm:w-3 h-2 sm:h-3 bg-[#38FFE5] rounded-full"
                ></span>
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col h-full justify-end pb-4 sm:pb-6 md:pb-8 lg:pb-10">
          <div className="flex flex-col md:flex-row items-center p-3 sm:p-4 md:p-6">
            <div className="basis-full md:basis-1/2 lg:basis-2/3 mb-4 sm:mb-6 md:mb-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold text-center md:text-left">
                {event.title}
              </h2>

              <p className="text-center md:text-left text-base sm:text-lg md:text-xl lg:text-2xl mt-2 sm:mt-4 md:mt-6 lg:mt-8 md:pr-4 lg:pr-10">
                {event.description}
              </p>
            </div>
            <div className="basis-full md:basis-1/2 pt-2 sm:pt-4 md:pt-8 lg:pt-16">
              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row-reverse items-center gap-3 sm:gap-4 lg:gap-6 xl:gap-10 pt-3 sm:pt-4 md:pt-6 lg:pt-8 justify-center">
                <p
                  className={`flex items-center ${
                    isEnglish ? "flex-row-reverse" : ""
                  } text-sm sm:text-base md:text-[18px] gap-2`}
                >
                  {isEnglish ? "Starts at " : "بدء في "}
                  {formatDate(event.start_date)}
                  <span className="text-[#38FFE5] flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="sm:w-5 sm:h-5 md:w-6 md:h-6"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </span>
                </p>
                <p
                  className={`flex items-center ${
                    isEnglish ? "flex-row-reverse" : ""
                  } text-sm sm:text-base md:text-[18px] gap-2`}
                >
                  {isEnglish ? "Ends at " : "انتهي في "}
                  {formatDate(event.end_date)}
                  <span className="text-[#38FFE5] flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="sm:w-5 sm:h-5 md:w-6 md:h-6"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </span>
                </p>
              </div>
              <div>
                <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-4 sm:gap-8 md:gap-12 lg:gap-44 lg:pr-10 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
                  <div>
                    <p className="text-sm sm:text-base md:text-[18px] justify-center flex items-center  gap-2">
                      أعضاء
                      <span>
                        {event.team_maximum_members}-
                        {event.team_minimum_members}
                      </span>
                      فريق من
                      <span className="text-[#38FFE5] text-lg sm:text-xl md:text-2xl lg:text-[24px] font-bold">
                        <HiOutlineUsers />
                      </span>
                    </p>
                  </div>
                  <div className="w-full sm:w-auto">
                    {showRegisterButton && (
                      <button
                        onClick={() => {
                          if (
                            (buttonText === "انضمام" ||
                              buttonText === "Join Team" ||
                              currentPhase === "team_formation") &&
                            !isInTeam
                          ) {
                            setIsModalOpen(true);
                          } else if (isRegistering) {
                            registerNow();
                          }
                        }}
                        disabled={
                          (currentPhase === "team_formation" && isInTeam) ||
                          (!isRegistering && currentPhase !== "team_formation")
                        }
                        className={`${
                          (isRegistering && !isInTeam) ||
                          (currentPhase === "team_formation" && !isInTeam)
                            ? "bg-[#38FFE5] hover:bg-[#38FFE5]/90"
                            : "bg-[#38FFE5] "
                        } cursor-${
                          (isRegistering && !isInTeam) ||
                          (currentPhase === "team_formation" && !isInTeam)
                            ? "pointer"
                            : "not-allowed"
                        } text-[#06373F] font-bold px-4 sm:px-6 py-2 rounded-md transition-colors w-full sm:w-auto`}
                      >
                        {currentPhase === "team_formation"
                          ? isInTeam
                            ? isEnglish
                              ? "Already in Team"
                              : "تم الانضمام"
                            : isEnglish
                            ? "Join Team"
                            : "انضمام"
                          : buttonText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TeamRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventTitle={event.title}
        minMembers={event.team_minimum_members}
        maxMembers={event.team_maximum_members}
        eventUuid={id}
        onSuccess={async () => {
          try {
            // Reset check flag to force a fresh team data fetch
            setHasCheckedTeam(false);

            // Add a small delay to ensure backend has processed the team creation
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Fetch fresh team data and wait for it to complete
            await getTeams();

            // Only after we have confirmed team data is loaded, update UI
            setIsInTeam(true);
            setButtonText(isEnglish ? "Already in Team" : "تم الانضمام");
            setActiveTab("team");
            setIsModalOpen(false);
          } catch (error) {
            console.error("Error updating team data:", error);
            // Show error toast
            toast.error(
              isEnglish
                ? "Team created but failed to load team data. Please refresh."
                : "تم إنشاء الفريق ولكن فشل تحميل بيانات الفريق. يرجى تحديث الصفحة."
            );
            setIsModalOpen(false);
          }
        }}
      />

      <div className="relative">
        <div
          dir={isEnglish ? "ltr" : "rtl"}
          className="flex justify-between items-center"
        >
          <div
            dir={isEnglish ? "ltr" : "rtl"}
            className="flex items-center px-8 gap-10 py-16 "
          >
            <h2
              className={`text-lg md:text-xl lg:text-[20px] font-bold pb-2 cursor-pointer ${
                activeTab === "team" ? "border-b-2 border-[#38FFE5]" : ""
              }`}
              onClick={() => {
                setActiveTab("team");
              }}
            >
              {isEnglish ? "Team" : "فريق"}
            </h2>
            <h2
              className={`text-lg md:text-xl lg:text-[20px] font-bold pb-2 cursor-pointer ${
                activeTab === "challenges" ? "border-b-2 border-[#38FFE5]" : ""
              }`}
              onClick={() => {
                setActiveTab("challenges");
              }}
            >
              {isEnglish ? "Challenges" : "التحديات"}
            </h2>

            <h2
              className={`text-lg md:text-xl lg:text-[20px] font-bold pb-2 cursor-pointer ${
                activeTab === "leaderboard" ? "border-b-2 border-[#38FFE5]" : ""
              }`}
              onClick={() => setActiveTab("leaderboard")}
            >
              {isEnglish ? "Leaderboard" : "المتصدرين"}
            </h2>

            <h2
              className={`text-lg md:text-xl lg:text-[20px] font-bold pb-2 cursor-pointer ${
                activeTab === "activities" ? "border-b-2 border-[#38FFE5]" : ""
              }`}
              onClick={() => setActiveTab("activities")}
            >
              {isEnglish ? "Activities" : "الأنشطة"}
            </h2>
          </div>

          {isLeaderboardFrozen && activeTab === "leaderboard" && (
            <div>
              <p className="text-red-500 text-lg border border-red-500 rounded-md px-2 py-1">
                تم تجميد قائمة المتصدرين مؤقتاً
              </p>
            </div>
          )}
        </div>

        {isEventStarted && !eventHasEnded && activeTab === "challenges" && (
          <div className="w-full h-full">
            <div className="flex flex-col w-full h-full justify-center items-center gap-2">
              <Image src="/lock.png" alt="lock" width={160} height={160} />

              <div dir className="flex flex-col items-center text-center my-4 ">
                {isEnglish ? (
                  <h3 className="text-2xl font-bold text-white">
                    {timeRemaining.days.toString().padStart(2, "0")}d :
                    {timeRemaining.hours.toString().padStart(2, "0")}h :
                    {timeRemaining.minutes.toString().padStart(2, "0")}m :
                    {timeRemaining.seconds.toString().padStart(2, "0")}s
                  </h3>
                ) : (
                  <h3 className="text-2xl  font-bold text-white">
                    ي {timeRemaining.days.toString().padStart(2, "0")} : س{" "}
                    {timeRemaining.hours.toString().padStart(2, "0")} : د{" "}
                    {timeRemaining.minutes.toString().padStart(2, "0")} : ث{" "}
                    {timeRemaining.seconds.toString().padStart(2, "0")}
                  </h3>
                )}
                <p className="mt-2 text-white text-lg">
                  {isEnglish ? "Left" : "متبقي"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === "challenges" && isChallengesStarted && (
        <div
          dir={isEnglish ? "ltr" : "rtl"}
          className="grid grid-cols-1 md:grid-cols-2 mb-10 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {challenges.map((challenge) => (
            <div
              key={`${challenge.challenge_id}`}
              className="bg-white/5 rounded-2xl p-6 lg:mt-12 hover:shadow-[0_0_15px_rgba(56,255,229,0.3)] transition-shadow"
            >
              <div
                className={`flex ${
                  isEnglish
                    ? "flex-row-reverse pr-4 justify-end"
                    : "flex-row-reverse justify-end pr-3 "
                }  items-center mb-4 gap-5`}
              >
                <div
                  className={`flex flex-col ${
                    isEnglish ? "items-start" : "items-end"
                  }`}
                >
                  <p className=" font-bold text-xl">{challenge.title}</p>
                </div>
                <div
                  className={`bg-transparent ${
                    isEnglish ? "" : ""
                  } rounded-none w-12 h-12 gap-2 `}
                >
                  <Image
                    src={challenge.category_icon_url}
                    alt={challenge.category.name}
                    width={48}
                    height={48}
                    className="opacity-70"
                  />
                </div>
              </div>

              <div dir={isEnglish ? "ltr" : "rtl"} className="text-sm mb-6">
                <div className="flex items-center mt-2 gap-1 justify-between">
                  <span>{isEnglish ? "Bytes:" : " بايتس :"}</span>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{challenge.bytes}</p>
                    <Image
                      src="/byte.png"
                      alt="byte"
                      width={18}
                      height={18}
                      className="opacity-70"
                    />
                  </div>
                </div>
                <div className="flex items-center mt-4 gap-1 justify-between">
                  <span>{isEnglish ? "Hacks:" : " الاختراقات:"}</span>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">
                      {challenge.solved_count}
                    </p>
                    <Image
                      src="/card-user.png"
                      alt="user"
                      width={18}
                      height={18}
                    />
                  </div>
                </div>
              </div>

              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="flex justify-between"
              >
                <div
                  className={`flex items-center gap-1 ${isEnglish ? "" : ""}`}
                >
                  <span className="text-white">
                    {isEnglish ? "Difficulty:" : "مستوى الصعوبة:"}
                  </span>
                  <span className={getDifficultyColor(challenge.difficulty)}>
                    {isEnglish
                      ? challenge.difficulty === "صعب"
                        ? "Hard"
                        : challenge.difficulty === "صعب جدا"
                        ? "Very Hard"
                        : challenge.difficulty === "متوسط"
                        ? "Medium"
                        : challenge.difficulty === "سهل"
                        ? "Easy"
                        : challenge.difficulty
                      : challenge.difficulty}
                  </span>
                </div>
                <Link
                  href={`/event/${challenge.challenge_id}`}
                  className="text-[#38FFE5] font-semibold   rounded  hover:bg-[#38FFE5]/10 hover:transition-all duration-300 hover:p-1 hover:brightness-110"
                >
                  {isEnglish ? "Start Now" : "ابدأ الآن"}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "team" && (
        <div className="mb-10">
          {teams ? (
            <>
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="bg-[#FFFFFF0D] p-3 sm:p-4 rounded-lg mb-5 sm:mb-10"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-5">
                    {teams?.icon_url ? (
                      <Image
                        src={teams.icon_url}
                        alt="team"
                        width={50}
                        height={50}
                        className="w-10 h-10 sm:w-12 sm:h-12 md:w-[50px] md:h-[50px] rounded-full object-cover"
                        unoptimized={true}
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-[50px] md:h-[50px] flex items-center justify-center bg-[#06373F] rounded-full">
                        <Image
                          src="/icon1.png"
                          alt="team"
                          width={40}
                          height={40}
                          className="text-[#38FFE5] text-xl sm:text-2xl"
                        />
                      </div>
                    )}
                    <p className="text-sm sm:text-base">{teams?.name}</p>
                    <div className="flex flex-wrap-reverse items-center gap-2">
                      <p className="text-xs sm:text-sm">
                        {isEnglish ? "Active" : "فعال"}
                      </p>
                      <span className="w-2 h-2 bg-[#38FFE5] rounded-full"></span>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="bg-[#38FFE5] text-[#06373F] hover:bg-[#38FFE5]/90 font-bold px-4 sm:px-6 py-2 rounded-md transition-colors w-full sm:w-auto text-sm sm:text-base"
                    >
                      {isEnglish ? "Edit" : "تعديل"}
                    </button>
                  </div>
                </div>
              </div>

              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5"
              >
                <div className="bg-[#FFFFFF0D] py-2 sm:py-3 flex items-center gap-3 sm:gap-5 rounded-md px-3 sm:px-4">
                  <Image
                    src="/blood.png"
                    height={32}
                    width={32}
                    alt="blood"
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-[32px] md:h-[40px]"
                  />
                  <div>
                    <p className="text-sm sm:text-base">
                      {isEnglish ? "First Bytes" : "البايتس الأول"}
                    </p>
                    <div className="gap-2 pt-1 sm:pt-3">
                      <p className="text-sm sm:text-base">
                        {teams?.statistics?.total_first_blood_count}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF0D] py-2 sm:py-3 flex items-center gap-3 sm:gap-5 rounded-md px-3 sm:px-4">
                  <Image
                    src="/ranking.png"
                    height={32}
                    width={32}
                    alt="ranking"
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-[32px] md:h-[32px]"
                  />
                  <div>
                    <p className="text-sm sm:text-base ">
                      {isEnglish ? "Ranking" : "التصنيف"}
                    </p>
                    <div className="flex items-center gap-2 pt-1 sm:pt-3">
                      <p className="text-sm sm:text-base">{teams?.rank || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF0D] py-2 sm:py-3 flex items-center gap-3 sm:gap-5 rounded-md px-3 sm:px-4">
                  <Image
                    src="/byte.png"
                    height={32}
                    width={32}
                    alt="byte"
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-[32px] md:h-[32px]"
                  />
                  <div>
                    <p className="text-sm sm:text-base">
                      {isEnglish ? "Challenges Bytes" : "بايتس التحدي"}
                    </p>
                    <div className="flex items-center gap-2 pt-1 sm:pt-3">
                      <p className="flex items-center gap-1 text-sm sm:text-base">
                        <span>{teams?.statistics?.total_bytes}</span>
                        {isEnglish ? "bytes" : "بايتس"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="flex gap-10 pt-10 pb-8"
              >
                <h3
                  className={`text-white text-lg font-bold pb-2 cursor-pointer ${
                    teamView === "members"
                      ? "border-b-2 border-b-[#38FFE5]"
                      : ""
                  }`}
                  onClick={() => setTeamView("members")}
                >
                  {isEnglish ? "Team Members" : "أعضاء الفريق"}
                </h3>
                <h3
                  className={`text-white text-lg font-bold pb-2 cursor-pointer ${
                    teamView === "activities"
                      ? "border-b-2 border-b-[#38FFE5]"
                      : ""
                  }`}
                  onClick={() => setTeamView("activities")}
                >
                  {isEnglish ? "Activities" : "الأنشطة"}
                </h3>
              </div>

              {teamView === "members" && (
                <>
                  <div>
                    <div
                      dir={isEnglish ? "ltr" : "rtl"}
                      className="grid grid-cols-1 sm:grid-cols-2 mt-3 sm:my-5 gap-4 sm:gap-10"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#FFFFFF0D] p-4 sm:px-8 md:px-12 rounded-md">
                        <div className="py-2 sm:py-3 flex items-center gap-3 sm:gap-5 mb-3 sm:mb-0">
                          <Image
                            src="/creat.png"
                            height={32}
                            width={32}
                            alt="creat"
                            className="w-7 h-7 sm:w-8 sm:h-8 md:w-[32px] md:h-[32px]"
                          />
                          <div>
                            <p className="text-sm sm:text-base">
                              {isEnglish ? "Team Members" : "أعضاء الفريق"}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <p className="font-semibold text-sm sm:text-base md:text-lg">
                                {teams?.members?.length}{" "}
                                {isEnglish ? "Members" : "أعضاء"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs sm:text-sm md:text-base">
                          <p>
                            {isEnglish ? "Team of" : "فريق من"}{" "}
                            {teams?.event?.team_minimum_members}-
                            {teams?.event?.team_maximum_members}{" "}
                            {isEnglish ? "Members" : "أعضاء"}
                          </p>
                        </div>
                      </div>
                      {showRegisterButton ? (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#FFFFFF0D] p-4 sm:px-8 md:px-12 rounded-md">
                          <div className="py-2 sm:py-3 flex items-center gap-3 sm:gap-5 mb-3 sm:mb-0">
                            <Image
                              src="/lock3.png"
                              height={32}
                              width={32}
                              alt="creat"
                              className="w-7 h-7 sm:w-8 sm:h-8 md:w-[32px] md:h-[32px]"
                            />
                            <div>
                              <p className="text-sm sm:text-base">
                                {isEnglish
                                  ? "Team Password"
                                  : "كلمة مرور الفريق"}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <p className="font-semibold text-sm sm:text-base md:text-lg">
                                  {"*****************"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="relative">
                            <button
                              onClick={() => {
                                if (!joinSecret) {
                                  fetchJoinSecret();
                                } else {
                                  copyToClipboard(joinSecret);
                                }
                              }}
                              className="flex gap-1 items-center cursor-pointer text-sm sm:text-base"
                            >
                              <IoCopy className="text-[#38FFE5]" />
                              <p className="border-b-2 border-b-white">
                                {joinSecret
                                  ? isEnglish
                                    ? "Copy Password"
                                    : "نسخ كلمة المرور"
                                  : isEnglish
                                  ? "Show Password"
                                  : "عرض كلمة المرور"}
                              </p>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center items-center bg-[#FFFFFF0D] p-4 rounded-md text-sm sm:text-base">
                          <p>
                            {isEnglish
                              ? "Cannot create password until the event starts"
                              : "لا يمكن انشاء كلمة مرور حتى بدء الفاعليه"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto mt-4">
                    <div className="min-w-[768px]">
                      {teams?.members?.map((member, index) => (
                        <div
                          key={member.uuid}
                          dir={isEnglish ? "ltr" : "rtl"}
                          className={`mt-2 flex justify-between items-center px-4 sm:px-6 md:px-10 py-3 sm:py-5 ${
                            index % 2 === 0 ? "bg-[#06373F]" : "bg-transparent"
                          }`}
                        >
                          <div className="flex items-center basis-1/3 gap-2 sm:gap-4">
                            <Image
                              src={member.profile_image || "/icon1.png"}
                              height={30}
                              width={30}
                              alt="member"
                              className="w-6 h-6 sm:w-8 sm:h-8 md:w-[30px] md:h-[30px] rounded-full object-cover"
                              unoptimized={true}
                            />
                            <p
                              onClick={() =>
                                router.push(`/profile/${member.username}`)
                              }
                              className="text-sm sm:text-base cursor-pointer"
                            >
                              {member.username}
                            </p>
                            {member.role === "leader" && (
                              <p className="text-[#38FFE4] text-xs sm:text-sm">
                                {isEnglish ? "Leader" : "قائد"}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 basis-1/3 justify-center">
                            <p className="text-sm sm:text-base">
                              {member.total_bytes || 0}
                            </p>
                            <Image
                              src="/byte.png"
                              height={30}
                              width={30}
                              alt="bytes"
                              className="w-6 h-6 sm:w-8 sm:h-8 md:w-[30px] md:h-[30px]"
                            />
                          </div>

                          <div className="flex items-center gap-2 basis-1/3 justify-end">
                            {isRemove &&
                              member.role !== "leader" &&
                              // Only show delete button if the event is in team_formation phase
                              // Hide it during event_active or event has ended
                              currentPhase === "team_formation" && (
                                <button
                                  onClick={() => deleteMember(member.username)}
                                  className="text-red-500 cursor-pointer text-xs sm:text-sm rounded-lg py-1 sm:py-2 px-2 sm:px-4 border-2 border-red-500"
                                >
                                  {isEnglish ? "Remove" : "إزالة"}
                                </button>
                              )}

                            {/* Only show the "..." button during team_formation phase */}
                            {currentPhase === "team_formation" &&
                              member.role === "leader" && (
                                <button
                                  onClick={() => setIsRemove(!isRemove)}
                                  className="cursor-pointer text-lg sm:text-xl"
                                >
                                  ...
                                </button>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {teamView === "activities" && (
                <>
                  {/* Check if there are any activities to show */}
                  {teams?.members?.flatMap(
                    (member) => member.challenge_completions || []
                  ).length > 0 ? (
                    <div className="px-4 lg:px-10 py-6 lg:py-10 bg-[#06373F26] rounded-lg">
                      <div className="overflow-x-auto">
                        <div className="min-w-[768px] w-full">
                          {/* Header wrapper div */}
                          <div className="rounded-2xl bg-[#38FFE50D] mb-6 lg:mb-10">
                            <table
                              className={`w-full ${
                                isEnglish ? "pl-5" : "pr-5"
                              }`}
                            >
                              <thead>
                                <tr
                                  className={`text-white ${
                                    isEnglish ? "flex-row-reverse" : "flex-row"
                                  } flex items-center justify-between`}
                                >
                                  <th
                                    className={`py-3 lg:py-4 w-[25%] text-sm lg:text-base ${
                                      isEnglish
                                        ? "text-left pl-3 lg:pl-5"
                                        : "text-right pr-3 lg:pr-5"
                                    }`}
                                  >
                                    {isEnglish ? "Time" : "التوقيت"}
                                  </th>
                                  <th
                                    className={`py-3 lg:py-4 w-[25%] text-sm lg:text-base ${
                                      isEnglish ? "text-left" : "text-right"
                                    }`}
                                  >
                                    {isEnglish ? "Bytes" : "البايتس"}
                                  </th>
                                  <th
                                    className={`py-3 lg:py-4 w-[50%] text-sm lg:text-base ${
                                      isEnglish
                                        ? "text-left pl-3 lg:pl-5"
                                        : "text-right pr-3 lg:pr-5"
                                    }`}
                                  >
                                    {isEnglish ? "User" : "المستخدم"}
                                  </th>
                                </tr>
                              </thead>
                              <thead>
                                <tr
                                  className={`text-white ${
                                    isEnglish ? "flex-row-reverse" : "flex-row"
                                  } flex items-center justify-between`}
                                >
                                  <th
                                    className={`py-3 lg:py-4 w-[25%] text-sm lg:text-base ${
                                      isEnglish
                                        ? "text-left pl-3 lg:pl-5"
                                        : "text-right pr-3 lg:pr-5"
                                    }`}
                                  >
                                    {isEnglish ? "Time" : "التوقيت"}
                                  </th>
                                  <th
                                    className={`py-3 lg:py-4 w-[25%] text-sm lg:text-base ${
                                      isEnglish ? "text-left" : "text-right"
                                    }`}
                                  >
                                    {isEnglish ? "Bytes" : "البايتس"}
                                  </th>
                                  <th
                                    className={`py-3 lg:py-4 w-[50%] text-sm lg:text-base ${
                                      isEnglish
                                        ? "text-left pl-3 lg:pl-5"
                                        : "text-right pr-3 lg:pr-5"
                                    }`}
                                  >
                                    {isEnglish ? "User" : "المستخدم"}
                                  </th>
                                </tr>
                              </thead>
                            </table>
                          </div>

                          {/* Body rows with proper alternating backgrounds */}
                          {(() => {
                            // Create a flat array of all activities
                            const allActivities = [];

                            // Collect all challenges from all members
                            teams?.members?.forEach((member) => {
                              if (member.challenge_completions) {
                                member.challenge_completions.forEach(
                                  (challenge) => {
                                    allActivities.push({
                                      member,
                                      challenge,
                                    });
                                  }
                                );
                              }
                            });

                            // Sort by completion date (most recent first)
                            allActivities.sort(
                              (a, b) =>
                                new Date(b.challenge.completed_at) -
                                new Date(a.challenge.completed_at)
                            );

                            // Map the activities with proper index for alternating backgrounds
                            return allActivities.map((activity, rowIndex) => (
                              <div
                                key={`activity-row-${rowIndex}`}
                                className={`${
                                  rowIndex % 2 === 0
                                    ? "bg-[#06373F] rounded-lg"
                                    : ""
                                } mb-2`}
                              >
                                <table className="w-full">
                                  <tbody>
                                    <tr
                                      className={`flex items-center justify-between ${
                                        isEnglish
                                          ? "flex-row-reverse"
                                          : "flex-row"
                                      }`}
                                    >
                                      <td
                                        dir={isEnglish ? "ltr" : "rtl"}
                                        className={`py-2 lg:py-3 text-white/70 w-[25%] text-sm lg:text-base ${
                                          isEnglish
                                            ? "pl-3 lg:pl-5"
                                            : "pr-3 lg:pr-5"
                                        }`}
                                      >
                                        {(() => {
                                          const completedDate =
                                            convertToUserTimezone(
                                              new Date(
                                                activity.challenge.completed_at
                                              )
                                            );
                                          const now =
                                            getCurrentDateInUserTimezone();
                                          const diffInMillis =
                                            now - completedDate;
                                          const diffInMinutes = Math.floor(
                                            diffInMillis / (1000 * 60)
                                          );

                                          if (diffInMinutes < 60) {
                                            return isEnglish
                                              ? `${diffInMinutes} minutes ago`
                                              : `منذ ${diffInMinutes} دقيقة`;
                                          } else if (diffInMinutes < 1440) {
                                            const hours = Math.floor(
                                              diffInMinutes / 60
                                            );
                                            return isEnglish
                                              ? `${hours} hour${
                                                  hours > 1 ? "s" : ""
                                                } ago`
                                              : `منذ ${hours} ساعة`;
                                          } else {
                                            const days = Math.floor(
                                              diffInMinutes / 1440
                                            );
                                            return isEnglish
                                              ? `${days} day${
                                                  days > 1 ? "s" : ""
                                                } ago`
                                              : `منذ ${days} يوم`;
                                          }
                                        })()}
                                      </td>
                                      <td className="py-2 lg:py-3 w-[25%]">
                                        <div
                                          dir={isEnglish ? "ltr" : "rtl"}
                                          className={`flex items-center gap-1 lg:gap-2 ${
                                            isEnglish ? "pl-0" : "pr-0"
                                          }`}
                                        >
                                          <span className="text-white text-sm lg:text-base min-w-[40px] text-center">
                                            {activity.challenge.bytes}
                                          </span>
                                          <Image
                                            src={
                                              activity.challenge.is_first_blood
                                                ? "/blood.png"
                                                : "/byte.png"
                                            }
                                            alt={
                                              activity.challenge.is_first_blood
                                                ? "first blood"
                                                : "points"
                                            }
                                            width={20}
                                            height={24}
                                            className="lg:w-[25px] lg:h-[30px]"
                                            title={
                                              isEnglish
                                                ? activity.challenge
                                                    .is_first_blood
                                                  ? "First Blood"
                                                  : "Bytes"
                                                : activity.challenge
                                                    .is_first_blood
                                                ? "البايتس الأولى"
                                                : "بايتس"
                                            }
                                          />
                                        </div>
                                      </td>
                                      <td className="py-2 lg:py-3 w-[50%]">
                                        <div
                                          onClick={() =>
                                            router.push(
                                              `/profile/${activity.member.username}`
                                            )
                                          }
                                          dir={isEnglish ? "ltr" : "rtl"}
                                          className={`flex cursor-pointer items-center gap-2 lg:gap-3 ${
                                            isEnglish
                                              ? "pl-2 lg:pl-3"
                                              : "pr-2 lg:pr-3"
                                          }`}
                                        >
                                          <Image
                                            src={
                                              activity.member.profile_image ||
                                              "/icon1.png"
                                            }
                                            alt="user"
                                            width={24}
                                            height={24}
                                            className="rounded-full lg:w-[32px] lg:h-[32px]"
                                            unoptimized={true}
                                          />
                                          <span className="text-white text-sm lg:text-base">
                                            {activity.member.username}
                                          </span>
                                          <span className="text-white text-sm lg:text-base">
                                            {isEnglish
                                              ? activity.challenge
                                                  .is_first_blood
                                                ? `got first blood in ${activity.challenge.challenge_name}`
                                                : `earned bytes in ${activity.challenge.challenge_name}`
                                              : activity.challenge
                                                  .is_first_blood
                                              ? `حصل على البايتس الأول في ${activity.challenge.challenge_name}`
                                              : `حصل على بايتس في ${activity.challenge.challenge_name}`}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Image
                        src="/notfound.png"
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
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <Image
                src="/notjoined.png"
                height={100}
                width={100}
                alt="no team"
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-[100px] md:h-[100px] mb-4"
              />
              <h3 className="text-lg sm:text-xl md:text-2xl text-center">
                {isEnglish
                  ? "You are not in a team for this event"
                  : "أنت لست في فريق لهذه الفعالية"}
              </h3>
            </div>
          )}
        </div>
      )}

      {activeTab === "leaderboard" && isEventScoreBoard ? (
        <>
          {/* Event End Countdown Timer */}
          {eventEndDate && !eventHasEnded && (
            <div className="w-full mb-8">
              <div className="flex flex-col w-full justify-center items-center gap-2">
                <div className="flex flex-col items-center text-center my-4">
                  <p dir="ltr" className="text-lg mb-2 text-[#38FFE5]">
                    {isEnglish ? "Event Ends In:" : "تنتهي الفعالية في"}
                  </p>
                  {isEnglish ? (
                    <h3 className="text-2xl font-bold text-white">
                      {endTimeRemaining.days.toString().padStart(2, "0")}d :
                      {endTimeRemaining.hours.toString().padStart(2, "0")}h :
                      {endTimeRemaining.minutes.toString().padStart(2, "0")}m :
                      {endTimeRemaining.seconds.toString().padStart(2, "0")}s
                    </h3>
                  ) : (
                    <h3 className="text-2xl font-bold text-white">
                      ي {endTimeRemaining.days.toString().padStart(2, "0")} : س{" "}
                      {endTimeRemaining.hours.toString().padStart(2, "0")} : د{" "}
                      {endTimeRemaining.minutes.toString().padStart(2, "0")} : ث{" "}
                      {endTimeRemaining.seconds.toString().padStart(2, "0")}
                    </h3>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remove the status indicator for leaderboard */}

          {/* Top 3 Users Display */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 sm:gap-8 md:gap-16 lg:gap-24 mb-10 mt-4">
            {/* First Place (Middle) */}

            {scoreboardData.length > 0 && (
              <div className="flex flex-col items-center md:hidden   md:mb-28">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 relative">
                    {/* Background laurel wreath image */}
                    <div className="absolute inset-0 z-10 mt-10 flex items-center justify-center">
                      <Image
                        src="/gold.png"
                        alt="gold laurel wreath"
                        width={160}
                        height={160}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Profile image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[80%] h-[80%] rounded-full overflow-hidden">
                        {scoreboardData[0].team_icon ? (
                          <Image
                            src={scoreboardData[0].team_icon}
                            alt={scoreboardData[0].team_name}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#06373F]">
                            <Image
                              src="/icon1.png"
                              alt="team"
                              width={40}
                              height={40}
                              className="text-[#FFD700] text-3xl"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 font-bold text-white text-lg">
                  {scoreboardData[0].team_name}
                </p>

                {/* Three score indicators */}
                <div className="flex items-center gap-2 mt-2  ">
                  <div className="flex items-center gap-1">
                    <Image
                      src="/byte.png"
                      alt="points"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[0].points}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/icon-challnge.png"
                      alt="challenges"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[0].challenges_solved}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/blood.png"
                      alt="first blood"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[0].first_blood_count}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Second Place (Left) */}
            {scoreboardData.length > 1 && (
              <div className="flex flex-col items-center md:mt-10">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 relative">
                    {/* Background laurel wreath image */}
                    <div className="absolute inset-0 mt-10 z-10 flex items-center justify-center">
                      <Image
                        src="/Sliver.png"
                        alt="orange laurel wreath"
                        width={144}
                        height={144}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Profile image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[80%] h-[80%] rounded-full overflow-hidden">
                        {scoreboardData[1].team_icon ? (
                          <Image
                            src={scoreboardData[1].team_icon}
                            alt={scoreboardData[1].team_name}
                            width={115}
                            height={115}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#06373F]">
                            <Image
                              src="/icon1.png"
                              alt="team"
                              width={40}
                              height={40}
                              className="text-[#FFA500] text-2xl"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 font-bold text-white">
                  {scoreboardData[1].team_name}
                </p>

                {/* Three score indicators */}
                <div className="flex items-center gap-2 bg-[#0A1316] rounded-lg p-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Image
                      src="/byte.png"
                      alt="points"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[1].points}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/icon-challnge.png"
                      alt="challenges"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[1].challenges_solved}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/blood.png"
                      alt="first blood"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[1].first_blood_count}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {scoreboardData.length > 0 && (
              <div className="md:flex flex-col items-center hidden   md:mb-28">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 relative">
                    {/* Background laurel wreath image */}
                    <div className="absolute inset-0 z-10 mt-10 flex items-center justify-center">
                      <Image
                        src="/gold.png"
                        alt="gold laurel wreath"
                        width={160}
                        height={160}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Profile image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[80%] h-[80%] rounded-full overflow-hidden">
                        {scoreboardData[0].team_icon ? (
                          <Image
                            src={scoreboardData[0].team_icon}
                            alt={scoreboardData[0].team_name}
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#06373F]">
                            <Image
                              src="/icon1.png"
                              alt="team"
                              width={40}
                              height={40}
                              className="text-[#FFD700] text-3xl"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 font-bold text-white text-lg">
                  {scoreboardData[0].team_name}
                </p>

                {/* Three score indicators */}
                <div className="flex items-center gap-2 mt-2 bg-[#0A1316] rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <Image
                      src="/byte.png"
                      alt="points"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[0].points}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/icon-challnge.png"
                      alt="challenges"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[0].challenges_solved}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/blood.png"
                      alt="first blood"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[0].first_blood_count}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Third Place (Right) */}
            {scoreboardData.length > 2 && (
              <div className="flex flex-col items-center md:mt-10">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 relative">
                    {/* Background laurel wreath image */}
                    <div className="absolute inset-0 z-10 mt-10 flex items-center justify-center">
                      <Image
                        src="/Bronze.png"
                        alt="silver laurel wreath"
                        width={144}
                        height={144}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Profile image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[80%] h-[80%] rounded-full overflow-hidden">
                        {scoreboardData[2].team_icon ? (
                          <Image
                            src={scoreboardData[2].team_icon}
                            alt={scoreboardData[2].team_name}
                            width={115}
                            height={115}
                            className="w-full h-full object-cover"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#06373F]">
                            <Image
                              src="/icon1.png"
                              alt="team"
                              width={40}
                              height={40}
                              className="text-[#C0C0C0] text-2xl"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-2 font-bold text-white">
                  {scoreboardData[2].team_name}
                </p>

                {/* Three score indicators */}
                <div className="flex items-center gap-2 mt-2 bg-[#0A1316] rounded-lg p-2">
                  <div className="flex items-center gap-1">
                    <Image
                      src="/byte.png"
                      alt="points"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[2].points}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/icon-challnge.png"
                      alt="challenges"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[2].challenges_solved}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Image
                      src="/blood.png"
                      alt="first blood"
                      width={16}
                      height={16}
                    />
                    <span className="text-white text-xs">
                      {scoreboardData[2].first_blood_count}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Responsive Table Container */}
          <div className="w-full overflow-x-auto bg-[#06373F26] p-5">
            <div className="min-w-[700px]">
              {/* Table Header */}
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="grid grid-cols-5 place-items-start px-4 md:px-10 gap-4 mb-9 bg-[#38FFE50D] py-3 rounded-md"
              >
                <div className="col-span-2 text-sm md:text-base text-center text-white font-semibold flex flex-wrap justify-center items-center">
                  <span
                    className={`${
                      isEnglish ? "pr-12 md:pr-28" : "pl-12 md:pl-28"
                    }`}
                  >
                    {isEnglish ? "Rank" : "التصنيف"}
                  </span>
                  <span className={`${isEnglish ? "ml-2" : "mr-2"}`}>
                    {isEnglish ? "Team" : "الفريق"}
                  </span>
                </div>
                <div className="col-span-1 text-sm md:text-base text-center text-white font-semibold">
                  {isEnglish ? "Points" : "النقاط"}
                </div>
                <div className="col-span-1 text-sm md:text-base text-center text-white font-semibold">
                  {isEnglish ? "Challenges" : "التحديات"}
                </div>
                <div className="col-span-1 text-sm md:text-base text-center text-white font-semibold">
                  {isEnglish ? "First Blood" : "البايتس الأولى"}
                </div>
              </div>

              {/* Table Rows */}
              {scoreboardData.map((team, index) => (
                <div
                  dir={isEnglish ? "ltr" : "rtl"}
                  key={index}
                  className={`rounded-lg mb-3 px-4 md:px-10 py-3 ${
                    index % 2 === 0 ? "bg-[#06373F]" : "bg-transparent"
                  }`}
                >
                  <div
                    className={`grid grid-cols-5 ${
                      isEnglish ? "place-items-start" : "place-items-start"
                    } gap-4`}
                  >
                    <div className="col-span-2 flex justify-center">
                      <div className="flex gap-4 md:gap-12 items-center">
                        <div className="w-[35px] flex justify-center">
                          {index < 3 ? (
                            <Image
                              src={
                                index === 0
                                  ? "/first.png"
                                  : index === 1
                                  ? "/second.png"
                                  : "/third.png"
                              }
                              alt={`rank ${index + 1}`}
                              width={35}
                              height={35}
                            />
                          ) : (
                            <span className="text-white text-base md:text-xl font-bold">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-10 md:ml-16">
                          {team.team_icon ? (
                            <Image
                              src={team.team_icon}
                              alt="team avatar"
                              width={40}
                              height={40}
                              className="rounded-full object-cover w-8 h-8 md:w-10 md:h-10"
                              unoptimized={true}
                            />
                          ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center ">
                              <Image
                                src="/icon1.png"
                                alt="team"
                                width={40}
                                height={40}
                                className="text-[#38FFE5] text-base md:text-xl sm:text-2xl"
                              />
                            </div>
                          )}
                          <span
                            className="text-white text-sm md:text-xl font-bold truncate max-w-[120px] md:max-w-[200px] cursor-pointer hover:text-[#38FFE5] transition-colors"
                            onClick={() => setSelectedTeamUuid(team.team_uuid)}
                          >
                            {team.team_name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <div className="flex flex-row-reverse items-center gap-2">
                        <Image
                          src="/byte.png"
                          alt="points"
                          width={25}
                          height={25}
                          className="w-5 h-5 md:w-6 md:h-6"
                        />
                        <span className="text-white text-sm md:text-xl">
                          {team.points}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <div className="flex flex-row-reverse items-center gap-2">
                        <Image
                          src="/icon-challnge.png"
                          alt="challenges"
                          width={25}
                          height={25}
                          className="w-5 h-5 md:w-6 md:h-6"
                        />
                        <span className="text-white text-sm md:text-xl">
                          {team.challenges_solved}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <div className="flex flex-row-reverse items-center gap-2">
                        <Image
                          src="/blood.png"
                          alt="first blood"
                          width={25}
                          height={25}
                          className="w-5 h-5 md:w-6 md:h-7"
                        />
                        <span className="text-white text-sm md:text-xl">
                          {team.first_blood_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {activeTab === "leaderboard" && (
            <div className="flex flex-col items-center justify-center pb-7">
              {/* Event End Countdown Timer */}
              {eventEndDate && !eventHasEnded && (
                <div className="w-full mb-8">
                  <div className="flex flex-col w-full justify-center items-center gap-2">
                    <div className="flex flex-col items-center text-center my-4">
                      <p
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="text-lg mb-2 text-[#38FFE5]"
                      >
                        {isEnglish ? "Event Ends In:" : "تنتهي الفعالية في"}
                      </p>
                      {isEnglish ? (
                        <h3 className="text-2xl font-bold text-white">
                          {endTimeRemaining.days.toString().padStart(2, "0")}d :
                          {endTimeRemaining.hours.toString().padStart(2, "0")}h
                          :
                          {endTimeRemaining.minutes.toString().padStart(2, "0")}
                          m :
                          {endTimeRemaining.seconds.toString().padStart(2, "0")}
                          s
                        </h3>
                      ) : (
                        <h3 className="text-2xl font-bold text-white">
                          ي {endTimeRemaining.days.toString().padStart(2, "0")}{" "}
                          : س{" "}
                          {endTimeRemaining.hours.toString().padStart(2, "0")} :
                          د{" "}
                          {endTimeRemaining.minutes.toString().padStart(2, "0")}{" "}
                          : ث{" "}
                          {endTimeRemaining.seconds.toString().padStart(2, "0")}
                        </h3>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Image
                src="/notfound.png"
                height={140}
                width={140}
                alt="leaderboard"
              />
              <h3 className=" font-bold text-center pt-4">
                {isEnglish
                  ? "Leaderboard coming soon"
                  : "سيتم عرض المتصدرين قريبًا"}
              </h3>
            </div>
          )}
        </>
      )}

      {activeTab === "challenges" &&
        !isChallengesStarted &&
        !isEventStarted && (
          <div className="flex flex-col items-center justify-center pb-7 ">
            <Image
              src="/notjoined.png"
              height={100}
              width={100}
              alt="no team"
            />
            <h3 className="text-lg  md:text-2xl  text-center mb-4">
              {isEnglish
                ? "You need register in this event"
                : "لم تقم بالتسجيل في هذه الفاعلية"}
            </h3>
          </div>
        )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsEditModalOpen(false)}
          ></div>
          <div
            className="bg-[#131619] rounded-lg p-8 w-full max-w-md mx-4 relative z-10"
            dir={isEnglish ? "ltr" : "rtl"}
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-black/30 overflow-hidden mb-4 border-2 border-gray-800">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Team"
                    className="w-full h-full object-cover"
                  />
                ) : teams?.image ? (
                  <img
                    src={teams.image}
                    alt="Team"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </span>
                )}
              </div>

              <div
                className={`flex ${
                  isEnglish ? "flex-row" : "flex-row-reverse"
                } w-full justify-center gap-2 mb-4`}
              >
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-900/20 transition text-sm"
                >
                  {isEnglish ? "Remove" : "إزالة"}
                </button>
                <label className="px-5 py-2 bg-[#38FFE5] text-[#06373F] rounded-md cursor-pointer hover:bg-[#38FFE5]/90 transition text-sm font-medium">
                  {isEnglish ? "Change" : "تغيير"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">
                {isEnglish ? "Team Name" : "اسم الفريق"}
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-3 py-3 bg-black/30 border border-gray-800 rounded-md focus:outline-none focus:border-[#38FFE5]"
                maxLength={50}
                placeholder={isEnglish ? "Enter team name" : "أدخل اسم الفريق"}
              />
            </div>

            <button
              onClick={updateTeam}
              disabled={isUpdating}
              className="w-full py-3 bg-[#38FFE5] text-[#06373F] rounded-md hover:bg-[#38FFE5]/90 transition font-bold text-base"
            >
              {isUpdating
                ? isEnglish
                  ? "Saving..."
                  : "جاري الحفظ..."
                : isEnglish
                ? "Save"
                : "حفظ"}
            </button>

            <button
              onClick={() => setIsEditModalOpen(false)}
              className="w-full py-3 mt-2 border border-gray-700 bg-transparent rounded-md hover:bg-white/5 transition text-sm"
            >
              {isEnglish ? "Back" : "الرجوع للخلف"}
            </button>
          </div>
        </div>
      )}

      <TeamDetailsModal
        isOpen={!!selectedTeamUuid}
        onClose={() => setSelectedTeamUuid(null)}
        teamUuid={selectedTeamUuid}
        teamData={scoreboardData.find(
          (team) => team.team_uuid === selectedTeamUuid
        )}
      />

      {activeTab === "activities" && (
        <div className="mb-10">
          <div
            dir={isEnglish ? "ltr" : "rtl"}
            className="flex flex-row justify-between items-center mb-6"
          >
            <div>
              <h3 className="text-lg md:text-xl lg:text-[20px] font-bold pb-2 cursor-pointer">
                {isEnglish ? "Latest Activities" : "أحدث الأنشطة"}
              </h3>
            </div>

            <div className="flex flex-row items-center gap-3">
              {/* Remove the Test Activity button */}
              <div className="flex flex-row items-center gap-1">
                <p>
                  {isEnglish
                    ? isLeaderboardFrozen
                      ? "Activities: Frozen"
                      : "Activities: Live"
                    : isLeaderboardFrozen
                    ? "الأنشطة : مجمدة"
                    : "الأنشطة : حيّة"}
                </p>
                <div
                  className={`w-[16px] h-[16px] rounded-full ${
                    isLeaderboardFrozen ? "bg-red-500" : "bg-[#38FFE5]"
                  }`}
                  style={{
                    animation: "pulse 3s ease-in-out infinite",
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="px-4 lg:px-10 py-6 lg:py-10 bg-[#06373F26] rounded-2xl">
            <div className="overflow-x-auto">
              <div className="min-w-[768px] w-full">
                {/* Header wrapper div */}
                <div className="rounded-2xl bg-[#38FFE50D] mb-6 lg:mb-10">
                  <table className={`w-full ${isEnglish ? "pl-5" : "pr-5"}`}>
                    <thead>
                      <tr
                        className={`text-white ${
                          isEnglish ? "flex-row-reverse" : "flex-row"
                        } flex items-center justify-between`}
                      >
                        <th
                          className={`py-3 lg:py-4 w-[25%] text-sm lg:text-base ${
                            isEnglish
                              ? "text-left pl-3 lg:pl-5"
                              : "text-right pr-3 lg:pr-5"
                          }`}
                        >
                          {isEnglish ? "Time" : "التوقيت"}
                        </th>
                        <th
                          className={`py-3 lg:py-4 w-[25%] text-sm lg:text-base ${
                            isEnglish ? "text-left" : "text-right"
                          }`}
                        >
                          {isEnglish ? "Bytes" : "البايتس"}
                        </th>
                        <th
                          className={`py-3 lg:py-4 w-[50%] text-sm lg:text-base ${
                            isEnglish
                              ? "text-left pl-3 lg:pl-5"
                              : "text-right pr-3 lg:pr-5"
                          }`}
                        >
                          {isEnglish ? "User" : "المستخدم"}
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Body rows */}
                {isActivitiesLoading ? (
                  <div className="flex justify-center items-center py-10">
                    <BiLoaderAlt className="animate-spin text-[#38FFE5] text-5xl mx-auto" />
                  </div>
                ) : activities.length > 0 ? (
                  activities.map((activity, index) => {
                    const solvedDate = convertToUserTimezone(
                      new Date(activity.solved_at)
                    );
                    const now = getCurrentDateInUserTimezone();
                    const diffTime = Math.abs(now - solvedDate);
                    const diffMinutes = Math.floor(diffTime / (1000 * 60));
                    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
                    const diffDays = Math.floor(
                      diffTime / (1000 * 60 * 60 * 24)
                    );

                    let timeAgo = "";
                    if (diffDays > 0) {
                      timeAgo = isEnglish
                        ? `${diffDays} days ago`
                        : `منذ ${diffDays} يوم`;
                    } else if (diffHours > 0) {
                      timeAgo = isEnglish
                        ? `${diffHours} hours ago`
                        : `منذ ${diffHours} ساعة`;
                    } else {
                      timeAgo = isEnglish
                        ? `${diffMinutes} minutes ago`
                        : `منذ ${diffMinutes} دقيقة`;
                    }

                    return (
                      <div
                        key={`${activity.user_name}-${activity.challenge_uuid}-${index}`}
                        className={`${
                          index % 2 === 0 ? "bg-[#06373F] rounded-2xl" : ""
                        } mb-2`}
                      >
                        <table className="w-full">
                          <tbody>
                            <tr
                              className={`flex items-center justify-between ${
                                isEnglish ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              <td
                                dir={isEnglish ? "ltr" : "rtl"}
                                className={`py-2 lg:py-3 text-white/70 w-[25%] text-sm lg:text-base ${
                                  isEnglish ? "pl-3 lg:pl-5" : "pr-3 lg:pr-5"
                                }`}
                              >
                                {timeAgo}
                              </td>
                              <td className="py-2 lg:py-3 w-[25%]">
                                <div
                                  dir={isEnglish ? "ltr" : "rtl"}
                                  className={`flex items-center gap-1 lg:gap-2 ${
                                    isEnglish ? "pl-0" : "pr-0"
                                  }`}
                                >
                                  <span className="text-white text-sm lg:text-base min-w-[24px] md:min-w-[32px] text-left">
                                    {activity.total_bytes}
                                  </span>
                                  <Image
                                    src={
                                      activity.is_first_blood
                                        ? "/blood.png"
                                        : "/byte.png"
                                    }
                                    alt={
                                      activity.is_first_blood
                                        ? "first blood"
                                        : "points"
                                    }
                                    width={25}
                                    height={30}
                                    className=""
                                  />
                                </div>
                              </td>
                              <td className="py-2 lg:py-3 w-[50%]">
                                <div
                                  dir={isEnglish ? "ltr" : "rtl"}
                                  className={`flex items-center gap-2 lg:gap-3 ${
                                    isEnglish ? "pl-2 lg:pl-3" : "pr-2 lg:pr-3"
                                  }`}
                                >
                                  <span className="text-sm lg:text-base min-w-[20px] text-center">
                                    {index + 1}
                                  </span>
                                  <Image
                                    src={
                                      activity.user_profile_image ||
                                      "/icon1.png"
                                    }
                                    alt="user"
                                    width={24}
                                    height={24}
                                    className="rounded-full lg:w-[32px] lg:h-[32px]"
                                    unoptimized={true}
                                  />
                                  <span
                                    onClick={() => {
                                      router.push(
                                        `/profile/${activity.user_name}`
                                      );
                                    }}
                                    className="text-white cursor-pointer text-sm lg:text-base"
                                  >
                                    {activity.user_name}
                                  </span>
                                  <span className="text-white text-sm lg:text-base">
                                    {isEnglish
                                      ? activity.is_first_blood
                                        ? `got first blood from ${activity.challenge_title}`
                                        : `earned bytes from ${activity.challenge_title}`
                                      : activity.is_first_blood
                                      ? `حصل علي البايتس الاول في ${activity.challenge_title}`
                                      : `حصل علي بايتس في ${activity.challenge_title}`}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Image
                      src="/notfound.png"
                      height={80}
                      width={80}
                      alt="activities"
                      className="w-16 h-16 sm:w-20 sm:h-20 mb-4"
                    />
                    <h3 className="text-lg sm:text-xl font-medium text-center">
                      {isEnglish
                        ? "Activities will be available soon"
                        : "ستكون الأنشطة متاحة قريبًا"}
                    </h3>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add back the Toaster component */}
      <Toaster
        position="top-center"
        containerStyle={{
          top: "50%",
          transform: "translateY(-50%)",
        }}
        toastOptions={{
          duration: 3000,
          className: "",
          style: {
            background: "#333",
            color: "#fff",
            direction: isEnglish ? "ltr" : "rtl",
            textAlign: isEnglish ? "left" : "right",
          },
          success: {
            style: {
              background: "green",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "green",
            },
          },
          error: {
            style: {
              background: "red",
            },
            iconTheme: {
              primary: "#fff",
              secondary: "red",
            },
          },
        }}
      />
    </div>
  );
}
