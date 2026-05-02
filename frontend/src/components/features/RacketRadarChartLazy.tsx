import { lazy, Suspense } from 'react';
import styled from 'styled-components';

const ChartSkeleton = styled.div`
  height: 350px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 16px;
  margin: 2rem 0;

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: #e0e0e0;
  }
`;

const RacketRadarChartLazy = lazy(() => 
  import('./RacketRadarChart').then(module => ({ default: module.default }))
);

interface LazyRadarChartProps {
  metrics: any[];
  title?: string;
}

export const LazyRadarChart: React.FC<LazyRadarChartProps> = (props) => {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <RacketRadarChartLazy {...props} />
    </Suspense>
  );
};

export default LazyRadarChart;