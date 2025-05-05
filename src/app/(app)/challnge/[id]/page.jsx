"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Image from "next/image";
import Link from "next/link";
import ConfettiAnimation from "@/components/ConfettiAnimation";
import LoadingPage from "../../../components/LoadingPage";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/app/context/UserProfileContext";
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
  const [isAvailable, setIsAvailable] = useState(true);
  const [socket, setSocket] = useState(null);
  const [userData, setUserData] = useState(null);
  const [labData, setLabData] = useState(null);
  const [labCategoryData, setLabCategoryData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const { id } = useParams();
  const { isEnglish } = useLanguage();
  const { convertToUserTimezone } = useUserProfile();
  const router = useRouter();

  const calculateTimeDifference = (createdAt, solvedAt) => {
    if (!createdAt || !solvedAt) return null;

    const createdDate = new Date(createdAt);
    const solvedDate = new Date(solvedAt);

    const diffInSeconds = Math.floor((solvedDate - createdDate) / 1000);

    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    return `${hours}س ${minutes}د ${seconds}ث`;
  };

  const fetchInitialData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      // Create an array of requests to run in parallel
      const requests = [
        // Request 1: Challenge data
        axios
          .get(`${apiUrl}/challenges/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 8000, // 8 second timeout
          })
          .catch((error) => {
            console.error("Error fetching challenge:", error);
            return { data: { data: { available: false } } };
          }),

        // Request 2: Solved flags data
        axios
          .post(
            `${apiUrl}/check-if-solved`,
            {
              challange_uuid: id,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              timeout: 8000, // 8 second timeout
            }
          )
          .catch((error) => {
            console.error("Error checking solved status:", error);
            return { data: { data: { solved_flags_data: [] } } };
          }),
      ];

      // Wait for all requests to complete (even if some fail)
      const [challengeResult, solvedResult] = await Promise.allSettled(
        requests
      );

      // Process challenge data
      if (
        challengeResult.status === "fulfilled" &&
        challengeResult.value.data
      ) {
        // Check if the challenge exists (has id or uuid)
        if (
          !challengeResult.value.data.data ||
          (!challengeResult.value.data.data.id &&
            !challengeResult.value.data.data.uuid)
        ) {
          // No valid challenge data found, redirect to 404
          router.push("/404");
          return;
        }

        setChallenge(challengeResult.value.data.data);
        // Set lab, lab_category, and category data if available
        if (challengeResult.value.data.lab) {
          setLabData(challengeResult.value.data.lab);
        }
        if (challengeResult.value.data.lab_category) {
          setLabCategoryData(challengeResult.value.data.lab_category);
        }
        if (challengeResult.value.data.data?.category) {
          setCategoryData(challengeResult.value.data.data.category);
        }
        if (challengeResult.value.data.data.available === false) {
          setIsAvailable(false);
        }
      } else {
        // Challenge API call failed or returned invalid data
        router.push("/404");
        return;
      }

      // Process solved flags data if available
      if (
        solvedResult.status === "fulfilled" &&
        solvedResult.value.data?.data?.solved_flags_data
      ) {
        setDescription(solvedResult.value.data.data.solved_flags_data);
      }
    } catch (error) {
      console.error("Fatal error in fetchInitialData:", error);
      // Set default state for essential UI elements
      setIsAvailable(false);
      // Redirect to 404 page on error
      router.push("/404");
      return;
    } finally {
      setLoadingPage(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    // Use a consistent ID if possible
    const socketUserId = userData?.user_name || "challenge_user";
    const socket = createSocket(socketUserId);
    setSocket(socket);

    // Join the challenge room
    socket.emit("joinChallengeRoom", id);

    // Setup socket event listeners
    socket.on("newSolve", (data) => {
      // When someone else submits a flag, refresh the leaderboard
      fetchActivitiesData();
    });

    socket.on("firstBlood", (data) => {
      // When someone gets first blood, refresh the leaderboard
      fetchActivitiesData();
    });

    // Handle unexpected online counts - if we see more than 5 users when we expect 1-3,
    // reset the connection tracking by forcing a page refresh once
    socket.on("onlineCount", (count) => {
      if (count > 5) {
        // Store a timestamp to prevent multiple refreshes
        const lastReset = sessionStorage.getItem("lastSocketReset");
        const now = Date.now();

        if (!lastReset || now - parseInt(lastReset) > 5 * 60 * 1000) {
          // Only reset once every 5 minutes
          console.log("Abnormal user count detected:", count);
          sessionStorage.setItem("lastSocketReset", now.toString());

          // Try to reset socket state
          if (socket.reset && typeof socket.reset === "function") {
            socket.reset();
          }
        }
      }
    });

    // Setup heartbeat to keep the connection alive
    const heartbeatInterval = setInterval(() => {
      if (socket) {
        socket.emit("heartbeat");
      }
    }, 60000); // Send heartbeat every minute

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      if (socket) {
        // Leave the challenge room but don't disconnect the socket
        socket.emit("leaveChallengeRoom", id);
        socket.off("newSolve");
        socket.off("firstBlood");
        socket.off("onlineCount");
      }
    };
  }, [id, userData]);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const checkSolvedFlags = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.post(
        `${apiUrl}/check-if-solved`,
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

  const submitFlag = async () => {
    try {
      setIsLoading(true);
      setError("");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      // Add timeout to prevent indefinite waiting
      const response = await axios.post(
        `${apiUrl}/submit-challenge`,
        { solution: flagInput, challange_uuid: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.status === "error") {
        setError(response.data.message);
        return;
      }

      // Check for solved flags after successful submission
      try {
        await checkSolvedFlags();
      } catch (checkError) {
        console.error("Error checking solved flags:", checkError);
        // Continue with the process even if checking solved flags fails
      }

      if (
        response.status === 200 &&
        response.data.flag_type === "multiple_all"
      ) {
        setNotfication(true);
        setTimeout(() => {
          setNotfication(false);
        }, 5000);
      } else if (response.data.data) {
        setNotfication(false);
      }

      if (
        response.data.data &&
        response.data.data.is_first_blood !== undefined
      ) {
        if (response.data.data.is_first_blood === true) {
          setIsFirstBlood(true);
          setFirstblood(response.data.data.first_blood_points);

          // Notify others via socket for first blood
          if (socket) {
            try {
              socket.emit("flagFirstBlood", {
                challenge_id: id,
                user_name: userData?.user_name || "anonymous",
                profile_image:
                  userData?.profile_image ||
                  response.data.data.profile_image ||
                  "",
                points: response.data.data.first_blood_points || 0,
              });
            } catch (socketError) {
              console.error("Socket first blood error:", socketError);
              // Continue even if socket emission fails
            }
          }
        } else if (response.data.data.is_first_blood === false) {
          setIsSubmitFlag(true);
          setPoints(response.data.data.points);

          // Notify others via socket for regular flag submission
          if (socket) {
            try {
              socket.emit("flagSubmitted", {
                challenge_id: id,
                user_name: userData?.user_name || "anonymous",
                profile_image:
                  userData?.profile_image ||
                  response.data.data.profile_image ||
                  "",
                points: response.data.data.points || 0,
              });
            } catch (socketError) {
              console.error("Socket flag submitted error:", socketError);
              // Continue even if socket emission fails
            }
          }
        }
      }

      // Refresh the activities data after submission
      try {
        fetchActivitiesData();

        // Check if all flags are solved after successful submission
        const solvedFlagsResponse = await axios.get(
          `${apiUrl}/challenges/${id}/check-solved-flags`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 5000, // 5 second timeout
          }
        );

        if (solvedFlagsResponse.data.data.all_flags_solved === true) {
          setIsLocked(true);
        }
      } catch (activitiesError) {
        console.error(
          "Error refreshing activities or checking solved flags:",
          activitiesError
        );
        // Continue even if refreshing activities fails
      }
    } catch (error) {
      console.error("Flag submission error:", error);

      // Check if the error is a network issue
      if (error.code === "ECONNABORTED" || !error.response) {
        setError("Network error. Please try again.");
      } else if (error.response?.status === 500) {
        setError("Server error. The team has been notified.");
      } else {
        setError(
          error.response?.data?.message ||
            "An error occurred. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
      // Clear flag input on success
      if (!error) {
        setFlagInput("");
      }
    }
  };

  useEffect(() => {
    const solvedFlags = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(
          `${apiUrl}/challenges/${id}/check-solved-flags`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

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

  const fetchActivitiesData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      // Add retry logic with exponential backoff
      const maxRetries = 2;
      let retryCount = 0;
      let success = false;
      let response;

      while (!success && retryCount <= maxRetries) {
        try {
          response = await axios.get(`${apiUrl}/challenges/${id}/leaderboard`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 8000, // 8 second timeout
          });

          success = true;
        } catch (error) {
          retryCount++;
          console.log(
            `Challenge leaderboard API call failed (attempt ${retryCount}/${maxRetries})`
          );

          // Only retry on server errors (500s) or timeouts
          if (
            error.response &&
            error.response.status < 500 &&
            error.code !== "ECONNABORTED"
          ) {
            throw error; // Don't retry client errors (400s)
          }

          if (retryCount <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1))
            );
          } else {
            throw error; // Max retries exceeded
          }
        }
      }

      if (response && response.data.status === "success") {
        setActivitiesData(response.data.data);
      } else {
        console.error("API returned non-success status:", response?.data);
        // Set empty array as fallback
        setActivitiesData([]);
      }
    } catch (error) {
      console.error(
        "Error fetching activities:",
        error.response?.data || error.message
      );
      // Set empty array on error to prevent UI issues
      setActivitiesData([]);
    }
  };

  // Initial fetch of activities data
  useEffect(() => {
    fetchActivitiesData();
  }, [id]);

  // Effect for when activities tab is selected
  useEffect(() => {
    if (activities) {
      fetchActivitiesData();
    }
  }, [activities]);

  return (
    <>
      {loadingPage ? (
        <LoadingPage />
      ) : (
        <div className="max-w-[2000px] pt-36 mx-auto pb-5">
          {/* Breadcrumb Navigation */}
          <div
            dir={isEnglish ? "ltr" : "rtl"}
            className="flex items-center gap-2 px-10 mb-12 text-xl"
          >
            {labData && (
              <>
                <Link href={`/labs/${labData.uuid}`}>
                  {isEnglish ? labData.name : labData.ar_name}
                </Link>
                <span className="text-gray-400 text-xl">›</span>
              </>
            )}
            {labCategoryData && (
              <>
                <Link href={`/challnges/${labCategoryData.uuid}`}>
                  {isEnglish ? labCategoryData.title : labCategoryData.ar_title}
                </Link>
                <span className="text-gray-400 text-xl">›</span>
              </>
            )}

            <span className="font-medium text-[#38FFE5] text-xl">
              {challenge?.title}
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
                      />
                    </div>
                    <div>
                      <p>
                        {isEnglish ? "First Bytes" : "البايتس الأول"}{" "}
                        <span> {isEnglish ? flag?.name : flag?.ar_name}</span>
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
                          <p className="text-white font-semibold">
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
                      className="md:w-[32px] md:h-[38px]"
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
                          className="text-white cursor-pointer font-semibold"
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
                      className="md:w-[32px] md:h-[38px]"
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
                      className="md:w-[32px] md:h-[38px]"
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
              <div className="mt-2 flex flex-wrap gap-2">
                {challenge?.keywords &&
                  challenge.keywords.length > 0 &&
                  challenge.keywords.map((keyword, index) => (
                    <p
                      key={index}
                      className="bg-zinc-800 text-white text-sm px-4 py-2 rounded-full w-fit"
                    >
                      {keyword}
                    </p>
                  ))}
              </div>
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
          <div className="relative mx-10 mt-10">
            {isAvailable ? (
              <div>
                <div
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="flex pt-10 items-center gap-4"
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
                    } gap-6 mt-10`}
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
                            onClick={() =>
                              window.open(challenge.link, "_blank")
                            }
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
                    <div dir={isEnglish ? "ltr" : "rtl"} className="pt-10 pb-2">
                      <h2 className="text-white text-2xl font-semibold">
                        {isEnglish ? "Challenge Hackers" : "مخترقو التحدي"}
                      </h2>
                      <p className="text-[#BCC9DB] pt-2 text-[18px]">
                        {isEnglish
                          ? "All players who hacked the challenge"
                          : "جميع اللاعبون الذين اخترقوا التحدي"}
                      </p>
                    </div>

                    <div
                      dir={isEnglish ? "ltr" : "rtl"}
                      className="mb-5 pb-5 mt-10 bg-[#06373F26] px-5"
                    >
                      {activitiesData?.length > 0 ? (
                        activitiesData.map((user, index) => {
                          // Get the most recent solved_at time
                          const latestSolvedAt = user.solved_at
                            ? user.solved_at
                            : null;

                          // Format the time difference
                          const formatTimeAgo = (date) => {
                            if (!date)
                              return isEnglish
                                ? "Unknown time"
                                : "وقت غير معروف";

                            try {
                              // Parse the date from the API response
                              const apiDate = new Date(date);
                              const now = new Date();

                              // Directly calculate time difference ignoring the year
                              // by setting today's date with the time from the API
                              const todayWithApiTime = new Date();
                              todayWithApiTime.setHours(
                                apiDate.getHours(),
                                apiDate.getMinutes(),
                                apiDate.getSeconds()
                              );

                              // Adjust for Cairo timezone (UTC+2)
                              // The time difference should be calculated based on the local time
                              let diffInSeconds = Math.floor(
                                (now - todayWithApiTime) / 1000
                              );

                              // If it's negative (future time today), add 24 hours
                              if (diffInSeconds < 0) {
                                diffInSeconds += 86400; // 24 hours in seconds
                              }

                              if (diffInSeconds < 60)
                                return isEnglish ? "Just now" : "الآن";
                              if (diffInSeconds < 3600) {
                                const minutes = Math.floor(diffInSeconds / 60);
                                return isEnglish
                                  ? `${minutes} ${
                                      minutes === 1 ? "minute" : "minutes"
                                    } ago`
                                  : `منذ ${minutes} ${
                                      minutes === 1 ? "دقيقة" : "دقائق"
                                    }`;
                              }
                              if (diffInSeconds < 86400) {
                                const hours = Math.floor(diffInSeconds / 3600);
                                return isEnglish
                                  ? `${hours} ${
                                      hours === 1 ? "hour" : "hours"
                                    } ago`
                                  : `منذ ${hours} ${
                                      hours === 1 ? "ساعة" : "ساعات"
                                    }`;
                              }
                              const days = Math.floor(diffInSeconds / 86400);
                              return isEnglish
                                ? `${days} ${days === 1 ? "day" : "days"} ago`
                                : `منذ ${days} ${days === 1 ? "يوم" : "أيام"}`;
                            } catch (error) {
                              console.error(
                                "Error formatting time ago:",
                                error
                              );
                              return isEnglish
                                ? "Unknown time"
                                : "وقت غير معروف";
                            }
                          };

                          return (
                            <div
                              key={index}
                              className={`flex items-center justify-between flex-wrap py-5 rounded-lg px-5 ${
                                index % 2 === 0
                                  ? "bg-transparent"
                                  : "bg-[#06373F]"
                              }`}
                            >
                              <div className="flex items-center gap-8">
                                <div>
                                  <Image
                                    src={
                                      index === 0 ? "/blood.png" : "/flag.png"
                                    }
                                    alt="flag"
                                    width={32}
                                    height={32}
                                  />
                                </div>
                                <div className="flex items-center gap-4">
                                  <Image
                                    src={user.profile_image || "/icon1.png"}
                                    alt="profile"
                                    width={32}
                                    height={32}
                                  />
                                  <p
                                    onClick={() =>
                                      router.push(`/profile/${user.user_name}`)
                                    }
                                    className="text-xl flex items-center gap-2 font-semibold cursor-pointer"
                                  >
                                    {user.user_name}
                                    {index === 0 && (
                                      <span className="text-sm text-red-500">
                                        {calculateTimeDifference(
                                          challenge?.created_at,
                                          user.solved_at
                                        )}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-[#BCC9DB] py-2 md:py-0 text-[18px]">
                                  {latestSolvedAt
                                    ? formatTimeAgo(latestSolvedAt)
                                    : isEnglish
                                    ? "Not solved yet"
                                    : "لم يتم الحل بعد"}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10">
                          <Image
                            src="/notfound.png"
                            alt="No activities"
                            width={64}
                            height={64}
                            className="mb-4"
                          />
                          <p className="text-[#BCC9DB] text-[18px]">
                            {isEnglish
                              ? "No activities yet"
                              : "لاتوجد أنشطة حتي الآن"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#040405CC] rounded-lg p-10  flex flex-col justify-center items-center">
                <Image src="/lock.png" alt="lock" width={160} height={160} />
                <p className="text-white font-semibold text-xl mt-4">
                  {isEnglish
                    ? "Challenge is not available yet"
                    : "التحدي غير متاح حالياً"}
                </p>
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
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 56 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g filter="url(#filter0_i_1002_4126)">
                      <path
                        d="M13.416 2.33301C14.3825 2.33301 15.166 3.11652 15.166 4.08301V8.39967L19.1809 7.5967C23.0321 6.82645 27.0243 7.19297 30.6708 8.6516L31.1461 8.84168C34.7887 10.2987 38.798 10.5709 42.6041 9.61931C44.3712 9.17758 46.0827 10.514 46.0827 12.3353V29.525C46.0827 31.0283 45.0595 32.3387 43.601 32.7034L43.1007 32.8285C38.9716 33.8608 34.6225 33.5656 30.6708 31.985C27.0243 30.5262 23.0321 30.1599 19.1809 30.9301L15.166 31.733V50.7497C15.166 51.7161 14.3825 52.4997 13.416 52.4997C12.4495 52.4997 11.666 51.7161 11.666 50.7497V4.08301C11.666 3.11652 12.4495 2.33301 13.416 2.33301Z"
                        fill="white"
                        fill-opacity="0.01"
                      />
                    </g>
                    <defs>
                      <filter
                        id="filter0_i_1002_4126"
                        x="0"
                        y="-3.5"
                        width="56"
                        height="59.5"
                        filterUnits="userSpaceOnUse"
                        color-interpolation-filters="sRGB"
                      >
                        <feFlood
                          flood-opacity="0"
                          result="BackgroundImageFix"
                        />
                        <feBlend
                          mode="normal"
                          in="SourceGraphic"
                          in2="BackgroundImageFix"
                          result="shape"
                        />
                        <feColorMatrix
                          in="SourceAlpha"
                          type="matrix"
                          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                          result="hardAlpha"
                        />
                        <feOffset dy="-3.5" />
                        <feGaussianBlur stdDeviation="8.75" />
                        <feComposite
                          in2="hardAlpha"
                          operator="arithmetic"
                          k2="-1"
                          k3="1"
                        />
                        <feColorMatrix
                          type="matrix"
                          values="0 0 0 0 0.219608 0 0 0 0 1 0 0 0 0 0.898039 0 0 0 1 0"
                        />
                        <feBlend
                          mode="normal"
                          in2="shape"
                          result="effect1_innerShadow_1002_4126"
                        />
                      </filter>
                    </defs>
                  </svg>

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
                    className="bg-transparent border border-[#38FFE5] text-[#38FFE5] w-90 cursor-pointer font-semibold px-8 py-2 rounded-lg hover:text-black hover:bg-[#38FFE5]/90 transition-all"
                  >
                    {isEnglish ? "Go Back" : "الرجوع للخلف"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================================== */}
          {/* firt blood animation card  */}
          {isFirstBlood && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[2px] ">
              <div
                onClick={() => setIsFirstBlood(false)}
                className="blood-bg relative flex items-center w-[600px] h-[600px] justify-center overflow-hidden"
              >
                <Image
                  src="/blooda.png"
                  alt="Blood animation background"
                  width={600}
                  height={600}
                  priority
                  className="absolute inset-0 object-cover object-center "
                />
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
          {/* ================================================================================== */}
          {/* anther aimation for submit flag  */}
          {isSubmitFlag && (
            <div
              onClick={() => setIsSubmitFlag(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-fadeIn"
            >
              <ConfettiAnimation />
              <div className="flex items-center justify-center bg-[#131619] min-w-[300px] md:min-w-[600px] min-h-[300px] rounded-lg p-4 animate-scaleIn">
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
                      priority
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
                      <span className="text-[#38FFE5]"> {points} </span>
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
          {/* ========================================================= */}

          {/* notfication flag  */}
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

           
          `}</style>
        </div>
      )}
    </>
  );
}
