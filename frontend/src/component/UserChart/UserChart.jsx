import React from "react";

export default function UserActivityChart({ activeCount = 0, inactiveCount = 0, totalUsers = 0 }) {
  const activeUsers = activeCount;
  const inactiveUsers = inactiveCount;
  const total = totalUsers || (activeUsers + inactiveUsers);

  const activePercentage = total > 0 ? (activeUsers / total) * 100 : 0;
  const inactivePercentage = total > 0 ? (inactiveUsers / total) * 100 : 0;

  return (
    <div
      className="w-full"
      style={{ display: "flex", justifyContent: "center", background: "transparent" }}
    >
      <style>{`
        .chart-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: white;
          border-radius: 12px;
          padding: 10px 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 650px;
          transition: all 0.2s ease;
        }

        .chart-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.07);
        }

        .chart-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          white-space: nowrap;
        }

        .stacked-bar {
          flex: 1;
          height: 10px;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          background: #f1f5f9;
        }

        .bar-segment {
          height: 100%;
        }

        .active-segment {
          width: ${activePercentage}%;
          background: linear-gradient(90deg, #3b82f6, #2563eb);
        }

        .inactive-segment {
          width: ${inactivePercentage}%;
          background: linear-gradient(90deg, #ef4444, #dc2626);
        }

        .stats {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.8rem;
          color: #475569;
          font-weight: 500;
          white-space: nowrap;
        }

        .legend {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.8rem;
          color: #475569;
          font-weight: 500;
          white-space: nowrap;
        }

        .legend-color {
          width: 10px;
          height: 10px;
          border-radius: 2px;
        }

        .legend-color.active {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .legend-color.inactive {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        @media (max-width: 640px) {
          .chart-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 10px;
          }
          .stacked-bar {
            width: 100%;
          }
        }
      `}</style>

      <div className="chart-card">
        <span className="chart-title">User Activity</span>

        <div className="stacked-bar">
            <div className="bar-segment active-segment"></div>
          <div className="bar-segment inactive-segment"></div>
          
        </div>

        <div className="stats">
          <span title="Users active in last 5 days">
            Active: {activeUsers.toLocaleString()} ({Math.round(activePercentage)}%)
          </span>
          <span title="Users not active for 5+ days">
            Inactive: {inactiveUsers.toLocaleString()} ({Math.round(inactivePercentage)}%)
          </span>
        </div>

        <div className="legend">
          <div 
            className="legend-item" 
            title={`${activeUsers.toLocaleString()} users active in last 5 days`}
          >
            <div className="legend-color active"></div>
            <span>Active (5d)</span>
          </div>
          <div 
            className="legend-item" 
            title={`${inactiveUsers.toLocaleString()} users inactive for 5+ days`}
          >
            <div className="legend-color inactive"></div>
            <span>5d+ Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
