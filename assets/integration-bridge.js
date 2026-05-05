const integrationUrls = {
  chrisr: './data/integration/chrisr-tech-health-normalized.json',
  chrise: './data/integration/chrise-fire-controls-normalized.json',
  jacob: './data/integration/jacob-union-slice.json',
  scopeCatalog: './data/integration/scope-catalog-ui.json',
  crosswalk: './data/integration/facility-crosswalk.json',
};

window.__integrationContext = { chrisr: null, chrise: null, jacob: null, scopeCatalog: null, crosswalk: null };
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

function resolveScopeRecord(scopeId) {
  return (window.__integrationContext?.scopeCatalog?.scopes ?? []).find((item) => item.id === scopeId) ?? null;
}

function scopeTaskQueue(scopeId) {
  const scope = resolveScopeRecord(scopeId);
  const tasks = window.__integrationContext?.jacob?.task_queue ?? [];
  if (!scope) return tasks;

  return tasks.filter((task) => {
    if (scope.type === 'region') return scope.region && task.region === scope.region;
    if (scope.type === 'market') return scope.market && task.market === scope.market;
    if (scope.type === 'store') {
      if (scope.id && task.scope_id) return task.scope_id === scope.id;
      if (scope.site_id && task.site_id) return String(task.site_id) === String(scope.site_id);
      return false;
    }
    return true;
  });
}

function scopeVerification(scopeId) {
  const tasks = scopeTaskQueue(scopeId);
  return tasks.map((task) => ({
    verification_id: `ver-${task.task_id}`,
    state: task.verification_required ? 'Under Review' : 'Not Required',
    evidence_required: !!task.evidence_required,
  }));
}

