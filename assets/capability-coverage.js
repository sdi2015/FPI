window.fpiOperatingPrograms = [
  {
    id: 'data-ingestion',
    label: 'Data Ingestion',
    fullName: 'Data ingestion and normalization',
    status: 'Active',
    tone: 'blue',
    description: 'Normalizes facility, risk, evidence, scoring, and orchestration records into one operating picture.',
    demoSignal: 'Seed, scoring, and orchestration data loaded.',
    route: 'command-center',
    relatedPage: 'Command Center',
  },
  {
    id: 'facility-profile',
    label: 'Facility Profile',
    fullName: 'Facility protection profile',
    status: 'Active',
    tone: 'green',
    description: 'Builds a single facility protection profile with risk, posture, source freshness, and domain status.',
    demoSignal: 'Store WS-X38 protection profile loaded.',
    route: 'store-profiles',
    relatedPage: 'Store Profiles',
  },
  {
    id: 'executive-protection',
    label: 'Executive Protection',
    fullName: 'Executive protection readiness',
    status: 'Watch',
    tone: 'orange',
    description: 'Tracks executive visit readiness, checklist gaps, local posture, and movement-support readiness.',
    demoSignal: 'Upcoming visit readiness incomplete.',
    route: 'protection-services',
    relatedPage: 'Protection Services',
  },
  {
    id: 'fire-assurance',
    label: 'Fire Assurance',
    fullName: 'Fire system monitoring and assurance',
    status: 'Elevated',
    tone: 'orange',
    description: 'Monitors fire/life safety evidence, inspection currency, trouble signals, and assurance gaps.',
    demoSignal: 'Inspection evidence stale.',
    route: 'protection-services',
    relatedPage: 'Protection Services',
  },
  {
    id: 'camera-controls',
    label: 'Camera / Controls',
    fullName: 'Camera and technical control monitoring',
    status: 'High',
    tone: 'red',
    description: 'Monitors camera coverage, access control, technical control health, and visibility gaps.',
    demoSignal: 'Parking lot camera offline.',
    route: 'risk-alerts',
    relatedPage: 'Risk & Alerts',
  },
  {
    id: 'threat-scoring',
    label: 'Threat Scoring',
    fullName: 'Threat detection and risk scoring',
    status: 'Active',
    tone: 'blue',
    description: 'Converts protection signals into explainable risk scores using severity, confidence, freshness, and risk drivers.',
    demoSignal: 'Store WS-X38 risk score increased from 48 Moderate to 72 High.',
    route: 'risk-alerts',
    relatedPage: 'Risk & Alerts',
  },
  {
    id: 'ffp-orchestration',
    label: 'FFP Orchestration',
    fullName: 'Automated FFP / remediation orchestration',
    status: 'Active',
    tone: 'blue',
    description: 'Turns scored risk into recommended action, owner assignment, case creation, SLA tracking, and closure requirements.',
    demoSignal: 'Case RF-56789 created and in progress.',
    route: 'remediation',
    relatedPage: 'Remediation',
  },
  {
    id: 'vendor-intelligence',
    label: 'Vendor Intelligence',
    fullName: 'Vendor intelligence and recommendations',
    status: 'Active',
    tone: 'green',
    description: 'Matches facility needs to vendor and technology options using capability fit, coverage, SLA, constraints, and evidence requirements.',
    demoSignal: 'SecureView Solutions matched with fit score 94.',
    route: 'vendor-match',
    relatedPage: 'Vendor Match',
  },
  {
    id: 'external-coordination',
    label: 'External Coordination',
    fullName: 'Law-enforcement / external coordination',
    status: 'Demo Safe',
    tone: 'gray',
    description: 'Tracks when external coordination, escalation, or public-safety awareness may be needed while keeping sensitive details out of the demo.',
    demoSignal: 'External coordination lane available; no sensitive contact details shown.',
    route: 'reports',
    relatedPage: 'Reports',
  },
  {
    id: 'governance',
    label: 'Governance',
    fullName: 'Verification, dashboard, and governance',
    status: 'Active',
    tone: 'green',
    description: 'Enforces evidence-based closure, dashboard visibility, executive reporting, and governance controls.',
    demoSignal: 'EV-2219 camera health validation required before closure.',
    route: 'evidence',
    relatedPage: 'Evidence',
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
      aria-label="Open ${program.fullName}"
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
      aria-label="Open ${program.fullName}"
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
