"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  FaUpload,
  FaTrash,
  FaFileAlt,
  FaCheck,
  FaInfoCircle,
} from "react-icons/fa";
import { BsFillFileEarmarkCheckFill } from "react-icons/bs";
import axios from "axios";
import Cookies from "js-cookie";

export default function AddChallenge() {
  const { isEnglish } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    approved: 0,
    declined: 0,
    under_review: 0,
    pending: 0,
  });
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [challengeData, setChallengeData] = useState({
    title: "",
    category: "",
    description: "",
    points: "",
    difficulty: "medium",
    file: null,
  });
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedSolutionFile, setUploadedSolutionFile] = useState(null);
  const [fileScanning, setFileScanning] = useState(false);
  const [fileScanComplete, setFileScanComplete] = useState(false);
  const [solutionFileScanning, setSolutionFileScanning] = useState(false);
  const [solutionFileScanComplete, setSolutionFileScanComplete] =
    useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [flags, setFlags] = useState([{ id: 1, value: "" }]);
  const fileInputRef = useRef(null);
  const solutionFileInputRef = useRef(null);

  // Reset error notification after a delay
  React.useEffect(() => {
    if (errorMessage) {
      setShowErrorNotification(true);
      const timer = setTimeout(() => {
        setShowErrorNotification(false);
        setTimeout(() => {
          setErrorMessage("");
        }, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Reset success message after a delay
  React.useEffect(() => {
    if (successMessage) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        setTimeout(() => {
          setSuccessMessage("");
        }, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(`${apiUrl}/challenge-categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.status === "success") {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      setStatisticsLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const token = Cookies.get("token");
        const response = await axios.get(
          `${apiUrl}/user-challenges/statistics`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data && response.data.status === "success") {
          setStatistics(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setStatisticsLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChallengeData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle flag input changes
  const handleFlagChange = (id, value) => {
    setFlags(flags.map((flag) => (flag.id === id ? { ...flag, value } : flag)));
  };

  // Add new flag input
  const addFlag = () => {
    const newId =
      flags.length > 0 ? Math.max(...flags.map((flag) => flag.id)) + 1 : 1;
    setFlags([...flags, { id: newId, value: "" }]);
  };

  // Remove flag input
  const removeFlag = (id) => {
    if (flags.length > 1) {
      setFlags(flags.filter((flag) => flag.id !== id));
    }
  };

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process the file
  const handleFile = (file) => {
    // Check file size (max 200MB)
    if (file.size > 200 * 1024 * 1024) {
      setErrorMessage(
        isEnglish
          ? "File size should be less than 200MB"
          : "يجب أن يكون حجم الملف أقل من 200 ميغابايت"
      );
      return;
    }

    // Check file type (only .zip allowed)
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension !== "zip") {
      setErrorMessage(
        isEnglish ? "Only .zip files are allowed" : "يُسمح فقط بملفات .zip"
      );
      return;
    }

    setUploadedFile(file);
    simulateFileScan(file);
  };

  // Simulate file scanning
  const simulateFileScan = (file) => {
    setFileScanning(true);
    setFileScanComplete(false);

    // Simulate uploading process
    setTimeout(() => {
      setFileScanning(false);
      setFileScanComplete(true);
    }, 3000);
  };

  // Remove uploaded file
  const removeFile = () => {
    setUploadedFile(null);
    setFileScanning(false);
    setFileScanComplete(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Process the solution file
  const handleSolutionFile = (file) => {
    // Check file size (max 200MB)
    if (file.size > 200 * 1024 * 1024) {
      setErrorMessage(
        isEnglish
          ? "Solution file size should be less than 200MB"
          : "يجب أن يكون حجم ملف الحل أقل من 200 ميغابايت"
      );
      return;
    }

    // Check file type (only .zip allowed)
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (fileExtension !== "zip") {
      setErrorMessage(
        isEnglish ? "Only .zip files are allowed" : "يُسمح فقط بملفات .zip"
      );
      return;
    }

    setUploadedSolutionFile(file);
    simulateSolutionFileScan(file);
  };

  // Simulate solution file scanning
  const simulateSolutionFileScan = (file) => {
    setSolutionFileScanning(true);
    setSolutionFileScanComplete(false);

    // Simulate uploading process
    setTimeout(() => {
      setSolutionFileScanning(false);
      setSolutionFileScanComplete(true);
    }, 3000);
  };

  // Remove uploaded solution file
  const removeSolutionFile = () => {
    setUploadedSolutionFile(null);
    setSolutionFileScanning(false);
    setSolutionFileScanComplete(false);

    if (solutionFileInputRef.current) {
      solutionFileInputRef.current.value = "";
    }
  };

  // Handle solution file input change
  const handleSolutionFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSolutionFile(e.target.files[0]);
    }
  };

  // Handle solution file drop
  const handleSolutionFileDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSolutionFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate required fields
    if (!challengeData.title.trim()) {
      setErrorMessage(
        isEnglish ? "Please enter a challenge name" : "يرجى إدخال اسم التحدي"
      );
      return;
    }

    if (!challengeData.description.trim()) {
      setErrorMessage(
        isEnglish ? "Please enter a description" : "يرجى إدخال وصف التحدي"
      );
      return;
    }

    if (!challengeData.category) {
      setErrorMessage(
        isEnglish ? "Please select a category" : "يرجى اختيار تصنيف للتحدي"
      );
      return;
    }

    // Validate challenge file
    if (!uploadedFile) {
      setErrorMessage(
        isEnglish ? "Please upload a challenge file" : "يرجى تحميل ملف التحدي"
      );
      return;
    }

    // Validate solution file
    if (!uploadedSolutionFile) {
      setErrorMessage(
        isEnglish ? "Please upload a solution file" : "يرجى تحميل ملف الحل"
      );
      return;
    }

    // Validate flags
    if (flags.every((flag) => !flag.value.trim())) {
      setErrorMessage(
        isEnglish
          ? "Please enter at least one flag"
          : "يرجى إدخال علم واحد على الأقل"
      );
      return;
    }

    // Wait for file uploads to complete
    if (fileScanning || solutionFileScanning) {
      setErrorMessage(
        isEnglish
          ? "Please wait for file uploads to complete"
          : "يرجى انتظار اكتمال تحميل الملفات"
      );
      return;
    }

    setUploading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = Cookies.get("token");
      const formData = new FormData();

      // Map form field names to API field names
      formData.append("name", challengeData.title);
      formData.append("description", challengeData.description);
      formData.append("category_uuid", challengeData.category);
      formData.append("difficulty", challengeData.difficulty);

      // Append flags as an array
      flags.forEach((flag, index) => {
        if (flag.value.trim()) {
          formData.append(`flag[${index}]`, flag.value);
        }
      });

      // Append the files
      formData.append("challange_file", uploadedFile);
      formData.append("answer_file", uploadedSolutionFile);

      // Append notes if available
      if (challengeData.notes) {
        formData.append("notes", challengeData.notes);
      }

      // Send request to server
      const response = await axios.post(`${apiUrl}/user-challenges`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.status === "success") {
        setSuccessMessage(
          isEnglish
            ? "Challenge created successfully!"
            : "تم إنشاء التحدي بنجاح!"
        );
        setShowSuccessMessage(true);

        // Reset form
        setChallengeData({
          title: "",
          category: "",
          description: "",
          points: "",
          difficulty: "medium",
          notes: "",
        });
        setUploadedFile(null);
        setFileScanComplete(false);
        setUploadedSolutionFile(null);
        setSolutionFileScanComplete(false);
        setFlags([{ id: 1, value: "" }]);
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
      setErrorMessage(
        error.response?.data?.message ||
          (isEnglish ? "Failed to create challenge" : "فشل في إنشاء التحدي")
      );
    } finally {
      setUploading(false);
    }
  };

  // Form field label style
  const labelStyle = `text-[#BCC9DB] font-medium `;

  const inputStyle =
    "w-full bg-[#0B0D0F] rounded-md mt-4 px-4 py-3 text-white  focus:outline-none focus:ring-1 focus:ring-[#38FFE5]";

  // Helper function to render the file upload area
  const renderFileUpload = (
    isUploaded,
    file,
    isScanning,
    isScanComplete,
    inputRef,
    handleChange,
    handleDrop,
    handleRemove,
    title
  ) => (
    <div className="bg-[#131619] rounded-lg p-6 mb-6">
      <div
        dir={isEnglish ? "ltr" : "rtl"}
        className="flex justify-between items-center mb-4"
      >
        <h3 className="text-white text-lg">
          {isEnglish
            ? title
            : title === "Challenge File"
            ? "ملف التحدي"
            : "ملف الحلول"}
        </h3>
      </div>
      <div
        className={`relative rounded-lg transition-all ${
          dragActive
            ? "border-[#38FFE5] bg-[#131619]"
            : "border-gray-600 hover:border-gray-500"
        } ${isUploaded ? "bg-[#131619]" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={handleChange}
          className="hidden"
        />

        {!isUploaded ? (
          <div
            dir={isEnglish ? "ltr" : "rtl"}
            className="text-center bg-[#0B0D0F] py-12 rounded-lg gap-2 flex justify-center items-center "
          >
            <p className="mt-2 text-sm text-gray-400">
              {isEnglish
                ? "Drag and drop your file here, or"
                : "اسحب وأفلت الملف هنا، أو"}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2 text-[#38FFE5] font-semibold cursor-pointer"
            >
              {isEnglish ? "Browse " : "تصفح "}
            </button>
          </div>
        ) : (
          <div className="bg-[#0B0D0F] py-6 rounded-lg">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center">
                <div className="mr-3">
                  {isScanning ? (
                    <div className="w-6 h-6 border-2 border-[#38FFE5] border-t-transparent rounded-full animate-spin"></div>
                  ) : isScanComplete ? (
                    <BsFillFileEarmarkCheckFill className="text-[#38FFE5] h-6 w-6" />
                  ) : (
                    <FaFileAlt className="text-gray-400 h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-gray-400  ">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div>
                {isScanning ? (
                  <p
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="text-gray-400 text-sm"
                  >
                    {isEnglish ? "Uploading..." : "جاري التحميل..."}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="p-2 text-red-400 hover:text-red-300 focus:outline-none"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[2000px] mt-28 mx-auto">
      {/* Statistics Section */}
      <div className="bg-[#0B0D0F] px-4 py-6 rounded-lg mb-8">
        <h2
          dir={isEnglish ? "ltr" : "rtl"}
          className="text-white mb-6 font-bold text-xl"
        >
          {isEnglish ? "Your Challenges" : "تحدياتك"}
        </h2>

        <div
          dir={isEnglish ? "ltr" : "rtl"}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-b-2 border-[#06373F] pb-10"
        >
          {/* Total Challenges */}
          <div className="bg-[#131619] rounded-lg p-4 relative overflow-hidden">
            <div className="flex items-center gap-1 ">
              <Image
                src="/uploaded.png"
                alt="Total Challenges"
                width={24}
                height={24}
              />
              <h3 className="text-gray-400 text-sm mb-2">
                {isEnglish ? "Total Challenges" : "جميع التحديات"}
              </h3>
            </div>

            <p className="text-white text-center text-4xl font-bold">
              {statisticsLoading ? "..." : statistics.total}
            </p>
            <p className="text-[#41C300] text-center   mt-2">
              {isEnglish
                ? "All challenges you've created"
                : "جميع التحديات التي قمت بها"}
            </p>
          </div>

          {/* Under Review */}
          <div className="bg-[#131619] rounded-lg p-4 relative overflow-hidden">
            <div className="flex items-center gap-1 ">
              <Image
                src="/wating.png"
                alt="Under Review"
                width={24}
                height={24}
              />
              <h3 className="text-gray-400 text-sm mb-2">
                {isEnglish ? "Under Review" : "تحت المراجعة"}
              </h3>
            </div>

            <p className="text-white text-center text-4xl font-bold">
              {statisticsLoading ? "..." : statistics.under_review}
            </p>
            <p className="text-[#0081D9] text-center   mt-2">
              {isEnglish ? "In review" : "قيد المراجعة"}
            </p>
          </div>

          {/* Approved Challenges */}
          <div className="bg-[#131619] rounded-lg p-4 relative overflow-hidden">
            <div className="flex items-center gap-1 ">
              <Image
                src="/reviewing.png"
                alt="Approved Challenges"
                width={24}
                height={24}
              />
              <h3 className="text-gray-400 text-sm mb-2">
                {isEnglish ? "Approved Challenges" : "التحديات المعتمدة"}
              </h3>
            </div>

            <p className="text-white text-center text-4xl font-bold">
              {statisticsLoading ? "..." : statistics.approved}
            </p>
            <p className="text-[#EC007E] text-center   mt-2">
              {isEnglish ? "Approved challenges" : "التحديات المعتمدة"}
            </p>
          </div>

          {/* Rejected Challenges */}
          <div className="bg-[#131619] rounded-lg p-4 relative overflow-hidden">
            <div className="flex items-center gap-1 ">
              <Image
                src="/rejected.png"
                alt="Rejected Challenges"
                width={24}
                height={24}
              />
              <h3 className="text-gray-400 text-sm mb-2">
                {isEnglish ? "Rejected Challenges" : "التحديات المرفوضة"}
              </h3>
            </div>

            <p className="text-white text-center text-4xl font-bold">
              {statisticsLoading ? "..." : statistics.declined}
            </p>
            <p className="text-[#D30E00] text-center   mt-2">
              {isEnglish
                ? "Challenges need to be modified"
                : "تحديات تحتاج إلى تعديل"}
            </p>
          </div>
        </div>
      </div>

      {/* Challenges List Section */}
      <div className="bg-[#0B0D0F] px-4 py-6 rounded-lg mb-8">
        <div
          dir={isEnglish ? "ltr" : "rtl"}
          className="flex flex-col   items-start mb-6 gap-4"
        >
          <div className="flex items-center gap-5 pb-2">
            <button className="text-white border-b-2 border-[#38FFE5]  py-1 whitespace-nowrap">
              {isEnglish ? "All" : "الكل"}
            </button>
            <button className="text-white px-2 py-1 whitespace-nowrap">
              {isEnglish ? "Pending" : "المعلقة"}
            </button>
            <button className="text-white px-2 py-1 whitespace-nowrap">
              {isEnglish ? "Under Review" : "تحت المراجعة"}
            </button>
            <button className="text-white px-2 py-1 whitespace-nowrap">
              {isEnglish ? "Approved" : "المقبولة"}
            </button>
            <button className="text-white px-2 py-1 whitespace-nowrap">
              {isEnglish ? "Rejected" : "المرفوضة"}
            </button>
          </div>
          <div className="relative w-full border-b-2 border-[#06373F] md:w-auto md:min-w-[300px] mt-7">
            <input
              type="text"
              placeholder={isEnglish ? "Challenge name" : "اسم التحدي"}
              className="bg-transparent text-white px-4 py-2 rounded-md pr-10 rtl:pl-10 w-full focus:outline-none focus:ring-1 focus:ring-[#38FFE5]"
              dir={isEnglish ? "ltr" : "rtl"}
            />
            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className="absolute inset-y-0 right-0  flex items-center pr-3 rtl:pl-3"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10">
          {/* Challenge Card 1 */}
          <div className="bg-[#131619] rounded-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 flex flex-col h-full">
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="flex gap-2 items-center mb-4"
              >
                <Image
                  src="/uploaded.png"
                  alt="Total Challenges"
                  width={32}
                  height={32}
                />
                <p className="font-bold text-white">R$4c3rT</p>
              </div>
              <p className="text-gray-300 text-sm flex-grow">
                Sometimes RSA certificates are breakable
              </p>
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="flex justify-between items-center mt-4"
              >
                <div className="flex items-center">
                  <span className=" text-gray-400">
                    {isEnglish ? "Difficulty level" : "مستوى الصعوبة"}:{" "}
                  </span>
                  <span className=" text-yellow-500 ml-1 rtl:mr-1">
                    {isEnglish ? "Medium" : "متوسط"}
                  </span>
                </div>
                <span className="text-pink-500 ">
                  {isEnglish ? "Under review" : "قيد المراجعة"}
                </span>
              </div>
            </div>
          </div>

          {/* Challenge Card 2 */}
          <div className="bg-[#131619] rounded-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 flex flex-col h-full">
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="flex gap-2 items-center mb-4"
              >
                <Image
                  src="/uploaded.png"
                  alt="Total Challenges"
                  width={32}
                  height={32}
                />
                <p className="font-bold text-white">scray</p>
              </div>
              <p className="text-gray-300 text-sm flex-grow">
                participants will encounter an audio file containing a hidden
                flag. They must carefully analyze the file to uncover the hidden
                message. Use your skills to explore this challenge!
              </p>
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="flex justify-between items-center mt-4"
              >
                <div className="flex items-center">
                  <span className="  text-gray-400">
                    {isEnglish ? "Difficulty level" : "مستوى الصعوبة"}:{" "}
                  </span>
                  <span className="  text-blue-400 ml-1 rtl:mr-1">
                    {isEnglish ? "Easy" : "سهل"}
                  </span>
                </div>
                <span className="text-red-500  ">
                  {isEnglish ? "Rejected" : "مرفوض"}
                </span>
              </div>
            </div>
          </div>

          {/* Challenge Card 3 */}
          <div className="bg-[#131619] rounded-lg overflow-hidden flex flex-col h-full">
            <div className="p-4 flex flex-col h-full">
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="flex gap-2 items-center mb-4"
              >
                <Image
                  src="/uploaded.png"
                  alt="Total Challenges"
                  width={32}
                  height={32}
                />
                <p className="font-bold text-white">Quest</p>
              </div>
              <p className="text-gray-300 text-sm flex-grow">
                Test your skills in this dynamic web application challenge.
                Analyze, adapt, and conquer!
              </p>
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className="flex justify-between items-center mt-4"
              >
                <div className="flex items-center">
                  <span className="  text-gray-400">
                    {isEnglish ? "Difficulty level" : "مستوى الصعوبة"}:{" "}
                  </span>
                  <span className="  text-red-500 ml-1 rtl:mr-1">
                    {isEnglish ? "Very Hard" : "صعب جدا"}
                  </span>
                </div>
                <span className="text-green-500  ">
                  {isEnglish ? "Approved" : "مقبول"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-8 text-right">
        <h1
          className={`text-white text-xl mb-6 font-bold ${
            isEnglish ? "text-left" : "text-right"
          }`}
        >
          {isEnglish ? "Add Challenge" : "إضافة تحدي"}
        </h1>

        {/* Error Notification */}
        <AnimatePresence>
          {showErrorNotification && errorMessage && (
            <div className="w-full h-full fixed inset-0 z-50">
              <div className="absolute bottom-4 right-4 w-fit z-50">
                <div className="bg-[#131619] border border-red-500 rounded-lg p-4 shadow-lg slide-in-animation">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3
                        className="text-white text-lg font-semibold"
                        dir={isEnglish ? "ltr" : "rtl"}
                      >
                        {errorMessage}
                      </h3>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Success Notification */}
        <AnimatePresence>
          {showSuccessMessage && successMessage && (
            <div className="w-full h-full fixed inset-0 z-50">
              <div className="absolute bottom-4 right-4 w-fit z-50">
                <div className="bg-[#131619] border border-[#38FFE5] rounded-lg p-4 shadow-lg slide-in-animation">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3
                        className="text-white text-lg font-semibold"
                        dir={isEnglish ? "ltr" : "rtl"}
                      >
                        {successMessage}
                      </h3>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-[#38FFE5]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        <style jsx global>{`
          @keyframes slideInFromLeft {
            0% {
              transform: translateX(100%);
              opacity: 0;
            }
            100% {
              transform: translateX(0);
              opacity: 1;
            }
          }

          .slide-in-animation {
            animation: slideInFromLeft 0.5s ease-out forwards;
          }
        `}</style>

        <form onSubmit={handleSubmit} className="w-full">
          {/* Main Challenge Details */}
          <div className="bg-[#131619] rounded-lg p-6 mb-6">
            <div className="mb-4 ">
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className=" flex justify-start"
              >
                <label className={labelStyle}>
                  {isEnglish ? "Challenge Name" : "اسم التحدي"}
                </label>
              </div>

              <input
                type="text"
                name="title"
                value={challengeData.title}
                onChange={handleInputChange}
                className={inputStyle}
                dir={isEnglish ? "ltr" : "rtl"}
                placeholder={
                  isEnglish ? "Enter challenge name" : "أدخل اسم التحدي"
                }
              />
            </div>

            {/* Description Section */}

            <div className="mb-2">
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className=" flex justify-start"
              >
                <label className={labelStyle}>
                  {isEnglish ? "Description" : "الوصف"}
                </label>
              </div>
              <textarea
                name="description"
                value={challengeData.description}
                onChange={handleInputChange}
                className="w-full bg-[#0B0D0F] rounded-md px-4 py-3 text-white mt-4 focus:outline-none focus:ring-1 focus:ring-[#38FFE5] min-h-[120px]"
                dir={isEnglish ? "ltr" : "rtl"}
                placeholder={isEnglish ? "Enter description" : "أدخل الوصف"}
              />
            </div>

            {/* Classification */}

            <div className="mb-2">
              <div
                dir={isEnglish ? "ltr" : "rtl"}
                className=" flex justify-start"
              >
                <label className={labelStyle}>
                  {isEnglish ? "Classification" : "التصنيف"}
                </label>
              </div>
              <div className="relative">
                <select
                  name="category"
                  value={challengeData.category}
                  onChange={handleInputChange}
                  className={`${inputStyle} appearance-none pr-10`}
                  dir={isEnglish ? "ltr" : "rtl"}
                  disabled={categoriesLoading}
                >
                  <option value="" disabled>
                    {isEnglish ? "Select classification" : "اختر التصنيف"}
                  </option>
                  {categories && categories.length > 0 ? (
                    categories.map((category) => (
                      <option key={category.uuid} value={category.uuid}>
                        {category.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="" disabled>
                        {categoriesLoading
                          ? isEnglish
                            ? "Loading categories..."
                            : "جاري تحميل التصنيفات..."
                          : isEnglish
                          ? "No categories available"
                          : "لا توجد تصنيفات متاحة"}
                      </option>
                    </>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Difficulty Section */}
            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className="mb-2 pt-4 flex justify-between items-center"
            >
              <h3 className="text-white text-lg">
                {isEnglish ? "Difficulty" : "الصعوبة"}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 place-items-center md:gap-0 lg:px-32  gap-4 mt-2 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="very_hard"
                  checked={challengeData.difficulty === "very_hard"}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 border rounded-full transition-colors ${
                    challengeData.difficulty === "very_hard"
                      ? "bg-[#38FFE5] border-[#38FFE5]"
                      : "border-gray-600 bg-transparent"
                  }`}
                >
                  {challengeData.difficulty === "very_hard" && (
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                  )}
                </span>
                <span className="text-gray-300">
                  {isEnglish ? "Very Hard" : "صعب جدا"}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="hard"
                  checked={challengeData.difficulty === "hard"}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 border rounded-full transition-colors ${
                    challengeData.difficulty === "hard"
                      ? "bg-[#38FFE5] border-[#38FFE5]"
                      : "border-gray-600 bg-transparent"
                  }`}
                >
                  {challengeData.difficulty === "hard" && (
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                  )}
                </span>
                <span className="text-gray-300">
                  {isEnglish ? "Hard" : "صعب"}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="medium"
                  checked={challengeData.difficulty === "medium"}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 border rounded-full transition-colors ${
                    challengeData.difficulty === "medium"
                      ? "bg-[#38FFE5] border-[#38FFE5]"
                      : "border-gray-600 bg-transparent"
                  }`}
                >
                  {challengeData.difficulty === "medium" && (
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                  )}
                </span>
                <span className="text-gray-300">
                  {isEnglish ? "Medium" : "متوسط"}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="difficulty"
                  value="easy"
                  checked={challengeData.difficulty === "easy"}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 border rounded-full transition-colors ${
                    challengeData.difficulty === "easy"
                      ? "bg-[#38FFE5] border-[#38FFE5]"
                      : "border-gray-600 bg-transparent"
                  }`}
                >
                  {challengeData.difficulty === "easy" && (
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                  )}
                </span>
                <span className="text-gray-300">
                  {isEnglish ? "Easy" : "سهل"}
                </span>
              </label>
            </div>
          </div>

          {/* Flag Section */}
          <div className="bg-[#131619] rounded-lg p-6 mb-6">
            <div
              dir={isEnglish ? "ltr" : "rtl"}
              className="flex justify-between items-center mb-4"
            >
              <h3 className="text-white text-lg">
                {isEnglish ? "Flags" : "الأعلام"}
              </h3>
            </div>

            {flags.map((flag, index) => (
              <div key={flag.id} className="mb-3 flex items-center">
                <input
                  type="text"
                  value={flag.value}
                  onChange={(e) => handleFlagChange(flag.id, e.target.value)}
                  className={`${inputStyle} flex-grow`}
                  placeholder={
                    isEnglish
                      ? `Enter flag ${index + 1}`
                      : `أدخل العلم ${index + 1}`
                  }
                />
                {flags.length > 1 && index > 0 ? (
                  <button
                    type="button"
                    onClick={() => removeFlag(flag.id)}
                    className="p-2 text-red-400 hover:text-red-300 focus:outline-none"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                ) : (
                  <div className="w-10"></div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addFlag}
              className="mt-3 text-black cursor-pointer px-4 py-2 bg-[#38FFE5] rounded-md hover:bg-[#2de0c8] focus:outline-none"
            >
              {isEnglish ? "Add Flag" : "إضافة علم"}
            </button>
          </div>

          {/* File Uploads */}
          {renderFileUpload(
            uploadedFile,
            uploadedFile,
            fileScanning,
            fileScanComplete,
            fileInputRef,
            handleFileChange,
            handleDrop,
            removeFile,
            "Challenge File"
          )}
          {renderFileUpload(
            uploadedSolutionFile,
            uploadedSolutionFile,
            solutionFileScanning,
            solutionFileScanComplete,
            solutionFileInputRef,
            handleSolutionFileChange,
            handleSolutionFileDrop,
            removeSolutionFile,
            "Solution File"
          )}

          {/* Notes/Remarks Section */}
          <div className="bg-[#131619] rounded-lg p-6 mb-6">
            <div dir={isEnglish ? "ltr" : "rtl"} className="flex justify-start">
              <label className={labelStyle}>
                {isEnglish ? "Notes" : "الملاحظات"}
              </label>
            </div>
            <textarea
              name="notes"
              value={challengeData.notes || ""}
              onChange={handleInputChange}
              className="w-full bg-[#0B0D0F] rounded-md px-4 py-3 text-white mt-4 focus:outline-none focus:ring-1 focus:ring-[#38FFE5] min-h-[120px]"
              dir={isEnglish ? "ltr" : "rtl"}
              placeholder={
                isEnglish
                  ? "Enter any additional notes"
                  : "أدخل أي ملاحظات إضافية"
              }
            />
          </div>

          {/* Submit Button */}
          <div dir={isEnglish ? "ltr" : "rtl"}>
            <button
              type="submit"
              disabled={uploading}
              className="mt-6 text-black px-7 cursor-pointer py-2 bg-[#38FFE5] rounded-md hover:bg-[#2de0c8] focus:outline-none flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin  h-5 w-5 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                 
                </>
              ) : (
                <>{isEnglish ? "Create" : "إنشاء"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
