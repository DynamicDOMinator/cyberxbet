"use client";
import { useLanguage } from "@/app/context/LanguageContext";
import { FaTiktok } from "react-icons/fa6";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Achievements from "@/app/components/Achievements";
import { FaInstagram } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import ActivityChart from "@/app/components/ActivityChart";
import LoadingPage from "@/app/components/LoadingPage";
import { Inter } from "next/font/google";
import CountrySelect from "@/app/components/CountrySelect";

const inter = Inter({ subsets: ["latin"] });

export default function ProfileSettings() {
  const { isEnglish } = useLanguage();
  const [country, setCountry] = useState(null);

  // Keep track of both current and original email
  const [originalEmail, setOriginalEmail] = useState(
    "Mahmoudfatouh1234@hotmail.com"
  );
  const [newEmail, setNewEmail] = useState("Mahmoudfatouh1234@hotmail.com");
  const [editingEmail, setEditingEmail] = useState(false);

  // Custom styles for the country select component
  const countrySelectStyles = {
    control: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: "black",
      borderColor: isFocused ? "#00D8C8" : "transparent",
      boxShadow: isFocused
        ? "0px 0px 0px 1px #00D8C8, 0px 0px 10px 0px #00D8C8"
        : "none",
      padding: "6px",
      borderRadius: "0.375rem",
      "&:hover": {
        borderColor: "#00D8C8",
      },
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: "#131619",
    }),
    option: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: isFocused ? "#2a2e32" : "#131619",
      color: "white",
    }),
    singleValue: (styles) => ({
      ...styles,
      color: "white",
      textAlign: isEnglish ? "left" : "right",
    }),
    placeholder: (styles) => ({
      ...styles,
      color: "gray",
      textAlign: isEnglish ? "left" : "right",
    }),
  };

  const handleEmailUpdate = () => {
    // Your API call would go here
    console.log("Email updated to:", newEmail);
    // After successful API call, update the original email
    setOriginalEmail(newEmail);
    setEditingEmail(false);
  };

  const cancelEmailEdit = () => {
    // Reset to original email
    setNewEmail(originalEmail);
    setEditingEmail(false);
  };

  return (
    <div
      dir={isEnglish ? "ltr" : "rtl"}
      className="pt-40 px-4 sm:px-10 max-w-[2000px] mx-auto"
    >
      <div className="flex items-center gap-3 sm:gap-5">
        <div>
          <Image
            className="rounded-full w-16 h-16 sm:w-[88px] sm:h-[88px]"
            src="/user.png"
            alt="profile"
            width={88}
            height={88}
          />
        </div>

        <div>
          <h1 className="text-2xl sm:text-4xl font-semibold ">
            Mahmoud Fatouh
          </h1>
          <p className="text-xl sm:text-3xl font-semibold">
            {isEnglish ? "Beginner" : "مبتدئ"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-8 sm:mt-16">
        <div
          className="bg-transparent shadow-inner shadow-[#FE2C55] rounded-full  w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #FE2C55 inset" }}
        >
          <span className={`text-white  font-medium ${inter.className}`}>
            TikTok
          </span>
          <FaTiktok className={`text-white  `} />
        </div>

        <div
          className="bg-transparent shadow-inner shadow-[#0A66C2] rounded-full w-[120px]  flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #0A66C2 inset" }}
        >
          <span className={`text-white font-medium ${inter.className}`}>
            LinkedIn
          </span>
          <FaLinkedin className={`text-white text-lg `} />
        </div>
        <div
          className="bg-white/10  rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
          style={{
            boxShadow:
              "0px 5px 15px 0px #BA339F inset, 2px -1px 30px 0px #E0AF47 inset",
          }}
        >
          <span className={`text-white font-medium ${inter.className}`}>
            Instagram
          </span>
          <FaInstagram className={`text-white text-lg `} />
        </div>
        <div
          className="bg-transparent shadow-inner shadow-[#FF0000] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #FF0000 inset" }}
        >
          <span className={`text-white font-medium ${inter.className}`}>
            Youtube
          </span>
          <FaYoutube className={`text-white text-lg `} />
        </div>
        <div
          className="bg-transparent shadow-inner shadow-[#5865F2] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #5865F2 inset" }}
        >
          <span className={`text-white font-medium ${inter.className}`}>
            Discord
          </span>
          <FaDiscord className={`text-[#5865F2] text-lg `} />
        </div>
        <div
          className="bg-transparent shadow-inner shadow-[#000000] rounded-full w-[120px] flex items-center justify-center gap-2 py-1 px-2 mb-2 sm:mb-0"
          style={{ boxShadow: "0px -1.5px 20px 0px #000000 inset" }}
        >
          <span className={`text-white  font-medium ${inter.className}`}>
            Twitter X
          </span>
          <BsTwitterX className={`text-white text-lg `} />
        </div>
      </div>
      {/* Personal Information Section */}
      <div className="bg-[#131619] rounded-xl p-6 mt-8 sm:mt-16">
        <h2 className="text-2xl font-semibold mb-6 text-right">
          {isEnglish ? "Personal Information" : "المعلومات الشخصية"}
        </h2>

        <div className="flex items-center gap-4 mb-8">
          <div className="relative w-24 h-24">
            <Image
              src="/user.png"
              alt="profile"
              className="rounded-full w-full h-full object-cover"
              width={96}
              height={96}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button className="bg-[#00D8C8] text-black font-bold hover:shadow-[0px_0px_15px_0px_#00D8C8] transition-all duration-300 px-5 py-2 rounded-md text-sm">
              {isEnglish ? "Upload Image" : "رفع صورة"}
            </button>{" "}
            <button className="bg-transparent border-2 border-red-500 hover:shadow-[0px_0px_15px_0px_red] transition-all duration-300 px-5 py-2 rounded-md text-sm">
              {isEnglish ? "Remove" : "إزالة"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="text-right mb-2">
              {isEnglish ? "Username" : "اسم المستخدم"}
            </label>
            <input
              type="text"
              defaultValue="Mahmoudfatouh"
              className="bg-black rounded-md p-3 text-right focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-right mb-2">
              {isEnglish ? "Email" : "البريد الإلكتروني"}
            </label>
            <div className="relative w-full">
              {editingEmail ? (
                <div className="flex flex-col w-full">
                  <div className="flex w-full">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-black rounded-md rounded-r-none p-3 text-right w-full focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleEmailUpdate}
                        className="bg-[#00D8C8] text-black rounded-md font-bold px-4 hover:shadow-[0px_0px_15px_0px_#00D8C8] transition-all duration-300"
                      >
                        {isEnglish ? "Save" : "حفظ"}
                      </button>
                      <button
                        onClick={cancelEmailEdit}
                        className="text-red-500 border-2 border-red-500 font-bold px-4 rounded-md hover:shadow-[0px_0px_15px_0px_#ff0000] transition-all duration-300"
                      >
                        {isEnglish ? "Cancel" : "الغاء"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full">
                  <input
                    type="email"
                    value={newEmail}
                    className="bg-black rounded-md p-3 text-right pr-12 w-full focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300"
                    readOnly
                  />
                  <button
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-[#00D8C8] transition-colors"
                    onClick={() => setEditingEmail(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-right mb-2">
              {isEnglish ? "Country" : "البلد"}
            </label>
            <CountrySelect
              value={country}
              onChange={setCountry}
              customStyles={countrySelectStyles}
              isEnglish={isEnglish}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-right mb-2">
              {isEnglish ? "Timezone" : "المنطقة الزمنية"}
            </label>
            <div className="relative">
              <select className="bg-black rounded-md p-3 w-full appearance-none text-right pr-10 focus:outline-none focus:border-[#00D8C8] focus:ring-1 focus:ring-[#00D8C8] focus:shadow-[0px_0px_10px_0px_#00D8C8] border border-transparent transition-all duration-300">
                <option value="cairo">Egypt, Cairo</option>
                {/* Add more timezones as needed */}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button className="bg-[#00D8C8] text-black font-bold hover:shadow-[0px_0px_15px_0px_#00D8C8] transition-all duration-300 px-8 py-2 rounded-md">
            {isEnglish ? "Save Changes" : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
}
