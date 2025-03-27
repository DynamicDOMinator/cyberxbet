"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";

export default function Events() {
  const { isEnglish } = useLanguage();
  const events = [
    {
      id: 1,
      title: "Hacking Bootcamp",
      subtitle: "Cybersecurity Summit 2025",
      description: "latest trends and threats in cybersecurity",
      date: isEnglish ? "September 2, 2025" : "سبتمبر 2, 2025",
      link: "/events/1",
    },
    {
      id: 2,
      title: "Hacking Bootcamp",
      subtitle: "Cybersecurity Summit 2025",
      description: "latest trends and threats in cybersecurity",
      date: isEnglish ? "September 2, 2025" : "سبتمبر 2, 2025",
      link: "/events/2",
    },
    {
      id: 3,
      title: "Hacking Bootcamp",
      subtitle: "Cybersecurity Summit 2025",
      description: "latest trends and threats in cybersecurity",
      date: isEnglish ? "September 2, 2025" : "سبتمبر 2, 2025",
      link: "/events/3",
    },
  ];

  return (
    <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 mt-36">
      <h1
        className={`text-3xl md:text-4xl font-bold mb-4 md:mb-6 ${
          isEnglish ? "text-left" : "text-right"
        }`}
      >
        {isEnglish ? "Events" : "الفعاليات"}
      </h1>

      <div className={`mb-8 ${isEnglish ? "text-left" : "text-right"}`}>
        <p dir={isEnglish ? "ltr" : "rtl"} className="text-lg">
          {isEnglish
            ? "All events available in "
            : "جميع الفعاليات الموجودة في "}
          <span className="text-[#38FFE5] font-bold">CyberXbytes</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white/1 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="bg-[url('/challnge-bg.jpg')] bg-cover bg-center py-8 md:py-14 px-4">
              <h2 className="text-3xl md:text-5xl text-center font-extrabold text-white mb-2">
                {event.title}
              </h2>
              <p className="text-sm md:text-base text-white text-center">
                {event.description}
              </p>
            </div>
            <div className="p-4">
              <h3 className="text-lg md:text-xl text-center font-semibold mb-4">
                {event.subtitle}
              </h3>
              <hr className="text-[#38FFE5]/20" />
              <div
                className={`flex items-center py-4 ${
                  isEnglish ? "justify-center" : "justify-center"
                }`}
              >
                <span
                  className={`text-sm md:text-base text-gray-400 ${
                    isEnglish ? "text-left" : "text-right"
                  }`}
                >
                  {event.date}
                </span>
                <span
                  className={`${isEnglish ? "mr-2" : "ml-2"} text-teal-400`}
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
