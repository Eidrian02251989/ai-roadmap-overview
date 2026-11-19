'use strict';

const projectLabels = ['In progress', 'Proposed', 'Not started', 'On hold', 'Deferred', 'Planned', 'Blocked', 'Done'];
const taskLabels = ['Odoo ERP (System/Automations)', 'AI Agent (Copilot/Claude Agent)', 'Agentic AI (Codex/Claude Code)', 'Workable ATS'];
const isCount = value => Number.isSafeInteger(value) && value >= 0;
const counts = (values, length) => Array.isArray(values) && values.length === length && values.every(isCount);
const sum = values => values.reduce((total, value) => total + value, 0);

function rows(labels, values, total, hideEmpty) {
  const fragment = document.createDocumentFragment();
  labels.forEach((label, i) => {
    if (hideEmpty && values[i] === 0) return;
    const row = document.createElement('div');
    row.className = 'row';
    const name = document.createElement('span');
    name.textContent = label;
    const count = document.createElement('b');
    count.textContent = String(values[i]);
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    fill.style.width = (total ? 100 * values[i] / total : 0) + '%';
    bar.append(fill);
    row.append(name, count, bar);
    fragment.append(row);
  });
  return fragment;
}

let loading = false;
async function refresh() {
  if (loading || document.hidden) return;
  loading = true;
  try {
    const response = await fetch('./summary.json', {cache:'no-store', credentials:'omit'});
    if (!response.ok) return;
    const s = await response.json();
    if (!isCount(s.projects) || !isCount(s.tasks) || !counts(s.projectStatuses, projectLabels.length) ||
        !counts(s.taskCategories, taskLabels.length) || sum(s.projectStatuses) !== s.projects ||
        sum(s.taskCategories) > s.tasks || !/^\d{4}-\d{2}-\d{2}$/.test(s.asOf)) return;
    const day = new Date(s.asOf + 'T00:00:00Z');
    if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0,10) !== s.asOf) return;
    const formatted = day.toLocaleDateString('en-US', {timeZone:'UTC', month:'long', day:'numeric', year:'numeric'});
    const charts = document.querySelectorAll('.grid section');
    charts[0].replaceChildren(charts[0].querySelector('h2'), rows(projectLabels,s.projectStatuses,s.projects,true));
    charts[1].replaceChildren(charts[1].querySelector('h2'), rows(taskLabels,s.taskCategories,s.tasks,false));
    const totals = document.querySelectorAll('.total b');
    totals[0].textContent = String(s.projects);
    totals[1].textContent = String(s.tasks);
    document.querySelector('.meta').textContent = 'Portfolio snapshot as of ' + formatted + ' · Manila';
  } catch {
    // Keep the last displayed, dated snapshot when the network is unavailable.
  } finally {
    loading = false;
  }
}

void refresh();
document.addEventListener('visibilitychange', refresh);
setInterval(refresh, 60_000);
