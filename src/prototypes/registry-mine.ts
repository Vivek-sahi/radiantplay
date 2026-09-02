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

import { ProjectMeta } from './registry-core';

export const myRegistry: ProjectMeta[] = [];
