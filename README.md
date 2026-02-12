# When Do Autocratizing Incumbents Lose Elections?

Interactive companion website for the research paper by Erin Hern and Marc Jacob.

**Live site:** [https://marcsjacob.github.io/incumbent_defeat_webpage/](https://marcsjacob.github.io/incumbent_defeat_webpage/)

## Contents

- `index.html` — Main page with interactive map, election explorer, bootstrap results, and case studies
- `alternatives.html` — Alternative explanations analysis
- `methodology.html` — Methodology and codebook
- `styles.css` — Site styling
- `app.js` — Interactive visualizations (Plotly.js)
- `data_embedded.js` — Embedded dataset (105 elections, 63 countries, 1995–2024)
- `election_details.js` — Individual election details (incumbent/challenger info, vote shares)

## Data Pipeline

The R scripts that build `data_embedded.js` and `election_details.js` from source data are located in the companion analysis repository at `statistical_analysis/website_build/`.

## Deployment

This site is designed for GitHub Pages. Push to `main` and enable Pages in repository settings (source: root `/`).
