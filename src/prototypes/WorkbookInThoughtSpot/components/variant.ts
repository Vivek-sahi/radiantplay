import React from 'react';

// Prototype options behind the gear (Vivek, 3 Nov). menuBar: the Google Sheets menu bar above the toolbar.
export interface WorkbookVariant { menuBar: boolean }
export const VariantContext = React.createContext<WorkbookVariant>({ menuBar: false });
