import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function ArticleFooter(): React.ReactNode {
  return (
    <div className={styles.articleFooter}>
      <hr />
      <div className={styles.footerContent}>
        <h3>Next Steps</h3>
        <p>
          Found this helpful? Explore more Cedra development resources and join our community.
        </p>
        <div className={styles.footerButtons}>
          <Link
            className="button button--primary button--md"
            to="https://github.com/cedra-labs/cedra"
          >
            Explore Code
          </Link>
        </div>
        <div className={styles.footerMeta}>
          <p>
            Have feedback on this page?<br />
            <a href="https://github.com/cedra-labs/docs/issues/new" target="_blank"> 
              Submit an issue
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 