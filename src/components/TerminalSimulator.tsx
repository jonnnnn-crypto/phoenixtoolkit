"use client";
import { useEffect, useRef } from "react";

export default function TerminalSimulator({ logs, isRunning }: { logs: string[], isRunning: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="absolute inset-0 p-6 overflow-y-auto font-mono text-sm leading-relaxed" ref={scrollRef}>
      {logs.length === 0 ? (
        <div className="text-gray-600 italic">Waiting for execution command...</div>
      ) : (
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div key={i} className={
              log.includes("[ERROR]") || log.includes("[CRITICAL]") ? "text-red-400" :
              log.includes("[VULN]") || log.includes("[FOUND]") ? "text-[var(--cyber-blue)] font-bold drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]" :
              log.includes("PORT") || log.includes("open") ? "text-[var(--neon-green)]" :
              "text-gray-300"
            }>
              {log}
            </div>
          ))}
          {isRunning && (
            <div className="text-[var(--neon-green)] animate-pulse inline-block ml-1">_</div>
          )}
        </div>
      )}
    </div>
  );
}
