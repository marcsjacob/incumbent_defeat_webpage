# CLAUDE.md — Session Log

## 2026-02-16: Switch to 11-Indicator (Strict) Visibility Index — Website Overhaul

### Data Rebuild
- Ran `build_all.R` to regenerate all data files: `data_embedded.js` (485 KB), `election_snapshot.csv`, `time_series.csv`, `bootstrap_results.csv`
- All dynamic content (bootstrap plot, election explorer table, case study timelines) now reflects the 11-indicator visibility index

### alternatives.html
- **Robustness Card 1 (Multivariate)**: coefficient range 0.07–0.08 → 0.09–0.10; full model β 0.08 → 0.10
- **Robustness Card 2 (Firth)**: Updated to reflect that both visibility and horizontal constraints 95% CIs now exclude zero (previously visibility CI included zero)
- **Robustness Card 3 (Levels vs Changes)**: level β 0.08 → 0.10; shift β 0.02 → 0.07
- **Robustness Card 4 (Influence Diagnostics)**: range 0.06–0.09 → 0.09–0.11
- **Comparing Main Predictors table**: High Visibility 0.08*/0.12*/0.06 → 0.10*/0.15*/0.08* (Autocracy now significant); Low Vis Democracy 0.12 → 0.10; Low Vis Autocracy 0.01 → 0.02; Unemployment Democracy −0.07 → −0.08
- **Unemployment detail table**: Democracy β −0.07 → −0.08

### methodology.html
- High-Visibility Index: 17 → 11 indicators; removed Civil Society card (v2csreprss, v2csrlgrep); removed v2mecenefi, v2meslfcen from Media; removed v2smgovsm, v2smgovsmcenprc from Digital
- Low-Visibility Index: 17 → 23 indicators; added v2csreprss, v2csrlgrep to Civil Society; added v2meslfcen to Media; added v2mecenefi, v2smgovsm, v2smgovsmcenprc to Digital
- Data Sources table: 17/17 → 11/23

### index.html
- No changes needed — no hardcoded indicator counts or coefficients

## 2026-02-16: Nicaragua 2001 correction — website updates
- **index.html**: Updated overview cards — 29→30 defeated, 28%→29%, 39%→41%, 21→22 of 54.
- **alternatives.html**: Updated robustness comparison table (all Pooled and Democracy β values); updated text descriptions for GDP Growth (CI, Democracy β), Citizen Support (Pooled β, Democracy β/CI), Mass Mobilization (Pooled β, Democracy β), Vertical Constraints (Democracy β); updated detail tables for GDP Growth (Pooled CI), Mass Mobilization (Pooled β/CI, Democracy β/CI); revised Firth robustness card to note 95% CI now includes zero.
- **data_embedded.js / election_details.js**: Rebuilt by `build_all.R`; Nicaragua 2001 correctly shows outcome="lost".
