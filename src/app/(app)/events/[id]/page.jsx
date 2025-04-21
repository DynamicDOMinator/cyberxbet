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

export default function EventPage() {
  const { isEnglish } = useLanguage();

  const [event, setEvent] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [isEventStarted, setIsEventStarted] = useState(true);
  const [isChallengesStarted, setIsChallengesStarted] = useState(false);
  const [teams, setTeams] = useState([]);
  const [isRemove, setIsRemove] = useState(false);
  const [joinSecret, setJoinSecret] = useState(null);
  const [hasCheckedTeam, setHasCheckedTeam] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [hideRegisterButton, setHideRegisterButton] = useState(true);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [eventStartDate, setEventStartDate] = useState(null);
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("challenges");
  const [eventIsActive , setEveentIsActive] = useState(false)
  

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
      const now = new Date().getTime();
      const difference = startTime - now;

      if (difference <= 0) {
        setIsEventStarted(false);
        getChallenges(); // Only call this once when the timer ends
        // checkEventStatus();
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
  }, [eventStartDate]); // Only depend on eventStartDate to prevent unnecessary API calls

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

        if (
          res.data.data &&
          res.data.data.message === "Event is currently running"
        ) {
          setIsEventStarted(false);
          setHideRegisterButton(false);
          setEveentIsActive(true)
        }
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
      const res = await axios.get(`${api}/teams/${teams?.uuid}/join-secrets`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      setJoinSecret(res.data.data[0]?.secret);
    } catch (error) {
      console.error("Error fetching join secret:", error);
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

  return (
    <div className="mt-28 lg:mt-36 px-4 sm:px-6 md:px-8 lg:px-10 max-w-[2000px] mx-auto">
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
        className={`bg-cover  bg-center relative rounded-lg mt-6 md:mt-8 lg:mt-12 h-[400px] md:h-[450px] lg:h-[500px] w-full`}
        style={{
          backgroundImage: `url(${event.image})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >

{eventIsActive && (
  <div className=" absolute flex flex-col items-center justify-center w-full h-full bg-black/80 ">
  <div>
    <p className="text-2xl font-bold flex items-center gap-4">
    تقام حالياً
      <span  style={{
                    animation: "pulse 3s ease-in-out infinite",
                    boxShadow: "0 0 5px #38FFE5",
                  }} className="w-3 h-3 bg-[#38FFE5] rounded-full">
  
      </span>
    </p>
  </div>
  
  </div>
) }

        <div className="flex flex-col h-full justify-end pb-6 md:pb-8 lg:pb-10">
          <div className="flex flex-col md:flex-row items-center p-4 md:p-6">
            <div className="basis-full md:basis-1/2 lg:basis-2/3  mb-6 md:mb-0">
              <h2 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-center md:text-left">
                {event.title}
              </h2>

              <p className="text-center md:text-left text-lg md:text-xl lg:text-2xl mt-4 md:mt-6 lg:mt-8 md:pr-10">
                {event.description}
              </p>
            </div>
            <div className="basis-full md:basis-1/2  pt-6 md:pt-12 lg:pt-24">
              <div className="flex flex-col  md:flex-row-reverse items-center gap-5 lg:gap-10 justify-center">
                <p
                  className={`flex items-center ${
                    isEnglish ? "flex-row-reverse" : ""
                  } text-base md:text-[18px] gap-2`}
                >
                  {isEnglish ? "Starts at " : "بدء في "}
                  {formatDate(event.start_date)}
                  <span className="text-[#38FFE5] flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="md:w-6 md:h-6"
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
                  } text-base md:text-[18px] gap-2`}
                >
                  {isEnglish ? "Ends at " : "انتهي في "}
                  {formatDate(event.end_date)}
                  <span className="text-[#38FFE5] flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="md:w-6 md:h-6"
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

              <div className="flex items-center justify-end gap-20 pt-6 md:pt-8 lg:pt-10">
                <div>
                  <p className=" text-base md:text-[18px] justify-center flex items-center gap-2">
                    أعضاء
                    <span>
                      {event.team_maximum_members}-{event.team_minimum_members}
                    </span>
                    فريق من
                    <span className="text-[#38FFE5] text-xl md:text-2xl lg:text-[24px] font-bold">
                      <HiOutlineUsers />
                    </span>
                  </p>
                </div>
                <div>
                  {hideRegisterButton && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-[#38FFE5] text-[#06373F] hover:bg-[#38FFE5]/90 font-bold px-6 py-2 rounded-md transition-colors w-full"
                    >
                      {isEnglish ? "Register Now" : "سجل الآن"}
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
            الفريق
          </h2>
          <h2
            className={`text-lg md:text-xl lg:text-[20px] font-bold pb-2 cursor-pointer ${
              activeTab === "challenges" ? "border-b-2 border-[#38FFE5]" : ""
            }`}
            onClick={() => {
              setActiveTab("challenges");
              
            }}
          >
            التحديات
          </h2>

          <h2
            className={`text-lg md:text-xl lg:text-[20px] font-bold pb-2 cursor-pointer ${
              activeTab === "leaderboard" ? "border-b-2 border-[#38FFE5]" : ""
            }`}
            onClick={() => setActiveTab("leaderboard")}
          >
            المتصدرين
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
                className="bg-[#FFFFFF0D] p-4 rounded-lg mb-10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <Image src="/user.png" alt="team" width={50} height={50} />
                    <p>{teams?.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#38FFE5] rounded-full"></div>
                      <p className="text-sm">فعال</p>
                    </div>
                  </div>

                  <div>
                    <button className="bg-[#38FFE5] text-[#06373F] hover:bg-[#38FFE5]/90 font-bold px-6 py-2 rounded-md transition-colors w-full">
                      تعديل
                    </button>
                  </div>
                </div>
              </div>

              <div dir="rtl" className="grid md:grid-cols-3 grid-col-1 gap-5 ">
                <div className="bg-[#FFFFFF0D] py-3 flex items-center gap-5 rounded-md px-4 ">
                  <Image src="/blood.png" height={32} width={32} alt="blood" />
                  <div>
                    <p>البايتس الأول</p>
                    <div className=" gap-2 pt-3">
                      <p>{teams?.statistics?.total_first_blood_count}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF0D] py-3 flex items-center gap-5 rounded-md px-4 ">
                  <Image
                    src="/ranking.png"
                    height={32}
                    width={32}
                    alt="ranking"
                  />
                  <div>
                    <p> التصنيف</p>
                    <div className="flex items-center gap-2 pt-3">
                      <p>لا يوجد تصنيف</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF0D] py-3 flex items-center gap-5 rounded-md px-4 ">
                  <Image src="/byte.png" height={32} width={32} alt="byte" />
                  <div>
                    <p> بايتس التحدي</p>
                    <div className="flex items-center gap-2 pt-3">
                      <p className="flex items-center gap-1">
                        <span>{teams?.statistics?.total_bytes}</span>
                        بايتس
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                dir="rtl"
                className="grid md:grid-cols-2 grid-col-1 my-5 gap-10"
              >
                <div className="flex justify-between items-center bg-[#FFFFFF0D] px-12 rounded-md">
                  <div className="py-3 flex items-center gap-5">
                    <Image
                      src="/creat.png"
                      height={32}
                      width={32}
                      alt="creat"
                    />
                    <div>
                      <p>أعضاء الفريق</p>
                      <div className="flex items-center gap-2 pt-1">
                        <p className="font-semibold text-lg">
                          {teams?.members?.length} أعضاء
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p>
                      فريق من {teams?.event?.team_minimum_members}-
                      {teams?.event?.team_maximum_members} أعضاء
                    </p>
                  </div>
                </div>
{hideRegisterButton ?   <div className="flex justify-between items-center bg-[#FFFFFF0D] px-12 rounded-md">
                  <div className="py-3 flex items-center gap-5">
                    <Image
                      src="/creat.png"
                      height={32}
                      width={32}
                      alt="creat"
                    />
                    <div>
                      <p>كلمة مرور الفريق</p>
                      <div className="flex items-center gap-2 pt-1">
                        <p className="font-semibold text-lg">
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
                      className="flex gap-1 items-center cursor-pointer"
                    >
                      <IoCopy className="text-[#38FFE5]" />
                      <p className="border-b-2 border-b-white">
                        {joinSecret ? "نسخ كلمة المرور" : "عرض كلمة المرور"}
                      </p>
                    </button>

                    {showCopiedToast && (
                      <div className="absolute -top-10 right-0 bg-[#38FFE5] text-[#06373F] px-3 py-1 rounded-md text-sm">
                        {isEnglish ? "Copied!" : "تم النسخ!"}
                      </div>
                    )}
                  </div>
                </div> :  <div className="flex justify-between items-center bg-[#FFFFFF0D] px-12 rounded-md">
                  
                  <p>

لا يمكن انشاء كلمة مرور وقت بدء الفاعليه

                  </p>
                  
                   </div>}
              
              </div>

              {teams?.members?.map((member, index) => (
                <div
                  key={member.uuid}
                  dir="rtl"
                  className={`mt-3 flex justify-between items-center px-10 py-5 ${
                    index % 2 === 0 ? "bg-[#06373F]" : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center basis-1/3 gap-4">
                    <Image
                      src={member.profile_image || "/user.png"}
                      height={30}
                      width={30}
                      alt="member"
                    />
                    <p>{member.username}</p>
                    {member.role === "leader" && (
                      <p className="text-[#38FFE4]">قائد</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 basis-1/3  justify-center">
                    <p>{member.total_bytes || 0}</p>
                    <Image src="/byte.png" height={30} width={30} alt="bytes" />
                  </div>

                  <div className="flex items-center gap-2 basis-1/3 justify-end">
                    {isRemove && member.role !== "leader" && (
                      <button
                        onClick={() => deleteMember(member.username)}
                        className="text-red-500 cursor-pointer text-sm rounded-lg py-2 px-4 border-2 border-red-500"
                      >
                        {isEnglish ? "Remove" : "إزالة"}
                      </button>
                    )}

                    <button
                      onClick={() => setIsRemove(!isRemove)}
                      className="cursor-pointer"
                    >
                      ...
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center ">
              <Image
                src="/notjoined.png"
                height={100}
                width={100}
                alt="no team"
             
              />
              <h3 className="text-xl md:text-2xl  text-center mb-4">
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
          <Image
            src="/ranking.png"
            height={80}
            width={80}
            alt="leaderboard"
         
          />
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
    </div>
  );
}
