import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Step = 'idle' | 'bismillah' | 'loading' | 'done';

const InaugurationPage = () => {
  const [step, setStep] = useState<Step>('idle');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  // Redirect if already inaugurated (optional, but requested previously, can be omitted if you want to test multiple times)
  useEffect(() => {
    const status = localStorage.getItem('dhic_portal_inaugurated');
    // If you strictly want persistence to hide the button, uncomment below:
    // if (status === 'true') {
    //   navigate('/');
    // }
  }, [navigate]);

  const triggerConfetti = () => {
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#0f766e', '#f59e0b', '#14b8a6', '#fcd34d']
      });
      confetti({
        particleCount: 5,
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
  };

  const handleLaunch = () => {
    setStep('bismillah');
    
    // Bismillah screen for 3 seconds
    setTimeout(() => {
      setStep('loading');
      triggerConfetti();
      
      // Loading progress 0-100 over 3.5 seconds
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 4) + 1;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          setTimeout(() => {
            setStep('done');
            localStorage.setItem('dhic_portal_inaugurated', 'true');
            // Navigate to home after a brief moment
            setTimeout(() => {
              navigate('/');
            }, 1000);
          }, 600);
        }
        setProgress(currentProgress);
      }, 80);
      
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#f3f2eb] dark:bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-6xl px-6 py-12 flex flex-col items-center min-h-screen justify-center"
          >
            {/* Top/Center content container */}
            <div className="flex flex-col lg:flex-row items-center justify-between w-full mb-16 gap-12 lg:gap-20">
              
              {/* Left Column */}
              <div className="flex-1 flex flex-col items-start text-left max-w-2xl">
                {/* Logo Area */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-white rounded-lg shadow-sm border flex items-center justify-center">
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      <span className="text-xl font-bold text-[#0f766e]">DH</span>
                      {/* Decorative elements representing logo like in screenshot */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#f59e0b] rounded-sm"></div>
                      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#14b8a6] rounded-sm"></div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-[15px] font-black text-[#1a202c] dark:text-white tracking-wider">DHIC PORTAL</h2>
                    <p className="text-[10px] text-[#0f766e] font-bold tracking-[0.2em] uppercase">Institutional Management</p>
                  </div>
                </div>

                <div className="uppercase tracking-[0.25em] text-[#0f766e] font-bold text-xs mb-5">
                  Digital Inauguration
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-[#1a202c] dark:text-white mb-6 leading-[1.1] tracking-tight">
                  Official Launching<br />Ceremony
                </h1>
                
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-lg leading-relaxed">
                  Witness the digital transformation of DHIC Portal infrastructure, officially inaugurated by:
                </p>

                {/* Inaugurator Card */}
                <div className="bg-white dark:bg-card border-l-[3px] border-l-[#0f766e] rounded-xl shadow-sm py-5 px-6 flex flex-col w-full max-w-md">
                  <h3 className="text-xl font-bold text-[#1a202c] dark:text-white">Sayyid Ali Ba'alawi Thangal</h3>
                  <p className="text-[13px] text-slate-500 font-semibold mt-1">Principal, Darul Hasanath Islamic College</p>
                </div>
              </div>

              {/* Right Column - Image Placeholder */}
              <div className="flex-1 flex justify-center lg:justify-end w-full relative">
                <div className="relative w-full max-w-[420px] aspect-[4/4.5] rounded-[2rem] overflow-hidden bg-slate-100 border-[6px] border-white dark:border-card shadow-xl flex items-center justify-center">
                  {/* Image */}
                  <img src="/principal.jpg" alt="Sayyid Ali Ba'alawi Thangal" className="w-full h-full object-cover" />
                  
                  {/* Badge */}
                  <div className="absolute bottom-6 left-6 bg-white dark:bg-card px-4 py-2 rounded-full shadow-md flex items-center gap-2">
                    <ShieldCheck className="w-[14px] h-[14px] text-[#0f766e]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1a202c] dark:text-white">Official Inaugurator</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Action Section */}
            <div className="flex flex-col items-center mt-8">
              <p className="text-[10px] font-bold tracking-[0.25em] text-slate-500 mb-5 uppercase">
                Proceed to the Digital Interface
              </p>
              
              <Button
                onClick={handleLaunch}
                className="group bg-[#14b8a6] hover:bg-[#0d9488] text-white px-14 py-8 rounded-full text-xl font-bold shadow-xl shadow-[#14b8a6]/25 transition-all hover:scale-105"
              >
                Launch Portal
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center gap-10 mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Global Access</span>
                <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Secure Encryption</span>
              </div>

              <div className="mt-20 text-[10px] uppercase font-bold tracking-widest text-slate-400/60">
                © 2026 DHIC PORTAL · DIGITAL INFRASTRUCTURE
              </div>
            </div>
          </motion.div>
        )}

        {step === 'bismillah' && (
          <motion.div
            key="bismillah"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-white dark:bg-background z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
              className="text-5xl md:text-7xl lg:text-[100px] text-[#1a202c] dark:text-white text-center px-6 leading-tight"
              style={{ fontFamily: "'Noto Naskh Arabic', 'Amiri', 'Traditional Arabic', serif" }}
              dir="rtl"
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
            </motion.div>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#f3f2eb] dark:bg-background z-50"
          >
            <div className="w-full max-w-md px-8 flex flex-col items-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0 rgba(20,184,166,0)", "0 0 20px rgba(20,184,166,0.3)", "0 0 0 rgba(20,184,166,0)"] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-10"
              >
                <span className="text-4xl font-bold text-[#0f766e]">DH</span>
              </motion.div>
              
              <h2 className="text-2xl md:text-3xl font-black text-[#1a202c] dark:text-white mb-3">DHIC Portal is Loading</h2>
              <p className="text-slate-500 font-medium tracking-wide mb-10">Preparing your digital ecosystem...</p>
              
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 mb-6 overflow-hidden relative shadow-inner">
                <motion.div 
                  className="h-full bg-[#14b8a6] rounded-full relative overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.1 }}
                >
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)', backgroundSize: '1rem 1rem' }}></div>
                </motion.div>
              </div>
              
              <div className="text-5xl font-black text-[#0f766e] tabular-nums tracking-tighter">
                {progress}%
              </div>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#14b8a6] z-50 text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <CheckCircle2 className="w-28 h-28 mb-8 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Inauguration Complete</h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InaugurationPage;
