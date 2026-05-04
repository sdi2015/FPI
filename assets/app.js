const seedUrl = './data/seed/fpi-seed-region75.json';
const scoringUrl = './scoring/scoring-output-region75.json';
const orchestrationUrl = './orchestration/orchestration-output-region75.json';
const serviceVerticalsUrl = './assets/service-verticals.json';

const byId = (id) => document.getElementById(id);
const text = (value, fallback = 'Not available') => value ?? fallback;
let currentWorkQueueItems = [];

function setText(id, value) {
  const element = byId(id);
  if (element) {
    element.textContent = value;
  }
}

function statusClass(value = '') {
  return String(value).replace(/\s+/g, '-');
}

function createItem({ title, body, status, meta }) {
  const article = document.createElement('article');
  article.className = `item ${statusClass(status)}`.trim();

  const heading = document.createElement('h3');
  heading.textContent = title;
  article.appendChild(heading);

  if (body) {
    const paragraph = document.createElement('p');
    paragraph.textContent = body;
    article.appendChild(paragraph);
  }

  if (meta) {
    const metaText = document.createElement('p');
    metaText.className = 'muted';
    metaText.textContent = meta;
    article.appendChild(metaText);
  }

  if (status) {
    const badge = document.createElement('span');
    badge.className = 'status';
    badge.textContent = status;
    article.appendChild(badge);
  }

  return article;
}

function replaceChildren(id, children) {
  const element = byId(id);
  if (!element) return;
  if (!children.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No synthetic records available for this section.';
    element.replaceChildren(empty);
    return;
  }
  element.replaceChildren(...children);
}

