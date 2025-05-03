"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Image from "next/image";
import ConfettiAnimation from "@/components/ConfettiAnimation";
import LoadingPage from "../../../components/LoadingPage";
import { useLanguage } from "@/app/context/LanguageContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useRouter } from "next/navigation";
import { createSocket } from "@/lib/socket-client";

export default function ChallengePage() {
  const [challenge, setChallenge] = useState(null);
  const [flags, setflags] = useState(false);
  const [flagInput, setFlagInput] = useState("");
  const [error, setError] = useState("");
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
  const [activitiesData, setActivitiesData] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [teamData, setTeamData] = useState(null);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [socket, setSocket] = useState(null);
  const [pendingActivitiesCount, setPendingActivitiesCount] = useState(0);

  const { id } = useParams();
  const { isEnglish } = useLanguage();
  const { convertToUserTimezone } = useUserProfile();
  const router = useRouter();

  // Handle parsing API date strings correctly (assuming API returns UTC+3)
  const parseApiDate = (dateString) => {
    if (!dateString) return null;

    try {
      // Handle ISO format with timezone info (like 2025-04-26T02:16:17+03:00)
      if (dateString.includes("T") && dateString.includes("+")) {
        const date = new Date(dateString);
        return date;
      }

      // Parse the date string (YYYY-MM-DD HH:MM:SS)
      const [datePart, timePart] = dateString.split(" ");
      if (!datePart || !timePart) return new Date(dateString);

      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute, second] = timePart.split(":").map(Number);

      // Create date object (API server is in UTC+3, so we convert to UTC)
      // Month is 0-indexed in JavaScript Date
      // For UTC+3 timezone, subtract 3 hours to get UTC time
      const date = new Date(
        Date.UTC(year, month - 1, day, hour, minute, second)
      );

      // Adjust for server timezone (UTC+3)
      const serverTimezoneOffsetHours = 3;
      date.setUTCHours(date.getUTCHours() - serverTimezoneOffsetHours);

      return date;
    } catch (error) {
      console.error("Error parsing API date:", error);
      return new Date(dateString);
    }
  };

  const fetchInitialData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      // Step 1: Fetch challenge data
      const challengeResponse = await axios.get(
        `${apiUrl}/event-challenges/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setChallenge(challengeResponse.data.data);

      // Step 2: Fetch team data (if challenge data contains event_uuid)
      if (challengeResponse.data.data?.event_uuid) {
        try {
          const teamResponse = await axios.get(
            `${apiUrl}/${challengeResponse.data.data.event_uuid}/my-team`,
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
      console.error("Error fetching initial data:", error);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [id]);

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

  // Replace the custom fetchActivitiesData function with a simpler version that doesn't change the UI structure
  const fetchActivitiesData = async (id) => {
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
  };

  // Update the socket event handlers to handle real-time updates properly
  useEffect(() => {
    const userName = Cookies.get("username");
    const newSocket = createSocket(userName);
    setSocket(newSocket);

    // Join the challenge room
    if (newSocket) {
      newSocket.emit("joinChallengeRoom", id);

      // Listen for new solves from other users
      newSocket.on("newSolve", async (data) => {
        console.log("Received new solve event:", data);

        if (activities) {
          // Simply trigger a refresh of the data to ensure consistency
          const freshData = await fetchActivitiesData(id);
          if (freshData && freshData.length > 0) {
            setActivitiesData(freshData);
            setShowEmptyState(false);
          }
        } else {
          // We're not on the activities tab, increment the counter only
          setPendingActivitiesCount((prev) => prev + 1);
        }
      });

      // Listen for first blood events
      newSocket.on("firstBlood", async (data) => {
        console.log("Received first blood event:", data);

        if (activities) {
          // Simply trigger a refresh of the data to ensure consistency
          const freshData = await fetchActivitiesData(id);
          if (freshData && freshData.length > 0) {
            setActivitiesData(freshData);
            setShowEmptyState(false);
          }
        } else {
          // We're not on the activities tab, increment the counter only
          setPendingActivitiesCount((prev) => prev + 1);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("newSolve");
        socket.off("firstBlood");
        socket.emit("leaveChallengeRoom", id);
      }
    };
  }, [id, activities]);

  // Update the useEffect for fetching activities data when tab becomes active
  useEffect(() => {
    if (activities) {
      // Load activities data when the activities tab is active
      const loadActivitiesData = async () => {
        try {
          const data = await fetchActivitiesData(id);
          if (data && data.length > 0) {
            setActivitiesData(data);
            setShowEmptyState(false);
          } else {
            setShowEmptyState(true);
          }
          // Reset counter when tab becomes active
          setPendingActivitiesCount(0);
        } catch (error) {
          console.error("Error loading activities data:", error);
          setShowEmptyState(true);
        }
      };

      loadActivitiesData();
    }
  }, [activities, id]);

  // Add a function to fetch team information at the beginning of the file
  useEffect(() => {
    // Fetch team information when component mounts
    const fetchTeamInfo = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(
          `${apiUrl}/${challenge?.event_uuid}/my-team`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data?.data) {
          setTeamData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching team information:", error);
      }
    };

    if (challenge?.event_uuid) {
      fetchTeamInfo();
    }
  }, [challenge?.event_uuid]);

  // Modify the submitFlag function to ensure team data is included in the socket payload
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

              // Now we have fresh team data, emit socket events
              const username = Cookies.get("username") || "";
              const pointsEarned = response.data.data.points || 0;
              const isFirstBlood = response.data.data.is_first_blood || false;

              // Find the user's total points in the team members array
              let userPoints = 0;
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
                userPoints = userMember?.total_bytes || 0;
              }

              // Create payload with complete information
              const socketPayload = {
                challenge_id: id,
                username: username,
                eventId: eventId,
                teamUuid: teamResponse.data.data.uuid,
                teamName: teamResponse.data.data.name,
                points: pointsEarned,
                newPoints: userPoints,
                newTeamTotal:
                  teamResponse.data.data.statistics?.total_bytes || 0,
                isFirstBlood: isFirstBlood,
                solvedCount:
                  teamResponse.data.data.statistics?.total_challenges_solved ||
                  0,
                challenge_name: challenge?.title || "Challenge",
              };

              console.log("Emitting flag event:", socketPayload);

              // Emit appropriate events
              if (socket) {
                if (isFirstBlood) {
                  socket.emit("flagFirstBlood", socketPayload);
                } else {
                  socket.emit("flagSubmitted", socketPayload);
                }

                // Always emit team update for scoreboard
                socket.emit("teamUpdate", {
                  action: "points_update",
                  ...socketPayload,
                });
              }

              // Now show appropriate notification
              if (isFirstBlood) {
                setIsFirstBlood(true);
                setFirstblood(response.data.data.first_blood_points);
                setTimeout(() => setIsFirstBlood(false), 5000);
              } else {
                setIsSubmitFlag(true);
                setPoints(pointsEarned);
                setTimeout(() => setIsSubmitFlag(false), 5000);
              }

              // Update the activities list to include the current user's submission immediately
              if (activities) {
                // Create a solver entry for the current user
                const currentUserSolver = {
                  username: username,
                  user_name: username,
                  userName: username,
                  profile_image: "/icon1.png", // Default icon, will be updated later
                  is_first_blood: isFirstBlood,
                  solved_at: new Date().toISOString(),
                };

                // Update activities data to include this submission
                setActivitiesData((prev) => {
                  // Check if this user is already in the list with better comparison
                  const userExists =
                    prev &&
                    Array.isArray(prev) &&
                    prev.some(
                      (user) =>
                        (user.username &&
                          username &&
                          user.username.toLowerCase() ===
                            username.toLowerCase()) ||
                        (user.user_name &&
                          username &&
                          user.user_name.toLowerCase() ===
                            username.toLowerCase()) ||
                        (user.userName &&
                          username &&
                          user.userName.toLowerCase() ===
                            username.toLowerCase())
                    );

                  if (userExists) {
                    // Update the existing entry
                    return prev.map((user) => {
                      const userMatches =
                        (user.username &&
                          username &&
                          user.username.toLowerCase() ===
                            username.toLowerCase()) ||
                        (user.user_name &&
                          username &&
                          user.user_name.toLowerCase() ===
                            username.toLowerCase()) ||
                        (user.userName &&
                          username &&
                          user.userName.toLowerCase() ===
                            username.toLowerCase());

                      return userMatches
                        ? {
                            ...user,
                            is_first_blood: isFirstBlood,
                            solved_at: new Date().toISOString(),
                          }
                        : user;
                    });
                  } else {
                    // Add the new solver to the beginning of the array
                    return Array.isArray(prev)
                      ? [currentUserSolver, ...prev]
                      : [currentUserSolver];
                  }
                });

                // Show empty state if needed
                setShowEmptyState(false);
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

  return (
    <>
      {loadingPage ? (
        <LoadingPage />
      ) : (
        <div className="max-w-[2000px] pt-36 mx-auto pb-5">
          {challenge?.flag_type === "multiple_individual" ? (
            challenge?.flags_data?.map((flag, index) => (
              <div key={index} className="mb-8">
                <div
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="grid grid-cols-1 px-10 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                    <div>
                      <Image
                        src="/blood.png"
                        alt="First Blood"
                        width={32}
                        height={32}
                      />
                    </div>
                    <div>
                      <p>
                        {isEnglish ? "First Bytes" : "البايتس الأول"}{" "}
                        <span>{flag.name}</span>
                      </p>
                      {flag.first_blood != null ? (
                        <div className="flex mt-2 items-center gap-1">
                          <Image
                            src={
                              flag.first_blood?.profile_image || "/icon1.png"
                            }
                            alt="First Blood"
                            width={32}
                            height={32}
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

                  <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                    <div>
                      <Image
                        src="/byte.png"
                        alt="Challenge Bytes"
                        width={32}
                        height={32}
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

                  <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                    <div>
                      <Image
                        src="/icon20.png"
                        alt="Hacks"
                        width={32}
                        height={32}
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
                <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                  <div>
                    <Image
                      src="/blood.png"
                      alt="First Blood"
                      width={32}
                      height={32}
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
                          width={32}
                          height={32}
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

                <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                  <div>
                    <Image
                      src="/byte.png"
                      alt="Challenge Bytes"
                      width={32}
                      height={32}
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

                <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                  <div>
                    <Image
                      src="/icon20.png"
                      alt="Hacks"
                      width={32}
                      height={32}
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
            className="pt-10 pb-5 px-5 bg-[#FFFFFF0D] rounded-lg mx-10"
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
                      className="bg-black/50 text-white text-sm p-2 rounded-full"
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
                onClick={() => {
                  setDetails(false);
                  setActivities(true);
                }}
                className={`text-lg font-semibold pb-2 cursor-pointer relative ${
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
                  className="bg-[#FFFFFF0D] relative rounded-lg p-6 flex flex-col min-h-[250px]"
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
                        تهانينا! لقد التقط جميع الأعلام بنجاح
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
                    className="bg-[#FFFFFF0D] rounded-lg p-6 flex flex-col min-h-[250px]"
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
                        className="lg:w-1/2 bg-transparent w-full cursor-pointer border border-[#38FFE5] hover:bg-[#38FFE5]/10 text-[#38FFE5] font-semibold py-3 rounded-lg transition-all inline-block text-center"
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
                    className="bg-[#FFFFFF0D] rounded-lg p-6 flex flex-col min-h-[250px]"
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
                        className="lg:w-1/2 w-full bg-transparent cursor-pointer border border-[#38FFE5] hover:bg-[#38FFE5]/10 text-[#38FFE5] font-semibold py-3 rounded-lg transition-all"
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
                    className="mx-10 mb-5 pb-5 mt-10 bg-[#06373F26] px-5"
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
                      const latestSolvedAt =
                        user.solved_flags?.length > 0
                          ? convertToUserTimezone(
                              new Date(
                                Math.max(
                                  ...user.solved_flags.map((flag) =>
                                    parseApiDate(flag.solved_at).getTime()
                                  )
                                )
                              )
                            )
                          : user.solved_at
                          ? convertToUserTimezone(parseApiDate(user.solved_at))
                          : null;

                      // Format the time difference
                      const formatTimeAgo = (date) => {
                        if (!date)
                          return isEnglish
                            ? "Not solved yet"
                            : "لم يتم الحل بعد";

                        // Get current date for comparison
                        const now = new Date();

                        // Calculate time difference in seconds
                        const diffInSeconds = Math.floor((now - date) / 1000);

                        // Format relative time
                        if (diffInSeconds < 60)
                          return isEnglish ? "Just now" : "الآن";

                        if (diffInSeconds < 3600) {
                          const minutes = Math.floor(diffInSeconds / 60);
                          return isEnglish
                            ? `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
                            : `منذ ${minutes} دقيقة`;
                        }

                        if (diffInSeconds < 86400) {
                          const hours = Math.floor(diffInSeconds / 3600);
                          return isEnglish
                            ? `${hours} hour${hours !== 1 ? "s" : ""} ago`
                            : `منذ ${hours} ساعة`;
                        }

                        const days = Math.floor(diffInSeconds / 86400);
                        return isEnglish
                          ? `${days} day${days !== 1 ? "s" : ""} ago`
                          : `منذ ${days} يوم`;
                      };

                      return (
                        <div
                          key={userKey}
                          className={`flex items-center justify-between flex-wrap py-5 rounded-lg px-5 ${
                            index % 2 === 0 ? "bg-transparent" : "bg-[#06373F]"
                          }`}
                        >
                          <div className="flex items-center gap-8">
                            <div>
                              <Image
                                src={
                                  index === 0 || user.is_first_blood
                                    ? "/blood.png"
                                    : "/flag.png"
                                }
                                alt="flag"
                                width={32}
                                height={32}
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
                            <p className="text-[#BCC9DB] text-[18px]">
                              {formatTimeAgo(latestSolvedAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-[#FFFFFF0D] rounded-lg p-4 sm:p-6 mt-4 mx-10">
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
              <div className="relative z-10 bg-[#131619] rounded-lg p-6 w-full max-w-[600px] mx-4">
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
                    className="bg-[#38FFE5] cursor-pointer text-black font-semibold px-8 py-2 rounded-lg hover:bg-[#38FFE5]/90 transition-all"
                  >
                    {isEnglish ? "Go Back" : "الرجوع للخلف"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* First blood animation card  */}
          {isFirstBlood && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px]">
              <div className="bg-[url('/blooda.png')] flex items-center justify-center w-full h-full bg-cover bg-center bg-no-repeat">
                <div className="flex items-center justify-center bg-[#131619] min-w-[300px] md:min-w-[600px] min-h-[300px] rounded-lg p-4">
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
                        <span className="text-red-500">{firstblood}</span>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <ConfettiAnimation />
              <div className="flex items-center justify-center bg-[#131619] min-w-[300px] md:min-w-[600px] min-h-[300px] rounded-lg p-4">
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
                <div className="bg-[#131619] border border-[#38FFE5] rounded-lg p-4 shadow-lg slide-in-animation">
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
          `}</style>
        </div>
      )}
    </>
  );
}
