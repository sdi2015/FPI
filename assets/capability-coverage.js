window.fpiOperatingPrograms = [
  {
    id: 'data-ingestion-normalization',
    label: 'Data Ingestion & Normalization',
    fullName: 'Data Ingestion & Normalization',
    status: 'Active',
    tone: 'blue',
    route: 'command-center',
    relatedPage: 'Command Center',
    description: 'Ingests, cleans, normalizes, and aligns facility, risk, evidence, scoring, vendor, and remediation data into one usable operating picture.',
    demoSignal: 'Facility and protection telemetry normalized into the shared operating view.',
  },
  {
    id: 'facility-protection-profiling',
    label: 'Facility Protection Profiling',
    fullName: 'Facility Protection Profiling',
    status: 'Active',
    tone: 'green',
    route: 'store-profiles',
    relatedPage: 'Store Profiles',
    description: 'Builds a facility-level protection profile showing posture, domain status, risk score, source freshness, recommendations, cases, and evidence state.',
    demoSignal: 'Store WS-X38 protection profile is current and available.',
  },
  {
    id: 'executive-protection-readiness',
    label: 'Executive Protection Readiness',
    fullName: 'Executive Protection Readiness',
    status: 'Watch',
    tone: 'orange',
    route: 'protection-services',
    relatedPage: 'Protection Services',
    description: 'Tracks executive visit readiness, checklist gaps, local posture, site readiness, movement-support considerations, and unresolved protection exceptions.',
    demoSignal: 'Executive readiness checklist still has open exceptions.',
  },
  {
    id: 'fire-system-monitoring-assurance',
    label: 'Fire-System Monitoring & Assurance',
    fullName: 'Fire-System Monitoring & Assurance',
    status: 'Elevated',
    tone: 'orange',
    route: 'protection-services',
    relatedPage: 'Protection Services',
    description: 'Monitors fire/life safety evidence, inspection currency, fire-system assurance gaps, trouble signals, and closure requirements.',
    demoSignal: 'Fire-system inspection evidence needs timely refresh.',
  },
  {
    id: 'camera-technical-control-monitoring',
    label: 'Camera & Technical Control Monitoring',
    fullName: 'Camera & Technical Control Monitoring',
    status: 'High',
    tone: 'red',
    route: 'risk-alerts',
    relatedPage: 'Risk & Alerts',
    description: 'Monitors camera coverage, access control, video health, technical controls, exterior visibility, device gaps, and control failures.',
    demoSignal: 'Camera/control coverage gap is active and tracked.',
  },
  {
    id: 'network-security-device-posture',
    label: 'Network & Security Device Posture',
    fullName: 'Network & Security Device Posture',
    status: 'Watch',
    tone: 'orange',
    route: 'protection-services',
    relatedPage: 'Protection Services',
    description: 'Tracks the posture of security-connected devices, network-dependent systems, connectivity status, device health, and technology readiness.',
    demoSignal: 'Connected security devices are under posture watch.',
  },
  {
    id: 'threat-detection-risk-scoring',
    label: 'Threat Detection & Risk Scoring',
    fullName: 'Threat Detection & Risk Scoring',
    status: 'Active',
    tone: 'blue',
    route: 'risk-alerts',
    relatedPage: 'Risk & Alerts',
    description: 'Turns signals into explainable risk scores using severity, confidence, source freshness, trend, domain impact, and contributing risk drivers.',
    demoSignal: 'Risk scoring model is actively correlating incoming signals.',
  },
  {
    id: 'remediation-orchestration',
    label: 'Remediation Orchestration',
    fullName: 'Remediation Orchestration',
    status: 'Active',
    tone: 'blue',
    route: 'remediation',
    relatedPage: 'Remediation',
    description: 'Converts scored risk into recommended action, owner assignment, case creation, SLA tracking, escalation state, and closure requirements.',
    demoSignal: 'Open remediation actions are orchestrated with owner and SLA tracking.',
  },
  {
    id: 'vendor-intelligence-recommendations',
    label: 'Vendor Intelligence & Recommendations',
    fullName: 'Vendor Intelligence & Recommendations',
    status: 'Active',
    tone: 'green',
    route: 'vendor-match',
    relatedPage: 'Vendor Match',
    description: 'Matches protection needs to vendors and technologies using capability fit, approval status, coverage, SLA, cost band, constraints, and evidence requirements.',
    demoSignal: 'Vendor match guidance is available for active protection needs.',
  },
  {
    id: 'law-enforcement-external-coordination',
    label: 'Law Enforcement / External Coordination',
    fullName: 'Law Enforcement / External Coordination',
    status: 'Demo Safe',
    tone: 'gray',
    route: 'reports',
    relatedPage: 'Reports',
    description: 'Tracks when external coordination, escalation readiness, or public-safety awareness may be needed while keeping sensitive details out of the demo.',
    demoSignal: 'External coordination readiness available. No sensitive contact details shown in demo. Human review required before external escalation.',
  },
  {
    id: 'verification-evidence-closure',
    label: 'Verification & Evidence Closure',
    fullName: 'Verification & Evidence Closure',
    status: 'Active',
    tone: 'green',
    route: 'evidence',
    relatedPage: 'Evidence',
    description: 'Ensures remediation cannot be treated as closed until required evidence is submitted, reviewed, verified, and tied to the case audit trail.',
    demoSignal: 'Evidence verification remains required before closure completion.',
  },
  {
    id: 'dashboarding-governance-executive-reporting',
    label: 'Dashboarding, Governance & Executive Reporting',
    fullName: 'Dashboarding, Governance & Executive Reporting',
    status: 'Active',
    tone: 'blue',
    route: 'reports',
    relatedPage: 'Reports',
    description: 'Provides executive dashboards, reporting summaries, governance controls, decision support, audit readiness, and leadership-level visibility.',
    demoSignal: 'Executive reporting and governance dashboards are active.',
  },
];

