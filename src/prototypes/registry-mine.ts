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

const DataStudio = React.lazy(() => import('./DataStudio'));
const SpotterPrep = React.lazy(() => import('./SpotterPrep'));
const SpotterPrep2 = React.lazy(() => import('./SpotterPrep2'));

export const myRegistry: ProjectMeta[] = [
  {
    id: 'DataStudio',
    name: 'Data Studio',
    description: 'Workspace for data teams to build, clean, join, and publish AI-ready data models.',
    author: 'Vivek Sahi',
    lastModified: '2026-03-31',
    thumbnail: DataStudioThumbnail,
    component: DataStudio,
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
  {
    id: 'SpotterPrep2',
    name: 'SpotterPrep v2',
    description: 'HR analytics data quality session — tiered confidence (high/medium/low), three agent modes (interactive/batch/autonomous), save-as-new-model with inherited caching.',
    author: 'Vivek Sahi',
    lastModified: '2026-05-26',
    component: SpotterPrep2,
    section: 'mine',
  },
];
