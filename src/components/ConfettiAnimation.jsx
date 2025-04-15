import { useEffect, useState } from "react";
import Confetti from "react-confetti";

const ConfettiAnimation = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Confetti
      width={windowSize.width}
      height={windowSize.height}
      recycle={true}
      numberOfPieces={50}
      gravity={0.2}
      wind={0.01}
      colors={["#38FFE5", "#00ff9f", "#00b8ff", "#ff00ff"]}
      style={{ position: "fixed", top: 0, left: 0, zIndex: 40 }}
    />
  );
};

export default ConfettiAnimation;
