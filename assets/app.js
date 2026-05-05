const seedUrl = './data/seed/fpi-seed-region75.json';
const scoringUrl = './scoring/scoring-output-region75.json';
const orchestrationUrl = './orchestration/orchestration-output-region75.json';

const byId = (id) => document.getElementById(id);
const routes = ['landing', 'command-center', 'store-profiles', 'protection-services', 'risk-alerts', 'remediation', 'vendor-match', 'evidence', 'reports', 'demo-mode'];

function dataView() {
  return state.dataSnapshot ?? state.lastGoodSnapshot ?? { seed: {}, scoring: {}, orchestration: {} };
}

function kpiTemplate() {
  const { seed = {}, scoring = {}, orchestration = {} } = dataView();
  const facilities = seed.facilities?.length ?? 0;
  const highRisk = scoring.tier === 'Critical' || scoring.tier === 'Elevated' ? 1 : 0;
  const remediations = seed.remediations ?? [];
  const openCases = remediations.filter((item) => item.status !== 'Closed').length;
  const verifiedClosures = (seed.evidence ?? []).filter((item) => item.status === 'Verified').length;
  const fireGaps = (seed.technology_issues ?? []).filter((item) => item.domain === 'Fire Alarm' && item.status !== 'Normal').length;
  const execExceptions = (orchestration.draft_actions ?? []).filter((item) => item.priority === 'P1-Critical').length;
  return [
    ['Facilities Monitored', facilities],
    ['High-Risk Facilities', highRisk],
    ['Open Remediation Cases', openCases],
    ['Verified Closures', verifiedClosures],
    ['Fire/Life Safety Gaps', fireGaps],
    ['Executive Readiness Exceptions', execExceptions],
    ['Detection-to-Case Time', '42 min'],
    ['Vendor SLA Misses', 2],
  ];
}

const scopeProfiles = {
  'store-ws-x38': {
    label: 'Store WS-X38',
    risk: '72 HIGH',
    confidence: '91%',
    updated: '8 minutes ago',
    freshness: 'Fresh',
    state: 'Current State: Active risk; remediation in progress.',
    summary: 'A parking lot camera outage and stale fire evidence are driving the current High posture. A remediation case exists and is awaiting verified closure evidence.',
  },
  'demo-portfolio': {
    label: 'Demo Portfolio',
    risk: '68 ELEVATED',
    confidence: '89%',
    updated: '12 minutes ago',
    freshness: 'Fresh',
    state: 'Current State: Elevated multi-site risk; prioritized actions in progress.',
    summary: 'Portfolio risk is concentrated in perimeter visibility and evidence quality. Teams should focus on top drivers and preserve verified closure discipline.',
  },
  'region-delta': {
    label: 'Region Delta',
    risk: '66 ELEVATED',
    confidence: '88%',
    updated: '15 minutes ago',
    freshness: 'Fresh',
    state: 'Current State: Elevated regional risk; remediation coordination in flight.',
    summary: 'Regional posture is elevated due to multi-site signal degradation and open verification dependencies.',
  },
  'market-north': {
    label: 'Market North',
    risk: '64 ELEVATED',
    confidence: '87%',
    updated: '17 minutes ago',
    freshness: 'Fresh',
    state: 'Current State: Elevated market risk; owner lanes actively engaged.',
    summary: 'Risk is elevated due to recurring signal degradation and pending verification tasks across two facilities.',
  },
  'multi-store-alpha': {
    label: 'Multi-Store Alpha',
    risk: '59 MEDIUM',
    confidence: '88%',
    updated: '14 minutes ago',
    freshness: 'Fresh',
    state: 'Current State: Medium risk; prevention and verification workflow active.',
    summary: 'This scope is stable but still has open evidence review items and one executive readiness exception.',
  },
};

const domainCards = [
  ['Physical Security', 'Degraded', 'Parking lot camera offline', 'High', 'Restore camera coverage'],
  ['Fire & Life Safety', 'Evidence Gap', 'Inspection evidence stale', 'Elevated', 'Open fire playbook'],
  ['Executive Protection', 'Watch', 'Upcoming visit; readiness incomplete', 'Medium', 'Complete readiness checklist'],
  ['Guard Services', 'At Risk', 'Guard coverage below standard', 'Medium', 'Review coverage plan'],
  ['Access Control', 'Degraded', 'Back door reader offline', 'Elevated', 'Create remediation case'],
  ['Incident Intelligence', 'Elevated', 'Repeat events in 30-day window', 'Medium', 'Review pattern and mitigation'],
];

