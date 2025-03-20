import React from "react";
import { Line } from "react-chartjs-2";
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

const ActivityChart = ({ isEnglish }) => {
  // Sample data - replace with your actual data
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

  const data = {
    labels: months,
    datasets: [
      {
        data: [900, 750, 850, 650, 800, 950, 700, 600, 500, 400, 350, 250],
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
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 100,
        max: 1000,
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
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#38FFE5",
        bodyColor: "#fff",
      },
    },
  };

  return (
    <div className="w-full h-[300px]  rounded-lg p-4 ">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl pb-10 font-semibold text-white">
          {isEnglish ? "Activity Trend" : "تفاصيل الانشطة"}
        </h3>
      </div>
      <div className="h-[250px] pb-10">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default ActivityChart;
