window.askPromptChips = [
  'Explain FPI operating layers',
  'What data is being ingested?',
  'Show fire assurance gaps',
  'Show EP readiness gaps',
  'Explain threat scoring',
  'What is blocking verified closure?',
  'Recommend vendor support',
  'Summarize external coordination posture',
  'Why is this high risk?',
  'Summarize this facility.',
  'Recommend next action.',
  'Recommend vendor.',
  'Draft remediation case.',
  'Explain evidence gap.',
  'Create EP readiness brief.',
];

window.askResponseMap = function askResponseMap(scopeLabel) {
  return {
    'Explain FPI operating layers': 'FPI operates across ten demo-safe capability layers: data ingestion and normalization, facility protection profiles, executive protection readiness, fire system assurance, camera and technical control monitoring, threat detection and risk scoring, FFP/remediation orchestration, vendor intelligence, external coordination readiness, and verification/governance. Together, these layers move a facility signal from detection to scored risk, recommended action, ownership, evidence, and verified closure.',
    'What data is being ingested?': 'Current demo ingest includes seed facility records, risk scoring output, and orchestration draft actions. These are normalized into one operating picture before UI display.',
    'Show fire assurance gaps': 'Fire assurance is elevated due to stale inspection evidence and verification dependencies that must be resolved before risk can be reduced.',
    'Show EP readiness gaps': 'EP readiness is currently on watch. The demo reflects incomplete checklist readiness for an upcoming visit window.',
    'Explain threat scoring': 'Threat scoring uses normalized signals, source freshness, and explainable drivers to produce a transparent risk score and tier.',
    'What is blocking verified closure?': 'The primary closure blocker is evidence verification. Case RF-56789 should not be closed until EV-2219, the post-repair camera health validation evidence, is verified.',
    'Recommend vendor support': 'SecureView Solutions remains the top vendor recommendation based on fit score, response capability, and evidence-return discipline.',
    'Summarize external coordination posture': 'External coordination is demo-safe and readiness-oriented. The lane indicates coordination capability without exposing sensitive contacts or operational details.',
    'Why is this high risk?': `${scopeLabel} is high risk because camera visibility is degraded, repeat incident context is elevated, and closure evidence is not yet verified.`,
    'Summarize this facility.': `${scopeLabel} has active remediation in progress, one critical visibility gap, and evidence controls preventing premature closure.`,
    'Recommend next action.': 'Prioritize restoring parking lot camera coverage, keep case RF-56789 in progress, and push EV-2219 to verified status.',
    'Recommend vendor.': 'SecureView Solutions is the primary recommendation based on fit score, service coverage, and evidence return quality.',
    'Draft remediation case.': 'Case draft: detect outage, assign Security Technology owner, target rapid coverage restoration, require post-repair validation evidence.',
    'Explain evidence gap.': 'The current gap is verification state, not task completion. The issue is only considered secured after evidence is verified.',
    'Create EP readiness brief.': 'EP readiness brief: status is watch, checklist completion required before upcoming visit window opens.',
  };
};
