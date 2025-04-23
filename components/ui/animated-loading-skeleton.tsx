import React, { useEffect, useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

// Interface for text generation configuration structure
interface TextConfig {
  numLines: number; // Total number of text lines to display
  lineHeight: number; // Height of each text line
  xBase: number; // Base x-coordinate for positioning
  yBase: number; // Base y-coordinate for positioning
  yStep: number; // Vertical step between lines
  lineLengths: number[]; // Array of line length percentages
}

// Interface for highlight positions
interface HighlightPosition {
  lineIndex: number;
  startPercent: number;
  width: number;
  isActive: boolean;
  id: number;
}

const AnimatedLoadingSkeleton = () => {
  const [windowWidth, setWindowWidth] = useState(0); // State to store window width for responsiveness
  const searchControls = useAnimation(); // Controls for magnifying glass animation
  const [highlightPositions, setHighlightPositions] = useState<HighlightPosition[]>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<number | null>(null);
  const nextHighlightId = useRef(1);
  const configRef = useRef<TextConfig | null>(null);

  // Dynamically calculates text configuration based on window width
  const getTextConfig = (width: number): TextConfig => {
    const numLines = width >= 1024 ? 8 : width >= 640 ? 6 : 4; // More lines on larger screens

    // Create varying line lengths for more natural text appearance
    const lineLengths = Array(numLines)
      .fill(0)
      .map(() => {
        // Random length between 70% and 100% for most lines
        // Last line is shorter (40-70%) to look like a paragraph ending
        return Math.random() * 30 + (numLines === 8 ? 70 : 60);
      });

    // Make last line shorter
    lineLengths[numLines - 1] = Math.random() * 30 + 40;

    return {
      numLines,
      lineHeight: 16,
      xBase: 40,
      yBase: 60,
      yStep: 36,
      lineLengths,
    };
  };

  // Generate highlight positions
  const generateHighlightPositions = (config: TextConfig): HighlightPosition[] => {
    const { numLines, lineLengths } = config;
    const numHighlights = Math.min(numLines, 4); // Up to 4 highlights

    // Select random lines to highlight
    const selectedLines = Array.from({ length: numLines }, (_, i) => i)
      .sort(() => Math.random() - 0.5)
      .slice(0, numHighlights);

    return selectedLines.map((lineIndex) => {
      const lineLength = lineLengths[lineIndex];
      // Position highlight somewhere in the middle of the line
      const startPercent = Math.random() * (lineLength * 0.6) + 10; // Start between 10-70% of line length
      const width = Math.random() * 15 + 10; // Width between 10-25% of total

      return {
        lineIndex,
        startPercent,
        width,
        isActive: false,
        id: nextHighlightId.current++,
      };
    });
  };

  // Animate search and highlights
  const animateSearchAndHighlights = async () => {
    if (!configRef.current) return;

    // Generate new highlight positions
    const newHighlights = generateHighlightPositions(configRef.current);
    setHighlightPositions(newHighlights);

    // Create sequence of positions for magnifying glass
    const searchPositions = [];

    for (const highlight of newHighlights) {
      const { lineIndex, startPercent } = highlight;
      const config = configRef.current;

      // Calculate position to center the magnifying glass over the highlight
      const xPos = config.xBase + startPercent * 0.01 * window.innerWidth * 0.6;
      const yPos = config.yBase + lineIndex * config.yStep;

      searchPositions.push({
        x: xPos,
        y: yPos,
        id: highlight.id,
      });
    }

    // Shuffle the positions and add the first one at the end to loop
    searchPositions.sort(() => Math.random() - 0.5);

    // Animate the magnifying glass to each position and activate/deactivate highlights
    for (let i = 0; i < searchPositions.length; i++) {
      const position = searchPositions[i];

      // Move to position
      await searchControls.start({
        x: position.x,
        y: position.y,
        transition: { duration: 1.2, ease: "easeInOut" },
      });

      // Activate highlight
      setActiveHighlightId(position.id);

      // Wait at position
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Deactivate highlight
      setActiveHighlightId(null);

      // Small pause before moving to next highlight
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Restart animation after a brief pause
    setTimeout(() => animateSearchAndHighlights(), 500);
  };

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (windowWidth === 0) return;
    const config = getTextConfig(windowWidth);
    configRef.current = config;
    animateSearchAndHighlights();
  }, [windowWidth]);

  const frameVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
  };

  const lineVariants = {
    hidden: { width: 0, opacity: 0 },
    visible: (i: number) => ({
      width: "100%",
      opacity: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.6,
        ease: "easeInOut",
      },
    }),
  };

  const glowVariants = {
    animate: {
      boxShadow: ["0 0 20px rgba(59, 130, 246, 0.2)", "0 0 35px rgba(59, 130, 246, 0.4)", "0 0 20px rgba(59, 130, 246, 0.2)"],
      scale: [1, 1.1, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const highlightVariants = {
    inactive: {
      opacity: 0,
      transition: { duration: 0.3 },
    },
    active: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  };

  const config = configRef.current || getTextConfig(windowWidth);

  return (
    <motion.div className="w-full max-w-4xl h-full mx-auto bg-white relative overflow-hidden from-gray-50 to-gray-100" variants={frameVariants} initial="hidden" animate="visible">
      <motion.div className="absolute z-10 pointer-events-none" animate={searchControls} style={{ left: 24, top: 24 }}>
        <motion.div className="bg-blue-500/20 p-3 rounded-full backdrop-blur-sm" variants={glowVariants} animate="animate">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </motion.div>
      </motion.div>

      <div className="max-w-3xl mx-auto space-y-4">
        {[...Array(config.numLines)].map((_, i) => (
          <div key={i} className="relative overflow-hidden">
            <motion.div
              className="h-4 bg-gray-200 rounded"
              style={{ width: `${config.lineLengths[i]}%` }}
              variants={lineVariants}
              initial="hidden"
              animate={{
                width: "100%",
                opacity: 1,
                background: ["#f3f4f6", "#e5e7eb", "#f3f4f6"],
                transition: {
                  width: { delay: i * 0.15, duration: 0.6, ease: "easeInOut" },
                  opacity: { delay: i * 0.15, duration: 0.6, ease: "easeInOut" },
                  background: { duration: 1.5, repeat: Infinity },
                },
              }}
              custom={i}
            />

            {highlightPositions
              .filter((highlight) => highlight.lineIndex === i)
              .map((highlight) => (
                <motion.div
                  key={highlight.id}
                  className="absolute h-4 bg-blue-400/50 rounded"
                  style={{
                    left: `${highlight.startPercent}%`,
                    width: `${highlight.width}%`,
                    top: 0,
                  }}
                  variants={highlightVariants}
                  initial="inactive"
                  animate={activeHighlightId === highlight.id ? "active" : "inactive"}
                />
              ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AnimatedLoadingSkeleton;
