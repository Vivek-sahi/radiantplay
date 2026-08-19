import React from 'react';
import { c, sp, fs, fw } from '../../styles';
import { Modal, ModalFooter } from '../../../../components/Modal';
import { Button } from '../../../../components/Button';
import { Typography } from '../../../../components/Typography';
import { Vertical, Horizontal } from '../../../../components/Layout';
import { radius } from '../../../../tokens/radius';

/**
 * Step 2 of the caching flow — the wall, pointed forward.
 *
 * Drawing a join between tables in different warehouses is where caching first comes up.
 * This is deliberately **info, not error**: the user did nothing wrong, and this is the
 * moment our differentiating capability introduces itself. "Cannot be joined" is a dead end;
 * "needs both tables in ThoughtSpot to join" is the same fact with a way through it.
 *
 * The benefit line is not padding. Caching stops live queries against the source warehouse,
 * which saves money — it's the more important half of what caching is, and without it this
 * dialog reads as a toll gate.
 *
 * Built on Radiant's `Modal` rather than a hand-rolled fixed overlay (2026-08-12). The overlay,
 * the escape key, the focus trap and the size scale are the dialog's job, not this file's, and
 * a bespoke shell means this dialog and the caching dialog it hands off to are two different
 * objects that only look alike by coincidence. `M1` is the confirmation size.
 *
 * ⚠️ Dismiss currently discards the attempted join. Phase 3 keeps it as a dashed pending edge
 * so Dismiss means "not now" rather than "undo" — see flow spec §3 step 2.
 */
const CacheRequiredNotice: React.FC<{
  /** Tables that have to be brought into ThoughtSpot before this join can exist. */
  tables: string[];
  /** Connection label per table, so the user can see *why* — two names, two warehouses. */
  connectionLabel: (table: string) => string;
  /**
   * A cache is already filling, so this join has to wait rather than start a second run.
   *
   * Barring join during a fill is the one rule that makes progressive use safe by
   * construction: two partially-filled tables joining on arbitrary prefixes can return
   * near-zero matches with no signal. This is the backstop, not the mechanism — the mechanism
   * is that the actions which create joins are disabled while a cache is in flight, so the
   * user should not normally reach this.
   */
  busy?: boolean;
  onDismiss: () => void;
  onProceed: () => void;
}> = ({ tables, connectionLabel, busy, onDismiss, onProceed }) => (
  <Modal
    isOpen
    onClose={onDismiss}
    size="M1"
    title={busy ? 'Wait for caching to finish' : 'Cache these tables to join them'}
    footer={
      <ModalFooter
        secondaryAction={busy ? undefined : <Button variant="secondary" onClick={onDismiss}>Dismiss</Button>}
        primaryAction={
          busy
            ? <Button variant="primary" onClick={onDismiss}>Got it</Button>
            : <Button variant="primary" onClick={onProceed}>Proceed to caching</Button>
        }
      />
    }
  >
    <Vertical gap={sp.C}>
      <Typography variant="body-normal" color="gray-light" noMargin>
        {busy
          ? 'A cache is still filling. Joining now would match against partial data and could quietly return the wrong rows, so joins wait until it completes.'
          : 'These tables are in different warehouses, so they can’t be joined where they are. Caching brings them into ThoughtSpot, which is what makes the join possible — and stops live queries against your warehouse.'}
      </Typography>

      {/* The two names side by side are the evidence for the sentence above — this is the
          only place the user can see that these tables are in fact in different warehouses. */}
      <Vertical
        gap={sp.A}
        style={{ padding: sp.C, borderRadius: radius.md, backgroundColor: c['background-sunken'] }}
      >
        {tables.map(t => (
          <Horizontal key={t} align="center" justify="space-between" gap={sp.C}>
            <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{t}</span>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{connectionLabel(t)}</span>
          </Horizontal>
        ))}
      </Vertical>
    </Vertical>
  </Modal>
);

export default CacheRequiredNotice;
