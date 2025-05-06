import React, { useEffect, useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

interface LineSegment {
  width: number;
  delay: number;
}

interface LineConfig {
  segments: LineSegment[];
  delay: number;
}

// Define the number of phases and opacity increment
const NUM_PHASES = 10; // Total number of phases after initial
const OPACITY_INCREMENT = 0.05; // 5% opacity increase per phase
const PHASE_DELAY = 2000; // ms between phases

const AnimatedLoadingText = () => {
  const [windowHeight, setWindowHeight] = useState(0);
  const [lineConfigs, setLineConfigs] = useState<LineConfig[]>([]);
  const [currentPhase, setCurrentPhase] = useState(0);

  // Create animation controls for each phase
  const phaseControls = Array(NUM_PHASES)
    .fill(0)
    .map(() => useAnimation());

  const initialAnimationComplete = useRef(false);

  // Generate lines based on available height
  useEffect(() => {
    const calculateLines = () => {
      const height = window.innerHeight;
      setWindowHeight(height);

      // Determine number of lines based on height
      const lineHeight = 20; // Consistent height for all lines
      const verticalGap = 16;
      const maxVisibleHeight = height * 0.8; // Use 80% of viewport height
      const maxLines = Math.floor(maxVisibleHeight / (lineHeight + verticalGap));
      const numLines = Math.min(Math.max(8, maxLines), 15); // Between 8 and 15 lines

      // Generate configuration for each line
      const newLineConfigs = Array(numLines)
        .fill(0)
        .map((_, i) => {
          // Determine number of segments in this line (3-5 segments)
          const numSegments = Math.floor(Math.random() * 3) + 3;

          // Create segments with varying widths
          const segments: LineSegment[] = [];
          let remainingWidth = 100;

          // Reserve some space for gaps between segments
          const gapWidth = 2;
          const totalGapWidth = (numSegments - 1) * gapWidth;
          const availableWidth = 100 - totalGapWidth;

          for (let j = 0; j < numSegments; j++) {
            let width;

            // Handle special case for first and last lines
            if (i === 0 && j === 0) {
              // First segment of first line is shorter (like a title)
              width = Math.random() * 15 + 15; // 15-30%
            } else if (i === numLines - 1 && j === numSegments - 1) {
              // Last segment of last line is shortest (like paragraph end)
              width = Math.random() * 10 + 5; // 5-15%
            } else {
              // Regular segments have varying width
              const isLast = j === numSegments - 1;

              if (isLast) {
                // Last segment uses remaining width
                width = availableWidth * (remainingWidth / 100);
              } else {
                // Distribute remaining width based on number of segments left
                const segmentsLeft = numSegments - j;
                const avgSegmentWidth = (availableWidth * (remainingWidth / 100)) / segmentsLeft;

                // Add some randomness to segment width
                width = avgSegmentWidth * (0.7 + Math.random() * 0.6); // 70%-130% of average
              }
            }

            segments.push({
              width,
              delay: j * 0.1, // Each segment appears with a small delay
            });

            remainingWidth -= width;
          }

          return {
            segments,
            delay: i * 0.15, // Staggered delay for each line
          };
        });

      setLineConfigs(newLineConfigs);
    };

    calculateLines();
    window.addEventListener("resize", calculateLines);
    return () => window.removeEventListener("resize", calculateLines);
  }, []);

  // Start subsequent phases after initial animation completes
  useEffect(() => {
    if (!lineConfigs.length) return;

    // Calculate when first phase should be complete
    const lastLine = lineConfigs[lineConfigs.length - 1];
    const lastSegment = lastLine.segments[lastLine.segments.length - 1];
    const initialAnimationTime = lastLine.delay + lastSegment.delay + 0.5; // Add 0.5s buffer

    // Start the phase transitions
    const startPhaseSequence = () => {
      initialAnimationComplete.current = true;

      // Start each phase with a delay
      for (let i = 0; i < NUM_PHASES; i++) {
        setTimeout(
          () => {
            setCurrentPhase((prev) => Math.min(prev + 1, NUM_PHASES));
            phaseControls[i].start("visible");
          },
          PHASE_DELAY * (i + 1)
        ); // Increasing delays for each phase
      }
    };

    // Set timer to start phase sequence
    const timer = setTimeout(startPhaseSequence, initialAnimationTime * 1000);

    return () => clearTimeout(timer);
  }, [lineConfigs, phaseControls]);

  // Frame container animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.05,
        duration: 0.3,
      },
    },
  };

  // Line segment animation with typewriter effect
  const segmentVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: (delay: number) => ({
      width: "100%",
      opacity: 1,
      transition: {
        width: {
          duration: 0.3,
          delay: delay,
          ease: "easeInOut",
        },
        opacity: {
          duration: 0.2,
          delay: delay,
          ease: "easeIn",
        },
      },
    }),
  };

  // Additional phase segment animation variants
  const getPhaseSegmentVariants = (phaseIndex: number) => ({
    hidden: { width: 0, opacity: 0 },
    visible: (delay: number) => ({
      width: "100%",
      opacity: OPACITY_INCREMENT, // Each layer adds 5% opacity
      transition: {
        width: {
          duration: 0.25,
          delay: delay,
          ease: "easeInOut",
        },
        opacity: {
          duration: 0.2,
          delay: delay,
          ease: "easeIn",
        },
      },
    }),
  });

  // Shimmer effect for the line segments
  const shimmerVariants = {
    hidden: { backgroundPosition: "200% 0" },
    visible: {
      backgroundPosition: "-200% 0",
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "linear",
      },
    },
  };

  // Pulsating effect for the segments
  const pulseVariants = {
    hidden: { opacity: 0.3 },
    visible: {
      opacity: [0.3, 0.6, 0.3],
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut",
        times: [0, 0.5, 1],
      },
    },
  };

  const lineHeight = 20; // Same height for all lines

  // Calculate darker background colors for each phase
  const getDarkerBackground = (phaseIndex: number) => {
    // Start with light gray and progressively darken
    const startLight = 243; // #f3f4f6
    const startDark = 229; // #e5e7eb

    // Calculate how much to darken per phase (more for later phases)
    const darkFactor = 1 + phaseIndex / NUM_PHASES;

    // Darken progressively
    const lightValue = Math.max(startLight - phaseIndex * 12 * darkFactor, 100);
    const darkValue = Math.max(startDark - phaseIndex * 14 * darkFactor, 80);

    return `linear-gradient(90deg, rgb(${lightValue}, ${lightValue}, ${lightValue}), rgb(${darkValue}, ${darkValue}, ${darkValue}))`;
  };

  return (
    <motion.div className="w-full max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl h-full flex flex-col justify-center" initial="hidden" animate="visible" variants={containerVariants}>
      <div className="max-w-3xl mx-auto space-y-4 w-full">
        {lineConfigs.map((line, lineIndex) => (
          <div key={lineIndex} className="flex w-full" style={{ height: `${lineHeight}px` }}>
            {line.segments.map((segment, segmentIndex) => (
              <React.Fragment key={`${lineIndex}-${segmentIndex}`}>
                <div className="relative" style={{ width: `${segment.width}%` }}>
                  {/* Base phase segment - primary display */}
                  <motion.div
                    className="h-full rounded overflow-hidden absolute inset-0 z-0"
                    style={{
                      height: `${lineHeight}px`,
                      background: "linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%)",
                      backgroundSize: "200% 100%",
                    }}
                    variants={segmentVariants}
                    custom={line.delay + segment.delay}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div
                      className="absolute inset-0"
                      variants={shimmerVariants}
                      initial="hidden"
                      animate="visible"
                      style={{
                        background: "linear-gradient(90deg, rgba(229,231,235,0.1) 0%, rgba(229,231,235,0.3) 50%, rgba(229,231,235,0.1) 100%)",
                        backgroundSize: "200% 100%",
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gray-200"
                      variants={pulseVariants}
                      initial="hidden"
                      animate="visible"
                      style={{
                        mixBlendMode: "overlay",
                      }}
                    />
                  </motion.div>

                  {/* Additional phase overlays */}
                  {Array(NUM_PHASES)
                    .fill(0)
                    .map((_, phaseIndex) => (
                      <motion.div
                        key={phaseIndex}
                        className="h-full rounded overflow-hidden absolute inset-0"
                        style={{
                          height: `${lineHeight}px`,
                          background: getDarkerBackground(phaseIndex),
                          backgroundSize: "200% 100%",
                          pointerEvents: "none",
                          zIndex: phaseIndex + 1,
                        }}
                        variants={getPhaseSegmentVariants(phaseIndex)}
                        custom={line.delay + segment.delay + 0.1 + phaseIndex * 0.05}
                        initial="hidden"
                        animate={phaseControls[phaseIndex]}
                      >
                        {phaseIndex % 2 === 0 && (
                          <motion.div
                            className="absolute inset-0"
                            variants={shimmerVariants}
                            initial="hidden"
                            animate="visible"
                            style={{
                              background: "linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.05) 100%)",
                              backgroundSize: "200% 100%",
                              opacity: 0.7,
                            }}
                          />
                        )}
                      </motion.div>
                    ))}
                </div>
                {/* Gap between segments except after the last segment */}
                {segmentIndex < line.segments.length - 1 && <div style={{ width: "2%" }} />}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AnimatedLoadingText;
