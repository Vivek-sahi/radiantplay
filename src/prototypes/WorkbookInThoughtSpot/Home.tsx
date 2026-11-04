import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Button, Horizontal, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import styles from './home/Home.module.css';
import { DocsShell } from './home/DocsShell';

/**
 * Workbook in ThoughtSpot · project home (Vivek, 4 Nov: "a home page for the workbook project which has all the links
 * etc, like how we made for AgentDB"). The same layout as the AgentDB MVP home. Copy is placeholder fact for Vivek to
 * rewrite. His own design pages are published beside the prototype under /workbook/; their source of truth is
 * ~/spreadsheet-workbook/, copied on change. The PM's and other people's documents are not published (public site).
 */

const PROTOTYPE = '/playground/WorkbookInThoughtSpot';
const REPO = 'https://github.com/Vivek-sahi/radiantplay/tree/prototype/data-studio/src/prototypes/WorkbookInThoughtSpot';
const ext = { target: '_blank', rel: 'noreferrer' } as const;
/** Recordings and documents (public/workbook/, git-ignored: they open locally and are not deployed). */
const DOCS = '/workbook';

const Section: React.FC<{ id: string; title: string; note?: React.ReactNode; children: React.ReactNode }> = ({ id, title, note, children }) => (
  <section id={id} className={styles.section}>
    <Vertical gap={spacing.D}>
      <Vertical gap={spacing.A}>
        <Typography variant="modal-title" color="base" noMargin>{title}</Typography>
        {note && <Typography variant="body-normal" color="gray-light" noMargin>{note}</Typography>}
      </Vertical>
      {children}
    </Vertical>
  </section>
);


const WorkbookHome: React.FC = () => (
  <DocsShell>
    <Vertical gap={spacing.D}>
      <Typography variant="overline" color="gray-light" noMargin>ThoughtSpot · Spreadsheet Workbook</Typography>
      <Typography variant="page-title" color="base" noMargin>Workbook in ThoughtSpot</Typography>
      <Horizontal gap={spacing.B} wrap>
        <RouterLink to={PROTOTYPE}><Button variant="primary" icon="play">Open the prototype</Button></RouterLink>
        <a href={REPO} {...ext}><Button variant="secondary" icon="folder">Repo</Button></a>
        <a href={`${DOCS}/manual-workflow-2026-11-03.mp4`} {...ext}><Button variant="secondary" icon="video">Manual workflow recording</Button></a>
        <a href={`${DOCS}/agentic-workflow-2026-11-03.mp4`} {...ext}><Button variant="secondary" icon="video">Agentic workflow recording</Button></a>
      </Horizontal>
    </Vertical>

    <Section id="need" title="The need">
      <Typography variant="body-normal" color="gray-light" noMargin>TBD</Typography>
    </Section>

    <Section id="jobs" title="Jobs">
      <Typography variant="body-normal" color="gray-light" noMargin>TBD</Typography>
    </Section>

    <Section id="lifecycle" title="Lifecycle">
      <Typography variant="body-normal" color="gray-light" noMargin>TBD</Typography>
    </Section>

    <Section id="flows" title="Key workflows">
      <Typography variant="body-normal" color="gray-light" noMargin>TBD</Typography>
    </Section>

    <Section id="ia" title="Information architecture">
      <Typography variant="body-normal" color="gray-light" noMargin>TBD</Typography>
    </Section>

    <Section id="decisions" title="Design decisions">
      <Typography variant="body-normal" color="gray-light" noMargin>TBD</Typography>
    </Section>

    <Section id="changes" title="Change log">
      <Typography variant="body-normal" color="gray-light" noMargin>TBD</Typography>
    </Section>

  </DocsShell>
);

export default WorkbookHome;
