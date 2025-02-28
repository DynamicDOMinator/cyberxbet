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

      {/* LED elements */}
      <div className="absolute top-[-100px] left-[-100px] w-[650px] h-[310px] bg-[#38FFE5] opacity-40 blur-[200px] z-[5]" />
      <div className="absolute top-[-200px] right-[-60px] w-[650px] h-[310px] bg-[#38FFE5] opacity-40 blur-[200px] z-[5]" />
      {/* <div className="absolute right-[-100px] top-[30%] w-[310px] h-[650px] bg-[#38FFE5] opacity-30 blur-[100px] z-[5]" /> */}

      {/* Blurred overlay with dynamic hole */}
      <div
        className="absolute inset-0 backdrop-blur-lg bg-black/5 z-10"
        style={{
          maskImage:
            "radial-gradient(circle at var(--mouse-x) var(--mouse-y), transparent 100px, black 300px)",
          WebkitMaskImage:
            "radial-gradient(circle at var(--mouse-x) var(--mouse-y), transparent 100px, black 300px)",
        }}
      />
    </main>
  );
}
