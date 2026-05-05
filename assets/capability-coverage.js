window.fpiOperatingPrograms = [
  {
    id: 'data-ingestion-normalization',
    label: 'Ingestion & Normalization',
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
    label: 'Facility Profiling',
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
    label: 'EP Readiness',
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
    label: 'Fire Assurance',
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
    label: 'Camera / Controls',
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
    label: 'Network / Device Posture',
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
    label: 'Threat Scoring',
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
    label: 'Remediation',
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
    label: 'Vendor Intelligence',
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
    label: 'External Coordination',
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
    label: 'Evidence Closure',
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
    label: 'Governance / Reporting',
    fullName: 'Dashboarding, Governance & Executive Reporting',
    status: 'Active',
    tone: 'blue',
    route: 'reports',
    relatedPage: 'Reports',
    description: 'Provides executive dashboards, reporting summaries, governance controls, decision support, audit readiness, and leadership-level visibility.',
    demoSignal: 'Executive reporting and governance dashboards are active.',
  },
];

window.renderSidebarPrograms = function renderSidebarPrograms() {
  const container = document.getElementById('sidebar-program-list');
  if (!container) return;

  container.innerHTML = window.fpiOperatingPrograms.map((program) => `
    <button
      type="button"
      class="sidebar-program-item"
      data-jump-route="${program.route}"
      data-program-id="${program.id}"
      title="${program.fullName}"
      aria-label="${program.fullName}: ${program.status}"
    >
      <span class="program-dot tone-${program.tone}"></span>
      <span class="program-label">${program.label}</span>
      <span class="program-status">${program.status}</span>
    </button>
  `).join('');
};

window.renderFpiProgramCoverage = function renderFpiProgramCoverage() {
  const container = document.getElementById('fpi-program-coverage-grid');
  if (!container) return;

  container.innerHTML = window.fpiOperatingPrograms.map((program) => `
    <article
      class="fpi-program-card"
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
        <span class="program-badge tone-${program.tone}">${program.status}</span>
      </div>
      <h3>${program.fullName}</h3>
      <p>${program.description}</p>
      <div class="program-demo-signal">
        <span>Demo signal</span>
        <strong>${program.demoSignal}</strong>
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
  document.querySelectorAll('.sidebar-program-item, .fpi-program-card').forEach((element) => {
    if (element.dataset.programBound === 'true') return;

    const navigate = () => {
      const route = element.getAttribute('data-jump-route');
      const programId = element.getAttribute('data-program-id');
      const isSidebarItem = element.classList.contains('sidebar-program-item');

      if (isSidebarItem && route === 'command-center' && programId) {
        window.__pendingProgramId = programId;
        if (typeof window.setRoute === 'function') {
          window.setRoute('command-center');
        }
        window.applyPendingProgramScroll?.();
        return;
      }

      if (route && typeof window.setRoute === 'function') {
        window.setRoute(route);
      } else if (route && typeof window.setActivePage === 'function') {
        window.setActivePage(route);
      } else if (route && typeof window.navigateToRoute === 'function') {
        window.navigateToRoute(route);
      }

      if (window.location.hash === '#/command-center' && programId) {
        scrollToProgramCard(programId);
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
