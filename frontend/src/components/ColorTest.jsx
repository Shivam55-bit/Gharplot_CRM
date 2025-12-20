import React from 'react';

const ColorTest = () => {
  const applyColor = (color, isBackground = false) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      
      if (isBackground) {
        span.style.backgroundColor = color;
      } else {
        span.style.color = color;
      }
      
      try {
        range.surroundContents(span);
      } catch (e) {
        // If selection spans multiple elements, use different approach
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      
      selection.removeAllRanges();
    }
  };

  return (
    <div style={{ margin: '20px', padding: '20px', border: '1px solid #ccc' }}>
      <h3>Color Test Component</h3>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={() => applyColor('red')}>Red Text</button>
        <button onClick={() => applyColor('blue')}>Blue Text</button>
        <button onClick={() => applyColor('yellow', true)}>Yellow Highlight</button>
        <button onClick={() => applyColor('green', true)}>Green Highlight</button>
      </div>
      
      <div 
        contentEditable 
        style={{ 
          border: '1px solid #ddd', 
          padding: '10px', 
          minHeight: '100px',
          backgroundColor: 'white'
        }}
      >
        Select this text and click the buttons above to test colors!
      </div>
    </div>
  );
};

export default ColorTest;