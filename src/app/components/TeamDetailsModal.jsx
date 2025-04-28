import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import { useUserProfile } from "@/app/context/UserProfileContext";
import { useRouter } from "next/navigation";

export default function TeamDetailsModal({
  isOpen,
  onClose,
  teamUuid,
  teamData,
}) {
  const { isEnglish } = useLanguage();
  const { getCurrentDateInUserTimezone, convertToUserTimezone } =
    useUserProfile();
  const router = useRouter();
  const [teamDetails, setTeamDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (teamUuid) {
        fetchTeamDetails();
      } else if (teamData) {
        setTeamDetails(teamData);
        setIsLoading(false);
      }
    }
  }, [isOpen, teamUuid, teamData]);

  const fetchTeamDetails = async () => {
    try {
      setIsLoading(true);
      const api = process.env.NEXT_PUBLIC_API_URL;
      const res = await axios.get(`${api}/teams/${teamUuid}`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      setTeamDetails(res.data.data);
    } catch (error) {
      console.error("Error fetching team details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div
        className="bg-[#131619] rounded-lg p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto relative z-10"
        dir={isEnglish ? "ltr" : "rtl"}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#38FFE5]"></div>
          </div>
        ) : teamDetails ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {teamDetails.icon_url ? (
                  <Image
                    src={teamDetails.icon_url}
                    alt={teamDetails.name}
                    width={60}
                    height={60}
                    className="rounded-full object-cover w-12 h-12"
                    unoptimized={true}
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-[#06373F] rounded-full">
                    <Image
                      src="/icon1.png"
                      alt="team"
                      width={40}
                      height={40}
                      className="text-[#38FFE5] text-xl"
                    />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-white">
                  {teamDetails.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#FFFFFF0D] p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Image src="/byte.png" alt="bytes" width={24} height={24} />
                  <span className="text-white font-bold">
                    {teamDetails.statistics.total_bytes}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {isEnglish ? "Total Bytes" : "إجمالي البايتس"}
                </p>
              </div>
              <div className="bg-[#FFFFFF0D] p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Image
                    src="/blood.png"
                    alt="first blood"
                    width={24}
                    height={24}
                  />
                  <span className="text-white font-bold">
                    {teamDetails.statistics.total_first_blood_count}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {isEnglish ? "First Bloods" : "البايتس الأولى"}
                </p>
              </div>
              <div className="bg-[#FFFFFF0D] p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Image
                    src="/icon-challnge.png"
                    alt="challenges"
                    width={24}
                    height={24}
                  />
                  <span className="text-white font-bold">
                    {teamDetails.statistics.total_challenges_solved}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {isEnglish ? "Challenges Solved" : "التحديات المحلولة"}
                </p>
              </div>
            </div>

            {/* Team Members */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">
                {isEnglish ? "Team Members" : "أعضاء الفريق"}
              </h3>
              <div className="space-y-4">
                {teamDetails.members.map((member) => (
                  <div
                    key={member.uuid}
                    className="bg-[#FFFFFF0D] p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {member.profile_image ? (
                          <Image
                            src={member.profile_image}
                            alt={member.username}
                            width={40}
                            height={40}
                            className="rounded-full object-cover w-10 h-10"
                            unoptimized={true}
                          />
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center bg-[#06373F] rounded-full">
                            <Image
                              src="/icon1.png"
                              alt="user"
                              width={24}
                              height={24}
                              className="text-[#38FFE5]"
                            />
                          </div>
                        )}
                        <div>
                          <p
                            className="text-white font-bold cursor-pointer hover:text-[#38FFE5] transition-colors"
                            onClick={() => {
                              router.push(`/profile/${member.username}`);
                              onClose();
                            }}
                          >
                            {member.username}
                          </p>
                          {member.role === "leader" && (
                            <p className="text-[#38FFE5] text-sm">
                              {isEnglish ? "Leader" : "قائد"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Image
                            src="/byte.png"
                            alt="bytes"
                            width={20}
                            height={20}
                          />
                          <span className="text-white">
                            {member.total_bytes}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Image
                            src="/blood.png"
                            alt="first blood"
                            width={20}
                            height={20}
                          />
                          <span className="text-white">
                            {
                              member.challenge_completions.filter(
                                (c) => c.is_first_blood
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-white">
            {isEnglish
              ? "Failed to load team details"
              : "فشل في تحميل تفاصيل الفريق"}
          </div>
        )}
      </div>
    </div>
  );
}
