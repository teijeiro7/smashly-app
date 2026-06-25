import React, { useMemo, memo } from 'react';
import styled from 'styled-components';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { RacketComparisonData } from '../../types/racket';
import { FiCheckCircle } from 'react-icons/fi';

const toTitleCase = (str: string): string =>
  str.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

interface RacketRadarChartProps {
  metrics: RacketComparisonData[];
}

const ChartContainer = styled.div`
  background: var(--surface);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px var(--shadow-color);
  margin: 2rem 0;
  will-change: contents;
  transform: translateZ(0);

  @media (max-width: 768px) {
    padding: 1rem 0.75rem;
  }
`;

const ChartSubtitle = styled.div`
  font-size: 0.875rem;
  color: var(--text-muted);
  text-align: center;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const RadarWrapper = styled.div`
  height: 400px;

  @media (max-width: 768px) {
    height: 260px;
  }
`;

// Colores para hasta 3 palas
const COLORS = ['var(--primary)', 'var(--info)', 'var(--accent)'];

// Tooltip personalizado
const CustomTooltip = memo(({ active, payload, metrics }: any) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid var(--border)',
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, marginBottom: '8px' }}>
        {({'S. Bola': 'Salida de Bola', 'Manej.': 'Manejabilidad', 'P. Dulce': 'Punto Dulce'} as Record<string, string>)[payload[0].payload.metric] ?? payload[0].payload.metric}
      </p>
      {payload.map((entry: any, index: number) => {
        const racket = metrics[index];
        return (
          <p
            key={index}
            style={{
              margin: '4px 0',
              color: entry.color,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {racket?.racketName}: <strong>{entry.value}/10</strong>
            {racket?.isCertified && <FiCheckCircle color='var(--primary)' size={12} />}
          </p>
        );
      })}
    </div>
  );
});

CustomTooltip.displayName = 'CustomTooltip';

// Leyenda personalizada
const Legend = memo(({ metrics }: { metrics: RacketComparisonData[] }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '1.5rem',
        marginTop: '0.25rem',
        flexWrap: 'wrap',
      }}
    >
      {metrics.map((racket, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: COLORS[index],
            }}
          />
          <span
            style={{
              fontSize: '0.875rem',
              color: 'var(--text)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {toTitleCase(racket.racketName)}
            {racket.isCertified && (
              <span title='Datos certificados por Testea Padel'>
                <FiCheckCircle color='var(--primary)' size={14} />
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
});

Legend.displayName = 'Legend';

const RacketRadarChart: React.FC<RacketRadarChartProps> = ({ metrics }) => {
  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];

    return [
      {
        metric: 'Potencia',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = Number(racket.radarData?.potencia) || 0;
          return acc;
        }, {} as any),
      },
      {
        metric: 'Control',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = Number(racket.radarData?.control) || 0;
          return acc;
        }, {} as any),
      },
      {
        metric: 'S. Bola',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = Number(racket.radarData?.salidaDeBola) || 0;
          return acc;
        }, {} as any),
      },
      {
        metric: 'Manej.',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = Number(racket.radarData?.manejabilidad) || 0;
          return acc;
        }, {} as any),
      },
      {
        metric: 'P. Dulce',
        ...metrics.reduce((acc, racket, idx) => {
          acc[`pala${idx + 1}`] = Number(racket.radarData?.puntoDulce) || 0;
          return acc;
        }, {} as any),
      },
    ];
  }, [metrics]);

  if (!metrics || metrics.length === 0) {
    return null;
  }

  return (
    <ChartContainer>
      <ChartSubtitle>
        <span>Puntaje 1-10</span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--primary)',
            fontWeight: 500,
          }}
        >
          <FiCheckCircle /> Datos Testea Pádel Certificados
        </span>
      </ChartSubtitle>

      <RadarWrapper>
      <ResponsiveContainer width='100%' height='100%'>
        <RadarChart data={chartData} outerRadius='75%' margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
          <PolarGrid strokeDasharray='3 3' stroke='var(--border)' />
          <PolarAngleAxis
            dataKey='metric'
            tick={{ fill: 'var(--text)', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: 'var(--text-subtle)', fontSize: 10 }}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip metrics={metrics} />} />
          {metrics.map((racket, index) => (
            <Radar
              key={index}
              name={toTitleCase(racket.racketName)}
              dataKey={`pala${index + 1}`}
              stroke={COLORS[index]}
              fill={COLORS[index]}
              fillOpacity={0.2}
              strokeWidth={3}
              isAnimationActive={true}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
      </RadarWrapper>

      <Legend metrics={metrics} />
    </ChartContainer>
  );
};

export default memo(RacketRadarChart, (prev, next) => {
  return JSON.stringify(prev.metrics) === JSON.stringify(next.metrics);
});
