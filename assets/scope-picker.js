window.__scopePickerState = {
  query: '',
  type: 'all',
  visibleCount: 180,
  pageSize: 180,
};

function normalizeScopeText(value) {
  return String(value || '').toLowerCase().trim();
}

function scopeTypeOrder(type) {
  const order = { region: 1, market: 2, store: 3 };
  return order[type] ?? 9;
}

function formatScopeGroupLabel(type, count) {
  if (type === 'region') return `Regions (${count})`;
  if (type === 'market') return `Markets (${count})`;
  if (type === 'store') return `Stores (${count})`;
  return `Other (${count})`;
}

function buildGroupedScopeOptions(scopes) {
  return scopes.reduce((groups, scope) => {
    const key = scope.type || 'other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(scope);
    return groups;
  }, {});
}

function refreshScopeChips() {
  document.querySelectorAll('[data-scope-type]').forEach((chip) => {
    const active = chip.dataset.scopeType === window.__scopePickerState.type;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function updateScopeMeta(totalMatched, shown) {
  const meta = document.getElementById('scope-results-meta');
  const showMore = document.getElementById('scope-show-more');
  if (meta) meta.textContent = `Showing ${shown} of ${totalMatched} matching scopes`;
  if (showMore) showMore.classList.toggle('hidden', shown >= totalMatched || totalMatched === 0);
}

window.renderScopeSelector = function renderScopeSelector(selectedScopeId) {
  const select = document.getElementById('scope-select');
  const search = document.getElementById('scope-search');
  if (!select) return selectedScopeId;

  const scopes = window.getScopeCatalog?.() ?? [];
  if (!scopes.length) return selectedScopeId;

  const query = normalizeScopeText(search?.value ?? window.__scopePickerState.query);
  window.__scopePickerState.query = query;

  const matched = scopes.filter((scope) => {
    const typeMatch = window.__scopePickerState.type === 'all' || scope.type === window.__scopePickerState.type;
    if (!typeMatch) return false;
    if (!query) return true;
    return normalizeScopeText(scope.label).includes(query)
      || normalizeScopeText(scope.id).includes(query)
      || normalizeScopeText(scope.type).includes(query)
      || normalizeScopeText(scope.summary).includes(query);
  });

  const shownScopes = matched.slice(0, window.__scopePickerState.visibleCount);
  refreshScopeChips();
  updateScopeMeta(matched.length, shownScopes.length);

  if (!shownScopes.length) {
    select.innerHTML = '<option value="">No matching scopes</option>';
    select.value = '';
    if (search) search.setAttribute('aria-label', `Search ${scopes.length} integrated scopes`);
    return selectedScopeId;
  }

  const grouped = buildGroupedScopeOptions(shownScopes);
  const sortedTypes = Object.keys(grouped).sort((a, b) => scopeTypeOrder(a) - scopeTypeOrder(b));

  select.innerHTML = sortedTypes.map((type) => {
    const options = grouped[type]
      .sort((a, b) => String(a.label).localeCompare(String(b.label)))
      .map((scope) => `<option value="${scope.id}">${scope.label}</option>`)
      .join('');
    return `<optgroup label="${formatScopeGroupLabel(type, grouped[type].length)}">${options}</optgroup>`;
  }).join('');

  const resolved = shownScopes.some((scope) => scope.id === selectedScopeId)
    ? selectedScopeId
    : (shownScopes[0]?.id ?? selectedScopeId);

  if (resolved) select.value = resolved;
  if (search) search.setAttribute('aria-label', `Search ${scopes.length} integrated scopes`);
  return resolved;
};

window.bindScopePicker = function bindScopePicker(onScopeChange) {
  const select = document.getElementById('scope-select');
  const search = document.getElementById('scope-search');
  const showMore = document.getElementById('scope-show-more');
  const filterWrap = document.getElementById('scope-type-filters');
  if (!select) return;

  if (select.dataset.boundScopePicker !== 'true') {
    select.dataset.boundScopePicker = 'true';
    select.addEventListener('change', (event) => onScopeChange?.(event.target.value));
  }

  if (search && search.dataset.boundScopeSearch !== 'true') {
    search.dataset.boundScopeSearch = 'true';
    search.addEventListener('input', () => {
      window.__scopePickerState.visibleCount = window.__scopePickerState.pageSize;
      const nextSelection = window.renderScopeSelector(select.value);
      if (nextSelection !== select.value) onScopeChange?.(nextSelection);
    });
  }

  if (showMore && showMore.dataset.boundScopeShowMore !== 'true') {
    showMore.dataset.boundScopeShowMore = 'true';
    showMore.addEventListener('click', () => {
      window.__scopePickerState.visibleCount += window.__scopePickerState.pageSize;
      const nextSelection = window.renderScopeSelector(select.value);
      if (nextSelection !== select.value) onScopeChange?.(nextSelection);
    });
  }

  if (filterWrap && filterWrap.dataset.boundScopeType !== 'true') {
    filterWrap.dataset.boundScopeType = 'true';
    filterWrap.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-scope-type]');
      if (!chip) return;
      window.__scopePickerState.type = chip.dataset.scopeType || 'all';
      window.__scopePickerState.visibleCount = window.__scopePickerState.pageSize;
      const nextSelection = window.renderScopeSelector(select.value);
      if (nextSelection !== select.value) onScopeChange?.(nextSelection);
    });
  }
};
