"use client";

import React, { useState } from "react";
//NEW LINE '

import dynamic from "next/dynamic";

const JsPsychExperiment = dynamic(
  () => import("../../components/JsPsychExperiment"),
  { ssr: false }
);


import SketchButton from "../../components/SketchButton";

function fmtPct(x: any) {
  if (typeof x !== "number" || Number.isNaN(x)) return "N/A";
  return `${Math.round(x * 100)}%`;
}

function fmtNum(x: any, decimals = 0) {
  if (typeof x !== "number" || Number.isNaN(x)) return "N/A";
  return decimals > 0 ? x.toFixed(decimals) : String(x);
}

export default function GamePage() {
  const [experimentFinished, setFinished] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFinish = (data: any) => {
    setFinished(true);
    setResults(data);
    console.log("Experiment Data (raw):", data?.raw?.values?.() ?? data);
  };

  const s = results?.summary;

  const preC = s?.pre?.comparison;
  const preE = s?.pre?.estimation;

  const postC = s?.post?.comparison;
  const postE = s?.post?.estimation;

  return (
    <div className="flex min-h-screen bg-[#F0F2F6]">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-6 hidden md:flex">
        <h2 className="text-xl font-bold text-gray-800">Controls</h2>

        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>User:</strong>{" "}
            <span className="font-mono bg-gray-100 p-1 rounded">
              {s?.participantId ?? "Guest"}
            </span>
          </p>
          <p>
            <strong>Status:</strong> {experimentFinished ? "✅ Complete" : "▶️ In Progress"}
          </p>
          <p>
            <strong>Consented:</strong>{" "}
            {typeof s?.consented === "boolean" ? (s.consented ? "Yes" : "No") : "N/A"}
          </p>
        </div>

        <div className="mt-auto">
          <SketchButton text="EXIT" href="/game" />
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 md:p-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 self-start">
          Numeracy Screener
        </h1>

        {!experimentFinished ? (
          <div className="w-full max-w-3xl">
            <JsPsychExperiment onFinish={handleFinish} />
          </div>
        ) : (
          <div className="w-full max-w-3xl bg-white p-8 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold text-green-600 mb-2">Task Complete!</h2>
            <p className="mb-6 text-gray-600">
              Your results were logged in the console (F12).
            </p>

            <div className="space-y-8">
              {/* PRE */}
              <section className="border border-gray-200 rounded-lg p-5">
                <h3 className="text-xl font-extrabold text-gray-800 mb-3">Pre-test Summary</h3>

                <div className="space-y-4">
                  <div>
                    <p className="font-bold text-gray-700">Task 1 — Magnitude Comparison</p>
                    <div className="mt-2 text-gray-700 space-y-1">
                      <p>Total trials: {fmtNum(preC?.total)}</p>
                      <p>Correct: {fmtNum(preC?.correct)}</p>
                      <p>Accuracy: {fmtPct(preC?.accuracy)}</p>
                      <p>Mean RT: {preC?.meanRT_ms ?? "N/A"} ms</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-gray-700">Task 2 — Number Line Estimation</p>
                    <div className="mt-2 text-gray-700 space-y-1">
                      <p>Total trials: {fmtNum(preE?.total)}</p>
                      <p>Mean PAE: {fmtNum(preE?.meanPAE, 2)}</p>
                      <p>
                        Mean directional error: {fmtNum(preE?.meanDirectionalError, 4)}{" "}
                        <span className="text-gray-500">
                          (+ = overestimate, − = underestimate)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* POST */}
              <section className="border border-gray-200 rounded-lg p-5">
                <h3 className="text-xl font-extrabold text-gray-800 mb-3">Post-test Summary</h3>

                <div className="space-y-4">
                  <div>
                    <p className="font-bold text-gray-700">Task 1 — Magnitude Comparison</p>
                    <div className="mt-2 text-gray-700 space-y-1">
                      <p>Total trials: {fmtNum(postC?.total)}</p>
                      <p>Correct: {fmtNum(postC?.correct)}</p>
                      <p>Accuracy: {fmtPct(postC?.accuracy)}</p>
                      <p>Mean RT: {postC?.meanRT_ms ?? "N/A"} ms</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-bold text-gray-700">Task 2 — Number Line Estimation</p>
                    <div className="mt-2 text-gray-700 space-y-1">
                      <p>Total trials: {fmtNum(postE?.total)}</p>
                      <p>Mean PAE: {fmtNum(postE?.meanPAE, 2)}</p>
                      <p>
                        Mean directional error: {fmtNum(postE?.meanDirectionalError, 4)}{" "}
                        <span className="text-gray-500">
                          (+ = overestimate, − = underestimate)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <SketchButton text="PLAY AGAIN" onClick={() => window.location.reload()} />
              <SketchButton text="EXIT" href="/game" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
