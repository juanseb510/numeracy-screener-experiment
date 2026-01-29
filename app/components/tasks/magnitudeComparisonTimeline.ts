// app/components/tasks/magnitudeComparisonTimeline.ts

import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import {
  COMPARISON_TRIALS,
  randomizeSides,
  type ComparisonTrial,
} from "@/app/data/protocolStimuli";
import { renderValueHTML } from "@/app/components/renderValue";

// --- Styling (same vibe as your current jsPsych cards) ---
const cardStyle = `
  border: 4px solid black; padding: 40px; border-radius: 20px;
  background: white; box-shadow: 8px 8px 0px rgba(0,0,0,0.2);
  min-width: 220px; height: 280px; display: flex;
  align-items: center; justify-content: center;
`;

const instructionStyle =
  "margin-top: 20px; font-size: 20px; font-weight: bold; color: #333;";

const buttonsCSS = `
  <style>
    .jspsych-btn {
      font-family: "Courier New", monospace !important;
      font-weight: 900 !important;
      font-size: 22px !important;
      padding: 14px 22px !important;
      border: 4px solid #111 !important;
      border-radius: 16px !important;
      background: #fff !important;
      box-shadow: 6px 6px 0px rgba(0,0,0,0.18) !important;
      color: #111 !important;
      cursor: pointer !important;
      transition: transform 0.12s ease-in-out, box-shadow 0.12s ease-in-out !important;
      margin: 0 10px !important;
      min-width: 140px !important;
    }
    .jspsych-btn:hover {
      transform: rotate(-1deg) scale(1.03) !important;
      box-shadow: 8px 8px 0px rgba(0,0,0,0.18) !important;
    }
    .jspsych-btn:active {
      transform: translateY(2px) !important;
      box-shadow: 4px 4px 0px rgba(0,0,0,0.18) !important;
    }
  </style>
`;

type BuildOptions = {
  // If you want to run only one block for debugging: "Pre-Instruction" or "Post-Instruction"
  block?: ComparisonTrial["block"];
  // Optional: cap number of trials for quick tests
  limit?: number;

  // NEW: tag trials as "pre" | "post" | "monster" (or any string you want)
  phase?: string;

  // NEW: optionally hide the intro screen (useful when chaining many sections)
  showIntro?: boolean;

  // NEW: customize the title on the intro screen
  introTitle?: string;
};

export function buildMagnitudeComparisonTimeline(options: BuildOptions = {}) {
  const {
    block,
    limit,
    phase = "magnitude_compare",
    showIntro = true,
    introTitle = "MAGNITUDE COMPARISON",
  } = options;

  // 1) Start from Protocol trials (cross + within)
  let trials = COMPARISON_TRIALS.slice();

  // 2) Optional block filter
  if (block) trials = trials.filter((t) => t.block === block);

  // 3) Optional limit for quick tests
  if (typeof limit === "number") trials = trials.slice(0, limit);

  // 4) Randomize left/right *per trial*
  const randomized = trials.map((t) => randomizeSides(t));

  // 5) Build jsPsych timeline
  const timeline: any[] = [];

  // Intro screen (BUTTON instead of "press any key" for tablet/mobile)
  if (showIntro) {
    timeline.push({
      type: HtmlButtonResponsePlugin,
      stimulus: `
        ${buttonsCSS}
        <div style="padding: 30px; text-align: center;">
          <h2 style="font-size: 40px; font-weight: 900; color: #2563eb; margin-bottom: 10px;">${introTitle}</h2>
          <p style="font-size: 22px; color: #333;">Pick which value is larger.</p>
          <p style="font-size: 16px; color: #666; margin-top: 8px;">Tap a button to begin.</p>
        </div>
      `,
      choices: ["BEGIN"],
      data: { task: "magnitude_compare_intro", phase },
    });
  }

  randomized.forEach((t, idx) => {
    const correctIndex = t.correctSide === "left" ? 0 : 1;

    // Small fixation between trials
    timeline.push({
      type: HtmlKeyboardResponsePlugin,
      stimulus:
        '<div style="font-size: 90px; font-weight: 900; color: black;">+</div>',
      choices: "NO_KEYS",
      trial_duration: 350,
      data: { task: "fixation", phase },
    });

    timeline.push({
      type: HtmlButtonResponsePlugin,
      stimulus: `
        ${buttonsCSS}

        <h2 style="font-size: 36px; font-weight: 900; color: #2563eb; margin-bottom: 22px; text-align:center;">
          WHICH ONE IS LARGER?
        </h2>

        <div style="display: flex; gap: 40px; justify-content: center; align-items: center;">
          <div style="${cardStyle}">${renderValueHTML(t.left)}</div>
          <!-- Removed "VS" per Schiller request -->
          <div style="${cardStyle}">${renderValueHTML(t.right)}</div>
        </div>

        <p style="${instructionStyle}; text-align:center;">
          Tap <strong>LEFT</strong> or <strong>RIGHT</strong>
        </p>

        <p style="margin-top: 10px; color: #999; text-align:center;">
          Trial ${idx + 1} / ${randomized.length}
        </p>
      `,
      choices: ["LEFT", "RIGHT"],
      data: {
        task: "magnitude_compare",
        phase,

        trial_id: t.id,
        block: t.block,
        distance: t.distance,
        relation: t.relation,
        left: t.left,
        right: t.right,
        left_value: t.leftVal,
        right_value: t.rightVal,
        correct_side: t.correctSide,
        correct_choice_index: correctIndex,
        wnb_consistent: t.meta?.wnbConsistent ?? null,
        decimal_digits: t.meta?.decimalDigits ?? null,
        source: t.meta?.source ?? null,
      },
      on_finish: (data: any) => {
        // HtmlButtonResponsePlugin stores button index in data.response (0/1)
        data.chosen_side = data.response === 0 ? "left" : "right";
        data.correct = data.response === correctIndex;
      },
    });
  });

  return timeline;
}
