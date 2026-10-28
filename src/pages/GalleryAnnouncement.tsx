import { useState } from 'react';
import { Modal, ModalFooter, ModalSplashContent } from '../components/Modal';
import { Button } from '../components/Button';
import { useIsDarkMode } from '../context/ThemeContext';

/** Bump the key for the next announcement; each one shows once per browser */
const SEEN_KEY = 'radiantplay:announced-gallery-groups';

const readSeen = () => {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
};

/**
 * A one-time splash screen introducing gallery groups (26.10.4g and 4h).
 * Figma's splash rule: once per feature, one image, a few short lines.
 */
export const GalleryAnnouncement: React.FC = () => {
  const [open, setOpen] = useState(() => !readSeen());
  const dark = useIsDarkMode();

  const close = () => {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* private window: it shows again next time */ }
    setOpen(false);
  };

  return (
    <Modal
      isOpen={open}
      onClose={close}
      size="M2"
      type="splashscreen"
      title="Group your prototypes"
      mediaContent={
        <img
          src={`/announcements/gallery-groups-${dark ? 'dark' : 'light'}.jpg`}
          alt="The gallery with prototypes under an Apps in ThoughtSpot group heading"
        />
      }
      footer={<ModalFooter primaryAction={<Button variant="primary" onClick={close}>Got it</Button>} />}
    >
      <ModalSplashContent
        title="Group your prototypes"
        bulletPoints={[
          'Prototypes of one project sit under one heading. Collapse the ones you aren’t working on.',
          'Use Move to group on a card, drag it onto a heading, or click a group name to rename it.',
          'Prefer the old view? Choose All in one grid in the Sort menu. Sort by recent or name still works, and there’s a list view too.',
        ]}
      />
    </Modal>
  );
};

export default GalleryAnnouncement;
