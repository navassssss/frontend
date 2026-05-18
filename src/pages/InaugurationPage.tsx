import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const InaugurationPage = () => {
  const [isInaugurated, setIsInaugurated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check persistence
  useEffect(() => {
    const status = localStorage.getItem('dhic_portal_inaugurated');
    if (status === 'true') {
      setIsInaugurated(true);
    }
  }, []);

  const handleInaugurate = () => {
    setIsAnimating(true);
    
    // Ceremonial loading moment
    setTimeout(() => {
      triggerConfetti();
      setIsAnimating(false);
      setIsInaugurated(true);
      localStorage.setItem('dhic_portal_inaugurated', 'true');
    }, 1500);
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    // Elegant, cinematic confetti
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#0f766e', '#f59e0b', '#14b8a6', '#fcd34d']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0f766e', '#f59e0b', '#14b8a6', '#fcd34d']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
    
    // Center burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#0f766e', '#f59e0b', '#ffffff', '#14b8a6'],
        disableForReducedMotion: true
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-background flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background ambient elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="z-10 flex flex-col items-center justify-center max-w-3xl w-full px-6 py-12 md:py-20 text-center"
      >
        {/* Institutional Identity */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 1 }}
          className="mb-12 flex flex-col items-center"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-sm border border-primary/20 backdrop-blur-sm">
            <span className="text-2xl md:text-3xl font-bold text-primary">DH</span>
          </div>
          <h2 className="text-sm md:text-base uppercase tracking-[0.2em] text-muted-foreground font-medium mb-2">
            Institutional Management System
          </h2>
          <div className="h-px w-12 bg-border mb-2" />
          <p className="text-xs md:text-sm text-muted-foreground tracking-widest uppercase">
            Darul Hasanath Islamic College
          </p>
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mb-14"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6 leading-tight">
            Official System <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
              Inauguration
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed font-light">
            Launching a smarter digital future for academic and institutional administration.
          </p>
        </motion.div>

        {/* Inaugurator Profile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-16 bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col items-center w-full max-w-sm mx-auto"
        >
          <div className="relative mb-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px] shadow-lg shadow-primary/20">
              <div className="w-full h-full rounded-full bg-card border-2 border-background flex items-center justify-center overflow-hidden">
                <span className="text-2xl font-bold text-primary/40">SAB</span>
              </div>
            </div>
            {/* Subtle glow behind avatar */}
            <div className="absolute inset-0 rounded-full bg-primary blur-xl opacity-20 -z-10"></div>
          </div>
          <h3 className="text-lg md:text-xl font-medium text-foreground mb-1">Sayyid Ali Ba'alawi Thangal</h3>
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium text-primary/80">Principal, DHIC</p>
        </motion.div>

        {/* Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="w-full flex flex-col items-center justify-center min-h-[100px]"
        >
          <AnimatePresence mode="wait">
            {!isInaugurated ? (
              <motion.div
                key="inaugurate-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                transition={{ duration: 0.5 }}
              >
                <Button
                  onClick={handleInaugurate}
                  disabled={isAnimating}
                  size="lg"
                  className="relative group overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground text-lg md:text-xl px-10 py-8 rounded-full shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  
                  {isAnimating ? (
                    <div className="flex items-center space-x-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span className="tracking-wide font-medium">Initiating Sequence...</span>
                    </div>
                  ) : (
                    <span className="flex items-center tracking-wide font-medium">
                      <Sparkles className="w-5 h-5 mr-3 opacity-80" />
                      Inaugurate System
                    </span>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-6 shadow-lg shadow-success/20 ring-1 ring-success/20">
                  <Check className="w-8 h-8" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-medium text-foreground mb-3">
                  System Inaugurated
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  DHIC Portal has officially been inaugurated.
                </p>
                <div className="mt-8 pt-8 border-t border-border/50 max-w-md w-full">
                  <p className="text-sm italic text-muted-foreground">
                    "Knowledge flourishes through organization and vision."
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default InaugurationPage;
