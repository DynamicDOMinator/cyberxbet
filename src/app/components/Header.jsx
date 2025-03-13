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

const gradientAnimation = `
  @keyframes gradient {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function Header() {
  const { isEnglish, setIsEnglish } = useLanguage();
  const [random, setRandom] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileChallengesOpen, setMobileChallengesOpen] = useState(false);
  const [mobileAddChallengeOpen, setMobileAddChallengeOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  useEffect(() => {
    setRandom(Math.floor(Math.random() * 1000));
  }, []);

  useEffect(() => {
    console.log("Language changed:", isEnglish);
  }, [isEnglish]);

  return (
    <header className="relative">
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
          <div className="flex items-center justify-end gap-4">
            <Link href="/">
              <Image
                src="/logo.png"
                width={100}
                height={100}
                className="w-[40px] h-[58px]"
                alt="logo"
              />
            </Link>
            <h1 className="text-white text-xl md:text-2xl font-bold font-Tajawal">
              CyberXbytes
            </h1>
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
                className="w-52 origin-top-right rounded-xl border border-white/5 bg-white/5 p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0"
              >
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <PencilIcon className="size-4 fill-white/30" />
                    Edit
                  </button>
                </MenuItem>
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <Square2StackIcon className="size-4 fill-white/30" />
                    Duplicate
                  </button>
                </MenuItem>
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <ArchiveBoxIcon className="size-4 fill-white/30" />
                    Archive
                  </button>
                </MenuItem>
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <TrashIcon className="size-4 fill-white/30" />
                    Delete
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
            <p className="text-white">{isEnglish ? "Events" : "الفعاليات"}</p>
            <p className="text-white">
              {isEnglish ? "Leaderboard" : "المتصدرين"}
            </p>
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
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>{random}</span>{" "}
              {isEnglish ? "Players Online" : "عدد اللاعبين"}
            </p>
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2 hover:bg-gray-800 transition-all duration-500 py-2 px-2 rounded-md text-white focus:outline-none cursor-pointer">
                <Image
                  src="/icon1.png"
                  width={30}
                  height={30}
                  className="rounded-full"
                  alt="users"
                />
                <p>Ahmed elsayed</p>
                <ChevronDownIcon className="size-4 fill-white/60" />
              </MenuButton>

              <MenuItems
                transition
                anchor="bottom end"
                className={`w-52 origin-top-right rounded-xl ${
                  isEnglish ? "lg:mr-10" : "lg:ml-10"
                } lg:mt-2 bg-[#0B0D0F33] p-1 text-sm/6 text-white transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0`}
              >
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                  >
                    <RiUserLine className="size-4 fill-[#38FFE5]" />
                    {isEnglish ? "Account" : "الحساب"}
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                  >
                    <CiSettings className="size-4 fill-[#38FFE5]" />
                    {isEnglish ? "Settings" : "الإعدادات"}
                  </button>
                </MenuItem>
                <div className="my-1 h-px bg-[#38FFE5]/20" />
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                    onClick={() => setIsEnglish(!isEnglish)}
                  >
                    <MdLanguage className="size-4 fill-[#38FFE5]" />
                    {isEnglish ? "العربية" : "English"}
                  </button>
                </MenuItem>
                <MenuItem>
                  <button
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="group flex w-full text-[#FF1100] items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
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
          <div className="lg:hidden absolute bg-black/20 top-full right-0 left-0 z-50">
            <div className="flex flex-col p-4 space-y-4">
              <button
                className={`text-white ${
                  isEnglish ? "text-left" : "text-right"
                }`}
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
                    <button
                      className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                        isEnglish ? "text-left" : "text-right"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                        isEnglish ? "text-left" : "text-right"
                      }`}
                    >
                      Duplicate
                    </button>
                    <button
                      className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                        isEnglish ? "text-left" : "text-right"
                      }`}
                    >
                      Archive
                    </button>
                  </div>
                )}
              </div>

              <button
                className={`text-white ${
                  isEnglish ? "text-left" : "text-right"
                }`}
              >
                {isEnglish ? "Events" : "الفعاليات"}
              </button>
              <button
                className={`text-white ${
                  isEnglish ? "text-left" : "text-right"
                }`}
              >
                {isEnglish ? "Leaderboard" : "المتصدرين"}
              </button>

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
                    >
                      Option 1
                    </button>
                    <button
                      className={`block w-full text-white py-2 px-4 hover:bg-white/10 rounded ${
                        isEnglish ? "text-left" : "text-right"
                      }`}
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
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>{random}</span>{" "}
                  {isEnglish ? "Players Online" : "عدد اللاعبين"}
                </p>

                <div className="relative mt-4">
                  <button
                    onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                    className="flex items-center gap-2 text-white w-full"
                  >
                    <Image
                      src="/icon1.png"
                      width={20}
                      height={20}
                      alt="users"
                    />
                    <span>Ahmed elsayed</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform ${
                        mobileUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileUserMenuOpen && (
                    <div className="mt-2 rounded-xl p-2 space-y-2">
                      <button
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                      >
                        <RiUserLine className="size-4 fill-[#38FFE5]" />
                        <span className="text-white">
                          {isEnglish ? "Account" : "الحساب"}
                        </span>
                      </button>
                      <button
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
                        onClick={() => setIsEnglish(!isEnglish)}
                        dir={isEnglish ? "ltr" : "rtl"}
                        className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10"
                      >
                        <MdLanguage className="size-4 fill-[#38FFE5]" />
                        <span className="text-white">
                          {isEnglish ? "العربية" : "English"}
                        </span>
                      </button>
                      <button
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
