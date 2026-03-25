"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BrainCircuit, Workflow, LayoutDashboard } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function FeatureHighlights() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".feature-block", {
        scrollTrigger: {
          trigger: ref.current,
          start: "top 70%",
        },
        x: -50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out"
      });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <section className="py-24 relative" ref={ref}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="feature-block glass p-8 rounded-2xl border-l-4 border-l-[var(--neon-green)]">
            <BrainCircuit className="w-10 h-10 text-[var(--neon-green)] mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">AI Engine</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[var(--neon-green)] rounded-full"/> AI Vulnerability Detection</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[var(--neon-green)] rounded-full"/> Auto Payload Generator</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[var(--neon-green)] rounded-full"/> Smart Report Generator</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[var(--neon-green)] rounded-full"/> Exploit Suggestion Engine</li>
            </ul>
          </div>

          <div className="feature-block glass p-8 rounded-2xl border-l-4 border-l-[var(--cyber-blue)]">
            <Workflow className="w-10 h-10 text-[var(--cyber-blue)] mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Automation Pipeline</h3>
            <div className="flex items-center gap-2 text-sm font-mono text-gray-300 bg-[rgba(0,0,0,0.3)] p-3 rounded mb-4 overflow-x-auto whitespace-nowrap">
              Recon &rarr; Scan &rarr; Analyze &rarr; Exploit &rarr; Report
            </div>
            <p className="text-gray-400 text-sm">
              Features async execution, smart chaining, multi-target support, and queue system.
            </p>
          </div>

          <div className="feature-block glass p-8 rounded-2xl border-l-4 border-l-white">
            <LayoutDashboard className="w-10 h-10 text-white mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Dashboard System</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full"/> Real-time Execution Logs</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full"/> CVSS Vulnerability Scoring</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full"/> Visual Analytics</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full"/> Automated Export System</li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
