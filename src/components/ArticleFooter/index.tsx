import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function ArticleFooter(): React.ReactNode {
  return (
    <div className={styles.articleFooter}>
      <hr />
      <div className={styles.footerContent}>
        <div className={styles.mainSection}>
          <h3>Help Improve Cedra</h3>
          <p>
            Found an issue or want to contribute? We welcome improvements to our docs and examples.
          </p>
          
          <div className={styles.actions}>
            <Link
              className="button button--primary button--md"
              to="https://github.com/cedra-labs/docs"
              target="_blank"
            >
              Improve Docs & Report Issues
            </Link>
            <Link
              className="button button--secondary button--md"
              to="https://github.com/cedra-labs/move-contract-examples/tree/main"
              target="_blank"
            >
              Code Examples
            </Link>
          </div>
        </div>

        <div className={styles.communitySection}>
          <h4>🚀 Join the Builder Community</h4>
          <div className={styles.communityLinks}>
            <a 
              href="https://t.me/+Ba3QXd0VG9U0Mzky" 
              target="_blank"
              rel="noopener noreferrer"
              className={styles.communityLink}
            >
              💬 Builders Chat
            </a>
            <a 
              href="https://t.me/cedranetwork" 
              target="_blank"
              rel="noopener noreferrer"
              className={styles.communityLink}
            >
              📢 Cedra News
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 