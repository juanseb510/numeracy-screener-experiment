// app/components/JsPsychExperiment.tsx

"use client";

import { useEffect, useRef } from "react";
import { initJsPsych } from "jspsych";
import "jspsych/css/jspsych.css";

import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import { getSession, upsertSession, clearSession } from "@/lib/sessionStore";

import { buildConsentAndIdTimeline } from "./tasks/consentAndIdTimeline";
import { buildMagnitudeComparisonTimeline } from "./tasks/magnitudeComparisonTimeline";
import { buildNumberLineEstimationTimeline } from "./tasks/numberLineEstimationTimeline";



type ExperimentProps = {
  onFinish?: (data: any) => void;
};

const JsPsychExperiment: React.FC<ExperimentProps> = ({ onFinish }) => {
  const experimentDivId = "jspsych-target";
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const jsPsych = initJsPsych({
      display_element: experimentDivId,
      on_finish: () => {
        const all = jsPsych.data.get();

        const consentRow = all.filter({ task: "consent" }).values()?.[0];
        const idRow = all.filter({ task: "id_entry" }).values()?.[0];

        const participantId = idRow?.participant_id ?? null;
        const consented = consentRow?.consented ?? null;

        const mean = (arr: number[], decimals = 0) => {
          if (!arr.length) return null;
          const m = arr.reduce((a, b) => a + b, 0) / arr.length;
          return decimals > 0 ? Number(m.toFixed(decimals)) : Math.round(m);
        };

        const summarizeComparison = (phase: "pre" | "post") => {
          const compare = all.filter({ task: "magnitude_compare", phase });

          const total = compare.count();
          const correct = compare.select("correct").values.filter(Boolean).length;

          const rtValues = compare
            .select("rt")
            .values.filter((v: any) => typeof v === "number") as number[];

          return {
            total,
            correct,
            accuracy: total > 0 ? correct / total : null,
            meanRT_ms: mean(rtValues, 0),
          };
        };

        const summarizeEstimation = (phase: "pre" | "post") => {
          const est = all.filter({ task: "number_line_estimation", phase });

          const total = est.count();

          const paeVals = est
            .select("pae")
            .values.filter((v: any) => typeof v === "number") as number[];

          const dirVals = est
            .select("directional_error")
            .values.filter((v: any) => typeof v === "number") as number[];

          return {
            total,
            meanPAE: mean(paeVals, 2),
            meanDirectionalError: mean(dirVals, 4),
          };
        };

        const preCompare = summarizeComparison("pre");
        const postCompare = summarizeComparison("post");

        const preEst = summarizeEstimation("pre");
        const postEst = summarizeEstimation("post");

        const pid = ((window as any).__participantId ?? "").toString().trim();
        const saved = pid ? getSession(pid) : null;
        const resumeFlow = !!(window as any).__resumeFlow;

        const savedPre = saved?.payload?.pre_summary;

        const finalPreCompare = resumeFlow && savedPre?.comparison ? savedPre.comparison : preCompare;
        const finalPreEst = resumeFlow && savedPre?.estimation ? savedPre.estimation : preEst;


        if (onFinish) {
          onFinish({
            raw: all,
            summary: {
              consented,
              participantId,
              pre: { comparison: finalPreCompare, estimation: finalPreEst },

              post: { comparison: postCompare, estimation: postEst },
            },
          });
        }
      },
    });

    // keep this for consent flow
    (window as any).jsPsych = jsPsych;

    // default: assume NEW session unless user chooses Resume
    (window as any).__resumeFlow = false;


    // --- Helpers for checkpoint saving (Pre-test complete) ---
    const mean = (arr: number[], decimals = 0) => {
      if (!arr.length) return null;
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      return decimals > 0 ? Number(m.toFixed(decimals)) : Math.round(m);
    };

    const summarizeComparisonFrom = (dataView: any, phase: "pre" | "post") => {
      const compare = dataView.filter({ task: "magnitude_compare", phase });
      const total = compare.count();
      const correct = compare.select("correct").values.filter(Boolean).length;

      const rtValues = compare
        .select("rt")
        .values.filter((v: any) => typeof v === "number") as number[];

      return {
        total,
        correct,
        accuracy: total > 0 ? correct / total : null,
        meanRT_ms: mean(rtValues, 0),
      };
    };

    const summarizeEstimationFrom = (dataView: any, phase: "pre" | "post") => {
      const est = dataView.filter({ task: "number_line_estimation", phase });
      const total = est.count();

      const paeVals = est
        .select("pae")
        .values.filter((v: any) => typeof v === "number") as number[];

      const dirVals = est
        .select("directional_error")
        .values.filter((v: any) => typeof v === "number") as number[];

      return {
        total,
        meanPAE: mean(paeVals, 2),
        meanDirectionalError: mean(dirVals, 4),
      };
    };

    const savePreCheckpoint = () => {
      const allNow = jsPsych.data.get();

      const idRow = allNow.filter({ task: "id_entry" }).values()?.[0];
      const participantId = (idRow?.participant_id ?? "").toString().trim();

      if (!participantId) return; // don't save without ID

      // Only store PRE summaries at this checkpoint
      const preSummary = {
        comparison: summarizeComparisonFrom(allNow, "pre"),
        estimation: summarizeEstimationFrom(allNow, "pre"),
      };

      // Store only rows up to this moment (values() is plain JSON-ish)
      const preRawRows = allNow.values();

      upsertSession(participantId, {
        stage: "PRE_DONE",
      payload: {
        pre_raw: preRawRows,
        pre_summary: preSummary,
      }
      });
    };

    // demo trials for estimation
    const ESTIMATION_TRIALS_DEMO = [
      { id: 1, stimulus: "13/20", trueValue01: 0.65, notation: "Fraction" as const },
      { id: 2, stimulus: "0.35", trueValue01: 0.35, notation: "Decimal" as const },
      { id: 3, stimulus: "35%", trueValue01: 0.35, notation: "Percentage" as const },
      { id: 4, stimulus: "7/10", trueValue01: 0.7, notation: "Fraction" as const },
      { id: 5, stimulus: "0.48", trueValue01: 0.48, notation: "Decimal" as const },
      { id: 6, stimulus: "65%", trueValue01: 0.65, notation: "Percentage" as const },
    ];

    const preTask1 = buildMagnitudeComparisonTimeline({ limit: 15 });
    const preTask2 = buildNumberLineEstimationTimeline({
      trials: ESTIMATION_TRIALS_DEMO.slice(0, 3),
      promptTitle: "NUMBER LINE ESTIMATION (PRE)",
    });

    // ✅ Monster placeholder (NO require)
    const monsterPlaceholder: any[] = [
      {
        type: HtmlButtonResponsePlugin,
        stimulus: `
          <div style="max-width: 920px; margin: 0 auto; padding: 40px; text-align:center;">
            <h2 style="font-size: 44px; font-weight: 900; color: #7c3aed; margin-bottom: 14px; font-family: 'Courier New', monospace;">
              MONSTER GAME (WARM-UP)
            </h2>
            <p style="font-size: 18px; color: #111; margin-bottom: 12px;">
              This is a short warm-up section with feedback.
            </p>
            <p style="font-size: 16px; color: #333;">
              Click <strong>Start</strong> to continue.
            </p>
          </div>
        `,
        choices: ["Start"],
        data: { task: "monster_game_intro" },
      },
      {
        type: HtmlButtonResponsePlugin,
        stimulus: `
          <div style="max-width: 920px; margin: 0 auto; padding: 40px; text-align:center;">
            <p style="font-size: 18px; color: #111; margin-bottom: 18px;">
              (Placeholder) Monster game will go here.
            </p>
            <p style="font-size: 16px; color: #333;">
              Click <strong>Continue</strong> to begin the post-test.
            </p>
          </div>
        `,
        choices: ["Continue"],
        data: { task: "monster_game_end" },
      },
    ];

    const postTask1 = buildMagnitudeComparisonTimeline({ limit: 15 });
    const postTask2 = buildNumberLineEstimationTimeline({
      trials: ESTIMATION_TRIALS_DEMO.slice(3, 6),
      promptTitle: "NUMBER LINE ESTIMATION (POST)",
    });
      const resumeChooser = {
  timeline: [
    {
      type: HtmlButtonResponsePlugin,
      stimulus: () => {
        const pid = ((window as any).__participantId ?? "").toString().trim();
        const s = pid ? getSession(pid) : null;

        return `
          <div style="max-width: 920px; margin: 0 auto; padding: 40px; text-align:center;">
            <h2 style="font-size: 40px; font-weight: 900; color: #111; margin-bottom: 10px; font-family: 'Courier New', monospace;">
              Session found
            </h2>
            <p style="font-size: 16px; color: #333; margin-bottom: 18px;">
              ID: <strong>${pid}</strong><br/>
              Last saved: <strong>${s?.updatedAt ?? "unknown"}</strong>
            </p>
            <p style="font-size: 16px; color: #111; margin-bottom: 18px;">
              Do you want to resume from the Post-test (Monster → Post), or start over?
            </p>
          </div>
        `;
      },
      choices: ["Resume", "Start new"],
      on_finish: (data: any) => {
        const pid = ((window as any).__participantId ?? "").toString().trim();
        const s = pid ? getSession(pid) : null;

        // 0 = Resume, 1 = Start new
        const resume = data.response === 0;

        (window as any).__resumeFlow = resume;
        (window as any).__sessionRow = s;

        if (!resume && pid) clearSession(pid);
      },
      data: { task: "resume_choice" },
    },
  ],
  conditional_function: () => {
    const pid = ((window as any).__participantId ?? "").toString().trim();
    if (!pid) return false;
    const s = getSession(pid);
    // show this only if we have a saved PRE checkpoint
    return !!s && (s.stage === "PRE_DONE" || s.stage === "MONSTER_DONE");
  },
};

const timeline: any[] = [
  ...buildConsentAndIdTimeline({ title: "Numeracy Screener" }),

  // shows only if a saved session exists for this ID
  resumeChooser,

  // PRE (skip if resumeFlow = true)
  {
    timeline: preTask1,
    data: { phase: "pre" },
    conditional_function: () => !(window as any).__resumeFlow,
  },

  {
    timeline: preTask2,
    data: { phase: "pre" },
    conditional_function: () => !(window as any).__resumeFlow,
    on_timeline_finish: () => {
      // only save checkpoint when actually running PRE
      if (!(window as any).__resumeFlow) savePreCheckpoint();
    },
  },

  // Monster warm-up (always runs for now)
  { timeline: monsterPlaceholder, data: { phase: "monster" } },

  // POST (always runs)
  { timeline: postTask1, data: { phase: "post" } },
  { timeline: postTask2, data: { phase: "post" } },
];



    jsPsych.run(timeline);
  }, [onFinish]);

  return (
    <div
      id={experimentDivId}
      className="w-full h-full min-h-[600px] flex flex-col items-center justify-center"
    />
  );
};

export default JsPsychExperiment;
