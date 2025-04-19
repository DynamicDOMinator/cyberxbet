"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock, FaUnlock, FaTrophy, FaTerminal } from "react-icons/fa";
import { MdSecurity } from "react-icons/md";
import { RiShieldFlashLine } from "react-icons/ri";
import styles from "./FirstBlood.module.css";

const FirstBlood = ({
  username = "h4x0r",
  challengeName = "Buffer Overflow",
  onAnimationComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const audioRef = useRef(null);

  // Static constants for positioning grid elements
  const gridElements = Array(50).fill(null);

  useEffect(() => {
    // Show the LED grid overlay first
    setShowOverlay(true);

    // Play the audio
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current
        .play()
     
    }

    // After a delay, show the main content
    const showContentTimer = setTimeout(() => {
      setShowContent(true);
    }, 1200);

    // Hide animation after total time
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 500);
      }
    }, 6500);

    return () => {
      clearTimeout(showContentTimer);
      clearTimeout(hideTimer);
    };
  }, [onAnimationComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Audio element */}
          <audio ref={audioRef} preload="auto">
            <source src="/sounds/achievement-unlock.mp3" type="audio/mpeg" />
          </audio>

          {/* Base grid without blur */}
          <div className={styles.baseGrid} />

          {/* LED elements */}
          <div className={`${styles.ledGlow} ${styles.topLeft}`} />
          <div className={`${styles.ledGlow} ${styles.topRight}`} />
          <div className={`${styles.ledGlow} ${styles.bottomRight}`} />
          <div className={`${styles.ledGlow} ${styles.bottomLeft}`} />

          {/* Radial grid overlay animation */}
          {showOverlay && (
            <div className={styles.gridOverlay}>
              {gridElements.map((_, index) => (
                <motion.div
                  key={index}
                  className={styles.gridCell}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0.5],
                    scale: [0, 1, 0.9],
                    transition: {
                      duration: 1.2,
                      delay: index * 0.01,
                      ease: "easeOut",
                    },
                  }}
                  style={{
                    left: `${(index % 10) * 10}%`,
                    top: `${Math.floor(index / 10) * 20}%`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Cyber flash effect - replacing blood splash */}
          <div className={styles.cyberFlashContainer}>
            <motion.div
              className={styles.cyberFlash}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0.2, 1, 1.5],
                transition: {
                  duration: 1.2,
                  times: [0, 0.3, 1],
                  ease: "easeOut",
                },
              }}
            />
            <motion.div
              className={styles.cyberLines}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                transition: {
                  duration: 1.5,
                  times: [0, 0.4, 1],
                },
              }}
            />
          </div>

          {/* Main content */}
          {showContent && (
            <motion.div
              className={styles.container}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                },
              }}
              exit={{
                opacity: 0,
                y: -20,
                transition: { duration: 0.3 },
              }}
            >
              <div className={styles.header}>
                <div className={styles.headerIcon}>
                  <RiShieldFlashLine />
                </div>
                <motion.div
                  className={styles.headerTitle}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      delay: 0.3,
                      duration: 0.5,
                    },
                  }}
                >
                  <h1>
                    <span className={styles.firstWord}>FIRST</span>
                    <span className={styles.secondWord}>BLOOD</span>
                  </h1>
                </motion.div>
              </div>

              <motion.div
                className={styles.achievementCard}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: {
                    delay: 0.5,
                    duration: 0.4,
                  },
                }}
              >
                <div className={styles.achievementHeader}>
                  <div className={styles.trophy}>
                    <FaTrophy />
                  </div>
                  <div className={styles.achievementTitle}>
                    <h2>{username}</h2>
                    <div className={styles.subtitle}>
                      <span>conquered</span>
                      <div className={styles.challenge}>
                        <FaLock />
                        <div className={styles.arrow} />
                        <FaUnlock />
                        <div className={styles.challengeName}>
                          {challengeName}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.achievementBody}>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>FIRST</div>
                    <div className={styles.statLabel}>to solve</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>+500</div>
                    <div className={styles.statLabel}>points</div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.statValue}>ELITE</div>
                    <div className={styles.statLabel}>status</div>
                  </div>
                </div>

                <div className={styles.terminalBox}>
                  <div className={styles.terminalHeader}>
                    <div className={styles.terminalIcon}>
                      <FaTerminal />
                    </div>
                    <div>achievement.log</div>
                  </div>
                  <div className={styles.terminalBody}>
                    <div className={styles.terminalLine}>
                      <span className={styles.prompt}>&gt;</span> First blood
                      detected
                    </div>
                    <div className={styles.terminalLine}>
                      <span className={styles.prompt}>&gt;</span> User{" "}
                      <span className={styles.highlight}>{username}</span> has
                      conquered{" "}
                      <span className={styles.highlight}>{challengeName}</span>
                    </div>
                    <div className={styles.terminalLine}>
                      <span className={styles.prompt}>&gt;</span> Achievement
                      unlocked:{" "}
                      <span className={styles.highlight}>First Blood</span>
                    </div>
                    <div className={styles.terminalLine}>
                      <span className={styles.prompt}>&gt;</span>{" "}
                      <span className={styles.cursor}></span>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className={styles.securityIcon}>
                <MdSecurity />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FirstBlood;
