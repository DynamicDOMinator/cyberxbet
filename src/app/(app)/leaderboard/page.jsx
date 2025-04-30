"use client";

import { useLanguage } from "../../context/LanguageContext";
import Image from "next/image";
import { useState, useEffect } from "react";
import LoadingPage from "@/app/components/LoadingPage";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
export default function Leaderboard() {
  const { isEnglish } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const router = useRouter();
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
      <div className="lg:px-16 px-5">
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
            <div className="flex items-center bg-[#0B0D0F] border-b border-[#06373F] px-3 py-2 w-64">
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
          className="relative bg-[#06373F26] px-2 sm:px-5 py-6 rounded-md overflow-x-auto"
        >
          {/* Common Table Styles */}
          <style jsx>{`
            .leaderboard-table {
              display: grid;
              grid-template-columns: repeat(12, 1fr);
              min-width: 600px;
            }

            @media (min-width: 768px) {
              .leaderboard-table {
                grid-template-columns: 2fr 1fr 1fr 1fr;
              }
            }
          `}</style>

          {/* Table Headers */}
          <div className="leaderboard-table px-4 sm:px-10 py-3 bg-[#38FFE50D] rounded-md mb-4 sm:mb-9">
            <div className="col-span-5 md:col-span-1 text-white font-semibold flex items-center gap-[96px]">
              <div className="w-8 md:w-10 flex justify-center">
                {isEnglish ? "Rank" : "التصنيف"}
              </div>
              <div className="ml-16 md:ml-20">
                {isEnglish ? "User" : "المستخدم"}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1 text-white font-semibold flex justify-center">
              {isEnglish ? "Bytes" : "البايتس"}
            </div>
            <div className="col-span-3 md:col-span-1 text-white font-semibold flex justify-center">
              {isEnglish ? "Challenges" : "التحديات"}
            </div>
            <div className="col-span-2 md:col-span-1 text-white font-semibold flex justify-center">
              {isEnglish ? "First Blood" : "البايتس الأولى"}
            </div>
          </div>

          {/* Table Rows */}
          {filteredData.map((user, index) => (
            <div
              key={index}
              className={`leaderboard-table px-4 sm:px-10 py-3 mb-3 rounded-lg ${
                index % 2 === 0 ? "bg-[#06373F]" : "bg-transparent"
              }`}
            >
              <div className="col-span-5 md:col-span-1 flex items-center  gap-[37px]">
                <div className="w-8 md:w-10 flex justify-center">
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
                      width={26}
                      height={26}
                      className="md:w-[30px] md:h-[30px]"
                    />
                  ) : (
                    <span className="text-white text-sm md:text-xl font-bold">
                      {user.rank}
                    </span>
                  )}
                </div>
                <div
                  onClick={() => router.push(`/profile/${user.username}`)}
                  className="flex items-center cursor-pointer gap-2 ml-16 md:ml-20"
                >
                  <Image
                    src={user.profileImage}
                    alt="user avatar"
                    width={30}
                    height={30}
                    className="rounded-full"
                  />
                  <span className="text-white text-sm md:text-xl font-bold truncate max-w-[100px] md:max-w-full">
                    {user.username}
                  </span>
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 flex justify-center items-center">
                <div className="flex flex-row-reverse items-center gap-1 md:gap-2">
                  <Image
                    src="/byte.png"
                    alt="flames"
                    width={20}
                    height={20}
                    className="md:w-[25px] md:h-[25px]"
                  />
                  <span className="text-white text-sm md:text-xl">
                    {user.flames}
                  </span>
                </div>
              </div>

              <div className="col-span-3 md:col-span-1 flex justify-center items-center">
                <div className="flex flex-row-reverse items-center gap-1 md:gap-2">
                  <Image
                    src="/icon-challnge.png"
                    alt="droplets"
                    width={20}
                    height={20}
                    className="md:w-[25px] md:h-[25px]"
                  />
                  <span className="text-white text-sm md:text-xl">
                    {user.droplets}
                  </span>
                </div>
              </div>

              <div className="col-span-2 md:col-span-1 flex justify-center items-center">
                <div className="flex flex-row-reverse items-center gap-1 md:gap-2">
                  <Image
                    src="/blood.png"
                    alt="notes"
                    width={20}
                    height={20}
                    className="md:w-[25px] md:h-[25px]"
                  />
                  <span className="text-white text-sm md:text-xl">
                    {user.notes}
                  </span>
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
