import React, { useEffect } from 'react';
import { useLocation } from '@docusaurus/router';
import ArticleFooter from '@site/src/components/ArticleFooter';
import * as ReactDOM from 'react-dom/client';

export default function GlobalFooter(): React.ReactNode {
  const location = useLocation();

  useEffect(() => {
    // Clean up any existing footers first
    const existingFooters = document.querySelectorAll('.article-footer-added');
    existingFooters.forEach(node => {
      node.remove();
    });

    // Delay slightly to ensure the DOM has updated after navigation
    const timer = setTimeout(() => {
      // Try multiple potential content containers
      const mainContent = 
        document.querySelector('article') || 
        document.querySelector('main') ||
        document.querySelector('.container');
        
      if (mainContent) {
        const footerContainer = document.createElement('div');
        footerContainer.className = 'article-footer-added';
        mainContent.appendChild(footerContainer);
        
        try {
          // Create a root and render our component
          const root = ReactDOM.createRoot(footerContainer);
          root.render(<ArticleFooter />);
        } catch (error) {
          console.error('Error rendering footer:', error);
        }
      }
    }, 100);

    // Clean up
    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname]); // Re-run when the URL changes

  return null; // This component doesn't render anything directly
} 