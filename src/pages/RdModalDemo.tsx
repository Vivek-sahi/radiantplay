import { useState } from 'react';
import { RdModal, type ModalSize } from '../components/RdModal';
import { Vertical } from '../components/Layout';
import { spacing } from '@tokens/spacing';
import { systemColors } from '@tokens/colors';

const bg = systemColors.light['background-sunken'];
const border = systemColors.light['border-divider'];
const contentPrimary = systemColors.light['content-primary'];
const contentSecondary = systemColors.light['content-secondary'];

type Demo = {
  label: string;
  size: ModalSize;
  eyebrow?: string;
  totalSteps?: number;
};

const DEMOS: Demo[] = [
  { label: 'M1 — simple', size: 'M1' },
  { label: 'M2 — simple', size: 'M2' },
  { label: 'M3 — simple', size: 'M3' },
  { label: 'M4 — fullscreen', size: 'M4' },
  { label: 'M2 — eyebrow', size: 'M2', eyebrow: 'New connection' },
  { label: 'M2 — wizard (3 steps)', size: 'M2', eyebrow: 'Create variable', totalSteps: 3 },
];

export default function RdModalDemo() {
  const [active, setActive] = useState<Demo | null>(null);
  const [step, setStep] = useState(1);

  const open = (demo: Demo) => {
    setActive(demo);
    setStep(1);
  };
  const close = () => setActive(null);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, padding: spacing.J }}>
      <Vertical gap={spacing.H}>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: contentSecondary }}>Dev demo</p>
          <h1 style={{ margin: `${spacing.A}px 0 0`, fontSize: 24, fontWeight: 700, color: contentPrimary }}>RdModal</h1>
          <p style={{ margin: `${spacing.B}px 0 0`, fontSize: 14, color: contentSecondary }}>Sizes M1–M4, simple / eyebrow / wizard variants</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: spacing.D,
        }}>
          {DEMOS.map((demo) => (
            <button
              key={demo.label}
              onClick={() => open(demo)}
              style={{
                padding: `${spacing.D}px ${spacing.F}px`,
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: contentPrimary }}>{demo.label}</div>
              {demo.eyebrow && <div style={{ fontSize: 12, color: contentSecondary, marginTop: 4 }}>{demo.eyebrow}{demo.totalSteps ? ` · ${demo.totalSteps} steps` : ''}</div>}
            </button>
          ))}
        </div>
      </Vertical>

      {active && (
        <RdModal
          size={active.size}
          title="Modal title"
          eyebrow={active.eyebrow}
          currentStep={active.totalSteps ? step : undefined}
          totalSteps={active.totalSteps}
          onClose={close}
          cancelLabel="Cancel"
          onCancel={close}
          confirmLabel={active.totalSteps && step < active.totalSteps ? 'Next' : 'Save'}
          onConfirm={() => {
            if (active.totalSteps && step < active.totalSteps) {
              setStep(s => s + 1);
            } else {
              close();
            }
          }}
          tertiaryLabel={active.totalSteps && step > 1 ? 'Back' : undefined}
          onTertiary={() => setStep(s => s - 1)}
        >
          <Vertical gap={spacing.D}>
            <p style={{ margin: 0, fontSize: 14, color: contentSecondary }}>
              {active.totalSteps
                ? `Step ${step} of ${active.totalSteps} — placeholder content`
                : 'Placeholder content area. Children go here.'}
            </p>
            <div style={{ height: 80, borderRadius: 6, border: `1px dashed ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 13, color: contentSecondary }}>Content slot</span>
            </div>
          </Vertical>
        </RdModal>
      )}
    </div>
  );
}
