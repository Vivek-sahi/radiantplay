import React from 'react';
import styles from '../WorkbookInThoughtSpot.module.css';

// The New tag the Apps prototype puts on its "Create apps" chip, on Radiant tokens.
export const NewBadge: React.FC = () => <span className={styles.newBadge}>New</span>;

export default NewBadge;