window.getOperatingProgramById = function getOperatingProgramById(programId) {
  return (window.fpiOperatingPrograms ?? []).find((program) => program.id === programId) ?? null;
};

window.renderSidebarPrograms = function renderSidebarPrograms() {
  window.renderSidebarNav?.();
};

window.renderProgramControlBoard = function renderProgramControlBoard() {
  const container = document.getElementById('program-control-list');
  if (!container) return;
  const activeProgramId = window.getActiveProgramId?.() ?? '';
  container.innerHTML = (window.fpiOperatingPrograms ?? []).map((program) => `
    <button type="button" class="program-control-btn ${activeProgramId === program.id ? 'active' : ''}" data-program-control="${program.id}" aria-pressed="${activeProgramId === program.id ? 'true' : 'false'}">
      <span class="program-dot tone-${program.tone}"></span>
      <strong>${program.fullName}</strong>
      <small>${window.resolveProgramSignal?.(program.id, program.demoSignal) ?? program.demoSignal}</small>
    </button>
  `).join('');
};

window.renderFpiProgramCoverage = function renderFpiProgramCoverage() {
  const container = document.getElementById('fpi-program-coverage-grid');
  if (!container) return;

  const activeProgramId = window.getActiveProgramId?.() ?? '';
  container.innerHTML = window.fpiOperatingPrograms.map((program) => `
    <article
      class="fpi-program-card ${activeProgramId === program.id ? 'active-program' : ''}"
      id="program-${program.id}"
      data-program-id="${program.id}"
      data-jump-route="${program.route}"
      tabindex="0"
      role="button"
      title="${program.fullName}"
      aria-label="${program.fullName}: ${program.status}"
    >
      <div class="program-card-topline">
        <span class="program-dot tone-${program.tone}"></span>
        <span class="program-badge tone-${program.tone}">${window.resolveProgramStatus?.(program.id, program.status) ?? program.status}</span>
      </div>
      <h3>${program.fullName}</h3>
      <p>${program.description}</p>
      <div class="program-demo-signal">
        <span>Demo signal</span>
        <strong>${window.resolveProgramSignal?.(program.id, program.demoSignal) ?? program.demoSignal}</strong>
      </div>
      <div class="program-card-footer">
        <span>Related page</span>
        <strong>${program.relatedPage}</strong>
      </div>
    </article>
  `).join('');
};

function scrollToProgramCard(programId) {
  const target = programId ? document.getElementById(`program-${programId}`) : null;
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.focus({ preventScroll: true });
}

window.applyPendingProgramScroll = function applyPendingProgramScroll() {
  const pendingProgramId = window.__pendingProgramId;
  if (!pendingProgramId || window.location.hash !== '#/command-center') return;
  window.__pendingProgramId = '';
  window.requestAnimationFrame(() => scrollToProgramCard(pendingProgramId));
};

window.bindFpiProgramNavigation = function bindFpiProgramNavigation() {
  document.querySelectorAll('.fpi-program-card, .program-control-btn').forEach((element) => {
    if (element.dataset.programBound === 'true') return;

    const navigate = () => {
      const programId = element.getAttribute('data-program-id') || element.getAttribute('data-program-control');
      if (programId) {
        window.selectProgramFromUI?.(programId);
        if (window.location.hash === '#/command-center') scrollToProgramCard(programId);
      }
    };

    element.addEventListener('click', navigate);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate();
      }
    });

    element.dataset.programBound = 'true';
  });
};
