import React, { useState } from 'react';
import { SpotterLeftToggle, type SpotterLeftMode } from '@spotter/page';
import styles from './CreateFlow.module.css';

// The Spotter panel beside the workbook, collapsible (Vivek, 4 Nov). Uses Radiant Play's Spotter
// panel toggle (SpotterLeftToggle: "Collapse panel" / "Expand panel"). Collapsed, the panel shrinks
// to a slim rail holding the toggle and the workbook takes the width. The conversation stays mounted
// while collapsed, so a turn that's still streaming or building carries on.

export const SpotterDock: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<SpotterLeftMode>('panel');
  const collapsed = mode === 'rail';
  return (
    <div className={collapsed ? styles.rail : styles.chat}>
      <div className={collapsed ? undefined : styles.chatHead}>
        <SpotterLeftToggle mode={mode} onClick={() => setMode(collapsed ? 'panel' : 'rail')} />
      </div>
      <div className={collapsed ? styles.hidden : styles.chatBody}>{children}</div>
    </div>
  );
};

export default SpotterDock;
