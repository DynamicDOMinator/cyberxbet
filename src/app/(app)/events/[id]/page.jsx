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

export default function EventPage() {
  const { isEnglish } = useLanguage();

  const [event, setEvent] = useState("");

  const { id } = useParams();

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
    const getEvent = async () => {
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/events/${id}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      setEvent(res.data.event);
    };
    getEvent();
  }, []);

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
        className={`bg-cover bg-center relative rounded-lg mt-6 md:mt-8 lg:mt-12 h-[400px] md:h-[450px] lg:h-[500px] w-full`}
        style={{
          backgroundImage: `url(${event.image})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
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
                <p  className={`flex items-center ${isEnglish ? "flex-row-reverse" : ""} text-base md:text-[18px] gap-2`}>
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
                  className={`flex items-center ${isEnglish ? "flex-row-reverse" : ""} text-base md:text-[18px] gap-2`}
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
              <div>
                <p className="pt-6 md:pt-8 lg:pt-10 text-base md:text-[18px] justify-center flex items-center gap-2">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
