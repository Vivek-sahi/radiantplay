# Radiant Play - One Pager

This document outlines the approach for improving the design and development experience within ThoughtSpot through an AI-assisted prototyping system.

## Problem Statement

Currently, even small UI changes in the product require long cycles of coordination with multiple stakeholders. Designers lack sufficient understanding of and access to the development process, which constrains their ability to contribute effectively to product improvements.

- **Static handoffs fail:** Figma files, PDFs, and screenshots lose context in translation. Developers guess at interactions, spacing, and edge cases.
- **Specs live separately:** Requirements are scattered across Confluence, Jira, and Figma comments. Developers hunt for information, designers repeat themselves.
- **Slow iteration cycles:** A design change goes through design review, spec writing, developer handoff, implementation, QA, and back — taking weeks for what could take hours.
- **Component duplication:** Designers don't always know what Radiant components already exist in code, leading to recreated or inconsistent implementations.

## Goal

The primary goal is to achieve a better ThoughtSpot product with a faster design + development cycle.

- **Improve product quality:** Interactive prototypes eliminate ambiguity. Developers get copy-paste ready code using real Radiant components and design tokens, resulting in fewer design-to-development discrepancies and a more polished end-user experience.
- **Improve collaboration between Design & Engineering:** Designers create prototypes that speak the same language as production code. Specs, decisions, and rationale live alongside the prototype — accelerating decision-making, reducing rework, and ensuring design vision translates accurately into functional features.
- **Adapt product development to a changing industry:** By integrating designers more closely with development through AI-assisted tooling, ThoughtSpot can more rapidly prototype, test, and iterate on product ideas.

## What We Built

The **Radiant Play** — a fork-ready repository where designers create interactive prototypes using ThoughtSpot's Radiant design system with AI assistance.

### How It Works

1. Designer forks the repository
2. Opens in Cursor IDE (or any AI-assisted editor)
3. Describes UI or pastes a Figma screenshot
4. AI generates code using real Radiant components
5. Designer previews an interactive prototype in the browser
6. Iterates by describing changes in natural language

### What's Inside

| Layer | Details |
|-------|---------|
| **Component Library** | 75 Radiant components (Layout Primitives, Forms, Feedback, Data Display, Navigation, Interaction, Data Viz, Advanced) + 55 icons |
| **Design Token System** | 3-tier architecture (Reference → System → Component) with CSS custom properties. No hard-coded values. |
| **Prototype Infrastructure** | Template system (`npm run new-prototype`), example prototypes, structured patterns |
| **Mock Data** | Realistic sample data (users, analytics, navigation, forms) ready to import |
| **AI Rules** | Comprehensive `.cursor/rules/` ensuring AI generates consistent, token-compliant code |
| **Documentation** | Component patterns, content guidelines, prototyping guides, collaboration docs |

### Tech Stack

- React 19, TypeScript, Vite, CSS Modules, Design Tokens

## Next Steps

1. **Prototype Specification System** — Embed specs (user flows, validation rules, edge cases) directly in prototypes so developers get context alongside interactive code.
2. **Code Export & Documentation** — One-click export of clean, documented, copy-paste ready code packages for developer handoff.
3. **Project Context System** — A `project.config.ts` per fork capturing project metadata, team info, Figma links, and prototype status.
4. **Enhanced Templates** — Pre-built starter templates for common ThoughtSpot patterns (dashboards, admin panels, modal workflows, data tables).

## Ideas to Explore

- **Component Discovery Gallery** — Visual, searchable grid of all Radiant components with quick-view drawers, variant previews, and copy-paste imports. Reduce component discovery from minutes to seconds.
- **Mock Data Browser** — Browsable, visual page showing all available mock data with copy-paste imports and type information.
- **AI Prompt Templates** — Pre-built prompt library for common prototype creation patterns, reducing AI iteration from 8+ attempts to under 3.
- **Figma Component Mapper** — Reference page mapping Figma component names to their React equivalents with prop translations and usage examples.
- **Automated Code Quality Checker** — Built-in panel checking token compliance, accessibility, TypeScript quality, and component reuse with auto-fix suggestions.
