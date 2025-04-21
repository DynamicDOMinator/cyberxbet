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

export default function EventPage() {
  const { isEnglish } = useLanguage();
  const { getCurrentDateInUserTimezone, timeZone } = useUserProfile();

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
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showRegisterButton, setShowRegisterButton] = useState(true);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [eventStartDate, setEventStartDate] = useState(null);
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("challenges");
  const [eventIsActive, setEveentIsActive] = useState(false);

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

      console.log("Team status response:", res.data);

      if (res.data.message === "You are in a team for this event") {
        setIsInTeam(true);
        if (currentPhase === "team_formation") {
          setButtonText(isEnglish ? "Already in Team" : "تم الانضمام");
          console.log(
            "User is in a team, updating button text to 'تم الانضمام'"
          );
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
      await getChallenges();
      await getTeams();
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
        // getChallenges(); // Only call this once when the timer ends
        // checkEventStatus();
        window.location.reload();
        console.log("Timer has ended");

        return;
      }

      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
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

  useEffect(() => {
    // Only check event status and get event data once when component mounts
    const checkEventStatus = async () => {
      try {
        const api = process.env.NEXT_PUBLIC_API_URL;
        const res = await axios.get(`${api}/${id}/check-if-event-started`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });

        console.log(
          "FULL Event status response data:",
          JSON.stringify(res.data)
        );

        // Default to hiding the button
        setShowRegisterButton(false);

        // Force team formation button if the message indicates team formation
        if (
          res.data.data &&
          res.data.data.message === "Team formation is open"
        ) {
          console.log("Team formation message detected directly!");
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
          console.log("Current event phase:", phase);

          if (phase === "registration") {
            setShowRegisterButton(true);
            setIsRegistering(true);
            setButtonText(isEnglish ? "Register Now" : "سجل الآن");
            console.log("Setting button for registration phase");
          } else if (phase === "team_formation") {
            setShowRegisterButton(true);
            setIsRegistering(true);
            setButtonText(isEnglish ? "Join Team" : "انضمام");
            console.log("Setting button for team formation phase");

            // Check if user is already in a team
            await checkIfInTeam();

            // Skip registration check for team formation
            return;
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
          console.log("Event is running, hiding button");
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

    checkEventStatus();
    getEvent();
  }, [id]);

  const getTeams = async () => {
    if (hasCheckedTeam && teams === null) return;

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
    } catch (error) {
      console.error("Error fetching teams:", error);
      if (
        error.response?.data?.message === "You are not in a team for this event"
      ) {
        setTeams(null);
        setHasCheckedTeam(true);
      }
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
      // Refresh the teams data after successful deletion
      getTeams();
    } catch (error) {
      console.error("Error deleting member:", error);
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

      console.log("User registered for the event");
      // Update button state immediately
      setIsRegistering(false);
      setButtonText(isEnglish ? "Already Registered" : "تم التسجيل ");

      // Show success toast
      toast.success(
        isEnglish
          ? "Successfully registered for the event"
          : "تم التسجيل في الفعالية بنجاح"
      );
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
      console.log("Registration status response:", res.data);

      if (res.data.message === "You are registered for this event") {
        console.log(
          "User is already registered, checking phase:",
          currentPhase
        );

        // If it's team formation phase, NEVER update the button
        if (currentPhase === "team_formation") {
          console.log(
            "In team formation phase, keeping 'انضمام' button regardless of registration status"
          );
          // Make sure button is enabled for team formation
          setIsRegistering(true);
          setButtonText(isEnglish ? "Join Team" : "انضمام");
        } else {
          // For other phases, show registered status
          setIsRegistering(false);
          setButtonText(isEnglish ? "Already Registered" : "تم التسجيل ");
          console.log("Updated button text to 'تم التسجيل'");
        }
      } else {
        console.log("User is not registered yet");
      }
    } catch (error) {
      console.error("Error checking registration status:", error);
    }
  };

  useEffect(() => {
    // This effect runs whenever currentPhase changes
    if (currentPhase === "team_formation") {
      console.log("Phase changed to team_formation, setting button text");
      setShowRegisterButton(true);
      setIsRegistering(true);

      // First update the button to انضمام
      setButtonText(isEnglish ? "Join Team" : "انضمام");

      // Then check if the user is already in a team
      checkIfInTeam();
    }
  }, [currentPhase, isEnglish]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewTeamImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
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
        formData.append("image", newTeamImage);
      }

      // Adding a static description field
      formData.append("description", "Team description placeholder");

      // Only make the request if there are changes
      if (formData.has("name") || formData.has("image")) {
        // Using the correct endpoint structure with teamUuid in the URL
        const response = await axios({
          method: "post",
          url: `${api}/teams/${teams?.uuid}`,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
            Accept: "application/json",
          },
          data: formData,
        });

        // Refresh team data
        await getTeams();
        toast.success(
          isEnglish ? "Team updated successfully" : "تم تحديث الفريق بنجاح"
        );
        setIsEditModalOpen(false);
      } else {
        setUpdateError(
          isEnglish ? "No changes to update" : "لا توجد تغييرات للتحديث"
        );
      }
    } catch (error) {
      console.error("Error updating team:", error);
      setUpdateError(
        error.response?.data?.message ||
          (isEnglish ? "Failed to update team" : "فشل في تحديث الفريق")
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mt-28 lg:mt-36 px-4 sm:px-6 md:px-8 lg:px-10 max-w-[2000px] mx-auto">
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
        className={`bg-cover bg-no-repeat bg-center relative rounded-lg mt-6 md:mt-8 lg:mt-12 h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] w-full`}
        style={{
          backgroundImage: `url(${event.image})`,
        }}
      >
        {eventIsActive && (
          <div className="absolute flex flex-col items-center justify-center w-full h-full bg-black/80">
            <div>
              <p className="text-xl sm:text-2xl font-bold flex items-center gap-4">
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
              <div className="flex flex-col sm:flex-row md:flex-row-reverse items-center gap-3 sm:gap-5 lg:gap-10 justify-center">
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

              <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end gap-4 sm:gap-8 md:gap-12 lg:gap-20 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
                <div>
                  <p className="text-sm sm:text-base md:text-[18px] justify-center flex items-center gap-2">
                    أعضاء
                    <span>
                      {event.team_maximum_members}-{event.team_minimum_members}
                    </span>
                    فريق من
                    <span className="text-[#38FFE5] text-lg sm:text-xl md:text-2xl lg:text-[24px] font-bold">
                      <HiOutlineUsers />
                    </span>
                  </p>
                </div>
                <div className="w-full sm:w-auto">
                  {/* Debug info */}
                  {console.log("Button render state:", {
                    text: buttonText,
                    phase: currentPhase,
                    showButton: showRegisterButton,
                    isRegistering,
                  })}
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

      <TeamRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventTitle={event.title}
        minMembers={event.team_minimum_members}
        maxMembers={event.team_maximum_members}
        onSuccess={() => {
          setHasCheckedTeam(false); // Reset this so we check again
          getTeams(); // Fetch the team data again after successful registration
          checkIfInTeam(); // Check if the user is now in a team
          setIsModalOpen(false); // Close the modal
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

        {isEventStarted && activeTab === "challenges" && (
          <div className="w-full h-full">
            <div className="flex flex-col w-full h-full justify-center items-center gap-2">
              <Image src="/lock.png" alt="lock" width={160} height={160} />

              <div className="flex flex-col items-center  mb-4">
                <div className="flex items-center gap-2 bg-black p-3 rounded-lg">
                  <div className="bg-white/10 rounded-md p-3">
                    <span className="text-white text-2xl font-bold">
                      {timeRemaining.hours.toString().padStart(2, "0")}
                    </span>
                    <span className="text-white text-xs block text-center mt-1">
                      {isEnglish ? "Hours" : "ساعات"}
                    </span>
                  </div>
                  <span className="text-[#38FFE5] text-2xl animate-pulse">
                    :
                  </span>
                  <div className="bg-white/10 rounded-md p-3">
                    <span className="text-white text-2xl font-bold">
                      {timeRemaining.minutes.toString().padStart(2, "0")}
                    </span>
                    <span className="text-white text-xs block text-center mt-1">
                      {isEnglish ? "Minutes" : "دقائق"}
                    </span>
                  </div>
                  <span className="text-[#38FFE5] text-2xl animate-pulse">
                    :
                  </span>
                  <div className="bg-white/10 rounded-md p-3">
                    <span className="text-white text-2xl font-bold">
                      {timeRemaining.seconds.toString().padStart(2, "0")}
                    </span>
                    <span className="text-white text-xs block text-center mt-1">
                      {isEnglish ? "Seconds" : "ثواني"}
                    </span>
                  </div>
                </div>
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
                  <span className="text-red-500 font-bold">
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
                    <Image
                      src="/user.png"
                      alt="team"
                      width={50}
                      height={50}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-[50px] md:h-[50px]"
                    />
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
                    <p className="text-sm sm:text-base">
                      {isEnglish ? "Ranking" : "التصنيف"}
                    </p>
                    <div className="flex items-center gap-2 pt-1 sm:pt-3">
                      <p className="text-sm sm:text-base">
                        {isEnglish ? "No Ranking" : "لا يوجد تصنيف"}
                      </p>
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
                                  {joinSecret || "*****************"}
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

                            {showCopiedToast && (
                              <div className="absolute -top-10 right-0 bg-[#38FFE5] text-[#06373F] px-3 py-1 rounded-md text-xs sm:text-sm">
                                {isEnglish ? "Copied!" : "تم النسخ!"}
                              </div>
                            )}
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
                              className="w-6 h-6 sm:w-8 sm:h-8 md:w-[30px] md:h-[30px]"
                            />
                            <p className="text-sm sm:text-base">
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
                            {isRemove && member.role !== "leader" && (
                              <button
                                onClick={() => deleteMember(member.username)}
                                className="text-red-500 cursor-pointer text-xs sm:text-sm rounded-lg py-1 sm:py-2 px-2 sm:px-4 border-2 border-red-500"
                              >
                                {isEnglish ? "Remove" : "إزالة"}
                              </button>
                            )}

                            <button
                              onClick={() => setIsRemove(!isRemove)}
                              className="cursor-pointer text-lg sm:text-xl"
                            >
                              ...
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {teamView === "activities" && (
                <div className="bg-[#FFFFFF0D] rounded-lg p-4 sm:p-6 mt-4">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Image
                      src="/activity.png"
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

      {activeTab === "leaderboard" && (
        <div className="flex flex-col items-center justify-center pb-7 ">
          <Image src="/ranking.png" height={80} width={80} alt="leaderboard" />
          <h3 className="text-xl font-bold text-center">
            {isEnglish
              ? "Leaderboard coming soon"
              : "سيتم عرض المتصدرين قريبًا"}
          </h3>
        </div>
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
    </div>
  );
}
