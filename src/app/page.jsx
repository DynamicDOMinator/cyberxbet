"use client";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-black ">
      {/* Base grid without blur */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#38FFE520_1px,transparent_1px),linear-gradient(to_bottom,#38FFE520_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Blurred overlay with dynamic hole */}
      <div
        className="absolute inset-0 backdrop-blur-lg bg-black/50 z-10"
        style={{
          maskImage:
            "radial-gradient(circle at var(--mouse-x) var(--mouse-y), transparent 60px, black 120px)",
          WebkitMaskImage:
            "radial-gradient(circle at var(--mouse-x) var(--mouse-y), transparent 60px, black 120px)",
        }}
      />

      {/* <div className="bg-[#38FFE5] w-[650px] h-[310px] absolute right-[-100px] top-[-100px] opacity-50 z-[5]"></div> */}
    </main>
  );
}
