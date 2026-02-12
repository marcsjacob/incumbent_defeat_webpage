// =============================================================================
// Interactive Data Explorer (v2)
// =============================================================================

const DATA = {};
const COLORS = {
  accent: '#2563eb',
  democracy: '#2563eb',
  autocracy: '#d97706',
  pooled: '#10b981',
  won: '#94a3b8',
  lost: '#dc2626',
  grid: '#e5e7eb',
  zero: '#cbd5e1'
};

// =============================================================================
// Data Loading (from embedded JS variables)
// =============================================================================

function loadAllData() {
  DATA.bootstrap = BOOTSTRAP_DATA;
  DATA.handcoded = HANDCODED_DATA;
  DATA.snapshot = SNAPSHOT_DATA;
  DATA.timeseries = TIMESERIES_DATA;
  DATA.detailed = typeof DETAILED_CODING !== 'undefined' ? DETAILED_CODING : [];
  DATA.electionDetails = typeof ELECTION_DETAILS !== 'undefined' ? ELECTION_DETAILS : [];
}

function findElectionDetail(country, year) {
  return DATA.electionDetails.find(d =>
    d.country === country && d.year === year
  );
}

function showElectionDetail(country, year) {
  const panel = document.getElementById('election-detail');
  const detail = findElectionDetail(country, year);

  if (!detail) {
    panel.style.display = 'none';
    return;
  }

  const fmtPct = v => v != null ? v.toFixed(1) + '%' : 'N/A';
  const outcomeClass = detail.outcome === 'lost' ? 'outcome-lost' : 'outcome-won';
  const outcomeLabel = detail.outcome === 'lost' ? 'Defeated' : 'Re-elected';

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="detail-header">
      <h3>${detail.country} ${detail.year}</h3>
      <span class="detail-type">${detail.election_type || ''}</span>
      <span class="detail-outcome ${outcomeClass}">${outcomeLabel}</span>
      <button class="detail-close" onclick="document.getElementById('election-detail').style.display='none'">&times;</button>
    </div>
    <div class="detail-body">
      <div class="detail-candidate detail-incumbent">
        <div class="candidate-label">Incumbent / Ruling Party</div>
        <div class="candidate-name">${detail.incumbent_name}</div>
        <div class="candidate-party">${detail.incumbent_party}</div>
        <div class="candidate-pct">${fmtPct(detail.incumbent_pct)}</div>
      </div>
      <div class="detail-vs">vs.</div>
      <div class="detail-candidate detail-challenger">
        <div class="candidate-label">Main Challenger</div>
        <div class="candidate-name">${detail.challenger_name}</div>
        <div class="candidate-party">${detail.challenger_party}</div>
        <div class="candidate-pct">${fmtPct(detail.challenger_pct)}</div>
      </div>
    </div>
    <div class="detail-footer">
      <span class="detail-system">Electoral System: ${detail.electoral_system}</span>
      ${detail.notes ? `<span class="detail-notes">${detail.notes}</span>` : ''}
      ${detail.source ? `<a class="detail-source" href="${detail.source}" target="_blank" rel="noopener">Wikipedia &rarr;</a>` : ''}
    </div>
  `;

  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// =============================================================================
// World Map
// =============================================================================

function plotMap() {
  // Aggregate elections per country
  const countryData = {};
  DATA.snapshot.forEach(r => {
    const iso = r.iso3;
    if (!iso) return;
    if (!countryData[iso]) {
      countryData[iso] = { name: r.country_name, count: 0, lost: 0, won: 0, years: [] };
    }
    countryData[iso].count++;
    countryData[iso].years.push(r.year);
    if (r['Incumbent.won'] === 'no') countryData[iso].lost++;
    else countryData[iso].won++;
  });

  const isos = Object.keys(countryData);
  const counts = isos.map(k => countryData[k].count);
  const texts = isos.map(k => {
    const d = countryData[k];
    return `<b>${d.name}</b><br>${d.count} election(s)<br>Won: ${d.won}, Lost: ${d.lost}<br>Years: ${d.years.join(', ')}`;
  });

  const trace = {
    type: 'choropleth',
    locations: isos,
    z: counts,
    text: texts,
    hoverinfo: 'text',
    colorscale: [[0, '#dbeafe'], [0.5, '#60a5fa'], [1, '#1e40af']],
    colorbar: { title: 'Elections', thickness: 15, len: 0.5 },
    marker: { line: { color: '#fff', width: 0.5 } }
  };

  const layout = {
    geo: {
      showframe: false,
      showcoastlines: true,
      coastlinecolor: '#cbd5e1',
      projection: { type: 'natural earth' },
      bgcolor: 'transparent',
      landcolor: '#f1f5f9',
      countrycolor: '#e5e7eb'
    },
    height: 440,
    margin: { l: 0, r: 0, t: 10, b: 10 },
    paper_bgcolor: 'transparent',
    font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
  };

  Plotly.newPlot('plot-map', [trace], layout, { responsive: true, displayModeBar: false });
}

// =============================================================================
// Bootstrap Coefficient Plot (with position dodge)
// =============================================================================

const IV_ORDER = [
  'High Visibility', 'Low Visibility', 'Scope',
  'Horizontal Constraints', 'Vertical Constraints',
  'GDP Growth', 'Unemployment',
  'Polarization', 'Mass Mobilization', 'Citizen Support'
];

function plotBootstrap(regime) {
  let rows = DATA.bootstrap.filter(r => IV_ORDER.includes(r.IV));

  const regimes = regime === 'all' ? ['Pooled', 'Democracy', 'Autocracy'] : [regime];
  const traces = [];
  const ciShapes = [];
  const nRegimes = regimes.length;

  // For position dodge: offset each regime slightly on the y axis
  const dodgeWidth = nRegimes > 1 ? 0.25 : 0;

  regimes.forEach((reg, ri) => {
    const subset = rows
      .filter(r => r.Regime === reg)
      .sort((a, b) => IV_ORDER.indexOf(a.IV) - IV_ORDER.indexOf(b.IV));

    const color = reg === 'Democracy' ? COLORS.democracy
               : reg === 'Autocracy' ? COLORS.autocracy
               : nRegimes > 1 ? COLORS.pooled : COLORS.accent;

    // Y positions with dodge offset
    const yOffset = nRegimes > 1 ? (ri - (nRegimes - 1) / 2) * dodgeWidth : 0;
    const yPositions = subset.map((r, i) => i + yOffset);
    const estimates = subset.map(r => r.estimate);
    const sig = subset.map(r => r.significant90 === true || r.significant90 === 'TRUE');

    // Draw CI bars as shapes (avoids error_x rendering artifacts)
    subset.forEach((r, i) => {
      const y = yPositions[i];
      // 95% CI (thin line)
      ciShapes.push({
        type: 'line', x0: r['conf.low95'], x1: r['conf.high95'], y0: y, y1: y,
        xref: 'x', yref: 'y',
        line: { color: color, width: 1.5 }
      });
      // 90% CI (thick line)
      ciShapes.push({
        type: 'line', x0: r['conf.low90'], x1: r['conf.high90'], y0: y, y1: y,
        xref: 'x', yref: 'y',
        line: { color: color, width: 4 }
      });
    });

    // Point estimates
    traces.push({
      type: 'scatter', x: estimates, y: yPositions,
      mode: 'markers',
      marker: {
        size: sig.map(s => s ? 10 : 8),
        color: sig.map(s => s ? color : '#fff'),
        line: { color: color, width: 2 },
        symbol: 'circle'
      },
      name: reg,
      text: subset.map((r, i) =>
        `<b>${r.IV}</b> (${reg})<br>` +
        `Coef: ${r.estimate.toFixed(3)}<br>` +
        `90% CI: [${r['conf.low90'].toFixed(3)}, ${r['conf.high90'].toFixed(3)}]<br>` +
        `95% CI: [${r['conf.low95'].toFixed(3)}, ${r['conf.high95'].toFixed(3)}]<br>` +
        `N = ${r.n}` + (sig[i] ? '<br><b>Significant at 90%</b>' : '')
      ),
      hoverinfo: 'text', legendgroup: reg, showlegend: true
    });
  });

  // Tick labels from first regime's order
  const tickLabels = rows
    .filter(r => r.Regime === regimes[0])
    .sort((a, b) => IV_ORDER.indexOf(a.IV) - IV_ORDER.indexOf(b.IV))
    .map(r => r.IV);

  // Zero line + CI shapes
  const allShapes = [{
    type: 'line', x0: 0, x1: 0, y0: -0.5, y1: IV_ORDER.length - 0.5,
    xref: 'x', yref: 'y',
    line: { color: '#94a3b8', width: 1, dash: 'dash' }
  }, ...ciShapes];

  const layout = {
    height: 480,
    margin: { l: 180, r: 30, t: 20, b: 50 },
    xaxis: {
      title: 'Standardized OLS Coefficient',
      zeroline: false,
      gridcolor: COLORS.grid
    },
    yaxis: {
      tickvals: IV_ORDER.map((_, i) => i),
      ticktext: tickLabels,
      autorange: 'reversed',
      gridcolor: COLORS.grid,
      zeroline: false,
      range: [-0.5, IV_ORDER.length - 0.5]
    },
    shapes: allShapes,
    legend: { orientation: 'h', y: -0.12, x: 0.5, xanchor: 'center' },
    plot_bgcolor: '#fff',
    paper_bgcolor: 'transparent',
    font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
  };

  Plotly.newPlot('plot-bootstrap', traces, layout, { responsive: true, displayModeBar: false });
}

// =============================================================================
// Hand-Coded Scatter Plot
// =============================================================================

function plotHandcoded(colorBy) {
  const data = DATA.handcoded;
  let traces;
  if (colorBy === 'outcome') {
    traces = [
      makeScatterTrace(data.filter(r => r['incumbent.won'] === 1), 'Incumbent Won', COLORS.won),
      makeScatterTrace(data.filter(r => r['incumbent.won'] === 0), 'Incumbent Lost', COLORS.lost)
    ];
  } else {
    traces = [
      makeScatterTrace(data.filter(r => r.regime_group === 'Democracy'), 'Democracy', COLORS.democracy),
      makeScatterTrace(data.filter(r => r.regime_group === 'Autocracy'), 'Autocracy', COLORS.autocracy)
    ];
  }

  const layout = {
    height: 460,
    margin: { l: 60, r: 30, t: 20, b: 60 },
    xaxis: { title: 'Scope (# distinct tactics)', gridcolor: COLORS.grid, zeroline: false },
    yaxis: { title: 'Visible Tactics (count)', gridcolor: COLORS.grid, zeroline: false },
    legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' },
    plot_bgcolor: '#fff',
    paper_bgcolor: 'transparent',
    font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
  };

  Plotly.newPlot('plot-scatter', traces, layout, { responsive: true, displayModeBar: false });
}

function makeScatterTrace(rows, name, color) {
  return {
    type: 'scatter', mode: 'markers',
    x: rows.map(r => r.scope_unique_target),
    y: rows.map(r => r.visible_count),
    hovertext: rows.map(r =>
      `<b>${r.country_name} (${r.year})</b><br>` +
      `Scope: ${r.scope_unique_target}<br>` +
      `Visible: ${r.visible_count}<br>` +
      `Subtle: ${r.subtle_count}<br>` +
      `Outcome: ${r['incumbent.won'] === 0 ? 'Lost' : 'Won'}<br>` +
      `Regime: ${r.regime_type}`
    ),
    hoverinfo: 'text',
    marker: { size: 10, color: color, opacity: 0.8, line: { color: '#fff', width: 1 } },
    name: name
  };
}

// =============================================================================
// Coding Datasheets
// =============================================================================

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function formatSheetLabel(sheet) {
  // Parse "Country M-D-YYYY" or "Country M-YYYY" into "Country (Month YYYY)"
  const m = sheet.match(/^(.+?)\s+(\d{1,2})-(?:\d{1,2}-)*(\d{4})$/);
  if (m) {
    const country = m[1];
    const month = parseInt(m[2], 10);
    const year = m[3];
    if (month >= 1 && month <= 12) return `${country} (${MONTHS[month - 1]} ${year})`;
  }
  // Fallback: try "Country M- YYYY" (e.g., "Lesotho 6- 2017")
  const m2 = sheet.match(/^(.+?)\s+(\d{1,2})-?\s*(\d{4})$/);
  if (m2) {
    const country = m2[1];
    const month = parseInt(m2[2], 10);
    const year = m2[3];
    if (month >= 1 && month <= 12) return `${country} (${MONTHS[month - 1]} ${year})`;
  }
  return sheet;
}

function populateDatasheetDropdown() {
  const sheets = [...new Set(DATA.detailed.map(r => r.sheet_name))].sort();
  const sel = document.getElementById('ds-election');
  sheets.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = formatSheetLabel(s);
    sel.appendChild(opt);
  });
}

function renderDatasheet() {
  const sheet = document.getElementById('ds-election').value;
  const summaryDiv = document.getElementById('ds-summary');
  const table = document.getElementById('ds-table');

  if (!sheet) {
    summaryDiv.style.display = 'none';
    table.style.display = 'none';
    return;
  }

  const rows = DATA.detailed.filter(r => r.sheet_name === sheet);

  // Find matching handcoded summary
  // Try to match by parsing country from sheet name
  const sheetCountry = sheet.replace(/\s+\d{1,2}-\d{1,2}-\d{4}$/, '').trim();
  const match = DATA.handcoded.find(r =>
    r.country_name === sheetCountry ||
    sheet.toLowerCase().includes(r.country_name.toLowerCase())
  );

  // Summary card
  const visCount = rows.filter(r => r.visible === 1).length;
  const subCount = rows.filter(r => r.subtle === 1).length;

  summaryDiv.style.display = 'block';
  summaryDiv.innerHTML = `
    <h3>${formatSheetLabel(sheet)}</h3>
    <div class="ds-meta">
      <span>Actions coded: <strong>${rows.length}</strong></span>
      <span><span class="tag tag-visible">Visible: ${visCount}</span></span>
      <span><span class="tag tag-subtle">Subtle: ${subCount}</span></span>
      ${match ? `<span>Outcome: <span class="tag ${match['incumbent.won'] === 0 ? 'tag-lost' : 'tag-won'}">${match['incumbent.won'] === 0 ? 'Lost' : 'Won'}</span></span>` : ''}
      ${match ? `<span>Regime: ${match.regime_type}</span>` : ''}
    </div>
  `;

  // Table
  table.style.display = 'table';
  const tbody = table.querySelector('tbody');
  tbody.innerHTML = rows.map(r => {
    const type = r.visible === 1 ? '<span class="type-visible">Visible</span>'
               : r.subtle === 1 ? '<span class="type-subtle">Subtle</span>' : '';
    return `<tr>
      <td>${r.year || ''}</td>
      <td>${r.action || ''}</td>
      <td>${r.target || ''}</td>
      <td>${r.code || ''}</td>
      <td>${type}</td>
    </tr>`;
  }).join('');
}

// =============================================================================
// Election Explorer Table (no unemployment column)
// =============================================================================

let sortCol = 'year';
let sortDir = -1;

function simplifyRegime(r) {
  if (!r) return '';
  if (r.toLowerCase().includes('democracy')) return 'Democracy';
  if (r.toLowerCase().includes('autocracy')) return 'Autocracy';
  return r;
}

function renderTable() {
  const regimeFilter = document.getElementById('filter-regime').value;
  const outcomeFilter = document.getElementById('filter-outcome').value;
  const search = document.getElementById('filter-search').value.toLowerCase();

  let rows = DATA.snapshot.map(r => ({
    country: r.country_name,
    year: r.year,
    regime: simplifyRegime(r.regime_type),
    regimeFull: r.regime_type,
    outcome: r['Incumbent.won'] === 'yes' ? 'Won' : 'Lost',
    polyarchy: r.v2x_polyarchy,
    visibility: r.visibility_index,
    scope: r.scope_index,
    horizontal: r.horizontal_constraints
  }));

  if (regimeFilter !== 'all') rows = rows.filter(r => r.regime === regimeFilter);
  if (outcomeFilter === 'lost') rows = rows.filter(r => r.outcome === 'Lost');
  if (outcomeFilter === 'won') rows = rows.filter(r => r.outcome === 'Won');
  if (search) rows = rows.filter(r => r.country.toLowerCase().includes(search));

  rows.sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'string') return va.localeCompare(vb) * sortDir;
    return (va - vb) * sortDir;
  });

  const tbody = document.querySelector('#election-table tbody');
  const hasDetails = DATA.electionDetails.length > 0;
  tbody.innerHTML = rows.map(r => {
    const detail = hasDetails ? findElectionDetail(r.country, r.year) : null;
    const clickAttr = detail ? ` class="clickable-row" onclick="showElectionDetail('${r.country.replace(/'/g, "\\'")}', ${r.year})"` : '';
    return `<tr${clickAttr}>
      <td>${r.country}${detail ? ' <span class="detail-indicator">&#9432;</span>' : ''}</td>
      <td>${r.year}</td>
      <td>${r.regimeFull || '\u2014'}</td>
      <td class="${r.outcome === 'Lost' ? 'outcome-lost' : 'outcome-won'}">${r.outcome}</td>
      <td>${fmt(r.polyarchy)}</td>
      <td>${fmt(r.visibility)}</td>
      <td>${fmt(r.scope)}</td>
      <td>${fmt(r.horizontal)}</td>
    </tr>`;
  }).join('');

  document.getElementById('table-count').textContent = `Showing ${rows.length} of ${DATA.snapshot.length} elections`;
}

