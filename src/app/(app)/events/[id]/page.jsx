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
import toast, { Toaster } from "react-hot-toast";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { createSocket } from "@/lib/socket-client";

import LoadingPage from "@/app/components/LoadingPage";
import { useRouter } from "next/navigation";
import TeamDetailsModal from "@/app/components/TeamDetailsModal";

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

  // Add a function to force refresh team data
  const forceRefreshTeamData = async () => {
    try {
      await getTeams();
    } catch (error) {
      console.error("Error refreshing team data:", error);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const userName = Cookies.get("username");
    const newSocket = createSocket(userName);
    setSocket(newSocket);

    // Join the team updates room for this event
    if (newSocket) {
      newSocket.emit("joinTeamRoom", id);

      // Listen for team updates
      newSocket.on("teamUpdate", (data) => {
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
                data.username,
                data.points || 0,
                data.isFirstBlood || false,
                data.teamUuid
              );
            }
          }
        }
      });

      // Listen specifically for leaderboard updates - these are direct scoreboard update events
      newSocket.on("leaderboardUpdate", (data) => {
        console.log("Received leaderboard update:", data);
        if (
          data.eventId === id &&
          isEventScoreBoard &&
          activeTab === "leaderboard"
        ) {
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
            data.username,
            data.points || 0,
            data.isFirstBlood || false,
            data.teamUuid
          );
        }
      });

      // Listen for flag submission updates from any team member
      newSocket.on("flagSubmitted", (data) => {
        console.log("Received flag submission:", data);
        if (data.eventId === id) {
          // Force refresh team data regardless of which team submitted
          setTimeout(() => {
            forceRefreshTeamData();
          }, 500);

          // Show a toast notification for the flag submission if it's my team
          if (teams?.uuid === data.teamUuid) {
            const username = data.username;
            toast.success(
              isEnglish
                ? `${username} solved a challenge for ${data.points} points!`
                : `حل ${username} تحديًا مقابل ${data.points} نقطة!`
            );
          }

          // Update scoreboard if we're viewing it
          if (isEventScoreBoard && activeTab === "leaderboard") {
            updateScoreboardWithNewPoints(
              data.username,
              data.points || 0,
              false,
              data.teamUuid
            );
          }
        }
      });

      // Listen for first blood specific events
      newSocket.on("flagFirstBlood", (data) => {
        console.log("Received first blood:", data);
        if (data.eventId === id) {
          // Force refresh team data regardless of which team got first blood
          setTimeout(() => {
            forceRefreshTeamData();
          }, 500);

          // Show a toast notification for the first blood if it's my team
          if (teams?.uuid === data.teamUuid) {
            const username = data.username;
            toast.success(
              isEnglish
                ? `${username} got first blood for ${data.points} points!`
                : `حصل ${username} على الدم الأول مقابل ${data.points} نقطة!`
            );
          }

          // Update scoreboard if we're viewing it
          if (isEventScoreBoard && activeTab === "leaderboard") {
            updateScoreboardWithNewPoints(
              data.username,
              data.points || 0,
              true,
              data.teamUuid
            );
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("teamUpdate");
        socket.off("flagSubmitted");
        socket.off("flagFirstBlood");
        socket.off("leaderboardUpdate");
        socket.emit("leaveTeamRoom", id);
      }
    };
  }, [id, teams?.uuid, isEnglish, isEventScoreBoard, activeTab]);

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

  const eventScoreBoard = async () => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/${id}/scoreboard`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (res.data.data.length > 0) {
        setIsEventScoreBoard(true);
        setScoreboardData(res.data.data);
      }
    } catch (error) {
      return null;
    }
  };

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

  // Function to handle real-time scoreboard updates
  const updateScoreboardWithNewPoints = (
    username,
    newPoints,
    isFirstBlood = false,
    teamUuid = null
  ) => {
    setScoreboardData((prevData) => {
      if (!prevData || prevData.length === 0) return prevData;

      // First, map the data to add the updated fields and calculate the new scores
      const updatedData = prevData
        .map((team) => {
          // If teamUuid is provided, we match by team UUID
          const isTeamMatch = teamUuid
            ? team.team_uuid === teamUuid
            : team.members?.some((member) => member.username === username);

          if (isTeamMatch) {
            // Update team stats
            const updatedPoints = Number(team.points) + Number(newPoints);
            const updatedChallengesSolved = Number(team.challenges_solved) + 1;
            const updatedFirstBloodCount = isFirstBlood
              ? Number(team.first_blood_count) + 1
              : Number(team.first_blood_count);

            console.log(
              `Updating team ${team.team_name} with new points: ${newPoints}, total: ${updatedPoints}`
            );

            return {
              ...team,
              points: updatedPoints,
              challenges_solved: updatedChallengesSolved,
              first_blood_count: updatedFirstBloodCount,
              // Mark this team as having just received points for animation
              justUpdated: true,
              justUpdatedTime: Date.now(),
            };
          }

          return team;
        })
        .sort((a, b) => b.points - a.points); // Resort by points

      return updatedData;
    });
  };

  // Clear the justUpdated flag after animation duration
  useEffect(() => {
    if (!scoreboardData || scoreboardData.length === 0) return;

    // Check if any team has the justUpdated flag
    const hasUpdated = scoreboardData.some((team) => team.justUpdated);

    if (hasUpdated) {
      // Set a timeout to clear the flag after animation plays
      const timer = setTimeout(() => {
        setScoreboardData((prevData) =>
          prevData.map((team) => ({
            ...team,
            justUpdated: false,
          }))
        );
      }, 3000); // 3 seconds animation

      return () => clearTimeout(timer);
    }
  }, [scoreboardData]);

  // useEffect for socket initialization and event handling
  useEffect(() => {
    const userName = Cookies.get("username");
    const newSocket = createSocket(userName);
    setSocket(newSocket);

    // Join the team updates room for this event
    if (newSocket) {
      newSocket.emit("joinTeamRoom", id);

      // Listen for team updates
      newSocket.on("teamUpdate", (data) => {
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
                data.username,
                data.points || 0,
                data.isFirstBlood || false,
                data.teamUuid
              );
            }
          }
        }
      });

      // Listen for flag submission updates from any team member
      newSocket.on("flagSubmitted", (data) => {
        console.log("Received flag submission:", data);
        if (data.eventId === id) {
          // Force refresh team data regardless of which team submitted
          setTimeout(() => {
            forceRefreshTeamData();
          }, 500);

          // Show a toast notification for the flag submission if it's my team
          if (teams?.uuid === data.teamUuid) {
            const username = data.username;
            toast.success(
              isEnglish
                ? `${username} solved a challenge for ${data.points} points!`
                : `حل ${username} تحديًا مقابل ${data.points} نقطة!`
            );
          }

          // Update scoreboard if we're viewing it
          if (isEventScoreBoard && activeTab === "leaderboard") {
            updateScoreboardWithNewPoints(
              data.username,
              data.points || 0,
              false,
              data.teamUuid
            );
          }
        }
      });

      // Listen for first blood specific events
      newSocket.on("flagFirstBlood", (data) => {
        console.log("Received first blood:", data);
        if (data.eventId === id) {
          // Force refresh team data regardless of which team got first blood
          setTimeout(() => {
            forceRefreshTeamData();
          }, 500);

          // Show a toast notification for the first blood if it's my team
          if (teams?.uuid === data.teamUuid) {
            const username = data.username;
            toast.success(
              isEnglish
                ? `${username} got first blood for ${data.points} points!`
                : `حصل ${username} على الدم الأول مقابل ${data.points} نقطة!`
            );
          }

          // Update scoreboard if we're viewing it
          if (isEventScoreBoard && activeTab === "leaderboard") {
            updateScoreboardWithNewPoints(
              data.username,
              data.points || 0,
              true,
              data.teamUuid
            );
          }
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("teamUpdate");
        socket.off("flagSubmitted");
        socket.off("flagFirstBlood");
        socket.emit("leaveTeamRoom", id);
      }
    };
  }, [id, teams?.uuid, isEnglish, isEventScoreBoard, activeTab]);

  // Additional effect to trigger scoreboard fetch when switching to leaderboard tab
  useEffect(() => {
    if (activeTab === "leaderboard" && isEventScoreBoard) {
      eventScoreBoard();
    }
  }, [activeTab]);

  return isLoading ? (
    <LoadingPage />
  ) : (
    <div className="mt-28 lg:mt-36 px-4 sm:px-6 md:px-8 lg:px-10 max-w-[2000px] mx-auto">
      {/* Add global styles for animations */}
      <style jsx global>{`
        @keyframes scoreUpdate {
          0% {
            background-color: rgba(56, 255, 229, 0.5);
          }
          50% {
            background-color: rgba(56, 255, 229, 0.3);
          }
          100% {
            background-color: transparent;
          }
        }

        .score-updated {
          animation: scoreUpdate 3s ease-out forwards;
        }
      `}</style>

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
      `}</style>

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

        {eventHasEnded && (
          <div className="absolute flex flex-col items-center justify-center w-full h-full bg-black/80 rounded-xl">
            <div>
              <p className="text-xl sm:text-2xl font-bold flex items-center gap-4">
                تم انتهاء الفاعليه
                <span
                  style={{
                    animation: "pulse 3s ease-in-out infinite",
                    boxShadow: "0 0 5px #FF3838",
                  }}
                  className="w-2 sm:w-3 h-2 sm:h-3 bg-[#FF3838] rounded-full"
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
          className="grid grid-cols-1 md:grid-cols-2 mb-10 lg:grid-cols-3 gap-4"
        >
          {challenges.map((challenge) => (
            <div
              key={`${challenge.challenge_id}`}
              className="bg-white/5 rounded-lg p-6 hover:shadow-[0_0_15px_rgba(56,255,229,0.3)] transition-shadow"
            >
              <div
                className={`flex ${
                  isEnglish ? "flex-row pr-4" : "flex-row-reverse pr-3"
                } justify-between items-center mb-4`}
              >
                <div
                  className={`flex flex-col ${
                    isEnglish ? "items-start" : "items-end"
                  }`}
                >
                  <span className="text-[#38FFE5] font-bold text-xl">
                    {challenge.title}
                  </span>
                </div>
                <div
                  className={`bg-transparent ${
                    isEnglish ? "flex-row-reverse" : ""
                  } rounded-none w-12 h-12 gap-2 flex items-center justify-center`}
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
                    {challenge.difficulty}
                  </span>
                </div>
                <Link
                  href={`/event/${challenge.challenge_id}`}
                  className="text-[#38FFE5] hover:px-1 py-1 rounded hover:bg-[#38FFE5]/10 hover:transition-all duration-300"
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
                          <div className="rounded-lg bg-[#38FFE50D] mb-6 lg:mb-10">
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
                                    {isEnglish ? "Challenge" : "التحدي"}
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
          <div className="w-full overflow-x-auto">
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
                    team.justUpdated ? "score-updated" : ""
                  } ${index % 2 === 0 ? "bg-[#06373F]" : "bg-transparent"}`}
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
                            <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-[#06373F] rounded-full">
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
                      <div
                        className={`flex flex-row-reverse items-center gap-2 ${
                          team.justUpdated ? "font-bold" : ""
                        }`}
                      >
                        <Image
                          src="/byte.png"
                          alt="points"
                          width={25}
                          height={25}
                          className="w-5 h-5 md:w-6 md:h-6"
                        />
                        <span
                          className={`text-white text-sm md:text-xl ${
                            team.justUpdated ? "text-[#38FFE5]" : ""
                          }`}
                        >
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
                        <span
                          className={`text-white text-sm md:text-xl ${
                            team.justUpdated ? "text-[#38FFE5]" : ""
                          }`}
                        >
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
                          className="w-5 h-5 md:w-6 md:h-6"
                        />
                        <span
                          className={`text-white text-sm md:text-xl ${
                            team.justUpdated ? "text-[#38FFE5]" : ""
                          }`}
                        >
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
            <div className="flex flex-col items-center justify-center pb-7 ">
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
    </div>
  );
}
