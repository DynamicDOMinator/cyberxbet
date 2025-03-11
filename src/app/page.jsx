"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import { FaTwitter } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { FaTelegramPlane } from "react-icons/fa";
import { FaDiscord } from "react-icons/fa";
import { FaRegCopyright } from "react-icons/fa";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import AOS from "aos";
import "aos/dist/aos.css";

const NumberAnimation = ({ end }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  // Generate intermediate numbers for animation
  const generateNumbers = () => {
    const result = [];
    const steps = 10;
    for (let i = steps; i >= 0; i--) {
      result.push(Math.floor(end * (i / steps)));
    }
    return result;
  };

  const numbers = generateNumbers();

  return (
    <div
      ref={ref}
      className="text-4xl font-bold relative h-[1em] overflow-hidden"
    >
      <div
        className={`transition-transform duration-[1200ms] ease-in-out flex flex-col items-center`}
        style={{
          transform: isVisible
            ? "translateY(0)"
            : `translateY(-${(numbers.length - 1) * 100}%)`,
        }}
      >
        {numbers.map((num, index) => (
          <div key={index} className="h-[1em] flex items-center justify-center">
            +{num}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const [isEnglish, setIsEnglish] = useState(false);

  const toggleLanguage = () => {
    setIsEnglish(!isEnglish);
  };

  useEffect(() => {
    // Initialize AOS with optimized settings
    AOS.init({
      duration: 800, // Reduced from 1000
      // once: true, // Changed to true to prevent re-animation
      mirror: false, // Disabled mirroring

      // offset: 50, // Reduced offset for earlier triggering
    });

    const handleMouseMove = (e) => {
      // Throttle mouse move updates
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          "--mouse-x",
          `${e.clientX}px`
        );
        document.documentElement.style.setProperty(
          "--mouse-y",
          `${e.clientY}px`
        );
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="relative bg-[#0B0D0F] min-h-screen overflow-hidden">
      {/* Base grid without blur */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#38FFE520_1px,transparent_1px),linear-gradient(to_bottom,#38FFE520_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* LED elements */}
      <div className="absolute top-[-100px] left-[-100px] w-[650px] h-[310px] bg-[#38FFE5] opacity-40 blur-[200px] z-[1] pointer-events-none" />
      <div className="absolute top-[-200px] right-[-60px] w-[650px] h-[310px] bg-[#38FFE5] opacity-40 blur-[200px] z-[1] pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[-60px] w-[750px] h-[510px] bg-[#38FFE5] opacity-40 blur-[200px] z-[1] pointer-events-none" />
      <div className="absolute bottom-[-50px] left-[-100px] w-[650px] h-[510px] bg-[#38FFE5] opacity-40 blur-[200px] z-[1] pointer-events-none" />

      {/* Blurred overlay with dynamic hole */}
      <div
        className="fixed inset-0 backdrop-blur-[200px] bg-[#0B0D0F]/20  pointer-events-none"
        style={{
          maskImage:
            "radial-gradient(circle at var(--mouse-x) var(--mouse-y), transparent 100px, black 300px)",
          WebkitMaskImage:
            "radial-gradient(circle at var(--mouse-x) var(--mouse-y), transparent 100px, black 300px)",
        }}
      />

      <div className="relative z-[3]">
        {/* header  */}
        <div
          className="flex items-center flex-col lg:flex-row-reverse justify-between"
          data-aos="fade-down"
        >
          <Logo priority={true} />
          <div className="flex items-center mt-8 lg:ml-16 gap-8 px-4">
            <Link href="/login">
              <button className="text-white cursor-pointer hover:bg-[#38FFE5] transition-all duration-400 hover:text-black border-2 border-white font-medium py-2 px-4 rounded">
                {isEnglish ? "Login" : "تسجيل الدخول"}
              </button>
            </Link>
            <button
              onClick={toggleLanguage}
              className="text-white cursor-pointer text-lg font-bold font-Tajawal"
            >
              {isEnglish ? "عربي" : "English"}
            </button>
          </div>
        </div>
        {/* end of the header  */}

        {/* section one  */}
        <div className="mt-20 px-4">
          <h1
            className="text-white text-4xl lg:text-7xl text-center mt-28 font-extrabold font-Tajawal"
            data-aos="fade-up"
          >
            {isEnglish ? "Start the Challenge Now" : "ابدأ التحدي الآن"}
          </h1>
          <div className="w-full max-w-[910px] mx-auto">
            <p
              className="text-white text-center leading-20 text-2xl lg:text-4xl px-4 lg:px-28 mt-20 font-Tajawal"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              {isEnglish ? (
                <>
                  Join us at <span className="text-[#38FFE5]">CyberXbytes</span>{" "}
                  to test your skills in the cybersecurity world and compete
                  with elite professionals and enthusiasts in an exciting gaming
                  environment full of challenges
                </>
              ) : (
                <>
                  انضم إلينا في{" "}
                  <span className="text-[#38FFE5]">CyberXbytes</span> لتختبر
                  مهارتك في عالم الأمن السيبراني و تتنافس مع نخبه من المحترفين و
                  الهواة فى بيئة لعب مشوقة مليئة بالتحديات
                </>
              )}
            </p>

            <div
              className="flex justify-center mt-14"
              data-aos="zoom-in"
              data-aos-delay="400"
            >
              <Link href="/signup">
                <button className="bg-[#38FFE5] cursor-pointer text-black font-bold font-Tajawal py-4 px-8 rounded-lg hover:shadow-[0_0_15px_15px_rgba(56,255,229,0.3)] transition-all duration-300">
                  {isEnglish ? "Join Now" : "انضم الآن"}
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* second section  */}
        <div>
          <h3
            className="text-white text-3xl lg:text-5xl text-center mt-28 font-extrabold font-Tajawal"
            data-aos="fade-up"
          >
            {isEnglish ? (
              <>
                What is the goal of{" "}
                <span className="text-[#38FFE5]">CyberXbytes</span>?
              </>
            ) : (
              <>
                ؟ <span className="text-[#38FFE5]">CyberXbytes</span> ما هدف
              </>
            )}
          </h3>
          <p
            className="text-white text-center font-bold text-2xl lg:text-4xl mt-16 font-Tajawal px-4"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {isEnglish
              ? "Developing Skills and Refining Talents"
              : "تطوير المهارات وصقل المواهب"}
          </p>
          <p
            className="text-white text-center font-medium px-4 lg:w-[932px] mx-auto text-2xl lg:text-4xl mt-16 font-Tajawal"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            {isEnglish
              ? "We aim to create an interactive environment that contributes to preparing the next generation of cybersecurity professionals through realistic challenges and educational games that make learning fun and effective."
              : "نهدف إلي إنشاء بيئة تفاعلية تسهم فى تأهيل الجيل القادم من محترفي الأمن السيبراني عبر التحديات الواقعية والألعاب التعليمية التي تجعل التعلم ممتعا وفعالا."}
          </p>

          <h3
            className="text-white text-2xl lg:text-4xl text-center mt-28 font-bold font-Tajawal px-4"
            data-aos="fade-up"
          >
            {isEnglish
              ? "Attracting Talent and Spreading Challenges"
              : "استقطاب المواهب ونشر التحديات"}
          </h3>

          <p
            dir={isEnglish ? "ltr" : "rtl"}
            className="text-white text-center font-medium px-4 lg:w-[932px] mx-auto text-2xl lg:text-4xl mt-16 font-Tajawal"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {isEnglish ? (
              <>
                At <span className="text-[#38FFE5]">CyberXbytes</span>, we open
                the field for professionals and creators to add their own
                challenges after review, providing the community with an
                opportunity to learn from diverse experiences, creating a
                dynamic space for spreading knowledge and enhancing
                collaboration between specialists.
              </>
            ) : (
              <>
                في <span className="text-[#38FFE5]">CyberXbytes</span> نفتح
                المجال للمحترفين والمبدعين لإضافة تحدياتهم الخاصة بعد مراجعتها,
                مما يتيح للمجتمع فرصة للتعلم من خبرات متنوعة, ويخلق فضاء
                ديناميكيا لنشر المعرفة و تعزيز التعاون بين المختصين.
              </>
            )}
          </p>
        </div>

        {/* third section */}
        <div className="mt-40 px-4">
          <h3
            dir={isEnglish ? "ltr" : "rtl"}
            className="text-white text-3xl lg:text-5xl text-center mt-28 font-extrabold font-Tajawal"
            data-aos="fade-up"
          >
            {isEnglish ? (
              <>
                Why join <span className="text-[#38FFE5]">CyberXbytes </span>?
              </>
            ) : (
              <>
                 لماذا تنضم إلي{" "}
                <span className="text-[#38FFE5]"> CyberXbytes </span>؟ 
              </>
            )}
          </h3>

          <div className="mt-40 grid gap-10 md:gap-10 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 max-w-7xl mx-auto px-4">
            <div
              className="flex flex-col items-center gap-7"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <Image
                priority={true}
                className="w-[100px] h-[100px]"
                src="/icon3.png"
                height={100}
                width={100}
                alt="image"
                loading="eager"
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish ? "Practice Environment" : "تحاكي الواقع"}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "Access a secure environment to practice and learn"
                  : "اختبر نفسك في سيناريوهات عملية"}
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-7"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <Image
                priority={true}
                className="w-[100px] h-[100px]"
                src="/icon2.png"
                height={100}
                width={100}
                alt="image"
                loading="eager"
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish ? "Leaderboard System" : "فرصة للتعلم"}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "Compete globally and track your progress"
                  : "استمتع بتحديات مصممة لتعزيز مهاراتك"}
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-7"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <Image
                priority={true}
                className="w-[100px] h-[100px]"
                src="/icon1.png"
                height={100}
                width={100}
                alt="image"
                loading="eager"
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish ? "Interactive Community" : "مجتمع تفاعلى"}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "Share achievements and learn from experts"
                  : "شارك انجازاتك وتعلم من الخبراء"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-40 grid gap-10 md:gap-0 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 max-w-7xl mx-auto px-4">
          <div
            className="flex flex-col items-center gap-7"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <Image
              priority={true}
              className="w-[100px] h-[100px]"
              src="/icon6.png"
              height={100}
              width={100}
              alt="image"
              loading="eager"
            />
            <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
              {isEnglish ? "Practice Environment" : "تحاكي الواقع"}
            </h4>
            <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
              {isEnglish
                ? "Access a secure environment to practice and learn"
                : "اختبر نفسك في سيناريوهات عملية"}
            </p>
          </div>

          <div
            className="flex flex-col items-center gap-7"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <Image
              priority={true}
              className="w-[100px] h-[100px]"
              src="/icon5.png"
              height={100}
              width={100}
              alt="image"
              loading="eager"
            />
            <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
              {isEnglish ? "Leaderboard System" : "فرصة للتعلم"}
            </h4>
            <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
              {isEnglish
                ? "Compete globally and track your progress"
                : "استمتع بتحديات مصممة لتعزيز مهاراتك"}
            </p>
          </div>

          <div
            className="flex flex-col items-center gap-7"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <Image
              priority={true}
              className="w-[100px] h-[100px]"
              src="/icon4.png"
              height={100}
              width={100}
              alt="image"
              loading="eager"
            />
            <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
              {isEnglish ? "Interactive Community" : "مجتمع تفاعلى"}
            </h4>
            <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
              {isEnglish
                ? "Share achievements and learn from experts"
                : "شارك انجازاتك وتعلم من الخبراء"}
            </p>
          </div>
        </div>

        {/* forth section */}

        {/* third section */}
        <div className="mt-40 px-4">
          <h3
            dir={isEnglish ? "ltr" : "rtl"}
            className="text-white text-3xl lg:text-5xl text-center mt-28 font-extrabold font-Tajawal"
            data-aos="fade-up"
          >
            {isEnglish ? "Challenges" : "التحديات المتوفرة في"}
            <span className="text-[#38FFE5]"> CyberXbytes</span>{" "}
          </h3>

          <div className="mt-40 grid gap-10 md:gap-10 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 max-w-7xl mx-auto px-4">
            <div
              className="flex flex-col items-center gap-7"
              data-aos="flip-left"
              data-aos-delay="100"
            >
              <Image
                className="w-[200px] h-[200px]"
                src="/icon3-1.png"
                height={200}
                width={200}
                alt="image"
                loading="lazy"
                quality={75}
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish ? "Web Applications" : "تطبيقات الويب"}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "Challenges that test your skills in discovering and exploiting vulnerabilities in web applications, such as SQL Injection, XSS, CSRF, and other common attacks in application security."
                  : "تحديات أمان تطبيقات الويب تختبر مهاراتك في اكتشاف واستغلال الثغرات في مواقع الإنترنت، مثل SQL Injection, XSS, CSRF، وغيرها من الهجمات الشائعة في أمن التطبيقات."}
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-7"
              data-aos="flip-left"
              data-aos-delay="200"
            >
              <Image
                className="w-[200px] h-[200px]"
                src="/icon2-1.png"
                height={200}
                width={200}
                alt="image"
                loading="lazy"
                quality={75}
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish ? "Reverse Engineering" : "الهندسة العكسية"}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "You will learn in these challenges how to disassemble and analyze executable codes to understand how they work."
                  : "ستتعلم في هذه التحديات كيف تفكك الأكواد التنفيذية وتحللها لفهم كيفية عملها"}
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-7"
              data-aos="flip-left"
              data-aos-delay="300"
            >
              <Image
                className="w-[200px] h-[200px]"
                src="/icon1-1.png"
                height={200}
                width={200}
                alt="image"
                loading="lazy"
                quality={75}
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish
                  ? "Cryptography and Decryption"
                  : "التشفير وفك التشفير"}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "You will test your skills in analyzing and breaking encrypted systems using techniques such as RSA, AES, Hash Cracking, and other encryption algorithms."
                  : "ستختبر تحديات التشفير قدرتك على تحليل وكسر الأنظمة المشفرة باستخدام أساليب مثل RSA, AES, Hash Cracking وغيرها من خوارزميات التشفير."}
              </p>
            </div>
          </div>

          <div className="mt-10 lg:mt-40 grid gap-10 md:gap-10 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 max-w-7xl mx-auto px-4">
            <div
              className="flex flex-col items-center gap-7"
              data-aos="flip-left"
              data-aos-delay="100"
            >
              <Image
                className="w-[200px] h-[200px]"
                src="/icon6-1.png"
                height={200}
                width={200}
                alt="image"
                loading="lazy"
                quality={75}
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish ? "Miscellaneous" : "متنوع"}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "This section includes a collection of challenges that do not belong to a specific category, such as OSINT (Open Source Intelligence), protocol analysis, and testing general knowledge in cybersecurity."
                  : "يضم هذا القسم مجموعة من التحديات التي لا تنتمي إلى فئة معينة، مثل OSINT (البحث المفتوح عن المعلومات)، تحليل البروتوكولات، واختبار المعرفة العامة في مجال الأمن السيبراني."}
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-7"
              data-aos="flip-left"
              data-aos-delay="200"
            >
              <Image
                className="w-[200px] h-[200px]"
                src="/icon5-1.png"
                height={200}
                width={200}
                alt="image"
                loading="lazy"
                quality={75}
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish ? (
                  <>
                    Learn with{" "}
                    <span className="text-[#38FFE5]">CyberXbytes</span>
                  </>
                ) : (
                  <>
                    <span className="text-[#38FFE5]">CyberXbytes </span> تعلم مع
                  </>
                )}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "We offer educational challenges 101 in various fields of cybersecurity, to help you understand the basics and refine your skills through practical experiences that suit all levels."
                  : "تقدم تحديات تعليمية 101 في مختلف مجالات الأمن السيبراني، لمساعدتك على فهم الأساسيات وصقل مهاراتك من خلال تجارب عملية مبسطة تناسب جميع المستويات"}
              </p>
            </div>

            <div
              className="flex flex-col items-center gap-7"
              data-aos="flip-left"
              data-aos-delay="300"
            >
              <Image
                className="w-[200px] h-[200px]"
                src="/icon4-1.png"
                height={200}
                width={200}
                alt="image"
                loading="lazy"
                quality={75}
              />
              <h4 className="text-white text-center font-bold text-2xl lg:text-4xl font-Tajawal">
                {isEnglish ? "Digital Forensics" : "التحليل الجنائي الرقمي"}
              </h4>
              <p className="text-[#BCC9DB] text-center text-lg font-Tajawal">
                {isEnglish
                  ? "These challenges include file analysis, memory analysis, network analysis, and system log analysis to detect suspicious activities."
                  : "تشمل التحديات تحليل الملفات، الذاكرة، الشبكات، وسجلات الأنظمة للكشف عن الأنشطة المشبوهة."}
              </p>
            </div>
          </div>
        </div>

        {/* numbers section */}

        <div className="grid md:grid-cols-3 grid-cols-1 mt-20 place-items-center max-w-7xl mx-auto gap-10 px-4">
          <div className="w-[200px] text-center" data-aos="zoom-in">
            <div className="h-[100px] text-white rounded-2xl relative flex items-center justify-center">
              <NumberAnimation end={1000} />
            </div>
            <p className="text-white text-center font-medium mt-3 text-2xl lg:text-2xl font-Tajawal">
              {isEnglish ? " Users" : " المستخدمين"}
            </p>
          </div>
          <div
            className="w-[200px] text-center"
            data-aos="zoom-in"
            data-aos-delay="200"
          >
            <div className="h-[100px] text-white rounded-2xl relative flex items-center justify-center">
              <NumberAnimation end={120} />
            </div>
            <p className="text-white text-center font-medium mt-3 text-2xl lg:text-2xl font-Tajawal">
              {isEnglish ? " Challenges" : "تحديات"}
            </p>
          </div>
          <div
            className="w-[200px] text-center"
            data-aos="zoom-in"
            data-aos-delay="400"
          >
            <div className="h-[100px] text-white rounded-2xl relative flex items-center justify-center">
              <NumberAnimation end={4} />
            </div>
            <p className="text-white text-center mt-3 text-2xl font-medium lg:text-2xl font-Tajawal">
              {isEnglish ? "Events" : " الفعاليات"}
            </p>
          </div>
        </div>

        <hr className="text-white my-14 mt-36 mx-4 lg:mx-20" />

        {/* footer */}
        <div className="relative grid lg:grid-cols-2 md:grid-cols-2 grid-cols-1 mt-20 place-items-start max-w-7xl mx-auto px-4 gap-10">
          <div className="w-full" data-aos="fade-right">
            <h5
              className={`text-white ${
                isEnglish ? "text-left" : "text-right"
              } text-2xl font-medium`}
            >
              {isEnglish ? "Join Our Community" : "انضم إلى مجتمعنا"}
            </h5>
            <p
              className={`text-white ${
                isEnglish ? "text-left" : "text-right"
              } mt-2 text-2xl`}
            >
              {isEnglish ? (
                <>
                  Be part of the{" "}
                  <span className="text-[#38FFE5]">CyberXbytes</span> community
                </>
              ) : (
                <>
                  <span className="text-[#38FFE5]">CyberXbytes</span> كن جزاءا
                  من مجتمع
                </>
              )}
            </p>
            <ul
              className={`flex flex-col gap-5 mt-6 ${
                isEnglish ? "" : "items-end"
              }`}
            >
              <li
                className={`flex items-center gap-2 text-white ${
                  isEnglish ? "justify-start" : "justify-end"
                }`}
              >
                {isEnglish ? (
                  <>
                    <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                      <FaDiscord />
                    </span>
                    Twitter: @CyberXbytes
                  </>
                ) : (
                  <>
                    Twitter: @CyberXbytes
                    <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                      <FaDiscord />
                    </span>
                  </>
                )}
              </li>

              <li
                className={`flex items-center gap-2 text-white ${
                  isEnglish ? "justify-start" : "justify-end"
                }`}
              >
                {isEnglish ? (
                  <>
                    <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                      <FaTelegramPlane />
                    </span>
                    Telegram: @CyberXbytesSupport
                  </>
                ) : (
                  <>
                    Telegram: @CyberXbytesSupport
                    <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                      <FaTelegramPlane />
                    </span>
                  </>
                )}
              </li>
            </ul>
          </div>

          <div
            className="w-full flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-4"
            data-aos="fade-left"
          >
            <div className="w-full">
              <h5
                className={`text-white ${
                  isEnglish ? "text-left" : "text-right"
                } text-2xl font-medium`}
              >
                {isEnglish ? "Contact Us" : "تواصل معنا"}
              </h5>
              <p
                className={`text-white ${
                  isEnglish ? "text-left" : "text-right"
                } mt-2 text-2xl`}
              >
                {isEnglish
                  ? "If you have any inquiries or wish to contact us"
                  : "إذا كان لديك أي استفسار أو رغبت في التواصل معنا"}
              </p>
              <ul
                className={`flex flex-col gap-5 mt-6 ${
                  isEnglish ? "" : "items-end"
                }`}
              >
                <li
                  className={`flex items-center gap-2 text-white ${
                    isEnglish ? "justify-start" : "justify-end"
                  }`}
                >
                  {isEnglish ? (
                    <>
                      <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                        <FaTwitter />
                      </span>
                      @CyberXbytesSupport
                    </>
                  ) : (
                    <>
                      @CyberXbytesSupport
                      <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                        <FaTwitter />
                      </span>
                    </>
                  )}
                </li>
                <li
                  className={`flex items-center gap-2 text-white ${
                    isEnglish ? "justify-start" : "justify-end"
                  }`}
                >
                  {isEnglish ? (
                    <>
                      <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                        <MdOutlineEmail />
                      </span>
                      @CyberXbytesSupport
                    </>
                  ) : (
                    <>
                      @CyberXbytesSupport
                      <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                        <MdOutlineEmail />
                      </span>
                    </>
                  )}
                </li>
                <li
                  className={`flex items-center gap-2 text-white ${
                    isEnglish ? "justify-start" : "justify-end"
                  }`}
                >
                  {isEnglish ? (
                    <>
                      <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                        <FaTelegramPlane />
                      </span>
                      Telegram: @CyberXbytesSupport
                    </>
                  ) : (
                    <>
                      Telegram: @CyberXbytesSupport
                      <span className="bg-[#38FFE5] py-2 px-2 rounded-full">
                        <FaTelegramPlane />
                      </span>
                    </>
                  )}
                </li>
              </ul>
            </div>

            <div
              className="w-full lg:w-1/3 flex justify-center lg:justify-end mt-10 lg:mt-0"
              data-aos="zoom-in"
            >
              <Image
                src="/big logo.png"
                alt="logo"
                className="w-[100px] h-[145px] lg:w-[100px] lg:h-[145px]"
                height={145}
                width={100}
                quality={100}
              />
            </div>
          </div>
        </div>

        <hr className="text-white mt-14 mx-4 lg:mx-20" />

        <div className="px-4 lg:px-20">
          <p
            className={`text-white ${
              isEnglish ? "text-left" : "text-right"
            } mt-10 mb-5 flex items-center ${
              isEnglish ? "justify-start" : "justify-end"
            } gap-1`}
          >
            {isEnglish ? (
              <>
                <FaRegCopyright /> CyberXbytes.com {new Date().getFullYear()}
              </>
            ) : (
              <>
                CyberXbytes.com {new Date().getFullYear()} <FaRegCopyright />
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
