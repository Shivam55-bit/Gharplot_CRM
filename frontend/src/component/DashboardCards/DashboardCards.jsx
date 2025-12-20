import React, { useState, useEffect } from "react";
import "./dashboardCard.css";
import { useAdmin } from "../../context/AdminContext"; //  Import context

// ------------------ Small Chart Helpers ------------------
const normalize = (arr, height = 36, padding = 4) => {
	const min = Math.min(...arr);
	const max = Math.max(...arr);
	const range = max - min || 1;
	return arr.map(
		(v) => height - ((v - min) / range) * (height - padding) - padding
	);
};

const LineChart = ({ data = [], stroke = "#6C5CE7" }) => {
	const points = normalize(data)
		.map((y, i) => `${(i / (data.length - 1)) * 100},${y}`)
		.join(" ");
	return (
		<svg
			className="dc-spark chart-line"
			viewBox="0 0 100 40"
			preserveAspectRatio="none"
			aria-hidden
		>
			<polyline
				fill="none"
				stroke={stroke}
				strokeWidth="3"
				points={points}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};

const BarChart = ({ data = [], fill = "#0984e3" }) => {
	const max = Math.max(...data, 1);
	const width = 100 / data.length;
	return (
		<svg
			className="dc-spark chart-bar"
			viewBox="0 0 100 40"
			preserveAspectRatio="none"
			aria-hidden
		>
			{data.map((d, i) => {
				const h = (d / max) * 36;
				const x = i * width + 4 * (i / data.length);
				const barW = width - 6;
				return (
					<rect
						key={i}
						x={x}
						y={40 - h}
						width={barW}
						height={h}
						rx="2"
						fill={fill}
					/>
				);
			})}
		</svg>
	);
};

const PieChart = ({
	data = [],
	colors = ["#6C5CE7", "#0984e3", "#ff7675"],
}) => {
	const total = data.reduce((s, v) => s + v, 0) || 1;
	let acc = 0;
	const r = 16;
	const cx = 20;
	const cy = 20;
	return (
		<svg className="dc-spark chart-pie" viewBox="0 0 40 40" aria-hidden>
			{data.map((v, i) => {
				const start = (acc / total) * Math.PI * 2;
				acc += v;
				const end = (acc / total) * Math.PI * 2;
				const x1 = cx + r * Math.cos(start);
				const y1 = cy + r * Math.sin(start);
				const x2 = cx + r * Math.cos(end);
				const y2 = cy + r * Math.sin(end);
				const large = end - start > Math.PI ? 1 : 0;
				const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
				return <path key={i} d={d} fill={colors[i % colors.length]} />;
			})}
		</svg>
	);
};

const Histogram = ({
	data = [],
	fill = "#fd7e14",
	bins = 6,
}) => {
	const min = Math.min(...data);
	const max = Math.max(...data);
	const range = max - min || 1;
	const counts = new Array(bins).fill(0);
	data.forEach((v) => {
		const idx = Math.min(bins - 1, Math.floor(((v - min) / range) * bins));
		counts[idx]++;
	});
	const maxCount = Math.max(...counts, 1);
	const width = 100 / bins;
	return (
		<svg
			className="dc-spark chart-hist"
			viewBox="0 0 100 40"
			preserveAspectRatio="none"
			aria-hidden
		>
			{counts.map((c, i) => {
				const h = (c / maxCount) * 36;
				const x = i * width + 4 * (i / bins);
				const barW = width - 6;
				return (
					<rect
						key={i}
						x={x}
						y={40 - h}
						width={barW}
						height={h}
						rx="2"
						fill={fill}
					/>
				);
			})}
		</svg>
	);
};

// ------------------ Animated Value Component ------------------
const AnimatedValue = ({ value, loading }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    if (loading) return;
    
    let start = 0;
    const end = typeof value === 'number' ? value : parseInt(value) || 0;
    
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    const duration = 1000; // 1 second
    const increment = end / (duration / 16); // 16ms per frame
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(Math.ceil(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value, loading]);
  
  if (loading) {
    return <div className="dc-value">Loading...</div>;
  }
  
  return <div className="dc-value">{displayValue.toLocaleString()}</div>;
};

// ------------------ Card Component ------------------
const Card = ({ title, value, SubChart, loading }) => {
  return (
    <div className="dc-card" tabIndex={0} role="group" aria-label={title}>
      <div className="dc-left">
        <div className="dc-title">{title}</div>
        <AnimatedValue value={value} loading={loading} />
      </div>

      <div className="dc-right">
        {SubChart}
      </div>
    </div>
  );
};

// ------------------ Dashboard Cards ------------------
const DashboardCards = () => {
  const { 
    allBoughtPropertyCount, 
    loading, 
    allPropertyCount,
    rentPropertyCount,
    subCategoryCounts
  } = useAdmin(); //  get from context
  
  const boughtCount = allBoughtPropertyCount || 0;
  const allPropertiesCount = allPropertyCount || 0;
  const rentCount = rentPropertyCount || 0;
  
  // Calculate total residential and commercial properties from sub-category counts
  const getResidentialTotal = () => {
    return subCategoryCounts.Residential?.reduce((sum, item) => sum + item.count, 0) || 0;
  };
  
  const getCommercialTotal = () => {
    return subCategoryCounts.Commercial?.reduce((sum, item) => sum + item.count, 0) || 0;
  };

  const residentialTotal = getResidentialTotal();
  const commercialTotal = getCommercialTotal();

  // Get cards data
  const getCards = () => {
    return [
      {
        title: "Total Property",
        value: allPropertiesCount,
        SubChart: <LineChart data={[10, 8, 12, 20, 18, allPropertiesCount || 24]} stroke="#6C5CE7" />,
      },
      {
        title: "Bought Property",
        value: boughtCount,
        SubChart: <BarChart data={[6, 10, 8, 12, boughtCount || 9]} fill="#0984e3" />,
      },
      {
        title: "Residential Property",
        value: residentialTotal,
        SubChart: (
          <PieChart
            data={subCategoryCounts.Residential?.map(item => item.count) || [1]}
            colors={["#6C5CE7", "#0984e3", "#ff7675"]}
          />
        ),
      },
      {
        title: "Commercial Property",
        value: commercialTotal,
        SubChart: (
          <PieChart
            data={subCategoryCounts.Commercial?.map(item => item.count) || [1]}
            colors={["#ff7675", "#f6ad55", "#fd7e14"]}
          />
        ),
      },
      {
        title: "Rent Property",
        value: rentCount,
        SubChart: (
          <Histogram
            data={[1, 2, 2, 3, 2, 1, 4, rentCount || 3, 2, 1]}
            fill="#fd7e14"
            bins={6}
          />
        ),
      },
    ];
  };

  const cards = getCards();

  return (
    <div className="container dc-grid mt-0">
      {cards.map((c) => (
        <Card key={c.title} {...c} loading={loading} />
      ))}
    </div>
  );
};

export default DashboardCards;