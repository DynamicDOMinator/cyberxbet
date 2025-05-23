"use client";
import React from "react";
import Link from "next/link";
import axios from "axios";
import { useLanguage } from "@/app/context/LanguageContext";
import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoadingPage from "@/app/components/LoadingPage";
import { HiOutlineUsers } from "react-icons/hi2";
import TeamRegistrationModal from "@/app/components/TeamRegistrationModal";
import toast, { Toaster } from "react-hot-toast";
import { createSocket, getSystemFreezeState } from "@/lib/socket-client";

export default function Events() {
  const { isEnglish } = useLanguage();
  const [event, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mainEvent, setMainEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buttonText, setButtonText] = useState("");
  const [isEventActive, setIsEventActive] = useState(false);
  const [isInTeam, setIsInTeam] = useState(false);
  const [showRegisterButton, setShowRegisterButton] = useState(true);
  const [isRegistering, setIsRegistering] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [loadingVisible, setLoadingVisible] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [eventFrozen, setEventFrozen] = useState(false);
  const socketRef = useRef(null);
  const router = useRouter();

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    };

    return new Intl.DateTimeFormat(
      isEnglish ? "en-US" : "ar-EG",
      options
    ).format(date);
  };

  // Function to explicitly check freeze state from the API
  const checkEventFreezeState = async (eventId) => {
    try {
      `Checking freeze state for event ${eventId}`;
      const response = await axios.get(`/api/freeze?eventId=${eventId}`);
      const frozen = response.data.frozen;
      `Event ${eventId} freeze state from API: ${frozen}`;

      if (frozen) {
        // Show toast notification for freeze
        toast.error(
          isEnglish
            ? "This event has been frozen by administrators"
            : "تم تجميد هذا الحدث من قبل المسؤولين"
        );
      }

      setEventFrozen(frozen);
      return frozen;
    } catch (error) {
      console.error(`Error checking freeze state for event ${eventId}:`, error);
      return false;
    }
  };

  // Check global system freeze state
  const checkGlobalFreezeState = async () => {
    try {
      ("Checking global freeze state");
      const response = await axios.get("/api/freeze");
      const frozen = response.data.frozen;
      `Global freeze state from API: ${frozen}`;

      if (frozen) {
        // Show toast notification for freeze
        toast.error(
          isEnglish
            ? "The system has been frozen by administrators"
            : "تم تجميد النظام من قبل المسؤولين"
        );
      }

      setIsFrozen(frozen);
      return frozen;
    } catch (error) {
      console.error("Error checking global freeze state:", error);
      return false;
    }
  };

  // Function to handle system freeze events from socket
  const handleSystemFreezeEvent = (data) => {
    "Received system_freeze event:", data;

    if (data.eventId && mainEvent && data.eventId === mainEvent.uuid) {
      // Event-specific freeze
      setEventFrozen(data.frozen);

      if (data.frozen) {
        // Toast removed
      }
    } else if (!data.eventId) {
      // Global freeze
      setIsFrozen(data.frozen);
    }
  };

  // Initialize socket and set up listeners
  useEffect(() => {
    ("Initializing socket connection");
    const userName = Cookies.get("username");
    const socket = createSocket(userName);
    socketRef.current = socket;

    // Listen for system_freeze events
    if (socket) {
      ("Setting up system_freeze event listener");

      socket.on("system_freeze", handleSystemFreezeEvent);

      // Request current system state
      socket.emit("get_system_state");
    }

    // Check initial global freeze state
    checkGlobalFreezeState();

    // Setup window event listener for custom events (for the virtual socket implementation)
    const handleFreezeUpdate = (event) => {
      const { detail } = event;
      "Received system_freeze_update event:", detail;

      if (detail.isGlobal) {
        setIsFrozen(detail.frozen);

        if (detail.frozen) {
          // Toast removed
        } else {
          // Toast removed
        }
      } else if (
        detail.eventId &&
        mainEvent &&
        detail.eventId === mainEvent.uuid
      ) {
        setEventFrozen(detail.frozen);

        if (detail.frozen) {
          // Toast removed
        } else {
          // Toast removed
        }
      }
    };

    window.addEventListener("system_freeze_update", handleFreezeUpdate);

    return () => {
      // Clean up socket listeners
      if (socketRef.current) {
        socketRef.current.off("system_freeze", handleSystemFreezeEvent);
      }

      window.removeEventListener("system_freeze_update", handleFreezeUpdate);
    };
  }, [isEnglish]);

  // Effect to check event-specific freeze state when mainEvent changes
  useEffect(() => {
    if (mainEvent?.uuid) {
      `Main event loaded: ${mainEvent.uuid}`;

      // Check event-specific freeze state
      checkEventFreezeState(mainEvent.uuid);

      // Join the team room for real-time updates
      if (socketRef.current) {
        `Joining team room for event: ${mainEvent.uuid}`;
        socketRef.current.emit("joinTeamRoom", mainEvent.uuid);
      }
    }

    return () => {
      // Leave the team room when component unmounts or mainEvent changes
      if (mainEvent?.uuid && socketRef.current) {
        `Leaving team room for event: ${mainEvent.uuid}`;
        socketRef.current.emit("leaveTeamRoom", mainEvent.uuid);
      }
    };
  }, [mainEvent]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = Cookies.get("token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await axios.get(`${apiUrl}/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setEvents(response.data.events);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    const fetchMainEvent = async () => {
      try {
        const token = Cookies.get("token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await axios.get(`${apiUrl}/main-event`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMainEvent(response.data.event);

        if (response.data.event?.uuid) {
          // After fetching main event, check the event phase
          await checkEventStatus(response.data.event.uuid);

          // Set isRegistered based on the API response
          if (response.data.event.is_registered) {
            setIsRegistering(false);
            setButtonText(isEnglish ? "Already Registered" : "تم التسجيل ");
          }
        }
      } catch (error) {
        return null;
      }
    };

    // Load data and hide loading indicator when both requests complete
    const loadData = async () => {
      try {
        await Promise.all([fetchEvents(), fetchMainEvent()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
        // Add a small delay before hiding the loading indicator for smooth transition
        setTimeout(() => {
          setLoadingVisible(false);
        }, 300);
      }
    };

    loadData();
  }, []);

  const checkEventStatus = async (eventId) => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const res = await axios.get(`${api}/${eventId}/check-if-event-started`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
        await checkIfInTeam(eventId);

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
          await checkIfInTeam(eventId);

          // Skip registration check for team formation
          return;
        }
      }

      // For backwards compatibility
      if (
        res.data.data &&
        res.data.data.message === "Event is currently running"
      ) {
        setIsEventActive(true);
        setShowRegisterButton(false); // Hide during event
      }

      // Only check registration status if not in team formation
      await checkRegistrationStatus(eventId);
    } catch (error) {
      console.error("Error checking event status:", error);
    }
  };

  const checkIfInTeam = async (eventId) => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const res = await axios.get(`${api}/${eventId}/check-if-in-team`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.message === "You are in a team for this event") {
        setIsInTeam(true);
        if (currentPhase === "team_formation") {
          setButtonText(isEnglish ? "Already in Team" : "تم الانضمام");
        }
      } else {
        setIsInTeam(false);
      }
    } catch (error) {
      console.error("Error checking team status:", error);
      setIsInTeam(false);
    }
  };

  const checkRegistrationStatus = async (eventId) => {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const res = await axios.get(`${api}/${eventId}/check-registration`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
      if (mainEvent?.uuid) {
        checkIfInTeam(mainEvent.uuid);
      }
    }
  }, [currentPhase, isEnglish, mainEvent]);

  const handleButtonClick = () => {
    // Check if system or event is frozen
    if (isFrozen || eventFrozen) {
      toast.error(
        isEnglish
          ? "This function is currently frozen by administrators."
          : "تم تجميد هذه الوظيفة مؤقتًا من قبل المسؤولين."
      );
      return;
    }

    if (currentPhase === "team_formation" && !isInTeam) {
      setIsModalOpen(true);
    } else if (currentPhase === "registration" && isRegistering) {
      registerNow();
    }
  };

  const registerNow = async () => {
    // Check if system or event is frozen
    if (isFrozen || eventFrozen) {
      toast.error(
        isEnglish
          ? "Registration is currently frozen by administrators."
          : "تم تجميد التسجيل مؤقتًا من قبل المسؤولين."
      );
      return;
    }

    if (!mainEvent?.uuid) return;

    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      const response = await axios.post(
        `${api}/${mainEvent.uuid}/register`,
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

  const handleTeamRegistrationSuccess = () => {
    setIsModalOpen(false);
    setIsInTeam(true);
    setButtonText(isEnglish ? "Already in Team" : "تم الانضمام");
    toast.success(
      isEnglish ? "Successfully joined the team" : "تم الانضمام للفريق بنجاح"
    );

    if (mainEvent?.uuid) {
      // Re-check team status after successful registration
      checkIfInTeam(mainEvent.uuid);
    }
  };

  return (
    <>
      {loadingVisible ? (
        <div
          className={`transition-opacity duration-300 ${
            loading ? "opacity-100" : "opacity-0"
          }`}
        >
          <LoadingPage />
        </div>
      ) : (
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 mt-36">
          <h1
            className={`text-3xl md:text-4xl font-bold mb-4 md:mb-6 ${
              isEnglish ? "text-left" : "text-right"
            } mt-12`}
          >
            {isEnglish ? "Events" : "الفعاليات"}
          </h1>

          <div className={`mb-8 ${isEnglish ? "text-left" : "text-right"}`}>
            <p dir={isEnglish ? "ltr" : "rtl"} className="text-lg">
              {isEnglish
                ? "All events hosted by "
                : "  جميع الفعاليات المُستضافة من"}
              <span className="text-[#38FFE5] font-bold">CyberXbytes</span>
            </p>
          </div>

          {(isFrozen || eventFrozen) && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-md text-center animate-pulse">
              <p className="text-lg font-semibold flex items-center justify-center gap-2">
                <span className="inline-block h-3 w-3 bg-red-500 rounded-full"></span>
                {isEnglish
                  ? "System frozen: Registration and team formation are temporarily disabled."
                  : "تم تجميد النظام: تم تعطيل التسجيل وتشكيل الفريق مؤقتًا."}
              </p>
            </div>
          )}

          <Toaster
            position="top-center"
            containerStyle={{
              top: "50%",
              transform: "translateY(-50%)",
            }}
            toastOptions={{
              duration: 5000, // Increased duration for better visibility
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

          {mainEvent && (
            <div
              className={`bg-cover bg-no-repeat bg-center relative rounded-[32px] mt-6 md:mt-8 lg:mt-12 min-h-[400px] md:h-[450px] lg:h-[500px] w-full overflow-hidden ${
                mainEvent.is_registered ? "cursor-pointer" : ""
              }`}
              style={{
                backgroundImage: `url(${mainEvent.image})`,
              }}
              onClick={() =>
                mainEvent.is_registered &&
                router.push(`/events/${mainEvent.uuid}`)
              }
            >
              {isEventActive && (
                <div className="absolute flex flex-col items-center justify-center w-full h-full bg-black/80">
                  <div>
                    <p className="text-2xl font-bold flex items-center gap-4">
                      {isEnglish ? "Running Now" : "تقام حالياً"}
                      <span
                        style={{
                          animation: "pulse 3s ease-in-out infinite",
                          boxShadow: "0 0 5px #38FFE5",
                        }}
                        className="w-3 h-3 bg-[#38FFE5] rounded-full"
                      ></span>
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col h-full justify-end pb-4 sm:pb-6 md:pb-8 lg:pb-10">
                <div className="flex flex-col md:flex-row items-center p-3 sm:p-4 md:p-6  ">
                  <div className="basis-full md:basis-1/2 lg:basis-2/3 mb-4 md:mb-0">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold text-center md:text-left">
                      {mainEvent.title}
                    </h2>

                    <p className="text-center lg:w-full break-words text-wrap whitespace-break-spaces md:text-left text-base sm:text-lg md:text-xl lg:text-2xl mt-2 sm:mt-4 md:mt-6 lg:mt-8 md:pr-6 lg:pr-10 line-clamp-3 md:line-clamp-none">
                      {mainEvent.description}
                    </p>
                  </div>

                  <div className="basis-full md:basis-1/2 pt-3 sm:pt-4 md:pt-6 lg:pt-20">
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row-reverse items-center gap-3 sm:gap-4 lg:gap-6 xl:gap-10 justify-center">
                      <p
                        className={`flex items-center ${
                          isEnglish ? "flex-row-reverse" : ""
                        } text-sm sm:text-base md:text-[18px] gap-2`}
                      >
                        {isEnglish ? "Starts at " : "بدء في "}
                        {formatDate(mainEvent.start_date)}
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
                        {formatDate(mainEvent.end_date)}
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

                    <div className="flex flex-col sm:flex-row items-center justify-center mx-auto gap-3 sm:gap-4 md:gap-30 pt-3 sm:pt-4 md:pt-6 lg:pt-8">
                      <div className="w-full sm:w-auto">
                        <p className="text-sm sm:text-base md:text-[18px] justify-center flex items-center gap-2">
                          أعضاء
                          <span>
                            {mainEvent.team_maximum_members}-
                            {mainEvent.team_minimum_members}
                          </span>
                          فريق من
                          <span className="text-[#38FFE5] text-lg sm:text-xl md:text-2xl lg:text-[24px] font-bold">
                            <HiOutlineUsers />
                          </span>
                        </p>
                      </div>
                      <div className="w-full sm:w-auto sm:min-w-[150px] md:min-w-[180px]">
                        {showRegisterButton && (
                          <button
                            onClick={handleButtonClick}
                            disabled={
                              (currentPhase === "team_formation" && isInTeam) ||
                              (!isRegistering &&
                                currentPhase !== "team_formation") ||
                              isFrozen ||
                              eventFrozen
                            }
                            className={`${
                              ((isRegistering && !isInTeam) ||
                                (currentPhase === "team_formation" &&
                                  !isInTeam)) &&
                              !isFrozen &&
                              !eventFrozen
                                ? "bg-[#38FFE5] hover:bg-[#38FFE5]/90"
                                : "bg-[#38FFE5] opacity-70"
                            } ${
                              ((isRegistering && !isInTeam) ||
                                (currentPhase === "team_formation" &&
                                  !isInTeam)) &&
                              !isFrozen &&
                              !eventFrozen
                                ? "cursor-pointer"
                                : "cursor-not-allowed"
                            } text-[#06373F] font-bold px-4 sm:px-6 py-2 rounded-md transition-colors w-full text-sm sm:text-base`}
                          >
                            {isFrozen || eventFrozen
                              ? isEnglish
                                ? "Currently Frozen"
                                : "تم التجميد مؤقتا"
                              : currentPhase === "team_formation"
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
          )}

          <TeamRegistrationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            eventTitle={mainEvent?.title || ""}
            minMembers={mainEvent?.team_minimum_members || 1}
            maxMembers={mainEvent?.team_maximum_members || 1}
            onSuccess={handleTeamRegistrationSuccess}
            eventUuid={mainEvent?.uuid}
            isFrozen={isFrozen || eventFrozen}
          />

          {event.length === 0 ? (
            <div className="flex flex-col items-center justify-center my-20 py-10 ">
              <Image
                src="/notfound.png"
                alt="No events found"
                width={300}
                height={300}
                className="mb-6 w-[230px] h-[230px]"
              />
              <h3 className="text-2xl font-medium text-center">
                {isEnglish
                  ? "No events available yet"
                  : "لا توجد فعاليات متاحة بعد"}
              </h3>
            </div>
          ) : (
            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className="grid mt-20 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 md:mt-16 gap-4 md:gap-[56px] pb-10"
            >
              {event.map((event) => (
                <div
                  onClick={() => router.push(`/events/${event.uuid}`)}
                  key={event.uuid}
                  className="bg-white/1 cursor-pointer min-h-[320px] relative rounded-2xl  shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-1/2 w-full">
                    <Image
                      className="object-cover rounded-t-2xl"
                      src={event.image}
                      alt={event.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority
                    />
                  </div>
                  <div className="px-4 pt-[27px]">
                    <h3 className="text-lg lg:text-[27px]  text-center font-semibold ">
                      {event.title}
                    </h3>
                    <hr className="text-[#38FFE5]/20 mt-[27px]" />
                    <div
                      className={`flex items-center pt-[20px] ${
                        isEnglish ? "justify-center" : "justify-center"
                      }`}
                    >
                      <span
                        className={`${
                          isEnglish ? "mr-2" : "ml-2"
                        } text-teal-400`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
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
                      <span
                        className={`text-sm md:text-base text-gray-400 ${
                          isEnglish ? "text-left" : "text-right"
                        }`}
                      >
                        {event.is_ended
                          ? `${
                              isEnglish ? "Ended at " : "انتهى في "
                            } ${formatDate(event.end_date)}`
                          : formatDate(event.start_date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
