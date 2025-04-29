"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/context/LanguageContext";
import { useInView } from "react-intersection-observer";

export default function EventInvitation({ params }) {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const [eventDetails, setEventDetails] = useState({
    name: "Private Event",
    date: "Loading...",
    description: "Loading event details...",
  });
  const { token } = params;
  const { isEnglish } = useLanguage();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const translations = {
    title: isEnglish ? "Event Invitation" : "دعوة للفاعليه",
    subtitle: isEnglish
      ? "You've been invited to join an exclusive event"
      : "لقد تمت دعوتك للانضمام إلى حدث حصري",
    verifying: isEnglish
      ? "Verifying your invitation..."
      : "جاري التحقق من دعوتك...",
    successMessage: isEnglish
      ? "You have been successfully registered for the event!"
      : "تم تسجيلك بنجاح في الحدث!",
    acceptInvitation: isEnglish ? "Join Event" : "انضم للفاعليه",
    eventName: isEnglish
      ? "Cyber Security Workshop"
      : "ورشة عمل الأمن السيبراني",
    eventDate: isEnglish ? "May 15, 2024" : "١٥ مايو ٢٠٢٤",
    eventDescription: isEnglish
      ? "Join us for an exclusive workshop on advanced cybersecurity techniques and hands-on challenges."
      : "انضم إلينا في ورشة عمل حصرية حول تقنيات الأمن السيبراني المتقدمة والتحديات العملية.",
  };

  useEffect(() => {
    const verifyInvitation = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setEventDetails({
        name: translations.eventName,
        date: translations.eventDate,
        description: translations.eventDescription,
      });

      setStatus("success");
      setMessage(translations.successMessage);
    };

    verifyInvitation();
  }, [token, isEnglish]);

  return (
    <main className="relative bg-[#0B0D0F] min-h-screen overflow-hidden">
      {/* Base grid without blur */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#38FFE520_1px,transparent_1px),linear-gradient(to_bottom,#38FFE520_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Animated LED elements */}
      <div
        className="absolute top-[-100px] left-[-100px] w-[650px] h-[310px] bg-[#38FFE5] opacity-40 blur-[200px] z-[1] pointer-events-none animate-pulse"
        style={{ animationDuration: "4s" }}
      />
      <div
        className="absolute top-[-200px] right-[-60px] w-[650px] h-[310px] bg-[#38FFE5] opacity-40 blur-[200px] z-[1] pointer-events-none animate-pulse"
        style={{ animationDuration: "3s", animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-[-50px] right-[-60px] w-[750px] h-[510px] bg-[#38FFE5] opacity-40 blur-[200px] z-[1] pointer-events-none animate-pulse"
        style={{ animationDuration: "5s", animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-[-50px] left-[-100px] w-[650px] h-[510px] bg-[#38FFE5] opacity-40 blur-[200px] z-[1] pointer-events-none animate-pulse"
        style={{ animationDuration: "4s", animationDelay: "1.5s" }}
      />

      {/* Moving LED elements */}
      <div
        className="led-1 absolute top-[20%] left-[10%] w-[100px] h-[100px] bg-[#38FFE5] opacity-30 blur-[50px] z-[1] pointer-events-none animate-float"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="led-2 absolute top-[40%] right-[15%] w-[120px] h-[120px] bg-[#38FFE5] opacity-30 blur-[50px] z-[1] pointer-events-none animate-float"
        style={{ animationDuration: "10s", animationDelay: "2s" }}
      />
      <div
        className="led-3 absolute bottom-[30%] left-[20%] w-[80px] h-[80px] bg-[#38FFE5] opacity-30 blur-[50px] z-[1] pointer-events-none animate-float"
        style={{ animationDuration: "12s", animationDelay: "1s" }}
      />
      <div
        className="led-4 absolute bottom-[20%] right-[25%] w-[90px] h-[90px] bg-[#38FFE5] opacity-30 blur-[50px] z-[1] pointer-events-none animate-float"
        style={{ animationDuration: "9s", animationDelay: "3s" }}
      />

      <div className="relative z-[3] min-h-screen flex items-center justify-center">
        <div className="max-w-3xl w-full px-4" ref={ref}>
          <div className="text-center mb-8" data-aos="fade-up">
            <h1 className="text-white text-4xl lg:text-6xl font-extrabold font-Tajawal mb-4">
              {translations.title}
            </h1>
            <p className="text-[#38FFE5] text-xl lg:text-2xl">
              {translations.subtitle}
            </p>
          </div>

          <div
            className="bg-[#0B0D0F]/50 backdrop-blur-lg border border-[#38FFE5]/20 rounded-xl shadow-2xl overflow-hidden p-8"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {status === "verifying" ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#38FFE5] border-t-transparent"></div>
                <p className="mt-4 text-white text-xl">
                  {translations.verifying}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-center">
                  {status === "success" ? (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-[#38FFE5] rounded-full flex items-center justify-center mb-6">
                        <svg
                          className="w-16 h-16 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-4">
                        {eventDetails.name}
                      </h2>
                      <p className="text-[#38FFE5] text-xl mb-6">
                        {eventDetails.date}
                      </p>
                      <p className="text-white text-lg">
                        {eventDetails.description}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6">
                        <svg
                          className="w-16 h-16 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                      <p className="text-white text-xl">{message}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setStatus("success");
                      setMessage(translations.successMessage);
                    }}
                    className="bg-[#38FFE5] text-black font-bold py-3 px-8 rounded-lg hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300 text-xl"
                  >
                    {translations.acceptInvitation}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(50px, -30px) rotate(90deg);
          }
          50% {
            transform: translate(0, -60px) rotate(180deg);
          }
          75% {
            transform: translate(-50px, -30px) rotate(270deg);
          }
          100% {
            transform: translate(0, 0) rotate(360deg);
          }
        }
        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}</style>
    </main>
  );
}