const remediationFlow = ['Detected', 'Recommended', 'Case Created', 'Assigned', 'In Progress', 'Completed', 'Verified', 'Closed'];
const evidenceStatuses = ['Missing', 'Submitted', 'Under Review', 'Verified', 'Rejected', 'Expired'];

const demoSteps = [
  { title: 'Signal Detected', note: 'Parking lot camera offline signal appears for Store WS-X38.', score: '48 Moderate' },
  { title: 'Risk Score Updated', note: 'Risk score increases after correlation with recent incident patterns.', score: '72 High' },
  { title: 'Recommendation Generated', note: 'FPI recommends restoring parking lot camera coverage immediately.', score: '72 High' },
  { title: 'Vendor / Technology Matched', note: 'SecureView Solutions matched with fit score 94 for this scenario.', score: '72 High' },
  { title: 'Remediation Case Created', note: 'Case RF-56789 created and assigned to Security Technology owner lane.', score: '72 High' },
  { title: 'Evidence Submitted', note: 'Evidence EV-2219 submitted for post-repair camera health validation.', score: '72 High' },
  { title: 'Closure Verified', note: 'Evidence verified by reviewer; closure is now eligible.', score: '55 Medium' },
  { title: 'Executive Summary Generated', note: 'Summary confirms controlled closure with verified evidence.', score: '55 Medium' },
];

const askPromptChips = window.askPromptChips ?? [
  'Why is this high risk?',
  'Summarize this facility.',
  'Recommend next action.',
];

const state = {
  scope: 'store-ws-x38',
  dataSnapshot: null,
  lastGoodSnapshot: null,
  lastRefreshAt: null,
  refreshInFlight: false,
  refreshError: '',
  demoStep: -1,
};

