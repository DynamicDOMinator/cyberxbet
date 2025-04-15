"use client";

import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";
import { useState, useEffect } from "react";
import LoadingPage from "@/app/components/LoadingPage";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
import Cookies from "js-cookie";
export default function Leaderboard() {
  const { isEnglish } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(`${apiUrl}/leader-board`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.status === "success") {
          // Transform the API data to match our component structure
          const transformedData = response.data.data.map((user, index) => ({
            rank: index + 1,
            username: user.user_name,
            profileImage: "/icon1.png", // fallback to default image
            flames: user.points,
            droplets: user.challenges_solved,
            notes: user.first_blood_count,
          }));

          setLeaderboardData(transformedData);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchLeaderboard();
  }, []);

  useEffect(() => {
    const filtered = leaderboardData.filter((user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchQuery, leaderboardData]);

  return isLoaded ? (
    <div className="max-w-[2000px] mx-auto pb-10 mt-36">
      <div className=" lg:px-16 px-5">
        <div dir={isEnglish ? "ltr" : "rtl"} className="mb-8">
          <h1 className="text-white text-2xl lg:text-4xl font-bold">
            {isEnglish ? "Leaderboard" : "المتصدرين"}
          </h1>

          <div className="flex items-center gap-1 pt-3">
            <span className="text-white/60 text-sm lg:text-xl">
              {isEnglish ? "Leaderboard by" : "قائمة المتصدرين في"}
            </span>
            <span className="text-[#38FFE5] text-sm lg:text-xl">
              CyberXbytes
            </span>
          </div>

          <div className={`flex justify-${isEnglish ? "end" : "start"} mt-10`}>
            <div className="flex items-center bg-[#0B0D0F] border-b border-[#06373F]   px-3 py-2 w-64">
              <FiSearch
                className={`${isEnglish ? "mr-2" : "ml-2"} text-white/60`}
                size={16}
              />
              <input
                type="text"
                placeholder={isEnglish ? "Search" : "بحث"}
                className="bg-[#0B0D0F] text-white/60 text-sm outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div
          dir={isEnglish ? "ltr" : "rtl"}
          className="relative bg-[#06373F26] px-5 py-6  rounded-md"
        >
          {/* Table Headers */}
          <div className="grid grid-cols-5 place-items-start px-10 gap-4 mb-9  bg-[#38FFE50D] py-3 rounded-md">
            <div className="col-span-2 text-center text-white font-semibold flex justify-center items-center ">
              <span className={`${isEnglish ? "pr-28" : "pl-28"}`}>
                {isEnglish ? "Rank" : "التصنيف"}
              </span>
              <span className={`${isEnglish ? "ml-2" : "mr-2"}`}>
                {isEnglish ? "User" : "المستخدم"}
              </span>
            </div>
            <div className="col-span-1 text-center text-white font-semibold">
              {isEnglish ? "Bytes" : "البايتس"}
            </div>
            <div className="col-span-1 text-center text-white font-semibold">
              {isEnglish ? "Challenges" : "التحديات"}
            </div>
            <div className="col-span-1 text-center text-white font-semibold">
              {isEnglish ? "First Blood" : "البايتس الأولى"}
            </div>
          </div>

          {/* Table Rows */}
          {filteredData.map((user, index) => (
            <div
              key={index}
              className={`rounded-lg mb-3 px-10 py-3 ${
                index % 2 === 0 ? "bg-[#06373F]" : "bg-transparent"
              }`}
            >
              <div
                className={`grid grid-cols-5 ${
                  isEnglish ? "place-items-start" : "place-items-start"
                } gap-4`}
              >
                <div className="col-span-2 flex justify-center">
                  <div className="flex gap-12 items-center">
                    <div className="w-[35px] flex justify-center">
                      {user.rank <= 3 ? (
                        <Image
                          src={
                            user.rank === 1
                              ? "/first.png"
                              : user.rank === 2
                              ? "/second.png"
                              : "/third.png"
                          }
                          alt={`rank ${user.rank}`}
                          width={35}
                          height={35}
                        />
                      ) : (
                        <span className="text-white text-xl font-bold">
                          {user.rank}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-16">
                      <Image
                        src={user.profileImage}
                        alt="user avatar"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <span className="text-white text-xl font-bold">
                        {user.username}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 flex justify-center">
                  <div className="flex flex-row-reverse items-center gap-2">
                    <Image
                      src="/byte.png"
                      alt="flames"
                      width={25}
                      height={25}
                    />
                    <span className="text-white text-xl ">{user.flames}</span>
                  </div>
                </div>

                <div className="col-span-1 flex justify-center">
                  <div className="flex flex-row-reverse items-center gap-2">
                    <Image
                      src="/icon-challnge.png"
                      alt="droplets"
                      width={25}
                      height={25}
                    />
                    <span className="text-white text-xl ">{user.droplets}</span>
                  </div>
                </div>

                <div className="col-span-1 flex justify-center">
                  <div className="flex flex-row-reverse items-center gap-2">
                    <Image
                      src="/blood.png"
                      alt="notes"
                      width={25}
                      height={25}
                    />
                    <span className="text-white text-xl ">{user.notes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <LoadingPage />
  );
}
