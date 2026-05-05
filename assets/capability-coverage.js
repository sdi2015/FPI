window.capabilityCoverage = [
  {
    id: 'ingest-normalize',
    name: 'Data ingestion and normalization',
    shortLabel: 'Ingest & Normalize',
    description: 'Normalizes facility, risk, evidence, scoring, and orchestration records into one operating picture.',
    status: 'Active',
    demoSignal: 'Seed, scoring, and orchestration data loaded.',
    relatedPage: 'Command Center',
    route: 'command-center',
    statusTone: 'blue',
  },
  {
    id: 'facility-profile',
    name: 'Facility protection profile',
    shortLabel: 'Facility Profile',
    description: 'Builds a single protection profile for each facility with risk, posture, source freshness, and domain status.',
    status: 'Active',
    demoSignal: 'Store WS-X38 profile loaded.',
    relatedPage: 'Store Profiles',
    route: 'store-profiles',
    statusTone: 'green',
  },
  {
    id: 'ep-readiness',
    name: 'Executive protection readiness',
    shortLabel: 'EP Readiness',
    description: 'Tracks visit readiness, checklist gaps, local posture, and executive movement support needs.',
    status: 'Watch',
    demoSignal: 'Upcoming visit readiness incomplete.',
    relatedPage: 'Protection Services',
    route: 'protection-services',
    statusTone: 'orange',
  },
  {
    id: 'fire-assurance',
    name: 'Fire system monitoring and assurance',
    shortLabel: 'Fire Assurance',
    description: 'Monitors fire/life safety evidence, inspection currency, trouble signals, and assurance gaps.',
    status: 'Elevated',
    demoSignal: 'Inspection evidence stale.',
    relatedPage: 'Protection Services',
    route: 'protection-services',
    statusTone: 'orange',
  },
  {
    id: 'camera-controls',
    name: 'Camera and technical control monitoring',
    shortLabel: 'Camera / Controls',
    description: 'Monitors camera coverage, technical control health, access control, and visibility gaps.',
    status: 'High',
    demoSignal: 'Parking lot camera offline.',
    relatedPage: 'Risk & Alerts',
    route: 'risk-alerts',
    statusTone: 'red',
  },
  {
    id: 'threat-scoring',
    name: 'Threat detection and risk scoring',
    shortLabel: 'Threat Scoring',
    description: 'Converts signals into explainable risk scores using severity, confidence, source freshness, and drivers.',
    status: 'Active',
    demoSignal: 'Store WS-X38 risk score increased from 48 Moderate to 72 High.',
    relatedPage: 'Risk & Alerts',
    route: 'risk-alerts',
    statusTone: 'blue',
  },
  {
    id: 'ffp-orchestration',
    name: 'Automated FFP / remediation orchestration',
    shortLabel: 'FFP Orchestration',
    description: 'Turns risk signals into recommended actions, owners, cases, SLAs, and closure requirements.',
    status: 'Active',
    demoSignal: 'Case RF-56789 created and in progress.',
    relatedPage: 'Remediation',
    route: 'remediation',
    statusTone: 'blue',
  },
  {
    id: 'vendor-intelligence',
    name: 'Vendor intelligence and recommendations',
    shortLabel: 'Vendor Intelligence',
    description: 'Matches facility needs to vendor or technology options using capability fit, coverage, SLA, constraints, and evidence requirements.',
    status: 'Active',
    demoSignal: 'SecureView Solutions matched with fit score 94.',
    relatedPage: 'Vendor Match',
    route: 'vendor-match',
    statusTone: 'green',
  },
  {
    id: 'external-coordination',
    name: 'Law-enforcement / external coordination',
    shortLabel: 'External Coordination',
    description: 'Tracks when external coordination, escalation, or public-safety awareness may be needed while keeping sensitive details out of the demo.',
    status: 'Demo Safe',
    demoSignal: 'External coordination lane available; no sensitive contact details shown.',
    relatedPage: 'Reports',
    route: 'reports',
    statusTone: 'gray',
  },
  {
    id: 'verification-governance',
    name: 'Verification, dashboard, and governance',
    shortLabel: 'Verification / Governance',
    description: 'Enforces evidence-based closure, executive reporting, dashboard visibility, and governance controls.',
    status: 'Active',
    demoSignal: 'EV-2219 camera health validation required before closure.',
    relatedPage: 'Evidence',
    route: 'evidence',
    statusTone: 'green',
  },
];

