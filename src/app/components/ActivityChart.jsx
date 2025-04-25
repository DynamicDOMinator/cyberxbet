import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { motion, useAnimation } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

const ActivityChart = ({ isEnglish, bytesData }) => {
  const controls = useAnimation();
  const chartRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          controls.start("visible");
          observer.unobserve(entries[0].target);
        }
      },
      { threshold: 0.2 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, [controls]);

  // Months labels in English and Arabic
  const months = isEnglish
    ? [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ]
    : [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ];

  // Create arrays for min and max values
  const maxBytesValues = Array(12).fill(0);
  const minBytesValues = Array(12).fill(0);

  // If we have data, fill in the values from the API
  if (bytesData) {
    Object.keys(bytesData)
      .filter((key) => key !== "yearly_median" && !isNaN(parseInt(key)))
      .forEach((month) => {
        // API months are 1-based, array is 0-based
        const monthIndex = parseInt(month) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          maxBytesValues[monthIndex] = bytesData[month]?.max || 0;
          minBytesValues[monthIndex] = bytesData[month]?.min || 0;
        }
      });
  }

  // Find the exact maximum value to set the y-axis scale
  const maxValue = Math.max(...maxBytesValues, 10); // Use at least 10 as minimum
  // Round up to nearest multiple of 10 for cleaner axis
  const yAxisMax = Math.ceil(maxValue / 10) * 10;

  const data = {
    labels: months,
    datasets: [
      {
        label: isEnglish ? "Max Bytes" : "الحد الأقصى للبايتس",
        data: isVisible ? maxBytesValues : Array(12).fill(0),
        borderColor: "#38FFE5",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "#00FFDE66"); // Semi-transparent teal at top
          gradient.addColorStop(0.5, "rgba(0, 255, 222, 0.1)"); // Nearly transparent in middle
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Completely transparent at bottom
          return gradient;
        },
        fill: true,
        pointBackgroundColor: "#38FFE5",
        pointBorderColor: "#000",
        pointBorderWidth: 2,
        pointRadius: 6,
        tension: 0.3,
        borderWidth: 3,
      },
      {
        label: isEnglish ? "Min Bytes" : "الحد الأدنى للبايتس",
        data: isVisible ? minBytesValues : Array(12).fill(0),
        borderColor: "#FF9D00",
        backgroundColor: "transparent",
        fill: false,
        pointBackgroundColor: "#FF9D00",
        pointBorderColor: "#000",
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1800,
      easing: "easeOutQuart",
    },
    scales: {
      y: {
        min: 0,
        max: yAxisMax,
        position: "right",
        grid: {
          display: false,
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            size: 12,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "white",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#38FFE5",
        bodyColor: "#fff",
        callbacks: {
          label: function (context) {
            const datasetLabel = context.dataset.label || "";
            const value = context.parsed.y;
            return `${datasetLabel}: ${value}`;
          },
        },
      },
    },
  };

  const chartContainerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      ref={chartRef}
      className="w-full h-[300px] rounded-lg p-4"
      initial="hidden"
      animate={controls}
      variants={chartContainerVariants}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl pb-10 font-semibold text-white">
          {isEnglish ? "Activity Trend" : "تفاصيل الانشطة"}
        </h3>
      </div>
      <div className="h-[280px] pb-10 pt-2">
        <Line data={data} options={options} />
      </div>
    </motion.div>
  );
};

export default ActivityChart;
