import React, { useState } from 'react';
import { Button, Icon, TextArea, Typography } from '@/components';
import styles from '../v5.module.css';

/**
 * The SQL agent, open on the right by default (Vivek, 26 Oct). The chat pattern of Claude and
 * ChatGPT: the conversation above, one composer with send inside it, no suggestion buttons. The
 * composer takes the ThoughtSpot AI edge on focus, as Spotter's prompt does. Its job here: turn
 * pasted DDL into AgentDB DDL, write the query to debug with, explain SQL. Replies come in stage 3.
 */
export const AgentPanel: React.FC<{ toast: (m: string) => void; onCollapse: () => void }> = ({ toast, onCollapse }) => {
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    toast('Agent replies come in the next stage');
    setText('');
  };

  return (
    <aside className={styles.benchAgent} aria-label="Agent">
      <div className={styles.bar}>
        <Icon name="ai" size="s" aria-hidden />
        <Typography variant="content-label" color="base" noMargin>
          Agent
        </Typography>
        <span className={styles.grow} />
        {/* Collapse gives the query the full width; the agent button in the tab bar brings it back (Vivek, 27 Oct). */}
        <Button variant="tertiary" size="small" iconOnly icon="chevron-right" aria-label="Collapse agent" title="Collapse agent" onClick={onCollapse}>
          Collapse agent
        </Button>
      </div>
      <div className={styles.agentEmpty}>
        <Typography variant="body-normal" color="gray-light" noMargin>
          Create a table, paste DDL from another database, or ask about your data.
        </Typography>
      </div>
      <div className={styles.composer}>
        <TextArea
          label="Ask the agent"
          showLabel={false}
          rows={2}
          resize="none"
          value={text}
          placeholder="Ask, or paste DDL. @ for a table."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter is a new line, as in Claude and ChatGPT.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className={styles.composerSend}>
          <Button variant="primary" size="small" iconOnly icon="arrow-up" aria-label="Send" disabled={!text.trim()} onClick={send}>
            Send
          </Button>
        </div>
      </div>
    </aside>
  );
};
