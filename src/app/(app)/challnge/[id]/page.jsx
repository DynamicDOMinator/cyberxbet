"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Image from "next/image";
import ConfettiAnimation from "@/components/ConfettiAnimation";

export default function ChallengePage() {
  const [challenge, setChallenge] = useState(null);
  const [flags, setflags] = useState(false);
  const [flagInput, setFlagInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstBlood, setIsFirstBlood] = useState(false);
  const [isSubmitFlag, setIsSubmitFlag] = useState(false);
  const [points, setPoints] = useState(0);
  const [firstblood, setFirstblood] = useState(0);
  const [notfication, setNotfication] = useState(false);
  const [description, setDescription] = useState("");

  const { id } = useParams();

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(`${apiUrl}/challenges/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setChallenge(response.data.data);
        // console.log(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChallenge();
  }, []);

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.post(
          `${apiUrl}/check-if-solved`,
          {
            challange_uuid: id,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDescription(response.data.data.solved_flags_data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchChallenge();
  }, [id]);

  const fetchChallenge = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.get(`${apiUrl}/challenges/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChallenge(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const checkSolvedFlags = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.post(
        `${apiUrl}/check-if-solved`,
        {
          challange_uuid: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDescription(response.data.data.solved_flags_data);
    } catch (error) {
      console.error(error);
    }
  };

  const submitFlag = async () => {
    try {
      setIsLoading(true);
      setError("");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const response = await axios.post(
        `${apiUrl}/submit-challenge`,
        { solution: flagInput, challange_uuid: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "error") {
        setError(response.data.message);
        return;
      }

      // Check for solved flags after successful submission
      await checkSolvedFlags();

      if (
        response.status === 200 &&
        response.data.flag_type === "multiple_all"
      ) {
        setNotfication(true);
        setTimeout(() => {
          setNotfication(false);
        }, 5000);
      } else if (response.data.data) {
        setNotfication(false);
      }

      if (
        response.data.data &&
        response.data.data.is_first_blood !== undefined
      ) {
        if (response.data.data.is_first_blood === true) {
          setIsFirstBlood(true);
          setFirstblood(response.data.data.first_blood_points);
          setTimeout(() => {
            setIsFirstBlood(false);
          }, 5000);
        } else if (response.data.data.is_first_blood === false) {
          setIsSubmitFlag(true);
          setPoints(response.data.data.points);
          setTimeout(() => {
            setIsSubmitFlag(false);
          }, 5000);
        }
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[2000px] pt-36 mx-auto pb-5">
      {challenge?.flag_type === "multiple_individual" ? (
        challenge?.flags_data?.map((flag, index) => (
          <div key={index} className="mb-8">
            <div
              dir="rtl"
              className="grid grid-cols-1 px-10 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                <div>
                  <Image
                    src="/blood.png"
                    alt="First Blood"
                    width={32}
                    height={32}
                  />
                </div>
                <div>
                  <p>
                    البايتس <span>{flag.name}</span>
                  </p>
                  {flag.first_blood != null ? (
                    <div className="flex mt-2 items-center gap-1">
                      <Image
                        src={flag.first_blood?.profile_image || "/icon1.png"}
                        alt="First Blood"
                        width={32}
                        height={32}
                      />
                      <p className="text-white font-semibold">
                        {flag.first_blood?.user_name}
                      </p>
                    </div>
                  ) : (
                    "لا يوجد حتي الان"
                  )}
                </div>
              </div>

              <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                <div>
                  <Image
                    src="/byte.png"
                    alt="Challenge Bytes"
                    width={32}
                    height={32}
                  />
                </div>
                <div>
                  <p>
                    بايتس <span>{flag.name}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="text-white">{flag.bytes}</span>
                    بايتس
                  </p>
                </div>
              </div>

              <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
                <div>
                  <Image src="/icon20.png" alt="Hacks" width={32} height={32} />
                </div>
                <div>
                  <p>الأختراقات</p>
                  <p className="flex items-center gap-1">
                    <span className="text-white">{flag.solved_count}</span>
                    أختراق
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : challenge?.flags_data || challenge?.flag_data ? (
        <div className="mb-8">
          <div
            dir="rtl"
            className="grid grid-cols-1 px-10 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
              <div>
                <Image
                  src="/blood.png"
                  alt="First Blood"
                  width={32}
                  height={32}
                />
              </div>
              <div>
                <p>البايتس الأول</p>
                {challenge?.flags_data?.[0]?.first_blood != null ? (
                  <div className="flex mt-2 items-center gap-1">
                    <Image
                      src={
                        challenge?.flags_data?.[0]?.first_blood
                          ?.profile_image || "/icon1.png"
                      }
                      alt="First Blood"
                      width={32}
                      height={32}
                    />
                    <p className="text-white font-semibold">
                      {challenge?.flags_data?.[0]?.first_blood?.user_name}
                    </p>
                  </div>
                ) : (
                  "لا يوجد حتي الان"
                )}
              </div>
            </div>

            <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
              <div>
                <Image
                  src="/byte.png"
                  alt="Challenge Bytes"
                  width={32}
                  height={32}
                />
              </div>
              <div>
                <p>بايتس التحدي</p>
                <p className="flex items-center gap-1">
                  <span className="text-white">{challenge?.bytes}</span>
                  بايتس
                </p>
              </div>
            </div>

            <div className="bg-[#FFFFFF0D] flex items-center justify-start py-4 px-5 rounded-lg gap-4">
              <div>
                <Image src="/icon20.png" alt="Hacks" width={32} height={32} />
              </div>
              <div>
                <p>الأختراقات</p>
                <p className="flex items-center gap-1">
                  <span className="text-white">{challenge?.solved_count}</span>
                  أختراق
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        dir="rtl"
        className="pt-10 pb-5 px-5 bg-[#FFFFFF0D] rounded-lg mx-10"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src={challenge?.category_icon_url || "/challnge3.png"}
              height={32}
              width={32}
              alt={`${challenge?.title || "Challenge"} icon`}
            />
            <p className="text-lg font-semibold">{challenge?.title}</p>
          </div>
          <div>
            <p className="font-bold">بواسطة {challenge?.made_by}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-gray-300 text-[18px]">{challenge?.description}</p>
          <p className="mt-10">
            مستوى الصعوبة:{" "}
            <span className="text-red-500">{challenge?.difficulty}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-10 mt-10">
        {/* Flag Submission Section */}
        <div
          dir="rtl"
          className="bg-[#FFFFFF0D] rounded-lg p-6 flex flex-col min-h-[250px]"
        >
          <div className="flex items-center gap-4 mb-6">
            <Image src="/flag.png" alt="Flag" width={32} height={32} priority />
            <h3 className="text-lg font-semibold">تسليم العلم</h3>
          </div>
          <p className="text-sm text-gray-400">هل وجدت العلم؟ أدخله بالأسفل</p>
          {challenge?.flag_type === "multiple_all" && (
            <button
              onClick={() => {
                setflags(true);
              }}
              className="text-[#38FFE5] text-right pt-1 cursor-pointer"
            >
              see more
            </button>
          )}

          <div className="flex items-center lg:flex-row flex-col gap-4 mt-auto">
            <div className=" w-full lg:w-2/3">
              <input
                type="text"
                placeholder="العلم"
                className="bg-[#0B0D0F] w-full border border-gray-700 rounded-lg p-3 text-white"
                value={flagInput}
                onChange={(e) => setFlagInput(e.target.value)}
              />
            </div>

            <button
              onClick={submitFlag}
              disabled={isLoading}
              className="bg-[#38FFE5] w-full lg:w-1/3 py-3 cursor-pointer hover:bg-[#38FFE5]/90 text-black font-semibold px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                "تسليم"
              )}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Challenge Files Section */}
        <div
          dir="rtl"
          className="bg-[#FFFFFF0D] rounded-lg p-6 flex flex-col min-h-[250px]"
        >
          <div className="flex items-center gap-4 mb-6">
            <Image
              src="/files.png"
              alt="Files"
              width={32}
              height={32}
              priority
            />
            <h3 className="text-lg font-semibold">ملفات التحدي</h3>
          </div>
          <p className="text-sm text-gray-400">تحميل الملفات المطلوبة للتحدي</p>
          <div className="mt-auto">
            {challenge?.file ? (
              <a
                href={challenge.file}
                download
                className="lg:w-1/2 bg-transparent w-full cursor-pointer border border-[#38FFE5] hover:bg-[#38FFE5]/10 text-[#38FFE5] font-semibold py-3 rounded-lg transition-all inline-block text-center"
              >
                تحميل الملف
              </a>
            ) : (
              <button
                disabled
                className="lg:w-1/2 bg-transparent w-full cursor-not-allowed border border-gray-600 text-gray-600 font-semibold py-3 rounded-lg"
              >
                لا يوجد ملفات
              </button>
            )}
          </div>
        </div>

        {/* Challenge Link Section */}
        <div
          dir="rtl"
          className="bg-[#FFFFFF0D] rounded-lg p-6 flex flex-col min-h-[250px]"
        >
          <div className="flex items-center gap-4 mb-6">
            <Image
              src="/links.png"
              alt="Link"
              width={32}
              height={32}
              priority
            />
            <h3 className="text-lg font-semibold">
              اضغط للانتقال إلى صفحة التحدي
            </h3>
          </div>
          <p className="text-sm text-gray-400">اضغط للانتقال إلى صفحة التحدي</p>
          <div className="mt-auto">
            {challenge?.link ? (
              <button
                onClick={() => window.open(challenge.link, "_blank")}
                className="lg:w-1/2 w-full bg-transparent cursor-pointer border border-[#38FFE5] hover:bg-[#38FFE5]/10 text-[#38FFE5] font-semibold py-3 rounded-lg transition-all"
              >
                ابدأ التحدي
              </button>
            ) : (
              <button
                disabled
                className="lg:w-1/2 w-full bg-transparent cursor-not-allowed border border-gray-600 text-gray-600 font-semibold py-3 rounded-lg"
              >
                لا يوجد رابط
              </button>
            )}
          </div>
        </div>
      </div>

      {/* flag pop up  */}
      {challenge?.flag_type === "multiple_all" && flags && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            onClick={() => setflags(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div className="relative z-10 bg-[#131619] rounded-lg p-6 w-full max-w-[600px] mx-4">
            <div className="flex flex-col items-center gap-4 mb-6">
              <Image
                src="/flag.png"
                width={50}
                height={50}
                alt="flag"
                priority
              />
              <h3 className="text-xl font-semibold text-white">أعلام التحدي</h3>
              <p className="text-gray-400">الأعلام الخاصة بهذا التحدي</p>
            </div>

            {description != null ? (
              <div className="mt-6 space-y-4">
                {challenge?.flags_data?.map((flag, index) => {
                  const solvedFlag = description.find(
                    (solved) => solved.id === flag.id
                  );
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-center text-gray-400">
                          {flag.description}
                        </p>
                        {solvedFlag && (
                          <svg
                            className="w-5 h-5 text-green-500"
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {challenge?.flags_data?.map((flag, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <p className="text-center text-gray-400">
                      {flag.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setflags(false)}
                className="bg-[#38FFE5] cursor-pointer text-black font-semibold px-8 py-2 rounded-lg hover:bg-[#38FFE5]/90 transition-all"
              >
                الرجوع للخلف
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================================== */}
      {/* firt blood animation card  */}
      {isFirstBlood && (
        <div className="fixed inset-0 z-50  flex items-center justify-center ">
          <div className="flex items-center justify-center  bg-[#131619] min-w-[300px] md:min-w-[600px] min-h-[300px] rounded-lg p-4">
            <div>
              <div className="flex items-center justify-center gap-4 pb-16">
                <h3 className="text-white text-xl md:text-2xl font-semibold">
                  الدم الأول
                </h3>
                <Image
                  src="/blood.png"
                  alt="First Blood"
                  width={32}
                  height={32}
                />
              </div>

              <div>
                <p className="text-white text-xl md:text-2xl text-center font-semibold">
                  تهانينا! لقد حزت على العلم الأول
                </p>
                <p
                  dir="rtl"
                  className="text-white text-center text-xl md:text-2xl font-semibold"
                >
                  <span className="text-red-500"> {firstblood} </span>
                  <span dir="rtl" className="text-red-500">
                    بايتس{" "}
                  </span>
                  ستضاف إلي حسابك
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ================================================================================== */}
      {/* anther aimation for submit flag  */}
      {isSubmitFlag && (
        <div className="fixed inset-0 z-50  flex items-center justify-center ">
          <ConfettiAnimation />
          <div className="flex items-center justify-center  bg-[#131619] min-w-[300px] md:min-w-[600px] min-h-[300px] rounded-lg p-4">
            <div>
              <div className="flex items-center justify-center gap-4 pb-16">
                <h3 className="text-white text-xl md:text-2xl font-semibold">
                  العلم صحيح
                </h3>
                <Image
                  src="/flag.png"
                  alt="First Blood"
                  width={32}
                  height={32}
                />
              </div>

              <div>
                <p className="text-white text-xl md:text-2xl text-center font-semibold">
                  تهانينا! لقد التقط العلم
                </p>
                <p
                  dir="rtl"
                  className="text-white text-center text-xl md:text-2xl font-semibold"
                >
                  <span className="text-[#38FFE5]"> {points} </span>
                  <span dir="rtl" className="text-[#38FFE5]">
                    بايتس{" "}
                  </span>
                  ستضاف إلي حسابك
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}

      {/* notfication flag  */}

      {notfication && (
        <div className="fixed top-28 right-4 z-50">
          <div className="bg-[#131619] border border-[#38FFE5] rounded-lg p-4 shadow-lg animate-fade-in">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-white text-lg font-semibold">
                  تهانينا! لقد التقط العلم
                </h3>
              </div>
              <Image src="/flag.png" alt="Flag" width={24} height={24} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
