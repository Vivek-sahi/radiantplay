/**
 * My Registry — Designer-owned
 *
 * This file is YOURS. Add your own prototypes here.
 * Upstream (main repo) never touches this file — so it never conflicts when you sync.
 *
 * Usage:
 *   1. Run /new-prototype or ask Claude to create a prototype
 *   2. Claude will add the entry here automatically
 *   3. Your prototypes appear in the gallery under "My prototypes"
 *
 * Example entry:
 *   import React from 'react';
 *   import { ProjectMeta } from './registry-core';
 *
 *   const MyPrototype = React.lazy(() => import('./MyPrototype'));
 *
 *   export const myRegistry: ProjectMeta[] = [
 *     {
 *       id: 'MyPrototype',
 *       name: 'My Prototype',
 *       description: 'What it does',
 *       author: 'Your Name',
 *       lastModified: '2026-04-08',
 *       component: MyPrototype,
 *     },
 *   ];
 */

import React from 'react';
import { ProjectMeta } from './registry-core';
import DataStudioThumbnail from './thumbnails/DataStudio.svg';

const DataStudioV2 = React.lazy(() => import('./DataStudioV2'));
const DataStudio15 = React.lazy(() => import('./DataStudio15'));
const DataNotebook = React.lazy(() => import('./DataNotebook'));
const SpotterPrep = React.lazy(() => import('./SpotterPrep'));
const SpotterPrep2 = React.lazy(() => import('./SpotterPrep2'));
const NearStore = React.lazy(() => import('./NearStore'));

export const myRegistry: ProjectMeta[] = [
  {
    id: 'NearStore',
    name: 'Near Store',
    description: 'ThoughtSpot data caching offering — cache live Snowflake model data into ThoughtSpot to cut query costs.',
    author: 'Vivek Sahi',
    lastModified: '2026-07-02',
    component: NearStore,
    section: 'mine',
  },
  {
    id: 'DataStudioV2',
    name: 'Data Studio — Agentic UX',
    description: 'Agentic workspace for data teams to build, clean, join, and publish AI-ready data models.',
    author: 'Vivek Sahi',
    lastModified: '2026-04-23',
    thumbnail: DataStudioThumbnail,
    component: DataStudioV2,
    section: 'mine',
  },
  {
    id: 'DataStudio15',
    name: 'Data Studio 1.5 — high-code notebook',
    description: 'Frozen snapshot of the high-code, notebook-based modeling UX — preserved for stakeholder comparison against the V2 no-code canvas approach.',
    author: 'Vivek Sahi',
    lastModified: '2026-07-02',
    thumbnail: DataStudioThumbnail,
    component: DataStudio15,
    section: 'mine',
  },
  {
    id: 'DataNotebook',
    name: 'Data Notebook — Hex-style',
    description: 'Reactive multi-source data notebook with a notebook agent — real in-browser SQL (DuckDB) and Python (Pyodide).',
    author: 'Vivek Sahi',
    lastModified: '2026-06-11',
    component: DataNotebook,
    section: 'mine',
  },
  {
    id: 'SpotterPrep2',
    name: 'SpotterPrep v2',
    description: 'Data quality prep for ThoughtSpot — confidence-gated agentic flow with rules chain.',
    author: 'Vivek Sahi',
    lastModified: '2026-05-26',
    component: SpotterPrep2,
    section: 'mine',
  },
  {
    id: 'SpotterPrep',
    name: 'SpotterPrep',
    description: 'Column-level data quality prep for ThoughtSpot data models. Profile, detect issues, apply fixes scheduled on cache refresh.',
    author: 'Vivek Sahi',
    lastModified: '2026-04-09',
    component: SpotterPrep,
    section: 'mine',
  },
];
