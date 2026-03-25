"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Terminal } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".cta-elem", {
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out"
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section className="py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-[var(--neon-green)] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-[var(--neon-green)] opacity-[0.05] blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="cta-elem inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(34,197,94,0.1)] text-[var(--neon-green)] mb-8">
          <Terminal size={32} />
        </div>
        <h2 className="cta-elem text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Control the Attack Surface.<br/>
          <span className="text-[var(--neon-green)] drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">Master the Security Layer.</span>
        </h2>
        <p className="cta-elem text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Deploy the most comprehensive offensive security operating system and automate your entire workflow today.
        </p>
        <div className="cta-elem flex flex-col sm:flex-row justify-center gap-6">
          <a href="/dashboard" className="neon-border px-8 py-4 rounded-md font-semibold text-black bg-[var(--neon-green)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all">
            Start Platform
          </a>
          <a href="/cve" className="glass px-8 py-4 rounded-md font-semibold text-white hover:bg-[rgba(255,255,255,0.05)] transition-all border border-[rgba(255,255,255,0.1)]">
            Search CVEs
          </a>
        </div>
      </div>
    </section>
  );
}