window.mergeIntegrationSnapshot = async function mergeIntegrationSnapshot(snapshot) {
  const [chrisr, chrise, jacob, scopeCatalog, crosswalk] = await Promise.all([
    loadJsonSafe(integrationUrls.chrisr),
    loadJsonSafe(integrationUrls.chrise),
    loadJsonSafe(integrationUrls.jacob),
    loadJsonSafe(integrationUrls.scopeCatalog),
    loadJsonSafe(integrationUrls.crosswalk),
  ]);

  window.__integrationContext = { chrisr, chrise, jacob, scopeCatalog, crosswalk };
  const syncStamps = [chrisr?.source_meta, chrise?.source_meta, jacob?.source_meta, scopeCatalog?.source_meta, crosswalk?.source_meta]
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

window.getIntegratedRiskAlerts = function getIntegratedRiskAlerts(scopeId) {
  const scope = resolveScopeRecord(scopeId);
  const issues = window.__integrationContext?.chrisr?.technology_issues ?? [];
  const fire = window.__integrationContext?.chrise?.fire_controls?.[0];
  const sites = window.__integrationContext?.chrise?.sites ?? [];
  const scopeSite = scope?.site_id ? sites.find((site) => String(site.site_id) === String(scope.site_id)) : null;

  return [
    { title: 'Alert: Camera coverage degradation', body: issues.find((item) => item.domain === 'Camera/VMS')?.summary ?? 'Camera visibility gap remains active.', badge: 'High' },
    { title: 'Alert: Fire evidence assurance', body: scopeSite ? `${scopeSite.name} fire profile shows risk ${scopeSite.risk_score} with ${scopeSite.open_deficiencies} open deficiencies.` : (fire?.summary ?? 'Fire-system evidence requires review.'), badge: 'Elevated' },
    { title: 'Alert: Device posture watch', body: issues.find((item) => item.domain === 'Network/Security Device')?.summary ?? 'Network/security device posture remains under watch.', badge: 'Medium' },
  ];
};

window.getIntegratedCommandCenterData = function getIntegratedCommandCenterData(scopeId) {
  const scope = resolveScopeRecord(scopeId);
  const tasks = scopeTaskQueue(scopeId);
  const verification = scopeVerification(scopeId);
  const criticalTasks = tasks.filter((item) => item.priority === 'Critical');
  const highTasks = tasks.filter((item) => item.priority === 'High');
  const blockedTasks = tasks.filter((item) => item.status === 'Blocked');

  return {
    priorityFacilities: [
      { title: 'Critical work queue', body: criticalTasks[0]?.summary ?? 'No critical items in selected scope.', badge: 'High' },
      { title: 'High-priority queue', body: highTasks[0]?.summary ?? 'No high-priority items in selected scope.', badge: 'Elevated' },
      { title: 'Blocked queue', body: blockedTasks[0]?.summary ?? 'No blocked items in selected scope.', badge: 'Medium' },
    ],
    verification: [
      { title: 'Evidence Verified', body: 'Verified evidence can advance closure when all controls pass.', badge: 'Verified' },
      { title: 'Evidence Pending Review', body: verification.filter((item) => item.state === 'Under Review').length ? `${verification.filter((item) => item.state === 'Under Review').length} verification item(s) require review.` : 'No pending verification items.', badge: 'Under Review' },
      { title: 'Evidence Missing', body: verification.filter((item) => item.evidence_required).length ? `${verification.filter((item) => item.evidence_required).length} queue item(s) require evidence capture.` : 'No evidence-required queue items.', badge: 'Missing' },
    ],
    insightText: `Scope-aware overlay active for ${scope?.label ?? 'selected scope'} using Chris R, Chris E, and Jacob data feeds. ${window.__integrationSummary}`,
  };
};

window.getJacobRiskDrivers = function getJacobRiskDrivers() {
  return window.__integrationContext?.jacob?.risk_drivers ?? [];
};

window.getJacobRemediationCards = function getJacobRemediationCards(scopeId) {
  return scopeTaskQueue(scopeId).slice(0, 4).map((task) => ({
    title: task.task_id,
    owner: task.owner_lane,
    status: task.status,
    evidence: task.evidence_required ? 'Required' : 'Not Required',
    summary: `${task.summary}${task.market ? ` · ${task.market}` : ''}`,
  }));
};

window.getJacobReportSummary = function getJacobReportSummary(scopeId) {
  const scope = resolveScopeRecord(scopeId);
  const jacob = window.__integrationContext?.jacob ?? {};
  const summary = jacob.executive_summary ?? {};
  const queue = scopeTaskQueue(scopeId);
  const nextSteps = jacob.leadership_next_steps ?? [];
  const playbooks = jacob.playbooks ?? [];
  const roleVisibility = jacob.role_visibility ?? [];

  return {
    executiveText: `${scope?.label ?? summary.facility_context ?? 'Region 75 synthetic portfolio'} · Sources: ${summary.source_count ?? 0} · Risk drivers: ${summary.risk_driver_count ?? 0} · Scoped queue: ${queue.length}`,
    operationalText: `Queue total ${queue.length}; critical ${queue.filter((task) => task.priority === 'Critical').length}; blocked ${queue.filter((task) => task.status === 'Blocked').length}; pending verification ${queue.filter((task) => task.verification_required).length}.`,
    governanceText: nextSteps[0] ?? 'Leadership next-step guidance not available.',
    playbookText: playbooks.length ? `${playbooks[0].name} (${playbooks[0].step_count} steps) — ${playbooks[0].trigger}` : 'No playbook data in current Jacob slice.',
    roleText: roleVisibility.length ? `${roleVisibility[0].label}: ${roleVisibility[0].scope}` : 'Role-visibility summary not available.',
  };
};

window.getScopeCatalog = function getScopeCatalog() {
  return window.__integrationContext?.scopeCatalog?.scopes ?? [];
};

window.getScopeProfile = function getScopeProfile(scopeId, fallback) {
  const found = window.getScopeCatalog().find((item) => item.id === scopeId);
  if (!found) return fallback;
  return {
    label: found.label,
    risk: found.risk || fallback.risk,
    confidence: found.confidence || fallback.confidence,
    updated: 'from synced team dataset',
    freshness: 'Fresh',
    state: `Current State: ${found.type} scope is active in the integrated dataset.`,
    summary: found.summary || fallback.summary,
  };
};

window.getScopeDomainCards = function getScopeDomainCards(scopeId) {
  const scope = resolveScopeRecord(scopeId);
  const tasks = scopeTaskQueue(scopeId);
  const sites = window.__integrationContext?.chrise?.sites ?? [];
  const site = scope?.site_id ? sites.find((item) => String(item.site_id) === String(scope.site_id)) : null;

  return [
    ['Physical Security', tasks.some((item) => item.risk_type?.toLowerCase().includes('camera')) ? 'Degraded' : 'Watch', tasks[0]?.summary ?? 'No scoped physical security task in current queue.', tasks.some((item) => item.priority === 'Critical') ? 'High' : 'Medium', 'Review scoped remediation queue'],
    ['Fire & Life Safety', site && site.open_deficiencies > 0 ? 'Evidence Gap' : 'Watch', site ? `${site.name} deficiencies=${site.open_deficiencies}, active troubles=${site.active_troubles}` : 'No scoped fire-site record matched.', site && site.risk_score >= 70 ? 'High' : 'Elevated', 'Open fire assurance controls'],
    ['Executive Protection', 'Watch', scope?.region ? `Regional posture active for ${scope.region}` : 'Regional posture context unavailable.', 'Medium', 'Apply role-based readiness checklist'],
  ];
};

window.getIntegrationSummary = function getIntegrationSummary() {
  return window.__integrationSummary || 'Workspace overlays not available; using base snapshot.';
};
