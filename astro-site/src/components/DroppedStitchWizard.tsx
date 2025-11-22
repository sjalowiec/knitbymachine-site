import { useState } from "react";

type WizardStep = "intro" | "question" | "result";
type OptionKey = "edge" | "transfer" | "sameNeedle" | "random" | "unsure";

interface DiagnosisContent {
  causeTitle: string;
  explanation: string;
  tryThisItems: string[];
  encouragement: string;
}

const diagnoses: Record<OptionKey, DiagnosisContent> = {
  edge: {
    causeTitle: "Edge tension or patterning at the edge",
    explanation:
      "The edge stitches may be too loose, losing contact with the gate pegs, or patterning may be pulling more on the edge needles.",
    tryThisItems: [
      "Add a claw weight or extra weight near the edge.",
      "Check that your edge needles are fully in working position.",
      "If you're patterning, try a plain-knit edge (1–2 stitches) before the pattern starts.",
    ],
    encouragement:
      "Edge stitches are fussy for everyone. A little extra weight and attention usually fixes it.",
  },
  transfer: {
    causeTitle: "Transfer tool technique",
    explanation:
      "Stitches may be falling off while they're on the tool or while you're moving them to new needles.",
    tryThisItems: [
      "Slow down and keep the stitches fully on the prongs before you move them.",
      "Keep the tool level with the needle bed instead of tipping it.",
      "Practice on scrap yarn until the motions feel smooth.",
    ],
    encouragement:
      "This is pure practice. The more you transfer on scrap, the more automatic it feels.",
  },
  sameNeedle: {
    causeTitle: "A problem needle (bent, sticky, or damaged)",
    explanation:
      "One stubborn needle can cause repeated dropped stitches in the same column.",
    tryThisItems: [
      "Mark the problem needle with a bit of yarn.",
      "Remove and inspect it for burrs, bends, or rough spots.",
      "Replace it if in doubt – it's not worth fighting.",
    ],
    encouragement:
      "If one needle keeps misbehaving, retiring it is an easy win.",
  },
  random: {
    causeTitle: "Overall yarn or carriage tension",
    explanation:
      "The yarn may be feeding too loosely or too tightly, or the carriage may not be moving smoothly.",
    tryThisItems: [
      "Knit a small swatch and adjust your tension dial up or down one number.",
      "Check that the mast, tension dial, and yarn path are smooth with no snags.",
      "Make sure you're moving the carriage all the way across with even speed.",
    ],
    encouragement:
      "Small tension tweaks can make a big difference. Keep notes as you experiment.",
  },
  unsure: {
    causeTitle: "A mix of tension and technique",
    explanation:
      "When things feel random, it usually means a few small factors are stacking up.",
    tryThisItems: [
      "Knit a 20–30 row test swatch and watch where the fabric misbehaves.",
      "Check edge weights, overall tension, and any tools you use often.",
      "Note when the drop happens (edge, transfer, middle) – then rerun this checker.",
    ],
    encouragement:
      "You're not doing anything 'wrong.' You're just gathering clues. Each small test gives you more control.",
  },
};

const options: { key: OptionKey; label: string }[] = [
  { key: "edge", label: "On the edge of my knitting" },
  { key: "transfer", label: "While I'm transferring stitches" },
  { key: "sameNeedle", label: "On the same needle over and over" },
  { key: "random", label: "Randomly in the middle of the fabric" },
  { key: "unsure", label: "I'm not sure – it feels random" },
];

export default function DroppedStitchWizard() {
  const [step, setStep] = useState<WizardStep>("intro");
  const [selectedOption, setSelectedOption] = useState<OptionKey | null>(null);

  const handleStart = () => {
    setStep("question");
  };

  const handleBack = () => {
    setStep("intro");
  };

  const handleSeeDiagnosis = () => {
    if (selectedOption) {
      setStep("result");
    }
  };

  const handleStartOver = () => {
    setSelectedOption(null);
    setStep("intro");
  };

  const handleChangeAnswer = () => {
    setStep("question");
  };

  if (step === "intro") {
    return (
      <div className="kbm-wizard">
        <div className="kbm-card kbm-card--shadow">
          <div className="kbm-card__header">
            <h2 className="kbm-card__title" data-testid="text-wizard-title">
              Dropped Stitch Troubleshooter
            </h2>
          </div>
          <div className="kbm-card__body">
            <p className="kbm-lede" data-testid="text-intro-description">
              Dropped stitches happen to everyone. This quick check helps you
              spot what's causing them so you can get back to confident
              knitting.
            </p>
          </div>
          <div className="kbm-card__footer">
            <button
              className="kbm-button kbm-button--primary"
              onClick={handleStart}
              data-testid="button-start"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "question") {
    return (
      <div className="kbm-wizard">
        <div className="kbm-card kbm-card--shadow">
          <div className="kbm-card__header">
            <h2 className="kbm-card__title" data-testid="text-question-title">
              When do you usually notice the dropped stitch?
            </h2>
            <p className="kbm-card__subtitle" data-testid="text-question-helper">
              Choose the option that sounds most like what you're seeing.
            </p>
          </div>
          <div className="kbm-card__body">
            <div className="kbm-pill-group">
              {options.map((option) => (
                <button
                  key={option.key}
                  className={`kbm-pill ${
                    selectedOption === option.key ? "kbm-pill--selected" : ""
                  }`}
                  onClick={() => setSelectedOption(option.key)}
                  data-testid={`button-option-${option.key}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="kbm-card__footer">
            <button
              className="kbm-button kbm-button--secondary"
              onClick={handleBack}
              data-testid="button-back"
            >
              Back
            </button>
            <button
              className="kbm-button kbm-button--primary"
              onClick={handleSeeDiagnosis}
              disabled={!selectedOption}
              data-testid="button-see-diagnosis"
            >
              See my diagnosis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "result" && selectedOption) {
    const diagnosis = diagnoses[selectedOption];

    return (
      <div className="kbm-wizard">
        <div className="kbm-card kbm-card--shadow">
          <div className="kbm-card__header">
            <div className="kbm-eyebrow" data-testid="text-result-eyebrow">
              Likely cause
            </div>
            <h2 className="kbm-card__title" data-testid="text-result-title">
              {diagnosis.causeTitle}
            </h2>
          </div>
          <div className="kbm-card__body">
            <p data-testid="text-result-explanation">{diagnosis.explanation}</p>

            <h3
              className="kbm-wizard__result-heading"
              data-testid="text-result-try-this-heading"
            >
              Try this next:
            </h3>
            <ul
              className="kbm-wizard__result-list"
              data-testid="list-result-suggestions"
            >
              {diagnosis.tryThisItems.map((item, index) => (
                <li
                  key={index}
                  data-testid={`list-item-suggestion-${index}`}
                >
                  {item}
                </li>
              ))}
            </ul>

            <p
              className="kbm-text-muted"
              data-testid="text-result-encouragement"
            >
              {diagnosis.encouragement}
            </p>
          </div>
          <div className="kbm-card__footer">
            <button
              className="kbm-button kbm-button--primary"
              onClick={handleStartOver}
              data-testid="button-start-over"
            >
              Start over
            </button>
            <button
              className="kbm-button kbm-button--ghost"
              onClick={handleChangeAnswer}
              data-testid="button-change-answer"
            >
              Change my answer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