function fmt(v) {
  if (v == null || isNaN(v)) return '\u2014';
  return Number(v).toFixed(2);
}

// =============================================================================
// Case Study Timeline (fixed to handle missing values)
// =============================================================================

function populateCaseDropdown() {
  const elections = [...new Set(DATA.timeseries.map(r => r.election_id))].sort();
  const sel = document.getElementById('case-election');
  elections.forEach(eid => {
    const row = DATA.timeseries.find(r => r.election_id === eid && r.timetotreat === 0);
    const label = row ? `${row.country_name} (${row.year})` : eid.replace(/_/g, ' ');
    const opt = document.createElement('option');
    opt.value = eid;
    opt.textContent = label;
    sel.appendChild(opt);
  });
  // Default to Poland 2023
  const poland = elections.find(e => e === 'Poland_2');
  if (poland) sel.value = poland;
}

function plotTimeline() {
  const eid = document.getElementById('case-election').value;
  const indicator = document.getElementById('case-indicator').value;

  const rows = DATA.timeseries
    .filter(r => r.election_id === eid)
    .sort((a, b) => a.timetotreat - b.timetotreat);

  // Filter out rows where the indicator is null/undefined
  const validRows = rows.filter(r => r[indicator] != null && !isNaN(r[indicator]));

  const x = validRows.map(r => r.timetotreat);
  const y = validRows.map(r => r[indicator]);
  const years = validRows.map(r => r.year);

  const electionRow = rows.find(r => r.timetotreat === 0);
  const title = electionRow ? `${electionRow.country_name} (${electionRow.year})` : eid.replace(/_/g, ' ');
  const outcome = electionRow ? (electionRow['Incumbent.won'] === 'yes' ? 'Won' : 'Lost') : '';

  if (validRows.length === 0) {
    Plotly.newPlot('plot-timeline', [], {
      height: 380, margin: { l: 60, r: 30, t: 40, b: 50 },
      title: { text: `${title} (Incumbent ${outcome}) - No data available for this indicator`, font: { size: 14 } },
      paper_bgcolor: 'transparent'
    }, { responsive: true, displayModeBar: false });
    return;
  }

  const traces = [{
    type: 'scatter', mode: 'lines+markers',
    x: x, y: y,
    marker: {
      size: x.map(t => t === 0 ? 12 : 7),
      color: x.map(t => t === 0 ? COLORS.lost : COLORS.accent),
      line: { color: '#fff', width: 1 }
    },
    line: { color: COLORS.accent, width: 2 },
    text: years.map((yr, i) =>
      `Year: ${yr}<br>t = ${x[i]}<br>${indicator}: ${y[i] != null ? y[i].toFixed(3) : 'N/A'}`
    ),
    hoverinfo: 'text', showlegend: false
  }];

  const indLabel = document.getElementById('case-indicator').selectedOptions[0].textContent;

  const layout = {
    height: 380,
    margin: { l: 60, r: 30, t: 40, b: 50 },
    title: { text: `${title} (Incumbent ${outcome})`, font: { size: 14 } },
    xaxis: {
      title: 'Years relative to election (t = 0)',
      zeroline: false,
      gridcolor: COLORS.grid, dtick: 1
    },
    yaxis: { title: indLabel, gridcolor: COLORS.grid, zeroline: false },
    shapes: [{
      type: 'line', x0: 0, x1: 0, y0: 0, y1: 1, yref: 'paper',
      line: { color: '#dc2626', width: 1.5, dash: 'dash' }
    }],
    annotations: [{
      x: 0, y: 1, yref: 'paper', xanchor: 'left',
      text: ' Election', showarrow: false,
      font: { size: 11, color: '#dc2626' }
    }],
    plot_bgcolor: '#fff',
    paper_bgcolor: 'transparent',
    font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
  };

  Plotly.newPlot('plot-timeline', traces, layout, { responsive: true, displayModeBar: false });
}

