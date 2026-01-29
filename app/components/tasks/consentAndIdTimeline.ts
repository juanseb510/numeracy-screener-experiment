// app/components/tasks/consentAndIdTimeline.ts

import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import HtmlSurveyTextPlugin from "@jspsych/plugin-survey-text";

type BuildOptions = {
  title?: string;
};

export function buildConsentAndIdTimeline(options: BuildOptions = {}) {
  const title = options.title ?? "Numeracy Screener";
  const timeline: any[] = [];

  const legibilityCSS = `
<style>
  .jspsych-content { color: #111 !important; }
  .jspsych-content * { color: #111 !important; }

  .consent-btn {
    font-family: "Courier New", monospace;
    font-weight: 900;
    border: 3px solid #111;
    border-radius: 14px;
    padding: 12px 16px;
    margin: 8px;
    cursor: pointer;
    background: #ffffff;
    color: #111;
  }
  .consent-btn:hover { transform: rotate(-1deg) scale(1.02); }

  .jspsych-survey-text label {
    font-weight: 900 !important;
    font-size: 18px !important;
  }

  .jspsych-survey-text input[type="text"] {
    color: #111 !important;
    background: #fff !important;
    border: 3px solid #111 !important;
    border-radius: 12px !important;
    padding: 12px 14px !important;
    font-size: 18px !important;
    width: min(520px, 100%) !important;
    outline: none !important;
  }

  /* Extra safety for endExperiment screens */
  .consent-end, .consent-end * { color: #111 !important; }
  
</style>
`;

  const declineHTML =
    legibilityCSS +
    `
<div class="consent-end" style="max-width: 800px; margin: 0 auto; padding: 40px; text-align: center;">
  <h2 style="font-size: 34px; font-weight: 900; margin-bottom: 10px; font-family: 'Courier New', monospace; color:#111;">
    No problem
  </h2>
  <p style="font-size: 18px; color:#111;">
    You chose not to participate. You can close this page now.
  </p>
</div>
`;

  // Reset decision each run
  (window as any).__consentDecision = null;

  // 1) Consent screen (custom buttons)
  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    choices: "NO_KEYS",
    stimulus:
      legibilityCSS +
      `
<div style="max-width: 860px; margin: 0 auto; padding: 30px;">
  <h1 style="font-size: 44px; font-weight: 900; color: #111; margin-bottom: 10px; font-family: 'Courier New', monospace;">
    ${title}
  </h1>

  <p style="font-size: 18px; margin-bottom: 18px; color:#111;">
    This activity is part of a research study about how people understand numbers.
    It includes two short tasks (comparison and estimation). You can stop at any time.
  </p>

  <div style="background: #fff; border: 3px solid #111; border-radius: 18px; padding: 18px; box-shadow: 6px 6px 0px rgba(0,0,0,0.18);">
    <ul style="margin: 0; padding-left: 20px; font-size: 16px; line-height: 1.5; color:#111;">
      <li>Your responses (accuracy and reaction time) will be recorded.</li>
      <li>No names are required. You will enter a participant ID.</li>
      <li>There are no known risks beyond everyday computer use.</li>
    </ul>
  </div>

  <p style="margin-top: 18px; font-size: 16px; color:#111;">
    By clicking <strong>I Agree</strong>, you indicate that you are at least 18 years old and consent to participate.
  </p>

  <div style="margin-top: 18px;">
    <button id="consent-agree" class="consent-btn">I Agree</button>
    <button id="consent-decline" class="consent-btn">I Do Not Agree</button>
  </div>
</div>
`,
    data: { task: "consent" },
    on_load: () => {
      const jsPsych = (window as any).jsPsych;

      const agreeBtn = document.getElementById("consent-agree");
      const declineBtn = document.getElementById("consent-decline");

      if (agreeBtn) {
        agreeBtn.onclick = () => {
          (window as any).__consentDecision = "agree";
          jsPsych.finishTrial({ consented: true, decision: "agree" });
        };
      }

      if (declineBtn) {
        declineBtn.onclick = () => {
          (window as any).__consentDecision = "decline";
          if (jsPsych?.endExperiment) {
            jsPsych.endExperiment(declineHTML);
          } else {
            const el = document.querySelector(".jspsych-content");
            if (el) el.innerHTML = declineHTML;
          }
        };
      }
    },
  });



  // 2) Participant ID entry ONLY if agreed
  timeline.push({
    type: HtmlSurveyTextPlugin,
    preamble:
      legibilityCSS +
      `
<div style="max-width: 860px; margin: 0 auto; padding: 10px 30px 0 30px;">
  <h2 style="font-size: 34px; font-weight: 900; margin-bottom: 6px; font-family: 'Courier New', monospace; color:#111;">
    Participant ID
  </h2>
  <p style="font-size: 16px; color:#111;">
    Enter your assigned participant ID (or a short code). Do not enter your name.
  </p>
</div>
`,
    questions: [
      {
        prompt: "Participant ID",
        name: "participant_id",
        required: true,
        placeholder: "e.g., KNU-0421",
      },
    ],
    data: { task: "id_entry" },
    conditional_function: () => (window as any).__consentDecision === "agree",
    on_finish: (data: any) => {
  const raw = data.response?.participant_id ?? "";
  const pid = String(raw).trim();
  data.participant_id = pid;

  // ✅ make it available to the router trial
  (window as any).__participantId = pid;

  // optional: attach to jsPsych-wide properties
  const jsPsych = (window as any).jsPsych;
  if (jsPsych?.data?.addProperties) jsPsych.data.addProperties({ participant_id: pid });
},

  });

  return timeline;
}
