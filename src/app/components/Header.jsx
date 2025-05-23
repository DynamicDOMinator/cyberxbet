"use client";
import Link from "next/link";
import Image from "next/image";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import {
  ArchiveBoxIcon,
  ChevronDownIcon,
  PencilIcon,
  Square2StackIcon,
  TrashIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { RiUserLine } from "react-icons/ri";
import { CiSettings } from "react-icons/ci";
import { MdLanguage } from "react-icons/md";
import { RiLogoutCircleRLine } from "react-icons/ri";
import { useLanguage } from "../context/LanguageContext";
import { useLabs } from "../context/LabsContext";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../context/UserProfileContext";
import { createSocket, disconnectSocket } from "@/lib/socket-client";

const gradientAnimation = `
  @keyframes gradient {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  @keyframes pulse {
    0% { opacity: 0.4; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.1); }
    100% { opacity: 0.4; transform: scale(0.8); }
  }
`;

export default function Header() {
  const { isEnglish, setIsEnglish } = useLanguage();
  const { labs } = useLabs();
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileChallengesOpen, setMobileChallengesOpen] = useState(false);
  const [mobileAddChallengeOpen, setMobileAddChallengeOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const userProfile = useUserProfile();
  const { profileImage } = userProfile;

  useEffect(() => {
    setUserName(userProfile?.userName);
  }, [userProfile]);

  // Initialize Socket client with error handling and improved connection tracking
  useEffect(() => {
    let socketInstance = null;
    let pollInterval = null;
    let reconnectTimeout = null;
    let isReconnecting = false;
    let lastKnownCount = 1; // Start with at least 1 online player (yourself)

    const fetchOnlineCountFallback = async () => {
      try {
        // Fallback to API endpoint if socket fails
        const response = await axios.get("/api/socket");
        if (response.data && typeof response.data.online === "number") {
          // Set a minimum value to avoid showing 0 players
          const count = Math.max(1, response.data.online);
          lastKnownCount = count; // Store last known good count
          setOnlinePlayers(count);
        } else {
          // If API fails too, set default count
          console.warn("API returned invalid online count");
          setOnlinePlayers(lastKnownCount);
        }
      } catch (error) {
        console.error("Error fetching online count:", error);
        // Always show at least 1 online player (the current user)
        setOnlinePlayers(lastKnownCount);
      }
    };

    const initializeSocket = () => {
      try {
        // Only create socket connection when we have a username
        if (userName) {
          // Clear any existing reconnect timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }

          // Try to get the socket instance
          socketInstance = createSocket(userName);

          // Set up event listeners for online player count
          socketInstance.on("onlinePlayers", (count) => {
            if (typeof count === "number" && count >= 0) {
              const validCount = Math.max(1, count);
              lastKnownCount = validCount;
              setOnlinePlayers(validCount);
            }
          });

          // Also listen for onlineCount event (for backward compatibility)
          socketInstance.on("onlineCount", (count) => {
            if (typeof count === "number" && count >= 0) {
              const validCount = Math.max(1, count);
              lastKnownCount = validCount;
              setOnlinePlayers(validCount);
            }
          });

          // When connected, emit userConnected event to ensure proper tracking
          socketInstance.on("connect", () => {
            console.log("Socket connected in Header component");
            isReconnecting = false;
            socketInstance.emit("userConnected", { userName });
          });

          // Handle connection errors
          socketInstance.on("connect_error", (error) => {
            console.error("Socket connection error:", error.message);

            // Don't immediately fall back to API, try reconnection first
            if (!isReconnecting) {
              isReconnecting = true;
              reconnectTimeout = setTimeout(() => {
                // Only fallback if socket is still not connected after timeout
                if (!socketInstance || !socketInstance.connected) {
                  fetchOnlineCountFallback();

                  // Try to re-initialize socket after a failure
                  console.log("Attempting to re-initialize socket connection");
                  initializeSocket();
                }
                isReconnecting = false;
              }, 3000);
            }
          });
        } else {
          // If we don't have a username yet, try to get the count via API
          fetchOnlineCountFallback();
        }
      } catch (error) {
        console.error("Socket initialization error:", error);
        fetchOnlineCountFallback();
      }
    };

    // Initialize socket
    initializeSocket();

    // Set up polling as backup for online count - less frequent but still reliable
    pollInterval = setInterval(() => {
      // Only use API fallback if socket isn't connected
      if (!socketInstance || !socketInstance.connected) {
        fetchOnlineCountFallback();
      }
    }, 30000); // Poll every 30 seconds as backup

    return () => {
      // Clear polling interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      // Clear reconnect timeout if it exists
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      // Remove event listeners but don't disconnect the socket
      // since it's a singleton that might be used elsewhere
      if (socketInstance) {
        try {
          socketInstance.off("onlinePlayers");
          socketInstance.off("onlineCount");
          socketInstance.off("connect_error");
        } catch (error) {
          console.error("Error removing socket listeners:", error.message);
        }
      }
    };
  }, [userName]); // Add userName as a dependency

  const logout = async () => {
    try {
      // First, properly disconnect the socket to update online count
      try {
        console.log("Disconnecting socket before logout");
        if (typeof window !== "undefined") {
          // Ensure we're disconnecting the socket properly with user info
          disconnectSocket();

          // Add a small delay to allow the disconnection to complete
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } catch (socketError) {
        console.error("Socket disconnect error:", socketError);
      }

      // Then handle the backend logout
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");

      try {
        if (apiUrl) {
          await axios.post(`${apiUrl}/auth/logout`, { token });
        }
      } catch (apiError) {
        console.log("API logout error:", apiError);
        // Continue with logout even if API call fails
      }

      // Clear cookie
      Cookies.remove("token");

      // Redirect after ensuring socket is disconnected
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback: Remove cookie and redirect anyway
      Cookies.remove("token");
      router.push("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-lg">
      <style>{gradientAnimation}</style>
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-black via-[#38FFE540] to-black"
        style={{
          backgroundSize: "200% 100%",
          animation: "gradient 8s linear infinite",
        }}
      />
      <nav
        dir={isEnglish ? "ltr" : "rtl"}
        className="flex items-center py-5 px-4 md:px-10"
      >
        <div className="flex items-center justify-between gap-10 w-full">
          {/* Logo Section */}
          <div
            className={`flex items-center ${
              isEnglish ? "flex-row-reverse" : ""
            } justify-end`}
          >
            <h1 className="text-white text-xl md:text-2xl font-bold font-Tajawal">
              CyberXbytes
            </h1>
            <Link href="/home">
              <Image
                src="/logo3.png"
                width={100}
                height={100}
                className="w-[50px] h-[50px]"
                alt="logo"
              />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/home">
              <p className="text-white">{isEnglish ? "Home" : "الرئيسية"}</p>
            </Link>
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 py-2 text-white focus:outline-none cursor-pointer">
                {isEnglish ? "Challenges" : "التحديات"}
                <ChevronDownIcon className="size-4 fill-white/60" />
              </MenuButton>

              <MenuItems
                transition
                anchor="bottom end"
                className="w-52 origin-top-right rounded-xl border border-white/5 bg-[#06373F]/25 mt-7 p-2 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                {labs &&
                  labs.map((lab) => (
                    <MenuItem key={lab.uuid}>
                      <Link href={`/labs/${lab.uuid}`}>
                        <p
                          dir={isEnglish ? "ltr" : "rtl"}
                          className="py-2 px-4 hover:bg-[#06373F] rounded-lg"
                        >
                          {isEnglish ? lab.name : lab.ar_name}
                        </p>
                      </Link>
                    </MenuItem>
                  ))}
              </MenuItems>
            </Menu>
            <Link href="/events">
              <p className="text-white">{isEnglish ? "Events" : "الفعاليات"}</p>
            </Link>
            <Link href="/leaderboard">
              <p className="text-white">
                {isEnglish ? "Leaderboard" : "المتصدرين"}
              </p>
            </Link>
            <Link href="/add-challenge">
              <p className="inline-flex items-center gap-2 py-2 text-white focus:outline-none cursor-pointer">
                {isEnglish ? "Add Challenge" : "أضف تحدي"}
              </p>
            </Link>
          </div>

          {/* User Info - Desktop */}
          <div
            className={`hidden lg:flex items-center gap-10 ${
              isEnglish ? "ml-auto" : "mr-auto"
            }`}
          >
            <p
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex items-center gap-2 text-white"
            >
              <span
                className="w-2 h-2 rounded-full bg-[#38FFE5]"
                style={{
                  animation: "pulse 3s ease-in-out infinite",
                  boxShadow: "0 0 5px #38FFE5",
                }}
              ></span>
              <span>{onlinePlayers}</span>{" "}
              {isEnglish ? "Players Online" : "عدد اللاعبين"}
            </p>
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2 hover:bg-gradient-to-r hover:from-[rgba(6,55,63,0.6)] hover:to-[rgba(56,255,229,0.18)] hover:transition-colors hover:duration-500 py-2 px-2 rounded-md text-white focus:outline-none cursor-pointer">
                <div
                  className={`${
                    !profileImage ? "" : ""
                  } rounded-full p-1  flex items-center justify-center`}
                >
                  <Image
                    src={profileImage || "/icon1.png"}
                    width={30}
                    height={30}
                    className="rounded-full w-[30px] h-[30px] object-cover"
                    alt="user profile"
                  />
                </div>
                <p>{userName}</p>
                <ChevronDownIcon className="size-4 fill-white/60" />
              </MenuButton>

              <MenuItems
                transition
                anchor="bottom end"
                className={`w-52 origin-top-right rounded-xl ${
                  isEnglish ? "lg:mr-10" : "lg:ml-10"
                } lg:mt-5 bg-[#06373F]/25 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0`}
              >
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    onClick={() => router.push(`/profile/${userName}`)}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-[#06373F] cursor-pointer"
                  >
                    <RiUserLine className="size-4 fill-[#38FFE5]" />
                    {isEnglish ? "Account" : "الحساب"}
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    onClick={() => router.push("/profile-settings")}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-[#06373F] cursor-pointer"
                  >
                    <CiSettings className="size-4 fill-[#38FFE5]" />
                    {isEnglish ? "Settings" : "الإعدادات"}
                  </button>
                </MenuItem>
                <div className="my-1 h-px bg-[#38FFE5]/20" />
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-[#06373F] cursor-pointer"
                    onClick={() => setIsEnglish(!isEnglish)}
                  >
                    <MdLanguage className="size-4 fill-[#38FFE5]" />
                    {isEnglish ? "العربية" : "English"}
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="group flex w-full cursor-pointer text-[#FF1100] items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                    onClick={logout}
                  >
                    <RiLogoutCircleRLine className="size-4 fill-[#FF1100]" />
                    {isEnglish ? "Logout" : "تسجيل خروج"}
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute bg-black top-full right-0 left-0 z-50">
            <div className="flex flex-col p-4 space-y-4">
              <Link href="/home">
                <button
                  className={`text-white ${
                    isEnglish ? "text-left" : "text-right"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isEnglish ? "Home" : "الرئيسية"}
                </button>
              </Link>
              {/* Challenges Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMobileChallengesOpen(!mobileChallengesOpen)}
                  className="flex items-center justify-between w-full text-white"
                >
                  <span>{isEnglish ? "Challenges" : "التحديات"}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform ${
                      mobileChallengesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileChallengesOpen && (
                  <div className="mt-2 bg-[#0B0D0F33] rounded-lg p-2 space-y-2">
                    {labs &&
                      labs.map((lab) => (
                        <Link href={`/labs/${lab.uuid}`} key={lab.uuid}>
                          <button
                            className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                              isEnglish ? "text-left" : "text-right"
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {isEnglish ? lab.name : lab.ar_name}
                          </button>
                        </Link>
                      ))}
                  </div>
                )}
              </div>

              <Link href="/events">
                <button
                  className={`text-white ${
                    isEnglish ? "text-left" : "text-right"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isEnglish ? "Events" : "الفعاليات"}
                </button>
              </Link>
              <Link href="/leaderboard">
                <button
                  className={`text-white ${
                    isEnglish ? "text-left" : "text-right"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isEnglish ? "Leaderboard" : "المتصدرين"}
                </button>
              </Link>

              <Link href="/add-challenge">
                <button
                  className={`text-white ${
                    isEnglish ? "text-left" : "text-right"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isEnglish ? "Add Challenge" : "أضف تحدي"}
                </button>
              </Link>

              {/* User Section */}
              <div className="border-t border-[#38FFE5]/20 pt-4 mt-4">
                <p
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="flex items-center gap-2 text-white"
                >
                  <span
                    className="w-2 h-2 rounded-full bg-[#38FFE5]"
                    style={{
                      animation: "pulse 3s ease-in-out infinite",
                      boxShadow: "0 0 5px #38FFE5",
                    }}
                  ></span>
                  <span>{onlinePlayers}</span>{" "}
                  {isEnglish ? "Players Online" : "عدد اللاعبين"}
                </p>

                <div className="relative mt-4">
                  <button
                    onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                    className="flex items-center gap-2 text-white w-full"
                  >
                    <div
                      className={`${
                        !profileImage ? "border border-[#38FFE5]/50" : ""
                      } rounded-full flex items-center justify-center`}
                    >
                      <Image
                        src={profileImage || "/icon1.png"}
                        width={20}
                        height={20}
                        className="rounded-full object-cover"
                        alt="user profile"
                      />
                    </div>
                    <span>{userName}</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform ${
                        mobileUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileUserMenuOpen && (
                    <div className="mt-2 rounded-xl p-2 space-y-2">
                      <button
                        onClick={() => {
                          router.push(`/profile/${userName}`);
                          setIsMobileMenuOpen(false);
                        }}
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                      >
                        <RiUserLine className="size-4 fill-[#38FFE5]" />
                        <span className="text-white">
                          {isEnglish ? "Account" : "الحساب"}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          router.push("/profile-settings");
                          setIsMobileMenuOpen(false);
                        }}
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                      >
                        <CiSettings className="size-4 fill-[#38FFE5]" />
                        <span className="text-white">
                          {isEnglish ? "Settings" : "الإعدادات"}
                        </span>
                      </button>
                      <div className="my-1 h-px bg-[#38FFE5]/20" />
                      <button
                        onClick={() => {
                          setIsEnglish(!isEnglish);
                          setIsMobileMenuOpen(false);
                        }}
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                      >
                        <MdLanguage className="size-4 fill-[#38FFE5]" />
                        <span className="text-white">
                          {isEnglish ? "العربية" : "English"}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                      >
                        <RiLogoutCircleRLine className="size-4 fill-[#FF1100]" />
                        <span className="text-[#FF1100]">
                          {isEnglish ? "Logout" : "تسجيل خروج"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
