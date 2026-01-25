import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ProcessingSectionProps {
  isProcessing: boolean;
}

const processingMessages = [
  "Looking at property...",
  "Talking to neighbours...",
  "Checking under the bed...",
  "Scaring off squatters...",
  "Counting the plug sockets...",
  "Testing water pressure...",
  "Checking for ghosts...",
  "Measuring cupboard space...",
  "Sniffing for damp...",
  "Judging the wallpaper...",
  "Befriending the local cat...",
  "Reviewing floor plans...",
];

const ProcessingSection = ({ isProcessing }: ProcessingSectionProps) => {
  return (
    <AnimatePresence>
      {isProcessing && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.5 }}
          className="py-16 bg-secondary/30 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-coral/10 border border-coral/20"
              >
                <Loader2 className="w-5 h-5 text-coral animate-spin" />
                <span className="text-coral font-medium">Processing your property...</span>
              </motion.div>
            </div>

            {/* Floating animated messages */}
            <div className="relative h-48 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                {processingMessages.map((message, index) => (
                  <motion.div
                    key={message}
                    initial={{ opacity: 0, y: 50, x: (index % 2 === 0 ? -1 : 1) * 100 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      y: [50, 0, -20, -50],
                      x: [
                        (index % 2 === 0 ? -1 : 1) * 100,
                        (index % 3 === 0 ? -50 : 50),
                        (index % 2 === 0 ? 30 : -30),
                        (index % 2 === 0 ? -1 : 1) * 80,
                      ],
                      scale: [0.8, 1.1, 1, 0.9],
                    }}
                    transition={{
                      duration: 6,
                      delay: index * 1.2,
                      repeat: Infinity,
                      repeatDelay: processingMessages.length * 1.2 - 6,
                      ease: "easeInOut",
                    }}
                    className="absolute"
                  >
                    <div className="px-6 py-3 rounded-2xl bg-card border border-border shadow-lg">
                      <span className="text-foreground font-medium whitespace-nowrap">
                        {message}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Decorative floating dots */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0.2, 0.6, 0.2],
                    y: [0, -30, 0],
                    x: [0, (i % 2 === 0 ? 15 : -15), 0],
                  }}
                  transition={{
                    duration: 4,
                    delay: i * 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute w-2 h-2 rounded-full bg-coral/40"
                  style={{
                    left: `${10 + i * 12}%`,
                    top: `${30 + (i % 3) * 20}%`,
                  }}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto mt-8">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 15,
                    ease: "easeInOut",
                  }}
                  className="h-full bg-gradient-to-r from-coral to-coral-dark rounded-full"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-3">
                This may take a moment...
              </p>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default ProcessingSection;
