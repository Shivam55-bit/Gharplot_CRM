import React from "react";
import { MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import "./ResultDisplay.css";

const ResultDisplay = ({ result, wordCount, caseStatus, isCompact = false }) => {
  // Don't show if not closed or no result
  if (caseStatus !== 'close' || !result) {
    return null;
  }

  // Determine color and quality based on word count
  const getQuality = (count) => {
    if (count < 10) return { level: 'poor', color: 'red', label: 'Low Quality', icon: AlertCircle };
    return { level: 'good', color: 'green', label: 'Good Quality', icon: CheckCircle };
  };

  const quality = getQuality(wordCount);
  const IconComponent = quality.icon;

  return (
    <div className={`result-display ${quality.level} ${isCompact ? 'compact' : ''}`}>
      <div className="result-header">
        <div className="result-icon">
          <MessageSquare size={16} />
        </div>
        <div className="result-quality">
          <IconComponent size={14} />
          <span className="quality-label">{quality.label}</span>
          <span className="word-count">({wordCount} words)</span>
        </div>
      </div>
      
      {!isCompact && (
        <div className="result-content">
          {result}
        </div>
      )}
      
      {isCompact && (
        <div className="result-preview">
          {result.length > 100 ? `${result.substring(0, 100)}...` : result}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;