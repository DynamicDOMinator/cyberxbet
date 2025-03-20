import React from "react";
import { BiLoaderAlt } from "react-icons/bi";
import Logo from "./Logo";

export default function LoadingPage() {
  return (
    <div className="bg-[#0B0D0F] min-h-screen flex flex-col relative z-[1000]">
      <div className="flex justify-center pt-6">
        <Logo />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <BiLoaderAlt className="animate-spin text-[#38FFE5] text-5xl mx-auto mb-4" />
   
        </div>
      </div>
    </div>
  );
}
