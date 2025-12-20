import React from "react";

const EnquiryChart = ({ total = 0, client = 0, manual = 0 }) => {
  // Calculate actual percentages
  const clientPercentage = total > 0 ? (client / total) * 100 : 0;
  const manualPercentage = total > 0 ? (manual / total) * 100 : 0;
  
  // Calculate stroke dasharray values for semi-circle
  const radius = 45;
  const circumference = Math.PI * radius;
  const clientStroke = (clientPercentage / 100) * circumference;
  const manualStroke = (manualPercentage / 100) * circumference;

  return (
    <div className="enquiry-chart-container" style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: '15px',
      width: '100%',
      padding: '5px'
    }}>
      {/* Semi-circle Donut Chart with animations */}
      <div style={{ position: 'relative', width: '110px', height: '60px' }}>
        <svg width="110" height="60" viewBox="0 0 110 60" className="chart-svg">
          {/* Background track */}
          <path
            d="M 10 50 A 45 45 0 0 1 100 50"
            fill="none"
            stroke="#e9ecef"
            strokeWidth="10"
            strokeLinecap="round"
          />
          
          {/* Manual Enquiries - drawn from left side with animation */}
          {manual > 0 && (
            <path
              d="M 10 50 A 45 45 0 0 1 100 50"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${manualStroke} ${circumference}`}
              strokeDashoffset={circumference}
              transform="scale(-1,1) translate(-110,0)"
              className="manual-path"
            />
          )}
          
          {/* Client Enquiries - drawn from right side with animation */}
          {client > 0 && (
            <path
              d="M 10 50 A 45 45 0 0 1 100 50"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${clientStroke} ${circumference}`}
              strokeDashoffset={circumference}
              className="client-path"
            />
          )}
        </svg>
        
        {/* Center text with animation */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div className="total-count">{total}</div>
          <div className="total-label">Total</div>
        </div>
      </div>
      
      {/* Client and Manual Counts with Color Dots */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div className="enquiry-item">
          <div className="d-flex align-items-center gap-2">
            <div className="indicator-dot client-dot"></div>
            <div>
              <div className="item-label">Client</div>
              <div className="item-count">{client}</div>
            </div>
          </div>
        </div>
        <div className="enquiry-item">
          <div className="d-flex align-items-center gap-2">
            <div className="indicator-dot manual-dot"></div>
            <div>
              <div className="item-label">Manual</div>
              <div className="item-count">{manual}</div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .chart-svg {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.05));
        }
        
        .manual-path {
          animation: draw-manual 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.2s;
        }
        
        .client-path {
          animation: draw-client 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.4s;
        }
        
        @keyframes draw-manual {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes draw-client {
          to {
            stroke-dashoffset: 0;
          }
        }
        
        .total-count {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          animation: pop-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          opacity: 0;
          transform: scale(0.8);
        }
        
        .total-label {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          animation: fade-in 0.5s ease forwards 0.3s;
          opacity: 0;
        }
        
        @keyframes pop-in {
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes fade-in {
          to {
            opacity: 1;
          }
        }
        
        .enquiry-item {
          transition: all 0.2s ease;
          padding: 4px 8px;
          border-radius: 6px;
        }
        
        .enquiry-item:hover {
          background-color: rgba(0, 0, 0, 0.03);
          transform: translateX(3px);
        }
        
        .indicator-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        
        .client-dot {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
        }
        
        .manual-dot {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3);
        }
        
        .item-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        
        .item-count {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin-top: 1px;
        }
        
        .enquiry-item:hover .indicator-dot {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};

export default EnquiryChart;