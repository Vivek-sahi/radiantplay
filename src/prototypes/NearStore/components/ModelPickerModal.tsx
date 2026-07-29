import React, { useState } from 'react';
import {
  Modal,
  ModalFooter,
  Button,
  SearchInput,
  Typography,
  Icon,
  Link,
  Avatar,
  Horizontal,
} from '@/components';
import { DatabaseZapIcon } from './DatabaseZapIcon';
import { c } from '../styles';
import type { SpotterModel } from '../spotterData';
import styles from './ModelPickerModal.module.css';

/**
 * "Select data model" picker. Two panes — model list + details. The details
 * pane carries the capability indicator: a single-line cached/live status with
 * last-refreshed + time window (see the requirements doc, touchpoint #2).
 */
export const ModelPickerModal: React.FC<{
  isOpen: boolean;
  models: SpotterModel[];
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}> = ({ isOpen, models, selectedId, onClose, onSelect }) => {
  const [highlightId, setHighlightId] = useState(selectedId);
  const [query, setQuery] = useState('');

  const highlighted = models.find((m) => m.id === highlightId) ?? models[0];
  const filtered = models.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = () => {
    onSelect(highlightId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select data model"
      size="large"
      footer={
        <ModalFooter
          secondaryAction={
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          }
          primaryAction={
            <Button variant="primary" onClick={handleSelect}>
              Select
            </Button>
          }
        />
      }
    >
      <div className={styles.body}>
        {/* Left — list */}
        <div className={styles.list}>
          <SearchInput
            placeholder="Find sources"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className={styles.allRow}>
            <Typography variant="body-normal" color="gray-light" noMargin>
              All data models
            </Typography>
          </div>
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`${styles.row} ${m.id === highlightId ? styles.rowActive : ''}`}
              onClick={() => setHighlightId(m.id)}
            >
              <span className={styles.check}>
                {m.id === selectedId && <Icon name="checkmark" size="s" color={c['content-brand']} />}
              </span>
              <span className={styles.rowText}>
                <Typography variant="body-normal" color="base" noMargin>
                  {m.name}
                </Typography>
                <Typography variant="footnote" color="gray-light" noMargin>
                  Model
                </Typography>
              </span>
            </button>
          ))}
        </div>

        {/* Right — details */}
        <div className={styles.details}>
          <Typography variant="content-label-subhead" color="base" noMargin>
            {highlighted.name}
          </Typography>
          <Typography variant="footnote" color="gray-light" noMargin>
            Model
          </Typography>
          <Typography variant="footnote" color="gray-light" noMargin>
            Created on: {highlighted.createdOn}
          </Typography>

          {/* Capability — cache shown as plain metadata, in line with "Created on". */}
          {highlighted.cache.state === 'cached' ? (
            <>
              <Horizontal gap={6} align="center">
                <DatabaseZapIcon size={12} color={c['content-brand']} />
                <Typography variant="footnote" color="gray-light" noMargin>
                  Last cached on {highlighted.cache.lastRefreshed}
                </Typography>
              </Horizontal>
            </>
          ) : (
            <Horizontal gap={8} align="center">
              <Typography variant="footnote" color="gray-light" noMargin>
                Cached: None
              </Typography>
              <Link href="/near-store-overview.html" target="_blank" rel="noopener" size="small">
                Learn more
              </Link>
            </Horizontal>
          )}

          <Typography variant="body-normal" color="base" noMargin>
            <strong>Description:</strong> {highlighted.description}
          </Typography>
          <Typography variant="body-normal" color="base" noMargin>
            <strong>Tags:</strong> {highlighted.tags.join(', ')}
          </Typography>

          <div className={styles.section}>
            <Typography variant="content-label" color="base" noMargin>
              Top Liveboards created using {highlighted.name}
            </Typography>
            {highlighted.topLiveboards.map((lb) => (
              <div key={lb.title} className={styles.lbItem}>
                <Link href="#" onClick={(e) => e.preventDefault()}>
                  {lb.title}
                </Link>
                <Typography variant="footnote" color="gray-light" noMargin>
                  by {lb.author}
                </Typography>
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <Typography variant="content-label" color="base" noMargin>
              Author
            </Typography>
            <Horizontal gap={8} align="center">
              <Avatar name={highlighted.author} size="s" />
              <Typography variant="body-normal" color="base" noMargin>
                {highlighted.author}
              </Typography>
            </Horizontal>
          </div>
        </div>
      </div>
    </Modal>
  );
};
