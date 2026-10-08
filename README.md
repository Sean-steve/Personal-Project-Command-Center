# Project Command Center

A personal portfolio-management web app for tracking GitHub repositories, local project ideas, milestones and blockers.

This repository contains **public application source only**. Private repository inventories and tracking issues remain in the private `Sean-steve/Sites` hub.

## Capabilities
- Repository discovery from the public GitHub API, with refresh and browser-side automatic polling.
- Dashboard, portfolio table, drag-and-drop board, roadmap and analytics.
- Project details, priority, status, milestones, blockers and notes.
- Local additions for projects not yet in GitHub.
- JSON import/export, including optional import of the private register (processed locally in your browser).
- Works as a static site (GitHub Pages) with no shared backend secrets.

## Privacy
The public site does not contain your private repository inventory or GitHub credentials. By default project notes stay in the browser's local storage. This is an MVP, **not** cross-device cloud storage or an authenticated private dashboard; avoid sensitive project details on shared devices.

## Auto-sync
The private repository-sync GitHub Actions workflow lives in [Sites](https://github.com/Sean-steve/Sites). It runs on a schedule and creates private triage issues; its workflow requires a one-time optional read-only token to discover newly created private repositories. The public dashboard can discover newly created **public** repositories directly through the GitHub API.

## Run
Open `index.html` or serve the folder: `python3 -m http.server 8000`.

## Deploy
GitHub Actions includes a Pages workflow. Enable GitHub Pages with **Settings → Pages → Source: GitHub Actions**. Do not publish the private hub's inventory to this Pages site.
