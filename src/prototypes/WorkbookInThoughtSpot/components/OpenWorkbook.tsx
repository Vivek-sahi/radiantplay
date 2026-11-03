import React, { useMemo, useState } from 'react';
import { RadianceBackground } from '@/app-chrome/RadianceBackground/RadianceBackground';
import { PromptBar, type OpenMenu } from '@spotter/chat';
import { Vertical } from '@components/Layout';
import { WorkbookLive } from './WorkbookLive';
import { ActionRow, ShowWork, StreamingText, agentTextStyle } from './ChatTurns';
import type { Workbook } from '../engine/workbook';
import styles from './CreateFlow.module.css';

// Opening an existing workbook (the edit scenario, Vivek 3 Nov): like opening a saved App in
// Faris's Apps prototype, Spotter sits on the left beside the object, already in context, and the
// workbook opens on the right where it was left.

export const OpenWorkbook: React.FC<{ build: () => Workbook; onDeleted?: () => void }> = ({ build, onDeleted }) => {
  const initial = useMemo(build, [build]);
  const [reply, setReply] = useState('');
  const [openMenu, setOpenMenu] = useState<OpenMenu>('none');
  const [focused, setFocused] = useState(false);
  const intro = `Opened ${initial.name}. It’s on the ${initial.model} model, which refreshed 2 hours ago. Ask me to change it, or work in the sheet.`;

  return (
    <div className={styles.root}>
      <RadianceBackground pattern="spotterx" state="answered" />
      <div className={styles.split}>
        <div className={styles.chat}>
          <Vertical gap={20} className={styles.thread}>
            <div>
              <ShowWork />
              <p style={agentTextStyle}><StreamingText text={intro} /></p>
              <ActionRow />
            </div>
          </Vertical>
          <Vertical gap={0} className={styles.composer}>
            <PromptBar
              value={reply}
              onValueChange={setReply}
              onSend={() => setReply('')}
              minLines={1}
              menuDirection="up"
              focused={focused}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              openMenu={openMenu}
              onOpenMenuChange={setOpenMenu}
            />
          </Vertical>
        </div>
        <div className={styles.canvas}>
          <WorkbookLive initial={initial} publishedAlready onDeleted={onDeleted} />
        </div>
      </div>
    </div>
  );
};

export default OpenWorkbook;
