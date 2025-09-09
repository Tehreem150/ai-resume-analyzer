import { useEffect, useState } from "react";

const CircularProgress = ({ score, size = 120, strokeWidth = 12 }) => {
  const [progress, setProgress] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let start = 0;
    const step = () => {
      start += 1;
      if (start <= score) {
        setProgress(start);
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [score]);

  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={
            progress >= 70 ? "#16a34a" : progress >= 40 ? "#facc15" : "#dc2626"
          }
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute text-xl font-bold text-gray-700">
        {progress}%
      </span>
    </div>
  );
};

export default CircularProgress;
