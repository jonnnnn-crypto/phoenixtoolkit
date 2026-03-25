"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Activity } from "lucide-react";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-text", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out"
      });
      gsap.from(".hero-btn", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        stagger: 0.15,
        ease: "power3.out"
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--neon-green)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[800px] h-[400px] bg-[var(--cyber-blue)] opacity-[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 text-center z-10 flex flex-col items-center">
        <div className="hero-text inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.05)] mb-8">
          <Activity className="w-4 h-4 text-[var(--neon-green)] animate-pulse" />
          <span className="text-xs font-mono text-[var(--neon-green)] tracking-widest uppercase">System Online • Engines Running</span>
        </div>
        
        <h1 className="hero-text text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">
          Phoenix <span className="neon-text">CyberSec</span> Toolkit
        </h1>
        
        <h2 className="hero-text text-2xl md:text-3xl text-gray-300 mb-6 font-medium">
          Your Complete Cybersecurity Operating System
        </h2>
        
        <p className="hero-text text-gray-400 max-w-2xl text-lg mb-12 leading-relaxed">
          Automated reconnaissance, vulnerability detection, exploitation, and reporting — all in one unified platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <a href="/dashboard" className="hero-btn neon-border px-8 py-4 rounded-md font-semibold text-black bg-[var(--neon-green)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all">
            Launch System
          </a>
          <a href="/ai" className="hero-btn glass px-8 py-4 rounded-md font-semibold text-white hover:bg-[rgba(255,255,255,0.05)] transition-all border border-[rgba(255,255,255,0.1)]">
            Explore AI Engine
          </a>
        </div>
      </div>
    </section>
  );
}
