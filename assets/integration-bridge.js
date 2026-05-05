const integrationUrls = {
  chrisr: './data/integration/chrisr-tech-health-normalized.json',
  chrise: './data/integration/chrise-fire-controls-normalized.json',
  jacob: './data/integration/jacob-union-slice.json',
};

window.__integrationContext = { chrisr: null, chrise: null, jacob: null };
window.__integrationSummary = '';
window.__programSignalOverrides = {};
window.__programStatusOverrides = {};

function loadJsonSafe(url) {
  return fetch(url, { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);
}

function mergeUniqueById(base = [], incoming = [], key = 'issue_id') {
  const seen = new Set(base.map((item) => item?.[key]));
  const merged = [...base];
  incoming.forEach((item) => {
    if (!item || seen.has(item[key])) return;
    seen.add(item[key]);
    merged.push(item);
  });
  return merged;
}

window.mergeIntegrationSnapshot = async function mergeIntegrationSnapshot(snapshot) {
  const [chrisr, chrise, jacob] = await Promise.all([
    loadJsonSafe(integrationUrls.chrisr),
    loadJsonSafe(integrationUrls.chrise),
    loadJsonSafe(integrationUrls.jacob),
  ]);

  window.__integrationContext = { chrisr, chrise, jacob };
  const syncStamps = [chrisr?.source_meta, chrise?.source_meta, jacob?.source_meta]
    .filter(Boolean)
    .map((meta) => `${meta.owner}: ${new Date(meta.synced_at).toLocaleTimeString()}`);
  window.__integrationSummary = syncStamps.length
    ? `Workspace overlays synced (${syncStamps.join(' | ')})`
    : 'Workspace overlays not available; using base snapshot.';

  const merged = {
    seed: { ...(snapshot.seed ?? {}) },
    scoring: { ...(snapshot.scoring ?? {}) },
    orchestration: { ...(snapshot.orchestration ?? {}) },
  };

  merged.seed.technology_issues = mergeUniqueById(
    merged.seed.technology_issues ?? [],
    chrisr?.technology_issues ?? [],
    'issue_id',
  );
  merged.seed.source_freshness = mergeUniqueById(
    merged.seed.source_freshness ?? [],
    chrisr?.source_freshness ?? [],
    'source_id',
  );

  const fireIssue = chrise?.fire_controls?.[0]
    ? {
      issue_id: `tech-fire-${chrise.fire_controls[0].control_id}`,
      facility_id: chrise.fire_controls[0].facility_id,
      domain: 'Fire Alarm',
      status: chrise.fire_controls[0].status,
      severity: 'High',
      summary: chrise.fire_controls[0].summary,
      source_id: 'src-fire-controls-normalized',
      confidence: chrise.fire_controls[0].confidence,
      freshness_status: chrise.fire_controls[0].freshness_status,
      creates_remediation_id: 'rem-region75-fire-evidence',
      risk_driver_ids: ['driver-fire-evidence-gap'],
      role_visibility: ['Executive', 'Field Operations', 'Fire/Life Safety'],
    }
    : null;
  if (fireIssue) {
    merged.seed.technology_issues = mergeUniqueById(merged.seed.technology_issues, [fireIssue], 'issue_id');
  }

  const fireDriver = chrise?.risk_driver_overrides?.[0];
  if (fireDriver) {
    merged.scoring.top_drivers = mergeUniqueById(
      merged.scoring.top_drivers ?? [],
      [{ label: fireDriver.label, points: fireDriver.points, explanation: fireDriver.explanation }],
      'label',
    );
  }

  const jacobActions = (jacob?.task_queue ?? []).map((task, index) => ({
    draft_action_id: `draft-jacob-${index + 1}`,
    title: task.summary,
    owner_role: task.owner_lane,
    priority: task.priority === 'Critical' ? 'P1-Critical' : task.priority === 'High' ? 'P2-High' : 'P3-Medium',
    domain: task.program,
    recommended_next_step: task.summary,
  }));
  merged.orchestration.draft_actions = mergeUniqueById(
    merged.orchestration.draft_actions ?? [],
    jacobActions,
    'draft_action_id',
  );

  window.refreshIntegrationProgramSignals?.(merged);
  return merged;
};

window.refreshIntegrationProgramSignals = function refreshIntegrationProgramSignals(view) {
  const issues = view?.seed?.technology_issues ?? [];
  const fireIssue = issues.find((item) => item.domain === 'Fire Alarm' && item.status !== 'Normal');
  const cameraIssue = issues.find((item) => item.domain === 'Camera/VMS' && item.status !== 'Normal');
  const networkIssue = issues.find((item) => item.domain === 'Network/Security Device' && item.status !== 'Normal');
  const verificationPending = (window.__integrationContext.jacob?.verification ?? []).some((item) => item.state !== 'Verified');

  window.__programSignalOverrides = {
    'fire-system-monitoring-assurance': fireIssue?.summary,
    'camera-technical-control-monitoring': cameraIssue?.summary,
    'network-security-device-posture': networkIssue?.summary,
    'verification-evidence-closure': verificationPending
      ? 'Verification is pending and required before closure can proceed.'
      : undefined,
    'dashboarding-governance-executive-reporting': 'Executive reporting now includes integrated technology, fire, and verification slices.',
  };

  window.__programStatusOverrides = {
    'fire-system-monitoring-assurance': fireIssue ? 'Elevated' : undefined,
    'camera-technical-control-monitoring': cameraIssue ? 'High' : undefined,
    'network-security-device-posture': networkIssue ? 'Watch' : undefined,
    'verification-evidence-closure': verificationPending ? 'Active' : undefined,
  };
};

window.resolveProgramSignal = function resolveProgramSignal(programId, fallback) {
  return window.__programSignalOverrides?.[programId] ?? fallback;
};

window.resolveProgramStatus = function resolveProgramStatus(programId, fallback) {
  return window.__programStatusOverrides?.[programId] ?? fallback;
};

window.getIntegratedRiskAlerts = function getIntegratedRiskAlerts() {
  const issues = window.__integrationContext?.chrisr?.technology_issues ?? [];
  const fire = window.__integrationContext?.chrise?.fire_controls?.[0];
  return [
    { title: 'Alert: Camera coverage degradation', body: issues.find((item) => item.domain === 'Camera/VMS')?.summary ?? 'Camera visibility gap remains active.', badge: 'High' },
    { title: 'Alert: Fire evidence assurance', body: fire?.summary ?? 'Fire-system evidence requires review.', badge: 'Elevated' },
    { title: 'Alert: Device posture watch', body: issues.find((item) => item.domain === 'Network/Security Device')?.summary ?? 'Network/security device posture remains under watch.', badge: 'Medium' },
  ];
};

window.getIntegratedCommandCenterData = function getIntegratedCommandCenterData() {
  const jacob = window.__integrationContext?.jacob ?? {};
  const tasks = jacob.task_queue ?? [];
  const verification = jacob.verification ?? [];
  const criticalTasks = tasks.filter((item) => item.priority === 'Critical');
  const highTasks = tasks.filter((item) => item.priority === 'High');
  const blockedTasks = tasks.filter((item) => item.status === 'Blocked');

  return {
    priorityFacilities: [
      { title: 'Critical work queue', body: criticalTasks[0]?.summary ?? 'No critical items in current Jacob slice.', badge: 'High' },
      { title: 'High-priority queue', body: highTasks[0]?.summary ?? 'No high-priority items in current Jacob slice.', badge: 'Elevated' },
      { title: 'Blocked queue', body: blockedTasks[0]?.summary ?? 'No blocked items in current Jacob slice.', badge: 'Medium' },
    ],
    verification: [
      { title: 'Evidence Verified', body: 'Verified evidence can advance closure when all controls pass.', badge: 'Verified' },
      { title: 'Evidence Pending Review', body: verification.filter((item) => item.state === 'Under Review').length ? `${verification.filter((item) => item.state === 'Under Review').length} verification item(s) require review.` : 'No pending verification items.', badge: 'Under Review' },
      { title: 'Evidence Missing', body: tasks.filter((item) => item.evidence_required).length ? `${tasks.filter((item) => item.evidence_required).length} queue item(s) require evidence capture.` : 'No evidence-required queue items.', badge: 'Missing' },
    ],
    insightText: `Integrated Chris R, Chris E, and Jacob slices are active: technology posture, fire assurance, and verification governance are now feeding command-center context. ${window.__integrationSummary}`,
  };
};

window.getJacobRiskDrivers = function getJacobRiskDrivers() {
  return window.__integrationContext?.jacob?.risk_drivers ?? [];
};

window.getJacobRemediationCards = function getJacobRemediationCards() {
  return (window.__integrationContext?.jacob?.task_queue ?? []).slice(0, 2).map((task) => ({
    title: task.task_id,
    owner: task.owner_lane,
    status: task.status,
    evidence: task.evidence_required ? 'Required' : 'Not Required',
    summary: task.summary,
  }));
};

window.getJacobReportSummary = function getJacobReportSummary() {
  const jacob = window.__integrationContext?.jacob ?? {};
  const summary = jacob.executive_summary ?? {};
  const queue = jacob.queue_summary ?? {};
  const nextSteps = jacob.leadership_next_steps ?? [];
  const playbooks = jacob.playbooks ?? [];
  const roleVisibility = jacob.role_visibility ?? [];

  return {
    executiveText: `${summary.facility_context ?? 'Region 75 synthetic portfolio'} · Sources: ${summary.source_count ?? 0} · Risk drivers: ${summary.risk_driver_count ?? 0} · Work queue: ${summary.work_queue_count ?? 0}`,
    operationalText: `Queue total ${queue.total ?? 0}; critical ${queue.critical ?? 0}; blocked ${queue.blocked ?? 0}; pending verification ${queue.pending_verification ?? 0}.`,
    governanceText: nextSteps[0] ?? 'Leadership next-step guidance not available.',
    playbookText: playbooks.length ? `${playbooks[0].name} (${playbooks[0].step_count} steps) — ${playbooks[0].trigger}` : 'No playbook data in current Jacob slice.',
    roleText: roleVisibility.length ? `${roleVisibility[0].label}: ${roleVisibility[0].scope}` : 'Role-visibility summary not available.',
  };
};

window.getIntegrationSummary = function getIntegrationSummary() {
  return window.__integrationSummary || 'Workspace overlays not available; using base snapshot.';
};
