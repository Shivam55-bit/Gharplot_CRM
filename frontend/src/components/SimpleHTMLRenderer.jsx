import React, { useEffect, useRef } from 'react';

const SimpleHTMLRenderer = ({ htmlContent }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && htmlContent) {
      console.log('🚀 SimpleHTMLRenderer - Input:', htmlContent);
      
      // Force decode HTML entities
      let decoded = htmlContent
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      console.log('🚀 SimpleHTMLRenderer - Decoded:', decoded);
      
      // Set innerHTML directly
      contentRef.current.innerHTML = decoded;
      
      console.log('🚀 SimpleHTMLRenderer - Final result:', contentRef.current.innerHTML);
    }
  }, [htmlContent]);

  return (
    <div 
      ref={contentRef}
      style={{
        lineHeight: '1.5',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
        fontWeight: '500',
        color: 'inherit',
        letterSpacing: '0.3px',
        minHeight: '60px',
        wordSpacing: '2px',
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60px',
        color: '#7f8c8d',
        fontStyle: 'italic'
      }}>
        Loading content...
      </div>
    </div>
  );
};

export default SimpleHTMLRenderer;