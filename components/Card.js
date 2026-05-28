import React from 'react';
import styles from './card.module.css';

export function Card({ children, className = '', title }) {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && <h3 className={styles.cardTitle}>{title}</h3>}
      {children}
    </div>
  );
}