window.renderSidebarOperatingLayers = function renderSidebarOperatingLayers() {
  const container = document.getElementById('sidebar-operating-layers');
  if (!container) return;

  container.innerHTML = window.capabilityCoverage.map((capability) => `
    <button
      class="sidebar-capability-item"
      type="button"
      data-capability-id="${capability.id}"
      data-route="${capability.route}"
      aria-label="Open ${capability.name}"
    >
      <span class="sidebar-capability-dot status-${capability.statusTone}"></span>
      <span class="sidebar-capability-label">${capability.shortLabel}</span>
      <span class="sidebar-capability-status">${capability.status}</span>
    </button>
  `).join('');
};

window.renderCapabilityCoverage = function renderCapabilityCoverage() {
  const container = document.getElementById('capability-coverage-grid');
  if (!container) return;

  container.innerHTML = window.capabilityCoverage.map((capability) => `
    <article
      class="capability-card"
      id="capability-${capability.id}"
      data-capability-id="${capability.id}"
      data-route="${capability.route}"
      tabindex="0"
      role="button"
      aria-label="Open ${capability.name}"
    >
      <div class="capability-card-header">
        <span class="capability-status-dot status-${capability.statusTone}"></span>
        <span class="status-badge status-${capability.statusTone}">${capability.status}</span>
      </div>
      <h3>${capability.name}</h3>
      <p>${capability.description}</p>
      <div class="capability-demo-signal">
        <span class="capability-meta-label">Demo signal</span>
        <span>${capability.demoSignal}</span>
      </div>
      <div class="capability-card-footer">
        <span>Related page</span>
        <strong>${capability.relatedPage}</strong>
      </div>
    </article>
  `).join('');
};

function scrollToCapabilityCard(capabilityId) {
  const target = capabilityId ? document.getElementById(`capability-${capabilityId}`) : null;
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.focus({ preventScroll: true });
}

window.applyPendingCapabilityScroll = function applyPendingCapabilityScroll() {
  const pendingCapabilityId = window.__pendingCapabilityId;
  if (!pendingCapabilityId || window.location.hash !== '#/command-center') return;
  window.__pendingCapabilityId = '';
  window.requestAnimationFrame(() => scrollToCapabilityCard(pendingCapabilityId));
};

window.bindCapabilityNavigation = function bindCapabilityNavigation() {
  const elements = document.querySelectorAll('[data-capability-id], .capability-card');
  elements.forEach((element) => {
    if (element.dataset.capabilityBound === 'true') return;

    const handleNavigate = () => {
      const capabilityId = element.getAttribute('data-capability-id');
      const route = element.getAttribute('data-route');
      const isSidebarItem = element.classList.contains('sidebar-capability-item');

      if (isSidebarItem && capabilityId) {
        window.__pendingCapabilityId = capabilityId;
        if (typeof window.setRoute === 'function') {
          window.setRoute('command-center');
        }
        if (window.location.hash === '#/command-center') {
          window.applyPendingCapabilityScroll?.();
        }
        return;
      }

      if (route && typeof window.setRoute === 'function') {
        window.setRoute(route);
      }
      if (window.location.hash === '#/command-center' && capabilityId) {
        scrollToCapabilityCard(capabilityId);
      }
    };

    element.addEventListener('click', handleNavigate);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleNavigate();
      }
    });

    element.dataset.capabilityBound = 'true';
  });
};
