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

export default function Test() {
  const [random, setRandom] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileChallengesOpen, setMobileChallengesOpen] = useState(false);
  const [mobileAddChallengeOpen, setMobileAddChallengeOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  useEffect(() => {
    setRandom(Math.floor(Math.random() * 1000));
  }, []);

  return (
    <header className="relative">
      <nav dir="rtl" className="flex items-center py-5 px-4 md:px-10">
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
            <p className="text-white">الرئيسية</p>
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 py-2 text-white focus:outline-none cursor-pointer">
                التحديات
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
                    <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                      ⌘E
                    </kbd>
                  </button>
                </MenuItem>
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <Square2StackIcon className="size-4 fill-white/30" />
                    Duplicate
                    <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                      ⌘D
                    </kbd>
                  </button>
                </MenuItem>
                <div className="my-1 h-px bg-white/5" />
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <ArchiveBoxIcon className="size-4 fill-white/30" />
                    Archive
                    <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                      ⌘A
                    </kbd>
                  </button>
                </MenuItem>
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <TrashIcon className="size-4 fill-white/30" />
                    Delete
                    <kbd className="ml-auto hidden font-sans text-xs text-white/50 group-data-[focus]:inline">
                      ⌘D
                    </kbd>
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
            <p className="text-white">الفعاليات</p>
            <p className="text-white">المتصدرين</p>
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 py-2 text-white focus:outline-none cursor-pointer">
                أضف تحدي
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
          <div className="hidden lg:flex items-center gap-10 mr-auto">
            <p dir="rtl" className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>{random}</span> عدد اللاعبين
            </p>
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2 py-2 text-white focus:outline-none cursor-pointer">
                <Image src="/logo.png" width={20} height={20} alt="users" />
                <p>Ahmed elsayed</p>
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
                    Profile Settings
                  </button>
                </MenuItem>
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <Square2StackIcon className="size-4 fill-white/30" />
                    My Challenges
                  </button>
                </MenuItem>
                <div className="my-1 h-px bg-white/5" />
                <MenuItem>
                  <button className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-white/10">
                    <TrashIcon className="size-4 fill-white/30" />
                    Sign Out
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full right-0 left-0 bg-gray-900/95 z-50">
            <div className="flex flex-col p-4 space-y-4">
              <button className="text-white text-right">الرئيسية</button>

              {/* Challenges Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMobileChallengesOpen(!mobileChallengesOpen)}
                  className="flex items-center justify-between w-full text-white"
                >
                  <span>التحديات</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform ${
                      mobileChallengesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileChallengesOpen && (
                  <div className="mt-2 bg-gray-800 rounded-lg p-2 space-y-2">
                    <button className="block w-full text-right text-white py-2 px-4 hover:bg-white/10 rounded">
                      Edit
                    </button>
                    <button className="block w-full text-right text-white py-2 px-4 hover:bg-white/10 rounded">
                      Duplicate
                    </button>
                    <button className="block w-full text-right text-white py-2 px-4 hover:bg-white/10 rounded">
                      Archive
                    </button>
                  </div>
                )}
              </div>

              <button className="text-white text-right">الفعاليات</button>
              <button className="text-white text-right">المتصدرين</button>

              {/* Add Challenge Dropdown */}
              <div className="relative">
                <button
                  onClick={() =>
                    setMobileAddChallengeOpen(!mobileAddChallengeOpen)
                  }
                  className="flex items-center justify-between w-full text-white"
                >
                  <span>أضف تحدي</span>
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform ${
                      mobileAddChallengeOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {mobileAddChallengeOpen && (
                  <div className="mt-2 bg-gray-800 rounded-lg p-2 space-y-2">
                    <button className="block w-full text-right text-white py-2 px-4 hover:bg-white/10 rounded">
                      Option 1
                    </button>
                    <button className="block w-full text-right text-white py-2 px-4 hover:bg-white/10 rounded">
                      Option 2
                    </button>
                  </div>
                )}
              </div>

              {/* User Section */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <p dir="rtl" className="flex items-center gap-2 text-white">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span>{random}</span> عدد اللاعبين
                </p>

                <div className="relative mt-4">
                  <button
                    onClick={() => setMobileUserMenuOpen(!mobileUserMenuOpen)}
                    className="flex items-center gap-2 text-white w-full"
                  >
                    <Image src="/logo.png" width={20} height={20} alt="users" />
                    <span>Ahmed elsayed</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform ${
                        mobileUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {mobileUserMenuOpen && (
                    <div className="mt-2 bg-gray-800 rounded-lg p-2 space-y-2">
                      <button className="block w-full text-right text-white py-2 px-4 hover:bg-white/10 rounded">
                        Profile Settings
                      </button>
                      <button className="block w-full text-right text-white py-2 px-4 hover:bg-white/10 rounded">
                        My Challenges
                      </button>
                      <button className="block w-full text-right text-white py-2 px-4 hover:bg-white/10 rounded">
                        Sign Out
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
