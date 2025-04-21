"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
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
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(
        isEnglish
          ? "File size should be less than 2MB"
          : "يجب أن يكون حجم الملف أقل من 2 ميغابايت"
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
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(
        isEnglish
          ? "Solution file size should be less than 2MB"
          : "يجب أن يكون حجم ملف الحل أقل من 2 ميغابايت"
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

      setSuccessMessage(
        isEnglish ? "Challenge created successfully!" : "تم إنشاء التحدي بنجاح!"
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
        className={`relative border border-dashed rounded-lg p-6 transition-all ${
          dragActive
            ? "border-[#38FFE5] bg-[#38FFE5]/5"
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
          <div className="text-center">
            <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-400">
              {isEnglish
                ? "Drag and drop your file here, or"
                : "اسحب وأفلت الملف هنا، أو"}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-[#38FFE5] hover:bg-[#38FFE5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#38FFE5]"
            >
              {isEnglish ? "Browse Files" : "تصفح الملفات"}
            </button>

            <div className="mt-3 flex justify-center items-center relative group">
              <FaInfoCircle className="text-[#38FFE5] h-4 w-4" />
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 bg-gray-800 text-white p-2 rounded-md text-xs shadow-lg z-10">
                {isEnglish
                  ? "Max: 2MB (.zip files only)"
                  : "الحد الأقصى: 2 ميغابايت (ملفات .zip فقط)"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <AnimatePresence mode="wait">
              {isScanning && (
                <motion.div
                  className="w-full mb-4 relative overflow-hidden"
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  key="scanning"
                >
                  {/* Document container with scanning effects */}
                  <div className="h-32 w-full bg-[#131619] rounded-md overflow-hidden relative mb-3 border border-gray-700">
                    {/* Document Preview */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                      <FaFileAlt className="text-gray-500 h-12 w-12" />
                    </div>

                    {/* Main scanning line that moves up and down */}
                    <motion.div
                      className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#38FFE5] to-transparent"
                      initial={{ top: "100%" }}
                      animate={{ top: ["100%", "0%", "100%"] }}
                      transition={{
                        duration: 3,
                        ease: "linear",
                        times: [0, 0.5, 1],
                        repeat: Infinity,
                        repeatType: "loop",
                      }}
                    />

                    {/* Horizontal scanning lines that fade in and out */}
                    <div className="absolute inset-0">
                      {Array.from({ length: 16 }).map((_, index) => (
                        <motion.div
                          key={index}
                          className={`h-[1px] w-full bg-[#38FFE5] absolute`}
                          style={{ top: `${index * 6 + 2}%` }}
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{
                            scaleX: [0, 1, 0],
                            opacity: [0, 0.3, 0],
                          }}
                          transition={{
                            duration: 2,
                            delay: index * 0.08,
                            repeat: Infinity,
                            repeatType: "loop",
                          }}
                        />
                      ))}
                    </div>

                    {/* Glowing dots that appear randomly */}
                    <div className="absolute inset-0">
                      {[...Array(8)].map((_, index) => {
                        // Pre-calculate random positions
                        const leftPos = Math.floor(Math.random() * 90 + 5);
                        const topPos = Math.floor(Math.random() * 90 + 5);

                        return (
                          <motion.div
                            key={`dot-${index}`}
                            className="absolute h-1 w-1 rounded-full bg-[#38FFE5] shadow-lg shadow-[#38FFE5]/50"
                            style={{
                              left: `${leftPos}%`,
                              top: `${topPos}%`,
                            }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0.5, 1.2, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: index * 0.2,
                              repeat: Infinity,
                              repeatType: "loop",
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <p
                    dir={isEnglish ? "ltr" : "rtl"}
                    className="text-center text-sm text-[#38FFE5]"
                  >
                    {isEnglish ? "Uploading file..." : "جاري رفع الملف ..."}
                  </p>
                </motion.div>
              )}

              {isScanComplete && (
                <motion.div
                  className="flex flex-col items-center justify-center w-full mb-4"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  key="complete"
                >
                  <div className="relative h-32 w-full bg-[#131619] rounded-md overflow-hidden border border-gray-700 flex items-center justify-center mb-3">
                    <FaFileAlt className="text-gray-500 h-10 w-10 z-10" />

                    {/* Success overlay effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-green-500/0 to-green-500/10"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.5 }}
                    />

                    {/* Background glow */}
                    <motion.div
                      className="absolute inset-0 bg-green-500/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0.5] }}
                      transition={{ duration: 1, times: [0, 0.5, 1] }}
                    />

                    {/* Success checkmark */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.3,
                        duration: 0.5,
                        type: "spring",
                      }}
                    >
                      <div className="bg-green-500/20 rounded-full p-3">
                        <BsFillFileEarmarkCheckFill className="h-10 w-10 text-green-400" />
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-center space-x-2 text-green-400">
                    <span>
                      {isEnglish
                        ? "File uploaded successfully"
                        : "تم رفع الملف بنجاح"}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between w-full bg-[#131619] rounded-md p-3">
              <div className="flex items-center space-x-3">
                <FaFileAlt className="h-10 w-10 text-[#38FFE5]" />
                <div>
                  <p className="text-sm font-medium text-white truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-400"
              >
                <FaTrash className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[1200px] mt-28 mx-auto px-4 py-8 text-right">
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
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-600 text-white px-4 py-3 rounded-md shadow-lg flex items-center max-w-md w-full mx-4"
          >
            <div className="mr-3">
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
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium" dir={isEnglish ? "ltr" : "rtl"}>
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setShowErrorNotification(false)}
              className="ml-4 text-white focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                  isEnglish ? `Flag ${index + 1}` : `العلم ${index + 1}`
                }
                dir={isEnglish ? "ltr" : "rtl"}
              />
              {flags.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFlag(flag.id)}
                  className="ml-2 p-2 bg-red-500/20 hover:bg-red-500/30 rounded-full text-red-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addFlag}
            className="mt-3 text-[#38FFE5] text-sm hover:underline flex items-center justify-center w-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            {isEnglish ? "Add another flag" : "إضافة علم آخر"}
          </button>
        </div>

        {/* Challenge File Upload */}
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

        {/* Solution File Upload */}
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

        {/* Notes Section */}
        <div className="bg-[#131619] rounded-lg p-6 mb-6">
          <div
            dir={isEnglish ? "ltr" : "rtl"}
            className="flex justify-between items-center mb-4"
          >
            <h3 className="text-white  text-lg">
              {isEnglish ? "Notes" : "الملاحظات"}
            </h3>
          </div>
          <textarea
            name="notes"
            value={challengeData.notes || ""}
            onChange={handleInputChange}
            className="w-full bg-[#131619] rounded-md px-4 py-3 text-white border border-gray-800 focus:outline-none focus:ring-1 focus:ring-[#38FFE5] min-h-[100px]"
            dir={isEnglish ? "ltr" : "rtl"}
            placeholder={isEnglish ? "Enter notes" : "أدخل الملاحظات"}
          />
        </div>

        {/* Action Buttons */}
        <div className="">
          <button
            type="submit"
            disabled={uploading}
            className={`flex items-center ${
              isEnglish ? "mr-auto" : "ml-auto"
            } px-8 py-2 rounded-md text-black font-medium transition-all ${
              uploading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-[#38FFE5] hover:bg-[#38FFE5]/90"
            }`}
          >
            {uploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
                {isEnglish ? "Creating..." : "جارٍ الإنشاء..."}
              </>
            ) : (
              <>{isEnglish ? "Create" : "انشاء"}</>
            )}
          </button>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccessMessage && successMessage && (
            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-md shadow-lg flex items-center max-w-md w-full mx-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mr-3">
                <FaCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-medium" dir={isEnglish ? "ltr" : "rtl"}>
                  {successMessage}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
