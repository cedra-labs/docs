import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import GlobalFooter from '@site/src/components/GlobalFooter';

// Default implementation, that you can customize
export default function Root({children}: {children: React.ReactNode}): React.ReactElement {
  return (
    <>
      {children}
      <BrowserOnly>
        {() => <GlobalFooter />}
      </BrowserOnly>
    </>
  );
} 