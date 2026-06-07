export const scenarioAcceptanceFixtures = [
  {
    id: 'natural-data-analysis',
    title: 'Natural Data Analysis',
    group: 'positive',
    expectation: {
      mode: 'vizual',
      visibleSurface: true,
      usefulInteraction: false,
      catalogGapOptional: true,
    },
    prompt: [
      'I run a small subscription product and need help understanding this week.',
      'Mon: signups 82, trials 31, paid conversions 8, support tickets 12.',
      'Tue: signups 96, trials 44, paid conversions 11, support tickets 15.',
      'Wed: signups 104, trials 51, paid conversions 10, support tickets 24.',
      'Thu: signups 118, trials 59, paid conversions 12, support tickets 31.',
      'Fri: signups 113, trials 54, paid conversions 9, support tickets 38.',
      'What changed, where is the risk, and what should I look at first?',
    ].join('\n'),
    evidenceChecklist: [
      'Agent received only the natural-language user request.',
      'A visible inline surface is rendered in the browser.',
      'The surface uses the provided local data; no external API is assumed.',
      'The answer avoids claiming causality from correlation.',
    ],
  },
  {
    id: 'concept-playground',
    title: 'Concept / Algorithm Playground',
    group: 'positive',
    expectation: {
      mode: 'vizual',
      visibleSurface: true,
      usefulInteraction: true,
      catalogGapOptional: true,
    },
    prompt: [
      'Explain why gradient descent can overshoot when the learning rate is too high.',
      'Give me a small interactive playground using only local state so I can compare learning rates 0.02, 0.18, and 0.72 against the same curve.',
      'I should be able to adjust or choose a setting and immediately see how the explanation changes.',
    ].join('\n'),
    evidenceChecklist: [
      'The interaction changes local explanation or displayed state.',
      'No button claims to call a business API that was not provided.',
      'The browser evidence includes a useful control interaction.',
    ],
  },
  {
    id: 'surface-action',
    title: 'Surface / Action Loop',
    group: 'positive',
    expectation: {
      mode: 'vizual',
      visibleSurface: true,
      usefulInteraction: true,
      catalogGapOptional: true,
    },
    prompt: [
      'Here are local QA findings from a release review:',
      'A: checkout copy is confusing, severity medium, owner Growth.',
      'B: export button silently fails, severity high, owner Platform.',
      'C: onboarding empty state lacks next step, severity low, owner Activation.',
      'Turn this into a compact review surface where I can mark one finding as the next follow-up and send that choice back into the chat context.',
    ].join('\n'),
    evidenceChecklist: [
      'The rendered interaction is backed by the local finding data.',
      'A user action is captured in the page action log or state-change log.',
      'The interaction supports a follow-up loop rather than a fake dispatch.',
    ],
  },
  {
    id: 'event-flow',
    title: 'Event Flow',
    group: 'positive',
    expectation: {
      mode: 'vizual',
      visibleSurface: true,
      usefulInteraction: true,
      catalogGapOptional: true,
    },
    prompt: [
      'I am reviewing a local automation run and want the flow to be understandable.',
      'Events: 09:00 queued import, 09:04 loaded 120 rows, 09:08 detected 7 invalid rows, 09:12 user approved retry, 09:17 retry passed, 09:20 export completed.',
      'Show the run as an inspectable event flow and let me focus on one event without leaving the chat.',
    ].join('\n'),
    evidenceChecklist: [
      'The visible surface represents run/message/state progression.',
      'The focus or selection interaction uses local event data.',
      'No external automation endpoint is assumed.',
    ],
  },
  {
    id: 'drill-down-feedback-loop',
    title: 'Drill-Down Feedback Loop',
    group: 'positive',
    expectation: {
      mode: 'vizual',
      visibleSurface: true,
      usefulInteraction: true,
      followUp: true,
      catalogGapOptional: true,
    },
    prompt: [
      'Compare these three stores and help me decide where to drill down first.',
      'North: revenue 182000, returns 4200, complaints 18, stockouts 4.',
      'South: revenue 139000, returns 9100, complaints 41, stockouts 11.',
      'West: revenue 166000, returns 5100, complaints 22, stockouts 6.',
      'Make it easy to select a store or data point and continue the diagnosis from that selection.',
    ].join('\n'),
    followUpPrompt: 'Use the selected store or point from the browser interaction and tell me the next two checks. Do not ask me to restate the original table.',
    evidenceChecklist: [
      'The first turn renders an inspectable comparison.',
      'The interaction result is visible and can be sent back as follow-up context.',
      'The follow-up answer references the selected local data rather than asking for it again.',
    ],
  },
  {
    id: 'text-only-negative',
    title: 'Text-Only Negative',
    group: 'negative',
    expectation: {
      mode: 'text',
      visibleSurface: false,
      usefulInteraction: false,
      catalogGapOptional: false,
    },
    prompt: 'In one sentence, what is the difference between correlation and causation? Please keep it text only.',
    evidenceChecklist: [
      'No Vizual native surface is rendered.',
      'No hidden guided prompt or component scaffold is injected.',
      'The answer remains a normal text reply.',
    ],
  },
  {
    id: 'creative-web-negative',
    title: 'Explicit Web Creative Negative',
    group: 'negative',
    expectation: {
      mode: 'creative',
      visibleSurface: false,
      usefulInteraction: false,
      catalogGapOptional: false,
    },
    prompt: [
      'Create a custom HTML landing page for a fictional conference called Quiet Systems Summit.',
      'I want the actual page artifact with CSS and a hero section, not a native Vizual chart or dashboard.',
    ].join('\n'),
    evidenceChecklist: [
      'The request is treated as an explicit creative artifact request.',
      'Vizual Native is not forced as the success condition.',
      'If this endpoint cannot capture freeform artifacts, mark it review-needed rather than passing a fake native render.',
    ],
  },
  {
    id: 'catalog-gap-metadata',
    title: 'Optional Catalog Gap Metadata',
    group: 'learning',
    expectation: {
      mode: 'vizual-or-gap',
      visibleSurface: true,
      usefulInteraction: false,
      catalogGapOptional: true,
    },
    prompt: [
      'I need to explain a patient journey where each step has a duration, uncertainty band, handoff owner, and dependency.',
      'If the current native catalog cannot express that cleanly, still give me the closest useful inline surface and attach non-blocking catalog-gap metadata for what is missing.',
    ].join('\n'),
    evidenceChecklist: [
      'Catalog Gap metadata is optional and non-blocking.',
      'Any gap signal stays outside the visible component spec.',
      'The user still gets the closest useful local surface when possible.',
    ],
  },
];

export function findScenarioFixture(id) {
  return scenarioAcceptanceFixtures.find(scenario => scenario.id === id) || null;
}
