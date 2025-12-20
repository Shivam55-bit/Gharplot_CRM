// HTML Renderer utility component
import React from 'react';
import './HTMLRenderer.css';

const HTMLRenderer = ({ htmlContent, style = {} }) => {
  if (!htmlContent) {
    return <span style={{ fontStyle: 'italic', color: '#666' }}>No content available</span>;
  }

  // Check if content contains HTML tags
  if (htmlContent.includes('<') || htmlContent.includes('&lt;')) {
    // Decode HTML entities if they exist
    let decodedContent = htmlContent;
    if (htmlContent.includes('&lt;')) {
      decodedContent = htmlContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ');
    }

    return (
      <div 
        className="html-renderer"
        dangerouslySetInnerHTML={{ __html: decodedContent }}
        style={{
          fontSize: '16px',
          lineHeight: '1.6',
          wordWrap: 'break-word',
          ...style
        }}
      />
    );
  }

  // Render as plain text if no HTML
  return (
    <div className="html-renderer" style={{
      fontSize: '16px',
      lineHeight: '1.6',
      wordWrap: 'break-word',
      ...style
    }}>
      {htmlContent}
    </div>
  );
};

export default HTMLRenderer;