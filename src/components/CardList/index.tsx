import React, { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

interface CardProps {
  title: string;
  description: string;
  to: string;
  children?: ReactNode;
}

function Card({ title, description, to, children }: CardProps) {
  return (
    <div className={styles.card}>
      <Link to={to} className={styles.cardLink}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
        <div className={styles.cardBody}>
          <p className={styles.cardDescription}>{description}</p>
          {children}
        </div>
      </Link>
    </div>
  );
}

interface CardListProps {
  children: ReactNode;
}

function CardListComponent({ children }: CardListProps) {
  return <div className={styles.cardList}>{children}</div>;
}

// Attach Card component to CardList
CardListComponent.Card = Card;

// Export as a named export
export const CardList = CardListComponent; 