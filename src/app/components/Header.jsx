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
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useUserProfile } from "../context/UserProfileContext";
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
  const [random, setRandom] = useState(0);
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

  useEffect(() => {
    setRandom(Math.floor(Math.random() * 1000));
  }, []);

  const logout = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const token = Cookies.get("token");
    const response = await axios.post(`${apiUrl}/auth/logout`, { token });

    Cookies.remove("token");

    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0B0D0F]">
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
            <p className="text-white">{isEnglish ? "Home" : "الرئيسية"}</p>
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 py-2 text-white focus:outline-none cursor-pointer">
                {isEnglish ? "Challenges" : "التحديات"}
                <ChevronDownIcon className="size-4 fill-white/60" />
              </MenuButton>

              <MenuItems
                transition
                anchor="bottom end"
                className="w-52 origin-top-right rounded-xl border border-white/5 bg-black/75 mt-7 p-2 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <MenuItem>
                  <Link href="/training-challenges">
                    <p
                      dir={isEnglish ? "ltr" : "rtl"}
                      className="py-2 px-4 hover:bg-white/10 rounded "
                    >
                      {isEnglish ? "Training Challenges" : "التحديات التدريبية"}
                    </p>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="/competitive-challenges">
                    <p
                      dir={isEnglish ? "ltr" : "rtl"}
                      className="py-2 px-4 hover:bg-white/10 rounded "
                    >
                      {isEnglish
                        ? "Competitive Challenges"
                        : "التحديات التنافسية"}
                    </p>
                  </Link>
                </MenuItem>
                <MenuItem>
                  <Link href="/servers">
                    <p
                      dir={isEnglish ? "ltr" : "rtl"}
                      className="py-2 px-4 hover:bg-white/10 rounded "
                    >
                      {isEnglish ? "Servers" : "الخوادم"}
                    </p>
                  </Link>
                </MenuItem>
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
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 py-2 text-white focus:outline-none cursor-pointer">
                {isEnglish ? "Add Challenge" : "أضف تحدي"}
                <ChevronDownIcon className="size-4 fill-white/60" />
              </MenuButton>

              <MenuItems
                transition
                anchor="bottom end"
                className="w-52 origin-top-right rounded-xl border border-white/5 bg-white/5 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <PencilIcon className="size-4 fill-white/30" />
                    Option 1
                  </button>
                </MenuItem>
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <Square2StackIcon className="size-4 fill-white/30" />
                    Option 2
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
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
              <span>{random}</span>{" "}
              {isEnglish ? "Players Online" : "عدد اللاعبين"}
            </p>
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2 hover:bg-gray-800 transition-all duration-500 py-2 px-2 rounded-md text-white focus:outline-none cursor-pointer">
                <div
                  className={`${
                    !profileImage ? "border border-[#38FFE5]/50" : ""
                  } rounded-full p-1 flex items-center justify-center`}
                >
                  <Image
                    src={profileImage || "/icon1.png"}
                    width={30}
                    height={30}
                    className="rounded-full object-cover"
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
                } lg:mt-5 bg-black/75 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0`}
              >
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    onClick={() => router.push("/profile")}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10 cursor-pointer"
                  >
                    <RiUserLine className="size-4 fill-[#38FFE5]" />
                    {isEnglish ? "Account" : "الحساب"}
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    onClick={() => router.push("/profile-settings")}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10 cursor-pointer"
                  >
                    <CiSettings className="size-4 fill-[#38FFE5]" />
                    {isEnglish ? "Settings" : "الإعدادات"}
                  </button>
                </MenuItem>
                <div className="my-1 h-px bg-[#38FFE5]/20" />
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10 cursor-pointer"
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
              <button
                className={`text-white ${
                  isEnglish ? "text-left" : "text-right"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {isEnglish ? "Home" : "الرئيسية"}
              </button>

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
                    <Link href="/training-challenges">
                      <button
                        className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                          isEnglish ? "text-left" : "text-right"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {isEnglish
                          ? "Training Challenges"
                          : "التحديات التدريبية"}
                      </button>
                    </Link>
                    <Link href="/competitive-challenges">
                      <button
                        className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                          isEnglish ? "text-left" : "text-right"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {isEnglish
                          ? "Competitive Challenges"
                          : "التحديات التنافسية"}
                      </button>
                    </Link>
                    <Link href="/servers">
                      <button
                        className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                          isEnglish ? "text-left" : "text-right"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {isEnglish ? "Servers" : "الخوادم"}
                      </button>
                    </Link>
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
              {/* Add Challenge Dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setMobileAddChallengeOpen(!mobileAddChallengeOpen)
                  }
                  className="flex items-center justify-between w-full text-white"
                >
                  <span>{isEnglish ? "Add Challenge" : "أضف تحدي"}</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform ${
                      mobileAddChallengeOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileAddChallengeOpen && (
                  <div className="mt-2 bg-[#0B0D0F33] rounded-lg p-2 space-y-2">
                    <button
                      className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                        isEnglish ? "text-left" : "text-right"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Option 1
                    </button>
                    <button
                      className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                        isEnglish ? "text-left" : "text-right"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Option 2
                    </button>
                  </div>
                )}
              </div>

              {/* User Section */}
              <div className="border-t border-[#38FFE5]/20 pt-4 mt-4">
                <p
                  dir={isEnglish ? "ltr" : "rtl"}
                  className="flex items-center gap-2 text-white"
                >
                  <span
                    className="w-2 h-2 rounded-full bg-[#38FFE5]"
                    style={{
                      animation: "pulse 1.5s ease-in-out infinite",
                      boxShadow: "0 0 5px #38FFE5",
                    }}
                  ></span>
                  <span>{random}</span>{" "}
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
                          router.push("/profile");
                          setIsMobileMenuOpen(false);
                        }}
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="group flex w-full  items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                      >
                        <RiUserLine className="size-4 fill-[#38FFE5]" />
                        <span className="text-white">
                          <Link href="/profile">
                            {isEnglish ? "Account" : "الحساب"}
                          </Link>
                        </span>
                      </button>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                      >
                        <CiSettings className="size-4 fill-[#38FFE5]" />
                        <span className="text-white">
                          <Link href="/profile-settings">
                            {isEnglish ? "Settings" : "الإعدادات"}
                          </Link>
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
