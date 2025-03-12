"use client";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

export default function AOSInit() {
  useEffect(() => {
    AOS.init({
      duration: 600,
      once: true,
      offset: 50,
      delay: 0,
      mirror: false,
      disable: false,
    });
  }, []);

  return null;
}
