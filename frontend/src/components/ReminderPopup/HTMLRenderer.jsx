import React from 'react';

const HTMLRenderer = ({ htmlContent }) => {
  // Simple HTML entity decoder and renderer
  const decodeAndRender = (html) => {
    if (!html) return 'No content';
    
    // Decode HTML entities
    const decoded = html
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
    
    console.log('🎨 HTMLRenderer - Input:', html);
    console.log('🎨 HTMLRenderer - Decoded:', decoded);
    
    return decoded;
  };
  
  return (
    <div 
      style={{
        fontSize: '16px',
        lineHeight: '1.7',
        fontFamily: 'Arial, sans-serif'
      }}
      dangerouslySetInnerHTML={{ 
        __html: decodeAndRender(htmlContent) 
      }} 
    />
  );
};

export default HTMLRenderer;