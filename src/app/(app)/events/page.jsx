"use client";
import React from "react";
import Link from "next/link";
import axios from "axios";
import { useLanguage } from "@/app/context/LanguageContext";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Image from "next/image";
import { useRouter } from "next/navigation";
import LoadingPage from "@/app/components/LoadingPage";

export default function Events() {
  const { isEnglish } = useLanguage();
  const [event, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    };

    return new Intl.DateTimeFormat(
      isEnglish ? "en-US" : "ar-EG",
      options
    ).format(date);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = Cookies.get("token");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const response = await axios.get(`${apiUrl}/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("API Response:", response.data);
        setEvents(response.data.events);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <>
      {loading ? (
        <LoadingPage />
      ) : (
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

          <div
            dir={isEnglish ? "ltr" : "rtl"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:mt-16 gap-4 md:gap-6"
          >
            {event.map((event) => (
              <div
                onClick={() => router.push(`/events/${event.uuid}`)}
                key={event.uuid}
                className="bg-white/1 cursor-pointer h-[320px] relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-1/2 w-full">
                  <Image
                    className="object-cover"
                    src={event.image}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg md:text-xl my-5 text-center font-semibold mb-4">
                    {event.title}
                  </h3>
                  <hr className="text-[#38FFE5]/20" />
                  <div
                    className={`flex items-center py-4 ${
                      isEnglish ? "justify-center" : "justify-center"
                    }`}
                  >
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
                    <span
                      className={`text-sm md:text-base text-gray-400 ${
                        isEnglish ? "text-left" : "text-right"
                      }`}
                    >
                      {formatDate(event.start_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