// =============================================================================
// Event Listeners
// =============================================================================

function setupEvents() {
  // Bootstrap regime buttons
  document.querySelectorAll('#bootstrap .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#bootstrap .btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      plotBootstrap(btn.dataset.regime);
    });
  });

  // Scatter color buttons
  document.querySelectorAll('#handcoded .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#handcoded .btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      plotHandcoded(btn.dataset.color);
    });
  });

  // Datasheets
  document.getElementById('ds-election').addEventListener('change', renderDatasheet);

  // Table controls
  document.getElementById('filter-regime').addEventListener('change', renderTable);
  document.getElementById('filter-outcome').addEventListener('change', renderTable);
  document.getElementById('filter-search').addEventListener('input', renderTable);

  // Table sorting
  document.querySelectorAll('#election-table th').forEach(th => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      if (sortCol === col) sortDir *= -1;
      else { sortCol = col; sortDir = 1; }
      renderTable();
    });
  });

  // Case study
  document.getElementById('case-election').addEventListener('change', plotTimeline);
  document.getElementById('case-indicator').addEventListener('change', plotTimeline);
}

// =============================================================================
// Init
// =============================================================================

(function init() {
  try {
    loadAllData();
    setupEvents();
    plotMap();
    plotBootstrap('Pooled');
    plotHandcoded('outcome');
    populateDatasheetDropdown();
    renderTable();
    populateCaseDropdown();
    plotTimeline();
  } catch (err) {
    console.error('Failed to initialize:', err);
    document.body.innerHTML += `<div style="color:red;text-align:center;padding:40px">
      Error initializing. ${err.message}</div>`;
  }
})();
