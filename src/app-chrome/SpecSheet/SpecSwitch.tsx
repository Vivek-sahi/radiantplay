import { useSearchParams } from 'react-router-dom';
import type { SpecState } from './types';
import styles from './SpecSwitch.module.css';

/**
 * The floating Prototype / Spec switch on a prototype page. It shows only when
 * the prototype has a spec that can be seen (see specVisible), so prototypes
 * without one look exactly as before.
 */
export const SpecSwitch: React.FC<{ state: SpecState }> = ({ state }) => {
  const [params, setParams] = useSearchParams();
  const onSpec = params.has('spec');

  const go = (spec: boolean) => {
    const next = new URLSearchParams(params);
    if (spec) next.set('spec', '');
    else next.delete('spec');
    setParams(next);
  };

  const dot = state === 'ready' ? styles.dotReady : state === 'changed' ? styles.dotChanged : styles.dotDraft;

  return (
    <nav className={styles.switcher} aria-label="Prototype or spec">
      <button type="button" className={`${styles.item} ${!onSpec ? styles.active : ''}`} aria-pressed={!onSpec} onClick={() => go(false)}>
        Prototype
      </button>
      <button type="button" className={`${styles.item} ${onSpec ? styles.active : ''}`} aria-pressed={onSpec} onClick={() => go(true)}>
        <span className={`${styles.dot} ${dot}`} aria-hidden />
        Spec
      </button>
    </nav>
  );
};

export default SpecSwitch;
