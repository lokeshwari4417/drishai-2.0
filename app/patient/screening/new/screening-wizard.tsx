"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface WizardProps {
  patientId: string;
  patientName: string;
}

type EyeSelection = "LEFT" | "RIGHT" | "BOTH";

const ANALYSIS_PHASES = [
  "Uploading retinal scans securely...",
  "Enhancing contrast and lighting uniformity...",
  "Running YOLOv8 deep learning model inference...",
  "Mapping vascular micro-lesions and generating diagnostic heatmaps...",
  "Compiling results and clinical recommendations..."
];

export default function ScreeningWizard({ patientId, patientName }: WizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [eyeSelection, setEyeSelection] = useState<EyeSelection | null>(null);
  
  const [leftFile, setLeftFile] = useState<File | null>(null);
  const [leftPreview, setLeftPreview] = useState<string | null>(null);
  
  const [rightFile, setRightFile] = useState<File | null>(null);
  const [rightPreview, setRightPreview] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  
  // AI Analyzing state
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  // Clean up previews
  useEffect(() => {
    return () => {
      if (leftPreview) URL.revokeObjectURL(leftPreview);
      if (rightPreview) URL.revokeObjectURL(rightPreview);
    };
  }, [leftPreview, rightPreview]);

  // Stepper logic for AI analysis
  useEffect(() => {
    if (step !== 3) return;

    // Simulate progress bar and phase transitions
    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 80);

    const phaseInterval = setInterval(() => {
      setPhaseIndex((prev) => {
        if (prev >= ANALYSIS_PHASES.length - 1) {
          clearInterval(phaseInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1600);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, [step]);

  const handleEyeSelect = (selection: EyeSelection) => {
    setEyeSelection(selection);
    setStep(2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: "LEFT" | "RIGHT") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (side === "LEFT") {
        setLeftFile(file);
        setLeftPreview(URL.createObjectURL(file));
      } else {
        setRightFile(file);
        setRightPreview(URL.createObjectURL(file));
      }
      setError(null);
    }
  };

  const handleLoadSample = async (side: "LEFT" | "RIGHT") => {
    try {
      setError(null);
      const res = await fetch("/sample_fundus.png");
      if (!res.ok) throw new Error("Could not load sample fundus asset");
      const blob = await res.blob();
      const file = new File([blob], `sample_${side.toLowerCase()}_eye.png`, { type: "image/png" });
      
      if (side === "LEFT") {
        setLeftFile(file);
        setLeftPreview(URL.createObjectURL(file));
      } else {
        setRightFile(file);
        setRightPreview(URL.createObjectURL(file));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load sample image");
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Form validations
    if (eyeSelection === "LEFT" && !leftFile) {
      setError("Please upload a scan for your Left Eye.");
      return;
    }
    if (eyeSelection === "RIGHT" && !rightFile) {
      setError("Please upload a scan for your Right Eye.");
      return;
    }
    if (eyeSelection === "BOTH" && (!leftFile || !rightFile)) {
      setError("Please upload scans for both Left and Right Eyes.");
      return;
    }

    setStep(3);

    // Build Form Data
    const formData = new FormData();
    formData.append("patientId", patientId);
    if (leftFile) formData.append("leftImage", leftFile);
    if (rightFile) formData.append("rightImage", rightFile);

    try {
      const res = await fetch("/api/screenings/new", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit screening");
      }

      // Add a slight final delay for the smooth UX feel before redirecting
      setTimeout(() => {
        router.push(`/patient/screening/${data.screeningId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setStep(2);
    }
  };

  // Render Step 1: Eye Selection
  if (step === 1) {
    return (
      <div className="mt-8 animate-fade-in">
        <h2 className="text-xl font-medium text-neutral-800">Step 1: Choose scans to upload</h2>
        <p className="text-sm text-neutral-500 mt-1">Specify which eye scans are being submitted today.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => handleEyeSelect("LEFT")}
            className="group flex flex-col items-center justify-center p-6 bg-white border border-neutral-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition duration-200 cursor-pointer text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition duration-200">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-medium text-neutral-900">Left Eye Only</h3>
            <p className="mt-1 text-xs text-neutral-400">Upload one scan for the left retina</p>
          </button>

          <button
            onClick={() => handleEyeSelect("RIGHT")}
            className="group flex flex-col items-center justify-center p-6 bg-white border border-neutral-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition duration-200 cursor-pointer text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition duration-200">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-medium text-neutral-900">Right Eye Only</h3>
            <p className="mt-1 text-xs text-neutral-400">Upload one scan for the right retina</p>
          </button>

          <button
            onClick={() => handleEyeSelect("BOTH")}
            className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition duration-200 cursor-pointer text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white group-hover:scale-105 transition duration-200">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="mt-4 font-medium text-neutral-900 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Both Eyes</h3>
            <p className="mt-1 text-xs text-neutral-400">Recommended full diagnostic screening</p>
          </button>
        </div>
      </div>
    );
  }

  // Render Step 2: Upload Files
  if (step === 2) {
    const showLeft = eyeSelection === "LEFT" || eyeSelection === "BOTH";
    const showRight = eyeSelection === "RIGHT" || eyeSelection === "BOTH";

    return (
      <div className="mt-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium text-neutral-800">Step 2: Upload scans for {patientName}</h2>
            <p className="text-sm text-neutral-500 mt-1">Select fundus photography files to submit.</p>
          </div>
          <button
            onClick={() => setStep(1)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Change eye selection
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Left Eye Upload Box */}
          {showLeft && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                  Left Eye Scan
                </span>
                
                {leftPreview ? (
                  <div className="mt-4 relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-100 bg-neutral-900">
                    <img
                      src={leftPreview}
                      alt="Left Eye Retinal Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setLeftFile(null);
                        setLeftPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => leftInputRef.current?.click()}
                    className="mt-4 border-2 border-dashed border-neutral-300 rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-4 hover:border-blue-500 hover:bg-blue-50/20 transition cursor-pointer"
                  >
                    <svg className="h-10 w-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-neutral-700">Click to upload Left Eye scan</p>
                    <p className="text-xs text-neutral-400 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={leftInputRef}
                  onChange={(e) => handleFileChange(e, "LEFT")}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {!leftPreview && (
                <button
                  type="button"
                  onClick={() => handleLoadSample("LEFT")}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 transition"
                >
                  ✨ Use Clinical Sample Image
                </button>
              )}
            </div>
          )}

          {/* Right Eye Upload Box */}
          {showRight && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                  Right Eye Scan
                </span>
                
                {rightPreview ? (
                  <div className="mt-4 relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-100 bg-neutral-900">
                    <img
                      src={rightPreview}
                      alt="Right Eye Retinal Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setRightFile(null);
                        setRightPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => rightInputRef.current?.click()}
                    className="mt-4 border-2 border-dashed border-neutral-300 rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-4 hover:border-blue-500 hover:bg-blue-50/20 transition cursor-pointer"
                  >
                    <svg className="h-10 w-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm font-medium text-neutral-700">Click to upload Right Eye scan</p>
                    <p className="text-xs text-neutral-400 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={rightInputRef}
                  onChange={(e) => handleFileChange(e, "RIGHT")}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {!rightPreview && (
                <button
                  type="button"
                  onClick={() => handleLoadSample("RIGHT")}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 bg-neutral-50 hover:bg-neutral-100 transition"
                >
                  ✨ Use Clinical Sample Image
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md transition duration-150 cursor-pointer"
          >
            Run AI Diagnostic Scan →
          </button>
        </div>
      </div>
    );
  }

  // Render Step 3: Immersive AI Analyzing State
  return (
    <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl animate-pulse-slow">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center py-8">
        {/* Futuristic circular scanner */}
        <div className="relative h-44 w-44 flex items-center justify-center rounded-full border-4 border-blue-500/20 bg-blue-950/20">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border border-blue-500 animate-ping opacity-25" />
          
          <svg className="h-16 w-16 text-blue-400 animate-spin-slow" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 8"
              d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
            />
          </svg>
          
          {/* Scan line sweeping overlay in previews if available */}
          <div className="absolute inset-2 rounded-full overflow-hidden bg-neutral-950 border border-blue-500/30">
            {leftPreview || rightPreview ? (
              <img
                src={leftPreview || rightPreview || ""}
                alt="Scanning..."
                className="h-full w-full object-cover opacity-60"
              />
            ) : (
              <div className="h-full w-full bg-blue-950/40" />
            )}
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent top-0 animate-scanner shadow-[0_0_10px_#60a5fa]" />
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
          Running Neural Network Analysis
        </h2>
        <p className="mt-2 text-sm text-neutral-400 max-w-md text-center">
          Our cloud-based AI is evaluating your fundus photography for early stages of Diabetic Retinopathy.
        </p>

        {/* Progress Bar */}
        <div className="mt-8 w-full max-w-md bg-neutral-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-100 ease-out shadow-[0_0_8px_#3b82f6]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="mt-2 text-xs font-mono text-blue-400">{progressPercent}% Diagnostic Process Complete</span>

        {/* Phase checklist */}
        <div className="mt-8 w-full max-w-lg bg-neutral-950/50 border border-neutral-800/80 rounded-2xl p-6">
          <h3 className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">Process Pipeline</h3>
          <ul className="mt-4 space-y-3 font-mono text-sm">
            {ANALYSIS_PHASES.map((phase, idx) => {
              const isDone = phaseIndex > idx;
              const isCurrent = phaseIndex === idx;

              return (
                <li key={idx} className="flex items-start transition duration-300">
                  {isDone ? (
                    <span className="mr-3 text-emerald-400">✔</span>
                  ) : isCurrent ? (
                    <span className="mr-3 text-blue-400 animate-pulse">●</span>
                  ) : (
                    <span className="mr-3 text-neutral-700">○</span>
                  )}
                  <span className={isDone ? "text-neutral-500 line-through" : isCurrent ? "text-blue-300 font-semibold" : "text-neutral-600"}>
                    {phase}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
