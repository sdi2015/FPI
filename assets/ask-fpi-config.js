window.askPromptChips = [
  'Explain FPI operating programs',
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
];

window.askResponseMap = function askResponseMap(scopeLabel) {
  return {
    'Explain FPI operating programs': 'FPI operates across ten demo-safe operating programs: data ingestion and normalization, facility protection profiles, executive protection readiness, fire system assurance, camera and technical control monitoring, threat detection and risk scoring, FFP/remediation orchestration, vendor intelligence, external coordination readiness, and verification/governance. Together, these programs move a facility signal from detection to scored risk, recommended action, ownership, evidence, and verified closure.',
    'What data is being ingested?': 'Current demo ingestion includes facility profile records, risk and scoring signals, remediation/case progress, and verification evidence states normalized into one operating picture.',
    'Show fire assurance gaps': 'Fire assurance is elevated because inspection evidence is stale and verification dependencies remain open before risk can be reduced.',
    'Show EP readiness gaps': 'Executive protection readiness is currently watch-level because checklist completion is still incomplete for an upcoming visit window.',
    'Explain threat scoring': 'Threat scoring converts normalized protection signals into explainable risk using severity, confidence, freshness, and top driver weighting.',
    'What is blocking verified closure?': 'The primary closure blocker is evidence verification. Case RF-56789 should not be closed until EV-2219, the post-repair camera health validation, confirms that the parking lot camera is online and footage is available. FPI requires verified evidence before marking the remediation complete.',
    'Recommend vendor support': 'SecureView Solutions is the top vendor support path based on fit score, response capability, and evidence-return reliability.',
    'Summarize external coordination posture': 'External coordination is available as a demo-safe readiness lane. The current demo does not display sensitive agency names, contact details, operational escalation instructions, or real incident information. Human review is required before any real external coordination or public-safety escalation.',
    'Why is this high risk?': `${scopeLabel} is high risk because camera visibility is degraded, repeat incident context is elevated, and closure evidence is not yet verified.`,
    'Summarize this facility.': `${scopeLabel} has active remediation in progress, one critical visibility gap, and evidence controls preventing premature closure.`,
    'Recommend next action.': 'Prioritize restoring parking lot camera coverage, keep case RF-56789 in progress, and move EV-2219 to verified status.',
  };
};