async function loadJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load ${url}: ${response.status}`);
  }
  return response.json();
}

async function loadDashboardData() {
  const [seed, scoring, orchestration, serviceVerticalConfig] = await Promise.all([
    loadJson(seedUrl),
    loadJson(scoringUrl),
    loadJson(orchestrationUrl),
    loadJson(serviceVerticalsUrl),
  ]);
  return {
    seed,
    scoring,
    orchestration,
    serviceVerticals: serviceVerticalConfig.service_verticals ?? [],
  };
}

function renderExplainableDrivers(scoring) {
  const items = scoring.top_drivers.map((driver) => {
    const li = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = driver.label;
    const explanation = document.createElement('p');
    explanation.textContent = driver.explanation;
    const meta = document.createElement('p');
    meta.className = 'muted';
    meta.textContent = `FPI-004 contribution +${driver.points} · Sources: ${driver.source_ids.length ? driver.source_ids.join(', ') : 'local synthetic evidence'}`;
    li.append(title, explanation, meta);
    return li;
  });
  byId('risk-drivers').replaceChildren(...items);
}

function currentProgramTier(scoring) {
  if (scoring.score >= 90) return 'High Priority';
  if (scoring.score >= 75) return 'Priority Watch';
  if (scoring.score >= 50) return 'Monitor';
  return 'Routine';
}

function renderExplainableScore(scoring) {
  const programTier = currentProgramTier(scoring);
  setText('risk-score', scoring.score);
  setText('risk-tier', `${programTier} · ${scoring.tier} Model Tier`);
  setText('risk-confidence', `Confidence: ${scoring.confidence} · Raw score ${scoring.raw_score}`);
  setText('scoring-version', `Scoring version: ${scoring.scoring_version}`);
  setText('program-posture-metric', programTier);
  setText('explainable-score', scoring.score);
  setText('explainable-tier', scoring.tier);
  setText('explainable-confidence', scoring.confidence);
  setText('explainable-note', `${scoring.contributions.length} visible factors · Top drivers exclude baseline context so the demo shows actionable risk drivers.`);
  setText('risk-meaning', `${programTier} means users should review the top drivers, assign the highest-priority draft action, and confirm evidence before treating the issue as closed.`);
}

function renderUserGuidance({ scoring, orchestration, evidence }) {
  const programTier = currentProgramTier(scoring);
  const topDriver = scoring.top_drivers[0];
  const topAction = currentWorkQueueItems[0] ?? orchestration.draft_actions[0];
  const evidenceGaps = evidence.filter((item) => item.status === 'Missing' || item.status === 'Rejected');
  const topDriverText = topDriver ? topDriver.label.toLowerCase() : 'the highest visible driver';
  const actionText = topAction ? `${topAction.title} (${topAction.priority})` : 'review the highest-priority local draft action';
  const ownerText = topAction ? (topAction.ownerRole ?? topAction.owner_role) : 'the accountable owner';

  setText('next-action-copy', `${programTier}: start with ${topDriverText}, then use the draft action queue to assign ownership and collect verification evidence.`);
  setText('next-action-posture', `${programTier} posture with ${scoring.confidence} confidence and ${scoring.top_drivers.length} visible top drivers.`);
  setText('next-action-owner', `${actionText}. Recommended owner lane: ${ownerText}.`);
  setText('next-action-proof', evidenceGaps.length
    ? `${evidenceGaps.length} evidence gap${evidenceGaps.length === 1 ? '' : 's'} need proof before closure is credible.`
    : 'No missing or rejected evidence is currently shown in the synthetic preview.');
}

function priorityRank(priority = '') {
  if (priority.includes('P1') || priority.includes('Critical')) return 1;
  if (priority.includes('P2') || priority.includes('High')) return 2;
  if (priority.includes('P3') || priority.includes('Medium')) return 3;
  return 4;
}

function findEvidenceForAction(action, evidence) {
  const sourceEvidenceId = action.source_factor_id?.replace('evidence-', '');
  const directEvidence = evidence.find((record) => record.evidence_id === sourceEvidenceId);
  if (directEvidence) return directEvidence;

  return evidence.find((record) => {
    const actionWords = action.title.toLowerCase();
    return actionWords.includes(record.remediation_id.replace('rem-region75-', '').replace(/-/g, ' '))
      || record.evidence_type.toLowerCase().split(' ').some((word) => word.length > 4 && actionWords.includes(word));
  });
}

function categoryForAction(action) {
  const content = `${action.title} ${action.source_label} ${action.owner_role}`.toLowerCase();
  if (content.includes('evidence')) return 'evidence';
  if (content.includes('vms') || content.includes('camera') || content.includes('technology')) return 'technology';
  if (content.includes('fire')) return 'technology';
  return 'operations';
}

function buildWorkQueue({ scoring, orchestration, evidence }) {
  return orchestration.draft_actions
    .map((action) => {
      const matchingDriver = scoring.top_drivers.find((driver) => driver.factor_id === action.source_factor_id);
      const matchingEvidence = findEvidenceForAction(action, evidence);
      const needsEvidence = action.verification_required || ['Missing', 'Rejected'].includes(matchingEvidence?.status);
      return {
        id: action.action_id,
        title: action.title,
        priority: action.priority,
        ownerRole: action.owner_role,
        status: action.status,
        sourceLabel: action.source_label,
        driverPoints: matchingDriver?.points ?? 0,
        recommendedNextStep: action.recommended_next_step,
        evidenceStatus: matchingEvidence?.status ?? 'Not attached',
        needsEvidence,
        category: categoryForAction(action),
      };
    })
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || b.driverPoints - a.driverPoints);
}

function workQueueMatchesFilter(item, filter) {
  if (filter === 'critical') return priorityRank(item.priority) === 1;
  if (filter === 'evidence') return item.needsEvidence;
  if (filter === 'technology') return item.category === 'technology';
  return true;
}

function renderWorkQueue(filter = 'all') {
  const filteredItems = currentWorkQueueItems.filter((item) => workQueueMatchesFilter(item, filter));
  const totalEvidenceNeeded = currentWorkQueueItems.filter((item) => item.needsEvidence).length;
  setText('work-queue-summary', `${currentWorkQueueItems.length} draft actions · ${totalEvidenceNeeded} need proof`);

  replaceChildren('work-queue-list', filteredItems.map((item) => {
    const article = document.createElement('article');
    article.className = `work-item ${statusClass(item.priority)} ${item.needsEvidence ? 'Needs-Evidence' : ''}`.trim();

    const header = document.createElement('div');
    header.className = 'work-item-header';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const badge = document.createElement('span');
    badge.className = 'status';
    badge.textContent = item.priority;
    header.append(title, badge);

    const source = document.createElement('p');
    source.className = 'muted';
    source.textContent = `Driver: ${item.sourceLabel}${item.driverPoints ? ` · +${item.driverPoints} score impact` : ''}`;

    const nextStep = document.createElement('p');
    nextStep.textContent = item.recommendedNextStep;

    const footer = document.createElement('div');
    footer.className = 'work-item-footer';
    footer.append(
      createInlineBadge(`Owner: ${item.ownerRole}`),
      createInlineBadge(`Status: ${item.status}`),
      createInlineBadge(`Evidence: ${item.evidenceStatus}`),
    );

    article.append(header, source, nextStep, footer);
    return article;
  }));
}

function createInlineBadge(label) {
  const badge = document.createElement('span');
  badge.className = 'mini-badge';
  badge.textContent = label;
  return badge;
}

function renderOwnerLanes(workItems) {
  const ownerMap = workItems.reduce((accumulator, item) => {
    accumulator[item.ownerRole] = accumulator[item.ownerRole] ?? { total: 0, critical: 0, evidence: 0 };
    accumulator[item.ownerRole].total += 1;
    accumulator[item.ownerRole].critical += priorityRank(item.priority) === 1 ? 1 : 0;
    accumulator[item.ownerRole].evidence += item.needsEvidence ? 1 : 0;
    return accumulator;
  }, {});

  replaceChildren('owner-lane-list', Object.entries(ownerMap).map(([owner, counts]) => {
    const article = document.createElement('article');
    article.className = 'lane-card';
    const heading = document.createElement('h3');
    heading.textContent = owner;
    const summary = document.createElement('p');
    summary.textContent = `${counts.total} draft action${counts.total === 1 ? '' : 's'} · ${counts.critical} critical · ${counts.evidence} need proof`;
    article.append(heading, summary);
    return article;
  }));
}

function renderDataStatus({ seed, scoring, orchestration, serviceVerticals }) {
  const records = [
    ['Seed data', `${seed.facilities.length} facility · ${seed.technology_issues.length} technology signals`],
    ['Scoring output', `${scoring.score} score · ${scoring.top_drivers.length} top drivers`],
    ['Orchestration output', `${orchestration.draft_actions.length} local draft actions`],
    ['Service vertical config', `${serviceVerticals.length} coverage lanes`],
  ];

  replaceChildren('data-status-list', records.map(([title, body]) => createItem({
    title,
    body,
    status: 'Loaded',
    meta: 'Local folder source',
  })));
}

function setupWorkQueueFilters() {
  const filterContainer = byId('work-queue-filters');
  if (!filterContainer) return;

  filterContainer.addEventListener('click', (event) => {
    const button = event.target.closest('[data-queue-filter]');
    if (!button) return;
    filterContainer.querySelectorAll('.filter-button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    renderWorkQueue(button.dataset.queueFilter);
  });
}

function renderDraftActions(orchestration) {
  setText('draft-action-count', orchestration.draft_actions.length);
  setText('adapter-mode-pill', orchestration.adapter_mode);
  setText('guardrail-note', orchestration.guardrail_note);

  replaceChildren('draft-action-list', orchestration.draft_actions.map((action) => createItem({
    title: action.title,
    body: action.recommended_next_step,
    status: action.priority,
    meta: `${action.action_id} · ${action.owner_role} · ${action.status} · ${action.adapter_mode} · Verification required: ${action.verification_required ? 'Yes' : 'No'}`,
  })));
}

function renderServiceVerticals(serviceVerticals) {
  setText('service-vertical-count', serviceVerticals.length);

  replaceChildren('service-vertical-list', serviceVerticals.map((vertical) => {
    const article = createItem({
      title: vertical.name,
      body: vertical.summary,
      status: vertical.status,
      meta: `Signals: ${vertical.currentSignals.join(' · ')}`,
    });
    article.classList.add('vertical-card');
    return article;
  }));
}

function renderExecutiveView({ facility, scoring, orchestration, issues, evidence }) {
  const programTier = currentProgramTier(scoring);
  const actionCount = orchestration.draft_actions.length;
  const verificationGaps = evidence.filter((item) => item.status === 'Missing' || item.status === 'Rejected').length;
  const degradedSignals = issues.filter((item) => item.status !== 'Normal').length;

  setText('executive-summary-copy', `${facility.display_name} is shown as ${programTier} in this synthetic preview because FPI can connect health signals, evidence gaps, and draft remediation into one explainable program view.`);
  setText('exec-program-posture', `${programTier}`);
  setText('exec-action-focus', `${actionCount} draft actions`);
  setText('exec-verification-state', `${verificationGaps} evidence gap${verificationGaps === 1 ? '' : 's'} · ${degradedSignals} degraded signal${degradedSignals === 1 ? '' : 's'}`);
}

function renderDashboard({ seed, scoring, orchestration, serviceVerticals }) {
  const facility = seed.facilities[0];
  const issues = seed.technology_issues.filter((item) => item.facility_id === facility.facility_id);
  const remediations = seed.remediations.filter((item) => item.facility_id === facility.facility_id);
  const evidence = seed.evidence.filter((item) => item.facility_id === facility.facility_id);
  const incidents = seed.incidents.filter((item) => item.facility_id === facility.facility_id);

  setText('facility-title', facility.display_name);
  setText('facility-subtitle', `${facility.mock_location} · ${facility.protection_status} · Program status: ${currentProgramTier(scoring)} · ${facility.data_mode ?? 'Synthetic demo'}`);
  setText('facility-code', facility.region_code ?? facility.reference_code);
  setText('facility-type', facility.facility_type);
  setText('issue-count', issues.length);
  setText('open-remediation-count', remediations.filter((item) => item.status !== 'Closed').length);
  setText('evidence-gap-count', evidence.filter((item) => item.status === 'Missing' || item.status === 'Rejected').length);

  currentWorkQueueItems = buildWorkQueue({ scoring, orchestration, evidence });

  renderExplainableScore(scoring);
  renderExplainableDrivers(scoring);
  renderDraftActions(orchestration);
  renderServiceVerticals(serviceVerticals);
  renderExecutiveView({ facility, scoring, orchestration, issues, evidence });
  renderWorkQueue();
  renderOwnerLanes(currentWorkQueueItems);
  renderDataStatus({ seed, scoring, orchestration, serviceVerticals });
  renderUserGuidance({ scoring, orchestration, evidence });

  replaceChildren('technology-issues', issues.map((issue) => createItem({
    title: `${issue.domain}: ${issue.status}`,
    body: issue.summary,
    status: issue.status,
    meta: `Source: ${issue.source_id}`,
  })));

  replaceChildren('remediation-queue', remediations.map((remediation) => createItem({
    title: remediation.title,
    body: `Owner: ${remediation.owner_role}`,
    status: remediation.status,
    meta: `Verification required: ${remediation.verification_required ? 'Yes' : 'No'}`,
  })));

  replaceChildren('evidence-list', evidence.map((record) => createItem({
    title: record.evidence_type,
    body: record.synthetic_note,
    status: record.status,
    meta: `Remediation: ${record.remediation_id}`,
  })));

  replaceChildren('source-freshness', seed.source_freshness.map((source) => createItem({
    title: source.source_label,
    body: `${source.adapter_mode} · Last demo update ${text(source.last_demo_update)}`,
    status: source.freshness_status,
  })));

  replaceChildren('incident-list', incidents.map((incident) => createItem({
    title: incident.incident_type,
    body: incident.synthetic_summary,
    status: incident.severity,
    meta: `Occurred: ${new Date(incident.occurred_at).toLocaleString()}`,
  })));
}

function renderError(error) {
  byId('main-content').replaceChildren();
  const panel = document.createElement('section');
  panel.className = 'panel error-panel';
  const heading = document.createElement('h2');
  heading.textContent = 'Unable to load FPI dashboard data';
  const body = document.createElement('p');
  body.textContent = error.message;
  const help = document.createElement('p');
  help.className = 'muted';
  help.textContent = 'Start the local server by double-clicking run_localhost.bat, then open http://127.0.0.1:8765/';
  panel.append(heading, body, help);
  byId('main-content').appendChild(panel);
}

setupWorkQueueFilters();

loadDashboardData()
  .then(renderDashboard)
  .catch((error) => {
    console.error(error);
    renderError(error);
  });
