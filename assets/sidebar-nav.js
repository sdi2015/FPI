const sidebarStorageKey = 'fpi.sidebar.nav.state';
const sidebarDefaultState = {
  expanded: { commandCenter: true, programs: true, modules: true },
  activeAnchor: 'cc-executive-overview',
  activeProgramId: '',
};

const commandCenterLinks = [
  { id: 'cc-executive-overview', label: 'Executive Overview' },
  { id: 'kpi-grid', label: 'KPI Summary' },
  { id: 'cc-priority-queue', label: 'Priority Queue' },
  { id: 'cc-verification-status', label: 'Verification Status' },
  { id: 'fpi-program-coverage', label: 'Program Coverage' },
];

const moduleLinks = [
  { route: 'store-profiles', label: 'Store Profiles' },
  { route: 'protection-services', label: 'Protection Services' },
  { route: 'risk-alerts', label: 'Risk & Alerts' },
  { route: 'remediation', label: 'Remediation' },
  { route: 'vendor-match', label: 'Vendor Match' },
  { route: 'evidence', label: 'Evidence' },
  { route: 'reports', label: 'Reports' },
  { route: 'demo-mode', label: 'Demo Mode' },
];

const programKeywordMap = {
  'fire-system-monitoring-assurance': ['fire', 'inspection', 'deficiencies', 'trouble'],
  'camera-technical-control-monitoring': ['camera', 'vms', 'visibility'],
  'network-security-device-posture': ['network', 'device', 'connectivity'],
  'threat-detection-risk-scoring': ['risk', 'driver', 'score'],
  'remediation-orchestration': ['case', 'remediation', 'queue', 'owner'],
  'vendor-intelligence-recommendations': ['vendor', 'fit', 'sla'],
  'verification-evidence-closure': ['evidence', 'verification', 'closure'],
};

function loadSidebarState() {
  try {
    const persisted = JSON.parse(window.localStorage.getItem(sidebarStorageKey) || '{}');
    return {
      expanded: { ...sidebarDefaultState.expanded, ...(persisted.expanded || {}) },
      activeAnchor: persisted.activeAnchor || sidebarDefaultState.activeAnchor,
      activeProgramId: persisted.activeProgramId || '',
    };
  } catch {
    return { ...sidebarDefaultState };
  }
}

window.__sidebarNavState = loadSidebarState();

function persistSidebarState() {
  window.localStorage.setItem(sidebarStorageKey, JSON.stringify(window.__sidebarNavState));
}

function scrollToAnchor(anchorId) {
  const target = document.getElementById(anchorId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderProgramChildren() {
  const programs = window.fpiOperatingPrograms ?? [];
  return programs.map((program) => {
    const active = window.__sidebarNavState.activeProgramId === program.id ? 'active' : '';
    return `
      <button type="button" class="sidebar-child-btn ${active}" data-sidebar-program="${program.id}" aria-pressed="${active ? 'true' : 'false'}">
        <span class="program-dot tone-${program.tone}"></span>${program.label}
      </button>
    `;
  }).join('');
}

window.renderSidebarNav = function renderSidebarNav() {
  const root = document.getElementById('sidebar-nav-root');
  if (!root) return;
  const state = window.__sidebarNavState;

  root.innerHTML = `
    <section class="sidebar-group">
      <button type="button" class="sidebar-group-toggle" data-sidebar-group="commandCenter" aria-expanded="${state.expanded.commandCenter}" aria-controls="sidebar-command-center">Command Center</button>
      <div id="sidebar-command-center" class="sidebar-group-content ${state.expanded.commandCenter ? '' : 'hidden'}">
        ${commandCenterLinks.map((item) => `<button type="button" class="sidebar-child-btn ${state.activeAnchor === item.id ? 'active' : ''}" data-cc-anchor="${item.id}">${item.label}</button>`).join('')}
      </div>
    </section>

    <section class="sidebar-group">
      <button type="button" class="sidebar-group-toggle" data-sidebar-group="programs" aria-expanded="${state.expanded.programs}" aria-controls="sidebar-programs">Protection Intelligence Programs</button>
      <div id="sidebar-programs" class="sidebar-group-content ${state.expanded.programs ? '' : 'hidden'}">${renderProgramChildren()}</div>
    </section>

    <section class="sidebar-group">
      <button type="button" class="sidebar-group-toggle" data-sidebar-group="modules" aria-expanded="${state.expanded.modules}" aria-controls="sidebar-modules">Operational Views</button>
      <div id="sidebar-modules" class="sidebar-group-content ${state.expanded.modules ? '' : 'hidden'}">
        ${moduleLinks.map((item) => `<a class="nav-link" href="#/${item.route}">${item.label}</a>`).join('')}
      </div>
    </section>
  `;
};

window.setActiveProgramContext = function setActiveProgramContext(programId) {
  window.__sidebarNavState.activeProgramId = programId || '';
  persistSidebarState();
};

window.getActiveProgramId = function getActiveProgramId() {
  return window.__sidebarNavState.activeProgramId || '';
};

window.getActiveProgramKeywords = function getActiveProgramKeywords() {
  const id = window.getActiveProgramId();
  return programKeywordMap[id] ?? [];
};

window.selectProgramFromUI = function selectProgramFromUI(programId) {
  if (!programId) return;
  window.setActiveProgramContext(programId);
  window.__sidebarNavState.activeAnchor = 'fpi-program-coverage';
  persistSidebarState();
  if (typeof window.setRoute === 'function') window.setRoute('command-center');
  window.__pendingProgramId = programId;
  window.requestAnimationFrame(() => {
    window.applyPendingProgramScroll?.();
    scrollToAnchor('fpi-program-coverage');
    window.renderAll?.();
  });
};

window.syncSidebarNavRoute = function syncSidebarNavRoute(route) {
  document.querySelectorAll('#sidebar-nav-root .nav-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#/${route}`);
  });
};

window.bindSidebarNav = function bindSidebarNav() {
  const root = document.getElementById('sidebar-nav-root');
  if (!root || root.dataset.boundSidebarNav === 'true') return;

  root.addEventListener('click', (event) => {
    const groupToggle = event.target.closest('[data-sidebar-group]');
    if (groupToggle) {
      const key = groupToggle.dataset.sidebarGroup;
      window.__sidebarNavState.expanded[key] = !window.__sidebarNavState.expanded[key];
      persistSidebarState();
      window.renderSidebarNav();
      window.syncSidebarNavRoute?.(window.location.hash.replace('#/', '') || 'landing');
      return;
    }

    const ccAnchor = event.target.closest('[data-cc-anchor]');
    if (ccAnchor) {
      const anchorId = ccAnchor.dataset.ccAnchor;
      window.__sidebarNavState.activeAnchor = anchorId;
      persistSidebarState();
      if (typeof window.setRoute === 'function') window.setRoute('command-center');
      window.requestAnimationFrame(() => {
        scrollToAnchor(anchorId);
        window.renderSidebarNav();
        window.syncSidebarNavRoute?.('command-center');
      });
      return;
    }

    const programBtn = event.target.closest('[data-sidebar-program]');
    if (programBtn) {
      window.selectProgramFromUI(programBtn.dataset.sidebarProgram);
    }
  });

  root.dataset.boundSidebarNav = 'true';
};
