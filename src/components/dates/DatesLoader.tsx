"use client";

import { useState, useEffect } from "react";

const STEPS = [
  { label: "Connecting" },
  { label: "Fetching your votes" },
  { label: "Checking the group" },
  { label: "Finding best dates" },
];

function FlippingCalendar({ currentStep }: { currentStep: number }) {
  const dates = ["8", "9", "10", "11"];
  const dateIdx = Math.min(currentStep, dates.length - 1);

  return (
    <div style={{
      position: "relative",
      width: 68, height: 68,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Pulsing rings */}
      <div style={{
        position: "absolute",
        width: 56, height: 56, borderRadius: 18,
        background: "rgba(255,107,53,0.08)",
        animation: "pulseRing 2s ease-out infinite",
      }} />
      <div style={{
        position: "absolute",
        width: 56, height: 56, borderRadius: 18,
        background: "rgba(255,107,53,0.08)",
        animation: "pulseRing 2s ease-out 1s infinite",
      }} />

      {/* Calendar card */}
      <div style={{
        position: "relative",
        width: 52, height: 56,
        borderRadius: 12,
        background: "linear-gradient(135deg, #fff, #FEFCF9)",
        border: "1.5px solid rgba(255,107,53,0.12)",
        boxShadow: "0 4px 14px rgba(255,107,53,0.18)",
        overflow: "hidden",
        zIndex: 1,
      }}>
        {/* Top bar (month) */}
        <div style={{
          height: 16,
          background: "linear-gradient(135deg, var(--tb-orange), var(--tb-orange-light))",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>APR</span>
        </div>
        {/* Date number with flip animation */}
        <div
          key={dateIdx}
          style={{
            height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            animation: "pageFlip 0.6s ease-in-out",
          }}>
          <span style={{
            fontSize: 22, fontWeight: 800, color: "var(--tb-text)",
            fontFamily: "var(--font-playfair)",
          }}>{dates[dateIdx]}</span>
        </div>
      </div>
    </div>
  );
}

function ProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {STEPS.map((step, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        const isPending = i > currentStep;

        return (
          <div
            key={step.label}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              opacity: isPending ? 0.4 : 1,
              transition: "opacity 0.3s ease",
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: isDone ? "#10B981" : isActive ? "rgba(255,107,53,0.08)" : "rgba(0,0,0,0.04)",
              border: isActive ? "1.5px solid var(--tb-orange)" : "1.5px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.3s ease",
            }}>
              {isDone ? (
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ animation: "stepCheck 0.35s ease-out both" }}>
                  <path d="M3 8l4 4 6-6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : isActive ? (
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--tb-orange)",
                  animation: "activeDot 1s ease infinite",
                }} />
              ) : null}
            </div>

            <span style={{
              fontSize: 12,
              fontWeight: isActive ? 600 : 500,
              color: isDone ? "#10B981" : isActive ? "var(--tb-orange)" : "var(--tb-light)",
              transition: "color 0.3s ease",
              fontFamily: "var(--font-sans)",
            }}>
              {step.label}{isActive ? "..." : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function DatesLoader() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showHeader, setShowHeader] = useState(false);
  const [showChips, setShowChips] = useState(false);
  const [showStrip, setShowStrip] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowHeader(true), 100);
    const t2 = setTimeout(() => setShowChips(true), 250);
    const t3 = setTimeout(() => setShowStrip(true), 400);
    const t4 = setTimeout(() => setShowSummary(true), 550);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => prev >= STEPS.length ? 0 : prev + 1);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pageFlip {
          0% { transform: rotateX(0deg); opacity: 1; }
          50% { transform: rotateX(-90deg); opacity: 0.3; }
          51% { transform: rotateX(90deg); opacity: 0.3; }
          100% { transform: rotateX(0deg); opacity: 1; }
        }
        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes stepCheck {
          0% { transform: scale(0) rotate(-30deg); }
          60% { transform: scale(1.15) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes activeDot { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .dates-skeleton {
          background: linear-gradient(90deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 100%);
          background-size: 200% 100%;
          animation: shimmer 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Header skeleton */}
      <div style={{
        background: "linear-gradient(145deg, #fff 0%, #FEFCF9 100%)",
        padding: "20px 20px 16px", borderBottom: "1px solid rgba(0,0,0,0.04)",
        opacity: showHeader ? 1 : 0,
        transform: showHeader ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s ease",
      }}>
        <div className="dates-skeleton" style={{ height: 26, width: "70%", borderRadius: 8, marginBottom: 10 }} />
        <div className="dates-skeleton" style={{ height: 22, width: "55%", borderRadius: 100 }} />
        <div className="dates-skeleton" style={{ marginTop: 14, height: 38, width: "100%", borderRadius: 12 }} />
      </div>

      {/* Quick chips skeleton */}
      <div style={{
        display: "flex", gap: 8, padding: "0 20px",
        opacity: showChips ? 1 : 0,
        transform: showChips ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s ease",
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="dates-skeleton" style={{ flex: 1, height: 48, borderRadius: 12 }} />
        ))}
      </div>

      {/* Date cards strip skeleton */}
      <div style={{
        padding: "0 20px",
        opacity: showStrip ? 1 : 0,
        transform: showStrip ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s ease",
      }}>
        <div style={{ display: "flex", gap: 10, overflowX: "hidden" }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="dates-skeleton" style={{ flexShrink: 0, width: 76, height: 120, borderRadius: 18 }} />
          ))}
        </div>
      </div>

      {/* Loading card with calendar + progress steps */}
      <div style={{
        margin: "8px 20px",
        padding: "20px 20px",
        borderRadius: 20,
        background: "linear-gradient(145deg, #fff, #FEFCF9)",
        border: "1px solid rgba(0,0,0,0.04)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        display: "flex", alignItems: "center", gap: 18,
        animation: "fadeInUp 0.5s ease-out 0.2s both",
      }}>
        <FlippingCalendar currentStep={currentStep} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: "var(--tb-text)", marginBottom: 10,
            fontFamily: "var(--font-sans)",
          }}>Loading your dates</p>
          <ProgressSteps currentStep={currentStep} />
        </div>
      </div>

      {/* Summary skeleton */}
      <div style={{
        margin: "0 20px",
        opacity: showSummary ? 1 : 0,
        transform: showSummary ? "translateY(0)" : "translateY(8px)",
        transition: "all 0.4s ease",
      }}>
        <div style={{
          padding: "18px 16px", borderRadius: 20,
          background: "linear-gradient(145deg, #fff, #FEFCF9)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="dates-skeleton" style={{ height: 16, width: 140, borderRadius: 6 }} />
            <div className="dates-skeleton" style={{ height: 20, width: 70, borderRadius: 8 }} />
          </div>
          <div className="dates-skeleton" style={{ height: 42, width: "100%", borderRadius: 10, marginBottom: 8 }} />
          <div className="dates-skeleton" style={{ height: 42, width: "100%", borderRadius: 10 }} />
        </div>
      </div>
    </div>
  );
}