function loadJson(url) {
  return fetch(url, { cache: 'no-store' }).then((response) => {
    if (!response.ok) throw new Error(`Unable to load ${url}`);
    return response.json();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateSnapshot(snapshot) {
  const { seed, scoring, orchestration } = snapshot;
  assert(seed && typeof seed === 'object', 'Invalid seed payload.');
  assert(scoring && typeof scoring === 'object', 'Invalid scoring payload.');
  assert(orchestration && typeof orchestration === 'object', 'Invalid orchestration payload.');

  ['facilities', 'risk_assessments', 'technology_issues', 'remediations', 'evidence', 'source_freshness'].forEach((field) => {
    assert(Array.isArray(seed[field]), `Seed missing required array: ${field}`);
  });
  assert(Array.isArray(scoring.top_drivers), 'Scoring missing required array: top_drivers');
  assert(Array.isArray(orchestration.draft_actions), 'Orchestration missing required array: draft_actions');

  const seedFacilityId = seed.facilities[0]?.facility_id;
  assert(seedFacilityId, 'Seed facility_id is missing.');
  assert(seedFacilityId === scoring.facility_id, 'Scoring facility_id mismatch.');
  assert(seedFacilityId === orchestration.facility_id, 'Orchestration facility_id mismatch.');

  const remediationIds = new Set(seed.remediations.map((item) => item.remediation_id));
  seed.technology_issues.forEach((issue) => {
    if (issue.creates_remediation_id && issue.creates_remediation_id !== 'none') {
      assert(remediationIds.has(issue.creates_remediation_id), `Technology issue references unknown remediation_id: ${issue.creates_remediation_id}`);
    }
  });
  seed.evidence.forEach((item) => {
    assert(remediationIds.has(item.remediation_id), `Evidence references unknown remediation_id: ${item.remediation_id}`);
  });
}

function renderRefreshStatus() {
  const stamp = byId('refresh-last-updated');
  const banner = byId('refresh-warning-banner');
  const button = byId('refresh-data-button');
  if (!stamp || !banner || !button) return;

  button.disabled = state.refreshInFlight;
  button.textContent = state.refreshInFlight ? 'Refreshing…' : 'Refresh Data';
  stamp.textContent = state.lastRefreshAt
    ? `Last refresh: ${new Date(state.lastRefreshAt).toLocaleString()}`
    : 'Last refresh: not yet loaded';

  banner.classList.toggle('hidden', !state.refreshError);
  banner.textContent = state.refreshError || '';
}

async function refreshData() {
  if (state.refreshInFlight) return;
  state.refreshInFlight = true;
  renderRefreshStatus();

  try {
    const [seed, scoring, orchestration] = await Promise.all([
      loadJson(seedUrl),
      loadJson(scoringUrl),
      loadJson(orchestrationUrl),
    ]);
    const nextSnapshot = { seed, scoring, orchestration };
    validateSnapshot(nextSnapshot);

    state.dataSnapshot = nextSnapshot;
    state.lastGoodSnapshot = nextSnapshot;
    state.lastRefreshAt = new Date().toISOString();
    state.refreshError = '';
    renderAll();
  } catch (error) {
    state.refreshError = `Refresh failed. Keeping last verified snapshot. ${error.message}`;
    if (!state.lastGoodSnapshot) renderError(error.message);
  } finally {
    state.refreshInFlight = false;
    renderRefreshStatus();
  }
}

function activeScope() {
  return scopeProfiles[state.scope] ?? scopeProfiles['store-ws-x38'];
}

function createBadge(value) {
  const slug = String(value).toLowerCase().replace(/\s+/g, '-');
  return `<span class="badge ${slug}">${value}</span>`;
}

function createStackRows(containerId, rows) {
  const container = byId(containerId);
  if (!container) return;
  container.classList.add('stack');
  container.innerHTML = rows.map((row) => `
    <article>
      <h4>${row.title}</h4>
      <p>${row.body}</p>
      ${row.badge ? createBadge(row.badge) : ''}
    </article>
  `).join('');
}

function animateNumber(element, targetValue) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    element.textContent = String(targetValue);
    return;
  }

  const durationMs = 520;
  const start = performance.now();
  const step = (timestamp) => {
    const progress = Math.min(1, (timestamp - start) / durationMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(targetValue * eased));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderKpis() {
  const grid = byId('kpi-grid');
  if (!grid) return;
  grid.innerHTML = kpiTemplate().map(([label, value]) => {
    const rawValue = String(value);
    const isWholeNumber = /^\d+$/.test(rawValue);
    const numericAttr = isWholeNumber ? `data-kpi-value="${rawValue}"` : '';
    return `
      <article class="section-card kpi-tile">
        <p>${label}</p>
        <strong ${numericAttr}>${value}</strong>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('strong[data-kpi-value]').forEach((node) => {
    animateNumber(node, Number.parseInt(node.dataset.kpiValue, 10));
  });
}

function renderCommandCenter() {
  const scope = activeScope();
  const { scoring = {}, orchestration = {} } = dataView();
  const liveRisk = scoring.score != null && scoring.tier ? `${scoring.score} ${String(scoring.tier).toUpperCase()}` : scope.risk;
  byId('selected-scope-pill').textContent = `Selected Scope: ${scope.label}`;
  byId('selected-risk-pill').textContent = `Risk Score: ${liveRisk}`;
  byId('command-center-summary').textContent = `${scope.label} is currently in active monitoring. See It → Score It → Solve It → Secure It remains the operating loop for this scope.`;

  const facilities = [
    { title: 'Store WS-X38', body: 'Camera outage + evidence dependency', badge: 'High' },
    { title: 'Store WS-B21', body: 'Access control instability', badge: 'Elevated' },
    { title: 'Store WS-C44', body: 'Executive readiness exception', badge: 'Medium' },
  ];
  createStackRows('priority-facilities', facilities);

  const drivers = (scoring.top_drivers ?? []).map((driver) => ({
    title: driver.label,
    body: driver.explanation,
    badge: `${driver.points} pts`,
  }));
  createStackRows('top-risk-drivers', drivers.length ? drivers : [{ title: 'Risk drivers loading', body: 'No drivers available.', badge: 'Medium' }]);

  const verification = [
    { title: 'Evidence Verified', body: '18 closures validated with accepted evidence.', badge: 'Verified' },
    { title: 'Evidence Pending Review', body: '2 submissions require reviewer confirmation.', badge: 'Under Review' },
    { title: 'Evidence Missing', body: '1 case blocked pending camera health validation.', badge: 'Missing' },
  ];
  createStackRows('verification-status', verification);

  const queue = (orchestration.draft_actions ?? []).map((item) => ({
    title: item.title.replace('synthetic ', ''),
    body: `${item.owner_role} · ${item.recommended_next_step}`,
    badge: item.priority.replace('P1-Critical', 'High').replace('P2-High', 'Elevated'),
  }));
  createStackRows('remediation-queue', queue);

  byId('command-center-insight').textContent = `${scope.label}: highest urgency is parking lot visibility restoration with verified evidence enforcement before closure.`;
}

function renderStoreProfile() {
  const scope = activeScope();
  const { scoring = {} } = dataView();
  const liveRisk = scoring.score != null && scoring.tier ? `${scoring.score} ${String(scoring.tier).toUpperCase()}` : scope.risk;
  byId('store-name').textContent = scope.label;
  byId('store-risk').textContent = liveRisk;
  byId('store-confidence').textContent = scoring.confidence ? String(scoring.confidence) : scope.confidence;
  byId('store-updated').textContent = state.lastRefreshAt ? new Date(state.lastRefreshAt).toLocaleTimeString() : scope.updated;
  byId('store-freshness').textContent = scope.freshness;
  byId('store-state').textContent = scope.state;
  byId('risk-summary-copy').textContent = scope.summary;
  byId('store-insight').textContent = `For ${scope.label}, closure remains blocked until EV-2219 camera health validation is verified by reviewer.`;

  const domainGrid = byId('domain-grid');
  domainGrid.innerHTML = domainCards.map(([domain, status, signal, risk, action]) => `
    <article class="domain-card">
      <h4>${domain}</h4>
      ${createBadge(status)}
      <p><strong>Signal:</strong> ${signal}</p>
      <p><strong>Risk:</strong> ${risk}</p>
      <p><strong>Action:</strong> ${action}</p>
    </article>
  `).join('');

  const caseStatuses = remediationFlow.map((step, index) => {
    const cls = index < 5 ? 'done' : index === 5 ? 'active' : '';
    return `<li class="${cls}">${step}</li>`;
  }).join('');
  byId('case-status-stepper').innerHTML = caseStatuses;

  const timeline = [
    ['Detection logged', 'done'],
    ['Case RF-56789 created', 'done'],
    ['Repair completed by SecureView Solutions', 'done'],
    ['Evidence EV-2219 submitted', 'active'],
    ['Reviewer verification required before closure', ''],
  ].map(([label, cls]) => `<li class="${cls}">${label}</li>`).join('');
  byId('evidence-timeline').innerHTML = timeline;
}

function renderProtectionServices() {
  const cards = byId('protection-service-cards');
  cards.innerHTML = domainCards.map(([domain, status, signal, risk, action]) => `
    <article class="domain-card">
      <h4>${domain}</h4>
      ${createBadge(status)}
      <p>${signal}</p>
      <p>Risk posture: ${risk}</p>
      <p>Owner action: ${action}</p>
    </article>
  `).join('');
}

function renderRiskAlerts() {
  const rows = [
    { title: 'Alert: Camera outage persistence', body: 'Parking lot visibility gap remains active beyond standard threshold.', badge: 'High' },
    { title: 'Alert: Evidence quality risk', body: 'Fire & Life Safety evidence age is beyond preferred recency target.', badge: 'Elevated' },
    { title: 'Alert: Executive readiness watch', body: 'Upcoming visit readiness pack is not complete.', badge: 'Medium' },
  ];
  createStackRows('risk-alert-list', rows);
}

function renderRemediation() {
  const flow = byId('remediation-flow');
  flow.innerHTML = remediationFlow.map((step, index) => {
    const cls = index < 5 ? 'done' : index === 5 ? 'active' : '';
    return `<li class="${cls}">${step}</li>`;
  }).join('');

  const cases = byId('remediation-cases');
  cases.innerHTML = `
    <article class="case-card">
      <h3>Case RF-56789</h3>
      <p>Owner: Security Technology</p>
      <p>Status: In Progress</p>
      <p>Evidence Status: Under Review</p>
      <p>Closure eligibility: blocked pending verified evidence.</p>
    </article>
    <article class="case-card">
      <h3>Case RF-56802</h3>
      <p>Owner: Fire & Life Safety</p>
      <p>Status: Assigned</p>
      <p>Evidence Status: Missing</p>
      <p>Closure eligibility: blocked pending evidence submission.</p>
    </article>
  `;
}

function renderVendorMatch() {
  byId('vendor-match-primary').innerHTML = `
    <h3>Primary recommendation</h3>
    <p><strong>Vendor:</strong> SecureView Solutions</p>
    <p><strong>Fit Score:</strong> 94</p>
    <p><strong>Recommended For:</strong> Camera outage / parking lot coverage gap</p>
    <p><strong>Rationale:</strong> Approved camera restoration capability, demo-region coverage, strong SLA history, and clear evidence requirement.</p>
    <p><strong>Constraint:</strong> Final vendor dispatch and procurement approval remain human-owned decisions.</p>
    <p><strong>Evidence Required:</strong> Post-repair camera health validation.</p>
  `;
}

function renderEvidence() {
  const cards = byId('evidence-status-cards');
  cards.innerHTML = evidenceStatuses.map((status) => `
    <article class="section-card inner-card">
      <h3>${status}</h3>
      <p>${status === 'Verified' ? 'Eligible for closure progression.' : 'Requires workflow attention based on case state.'}</p>
      ${createBadge(status)}
    </article>
  `).join('');
}

function renderReports() {
  const scope = activeScope();
  const reports = byId('reports-summary');
  reports.innerHTML = `
    <article class="section-card inner-card">
      <h3>Executive snapshot</h3>
      <p>${scope.label} risk posture: ${scope.risk}. Confidence ${scope.confidence}. Verified closure discipline is active.</p>
    </article>
    <article class="section-card inner-card">
      <h3>Operational summary</h3>
      <p>Top action remains parking lot camera restoration with reviewer-verified evidence before closure.</p>
    </article>
  `;
}

function renderDemoMode() {
  const statRow = byId('demo-scenario-stats');
  const currentStep = state.demoStep >= 0 ? demoSteps[state.demoStep] : null;
  statRow.innerHTML = `
    <article><strong>Initial Risk Score</strong><p>48 Moderate</p></article>
    <article><strong>Updated Risk Score</strong><p>${currentStep ? currentStep.score : '72 High'}</p></article>
    <article><strong>Vendor Match</strong><p>SecureView Solutions</p></article>
    <article><strong>Case / Evidence</strong><p>RF-56789 / EV-2219</p></article>
  `;

  byId('demo-stepper').innerHTML = demoSteps.map((step, index) => {
    const cls = index < state.demoStep ? 'done' : index === state.demoStep ? 'active' : '';
    return `<li class="${cls}">${index + 1}. ${step.title}</li>`;
  }).join('');

  byId('demo-narrator').textContent = currentStep
    ? currentStep.note
    : 'Press Start Scenario to begin the guided walkthrough.';
}

function askResponse(prompt) {
  const scope = activeScope().label;
  const responses = typeof window.askResponseMap === 'function'
    ? window.askResponseMap(scope)
    : {
      'Why is this high risk?': `${scope} is high risk because camera visibility is degraded, repeat incident context is elevated, and closure evidence is not yet verified.`,
      'Summarize this facility.': `${scope} has active remediation in progress, one critical visibility gap, and evidence controls preventing premature closure.`,
      'Recommend next action.': 'Prioritize restoring parking lot camera coverage, keep case RF-56789 in progress, and push EV-2219 to verified status.',
    };
  return responses[prompt] ?? 'No response template found.';
}

function renderAskFpiChips() {
  const chips = byId('ask-fpi-chips');
  chips.innerHTML = askPromptChips.map((chip) => `<button type="button" data-chip="${chip}">${chip}</button>`).join('');
}

function openAskPanel() {
  const panel = byId('ask-fpi-panel');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  byId('ask-fpi-context').textContent = `Context: ${activeScope().label}`;
}

function closeAskPanel() {
  const panel = byId('ask-fpi-panel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

function setRoute(route) {
  const next = routes.includes(route) ? route : 'command-center';
  window.location.hash = next === 'landing' ? '#/' : `#/${next}`;
}
window.setRoute = setRoute;

function currentRoute() {
  const hash = window.location.hash || '#/';
  return hash === '#/' ? 'landing' : (hash.replace('#/', '') || 'landing');
}

function applyRouting() {
  const route = currentRoute();
  const shell = byId('workspace-shell');
  const landing = byId('landing-page');
  const fab = byId('ask-fpi-fab');

  const showLanding = route === 'landing';
  landing.classList.toggle('hidden', !showLanding);
  shell.classList.toggle('hidden', showLanding);
  fab.classList.toggle('hidden', showLanding);

  document.querySelectorAll('.app-page').forEach((page) => {
    page.classList.toggle('route-active', page.dataset.route === route);
  });

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#/${route}`);
  });

  window.applyPendingCapabilityScroll?.();
}

function bindEvents() {
  byId('enter-command-center')?.addEventListener('click', () => setRoute('command-center'));
  byId('run-demo-scenario')?.addEventListener('click', () => setRoute('demo-mode'));
  byId('landing-ask-fpi')?.addEventListener('click', () => { setRoute('command-center'); openAskPanel(); });

  byId('scope-select')?.addEventListener('change', (event) => {
    state.scope = event.target.value;
    renderAll();
  });
  byId('refresh-data-button')?.addEventListener('click', refreshData);

  ['open-ask-fpi', 'ask-fpi-fab'].forEach((id) => byId(id)?.addEventListener('click', openAskPanel));
  byId('close-ask-fpi')?.addEventListener('click', closeAskPanel);

  document.body.addEventListener('click', (event) => {
    const chipButton = event.target.closest('[data-chip]');
    if (chipButton) {
      byId('ask-fpi-response').textContent = askResponse(chipButton.dataset.chip);
      return;
    }

    if (event.target.closest('.inline-open-ask')) {
      openAskPanel();
      return;
    }

    const jumpButton = event.target.closest('[data-jump-route]');
    if (jumpButton) {
      setRoute(jumpButton.dataset.jumpRoute);
    }
  });

  byId('demo-start')?.addEventListener('click', () => { state.demoStep = 0; renderDemoMode(); });
  byId('demo-next')?.addEventListener('click', () => {
    state.demoStep = Math.min(demoSteps.length - 1, state.demoStep + 1);
    renderDemoMode();
  });
  byId('demo-reset')?.addEventListener('click', () => { state.demoStep = -1; renderDemoMode(); });
  byId('demo-generate-summary')?.addEventListener('click', () => {
    state.demoStep = demoSteps.length - 1;
    renderDemoMode();
    byId('demo-narrator').textContent = 'Executive Summary: Signal detected, risk elevated, action assigned, vendor matched, evidence verified, and closure controlled.';
  });

  window.addEventListener('hashchange', applyRouting);
}

function renderAll() {
  window.renderSidebarOperatingLayers?.();
  renderKpis();
  window.renderCapabilityCoverage?.();
  renderCommandCenter();
  renderStoreProfile();
  renderProtectionServices();
  renderRiskAlerts();
  renderRemediation();
  renderVendorMatch();
  renderEvidence();
  renderReports();
  renderDemoMode();
  renderAskFpiChips();
  window.bindCapabilityNavigation?.();
  renderRefreshStatus();
}

function renderError(message) {
  byId('main-content').innerHTML = `
    <section class="section-card">
      <h2>Unable to load Facility Protection Intelligence data</h2>
      <p>${message}</p>
    </section>
  `;
}

bindEvents();
refreshData()
  .then(() => {
    if (!window.location.hash) window.location.hash = '#/';
    applyRouting();
  })
  .catch((error) => {
    console.error(error);
    renderError(error.message);
  });
