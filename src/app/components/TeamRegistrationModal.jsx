import { useLanguage } from "@/app/context/LanguageContext";
import { HiOutlineUsers } from "react-icons/hi2";
import Image from "next/image";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { createSocket } from "@/lib/socket-client";

export default function TeamRegistrationModal({
  isOpen,
  onClose,
  eventTitle,
  minMembers,
  maxMembers,
  onSuccess,
  eventUuid,
}) {
  const { isEnglish } = useLanguage();
  const [currentStep, setCurrentStep] = useState("initial");
  const [createTeam, setCreateTeam] = useState("");
  const [joinTeam, setJoinTeam] = useState("");
  const [teamPassword, setTeamPassword] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = Cookies.get("token");
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!isOpen) return;

    const userName = Cookies.get("username");
    const newSocket = createSocket(userName);
    setSocket(newSocket);

    return () => {
      // No need to disconnect since socket is managed globally
    };
  }, [isOpen]);

  const handleCreateTeam = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/${eventUuid}/teams`,
        {
          name: createTeam,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        toast.success(
          isEnglish ? "Team created successfully!" : "تم إنشاء الفريق بنجاح!"
        );

        // Emit team created event
        if (socket) {
          const userName = Cookies.get("username");
          socket.emit("teamUpdate", {
            action: "create",
            eventId: eventUuid,
            teamUuid: response.data.data.uuid,
            teamName: createTeam,
            userName: userName,
            teamData: response.data.data,
          });
        }

        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error creating team:", error);
      if (error.response?.data?.message) {
        toast.error(
          isEnglish
            ? error.response.data.message
            : error.response.data.messageAr
        );
      } else {
        toast.error(isEnglish ? "Failed to create team" : "فشل إنشاء الفريق");
      }
    }
  };

  const handleJoinTeam = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/teams/join`,
        {
          secret: teamPassword,
          team_name: joinTeam,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.status === "success" || response.status === 200) {
        const teamName = response.data?.data?.team?.name || joinTeam;
        const teamUuid = response.data?.data?.team?.uuid;

        toast.success(
          isEnglish
            ? `Successfully joined team "${teamName}"!`
            : `تم الانضمام إلى الفريق "${teamName}" بنجاح!`
        );

        // Emit team join event
        if (socket) {
          const userName = Cookies.get("username");
          socket.emit("teamUpdate", {
            action: "join",
            eventId: eventUuid,
            teamUuid: teamUuid,
            teamName: teamName,
            userName: userName,
            teamData: response.data?.data,
          });
        }

        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.success(
          isEnglish
            ? "Joined team successfully!"
            : "تم الانضمام إلى الفريق بنجاح!"
        );

        // Emit team join event even if we don't have complete data
        if (socket) {
          const userName = Cookies.get("username");
          socket.emit("teamUpdate", {
            action: "join",
            eventId: eventUuid,
            teamName: joinTeam,
            userName: userName,
          });
        }

        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error joining team:", error);
      if (error.response?.data?.message) {
        toast.error(
          isEnglish
            ? error.response.data.message
            : error.response.data.messageAr
        );
      } else {
        toast.error(
          isEnglish ? "Failed to join team" : "فشل الانضمام إلى الفريق"
        );
      }
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (currentStep) {
      case "create":
        return (
          <div className="w-full">
            <div className="flex flex-col gap-4 justify-center items-center ">
              <Image src="/join.png" alt="Join a team" width={40} height={40} />
              <h3 className="text-xl font-bold mb-4">
                {isEnglish ? "Join a team" : "الإنضمام الي فريق"}
              </h3>
            </div>
            <div className="mb-8">
              <p className="text-sm text-center text-gray-400">
                {isEnglish
                  ? `Team of ${minMembers}-${maxMembers} members`
                  : `فريق من ${minMembers}-${maxMembers} أعضاء`}
              </p>
            </div>

            <div className="flex flex-col gap-8 relative  justify-center items-center">
              <div className="md:w-2/3 w-full">
                <label className="block text-sm font-medium mb-2">
                  {isEnglish ? "Team name" : "اسم الفريق"}
                </label>
                <input
                  type="text"
                  value={createTeam}
                  onChange={(e) => setCreateTeam(e.target.value)}
                  className="w-full bg-[#0B0D0F]  rounded-lg p-2 focus:border-[#38FFE5] focus:outline-none"
                />
              </div>

              <button
                onClick={handleCreateTeam}
                className="md:w-2/3 w-full mt-7 cursor-pointer bg-[#38FFE5] text-[#06373F] font-bold py-2 rounded-lg hover:bg-[#38FFE5]/90 transition-colors"
              >
                {isEnglish ? "Create Team" : "انشاء فريق"}
              </button>
              <button
                onClick={() => setCurrentStep("initial")}
                className="  bg-transparent border md:w-2/3 w-full border-[#38FFE5] mb-4 text-[#38FFE5] font-bold py-2 rounded-lg hover:bg-[#38FFE5]/10 transition-colors"
              >
                {isEnglish ? "Back" : "الرجوع للخلف"}
              </button>
            </div>
          </div>
        );

      case "join":
        return (
          <div className="w-full">
            <div className="flex flex-col gap-4 justify-center items-center mb-8">
              <Image
                src="/creat.png"
                alt="Join a team"
                width={40}
                height={40}
              />
              <h3 className="text-xl font-bold mb-4">
                {isEnglish ? "Join a team" : "الإنضمام الي فريق"}
              </h3>
            </div>

            <div className="flex flex-col gap-8 relative  justify-center items-center">
              <div className="md:w-2/3 w-full">
                <label className="block text-sm font-medium mb-2">
                  {isEnglish ? "Team name" : "اسم الفريق"}
                </label>
                <input
                  type="text"
                  value={joinTeam}
                  onChange={(e) => setJoinTeam(e.target.value)}
                  className="w-full bg-[#0B0D0F]  rounded-lg p-2 focus:border-[#38FFE5] focus:outline-none"
                  placeholder={
                    isEnglish ? "Enter team name" : "أدخل اسم الفريق"
                  }
                />
              </div>
              <div className="md:w-2/3 w-full">
                <label className="block text-sm font-medium mb-2">
                  {isEnglish ? "Team Password" : "كلمة مرور الفريق"}
                </label>
                <input
                  type="password"
                  value={teamPassword}
                  onChange={(e) => setTeamPassword(e.target.value)}
                  className="w-full bg-[#0B0D0F]  rounded-lg p-2 focus:border-[#38FFE5] focus:outline-none"
                  placeholder={
                    isEnglish ? "Enter team password" : "أدخل كلمة مرور الفريق"
                  }
                />
              </div>
              <button
                onClick={handleJoinTeam}
                className="md:w-2/3 w-full mt-10 cursor-pointer bg-[#38FFE5] text-[#06373F] font-bold py-2 rounded-lg hover:bg-[#38FFE5]/90 transition-colors"
              >
                {isEnglish ? "Join Team" : "انضم إلى الفريق"}
              </button>
              <button
                onClick={() => setCurrentStep("initial")}
                className="  bg-transparent border md:w-2/3 w-full border-[#38FFE5] mb-4 text-[#38FFE5] font-bold py-2 rounded-lg hover:bg-[#38FFE5]/10 transition-colors"
              >
                {isEnglish ? "Back" : "الرجوع للخلف"}
              </button>
            </div>
          </div>
        );

      default:
        return (
          <>
            <div className="text-center flex items-center gap-2 justify-center">
              <h2 className="text-2xl font-bold">
                {isEnglish ? "Register in" : "سجل في"}
              </h2>
              <p className="text-[#38FFE5] text-2xl font-bold">{eventTitle}</p>
            </div>
            <p className="text-center mt-3 text-gray-400 mb-8">
              {isEnglish
                ? `Team of ${minMembers}-${maxMembers} members`
                : `فريق من ${minMembers}-${maxMembers} أعضاء`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-20 gap-10 relative">
              {/* Vertical Separator for Desktop */}
              <div className="hidden md:block absolute left-1/2 top-1/2 -translate-y-1/2 w-[1px] h-4/5 bg-[#38FFE5]"></div>

              {/* Join Team Option */}
              <div className="flex flex-col items-center gap-4 p-4 hover:bg-white/5 transition-colors rounded-2xl">
                <div className="text-[#FFB800]">
                  <Image
                    src="/join.png"
                    alt="Team Password"
                    width={40}
                    height={40}
                  />
                </div>
                <p className="text-center">
                  {isEnglish ? "Create your own team" : "أنشئ فريقك الخاص"}
                </p>
                <button
                  onClick={() => setCurrentStep("create")}
                  className="bg-[#38FFE5] cursor-pointer text-[#06373F] hover:bg-[#38FFE5]/90 font-bold px-6 py-2 rounded-lg transition-colors w-full"
                >
                  {isEnglish ? "Create your Team" : "إنشاء فريقك"}
                </button>
              </div>

              {/* Horizontal Separator for Mobile */}
              <div className="block md:hidden h-[1px] w-4/5 mx-auto bg-[#38FFE5]"></div>

              {/* Create Team Option */}
              <div className="flex flex-col items-center gap-4 p-4 hover:bg-white/5 transition-colors rounded-2xl">
                <div className="text-[#38FFE5]">
                  <Image
                    src="/creat.png"
                    alt="Team Password"
                    width={40}
                    height={40}
                  />
                </div>
                <p className="text-center">
                  {isEnglish
                    ? "Using team password"
                    : "باستخدام كلمة مرور الفريق"}
                </p>
                <button
                  onClick={() => setCurrentStep("join")}
                  className="bg-[#38FFE5] cursor-pointer text-[#06373F] hover:bg-[#38FFE5]/90 font-bold px-6 py-2 rounded-lg transition-colors w-full"
                >
                  {isEnglish ? "Join Team" : "الإنضمام إلي فريق"}
                </button>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center z-50 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#131619] rounded-2xl p-6 w-full max-w-xl"
      >
        <div dir={isEnglish ? "ltr" : "rtl"}>{renderStep()}</div>
      </div>
    </div>
  );
}
