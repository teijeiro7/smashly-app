import React from 'react';
import styled from 'styled-components';
import { ComparisonTableItem, Racket, RacketComparisonData } from '../../types/racket';
import { FiCheckCircle, FiMinus } from 'react-icons/fi';

const toTitleCase = (str: string): string =>
  str.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

interface ComparisonTableProps {
  data: ComparisonTableItem[];
  metrics: RacketComparisonData[];
  rackets?: Racket[];
}

const RACKET_COLORS = ['var(--primary)', 'var(--info)', 'var(--accent)'];

// ── Desktop table ─────────────────────────────────────────────

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-bottom: 3rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  background: var(--surface);
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: var(--surface-3); border-radius: 3px; }
  &::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }

  @media (max-width: 768px) {
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: var(--surface-2);
  color: var(--text);
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 2px solid var(--border);
  white-space: nowrap;

  &:first-child { border-top-left-radius: 16px; width: 25%; min-width: 100px; }
  &:last-child  { border-top-right-radius: 16px; }
`;

const Tr = styled.tr`
  &:last-child td { border-bottom: none; }
  &:nth-child(even) { background: var(--surface-2); }
  transition: background 0.2s;
  &:hover { background: var(--surface-3); }
`;

const Td = styled.td`
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: nowrap;
  &:first-child { font-weight: 600; color: var(--text); }
`;

const CheckMark = styled(FiCheckCircle)`
  color: var(--primary-hover);
  margin-left: 0.5rem;
  vertical-align: middle;
`;

const EmptyMark = styled(FiMinus)`
  color: var(--border-strong);
`;

// ── Mobile cards ──────────────────────────────────────────────

const MobileCards = styled.div`
  display: none;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const FeatureCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
`;

const FeatureHeader = styled.div`
  background: var(--surface-2);
  padding: 0.5rem 0.875rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
`;

const RacketRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.875rem;
  gap: 0.625rem;
  border-bottom: 1px solid var(--surface-3);

  &:last-child { border-bottom: none; }
`;

const RacketDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background: ${p => p.$color};
`;

const RacketNameMobile = styled.span`
  font-size: 0.8125rem;
  color: var(--text-muted);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RacketValueMobile = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text);
  text-align: right;
`;

// ── Helpers ───────────────────────────────────────────────────

const normalizeString = (str: string): string =>
  str.toLowerCase().replace(/\s+/g, ' ').replace(/\d{4}/g, '').trim();

const findMatchingValue = (row: any, racketName: string): any => {
  const normalizedRacketName = normalizeString(racketName);
  const racketKey = racketName.split(' ')[0].toLowerCase();

  for (const key of Object.keys(row)) {
    if (key === 'feature') continue;
    const normalizedKey = normalizeString(key);
    if (normalizedKey === normalizedRacketName) return row[key];
    if (normalizedKey.includes(racketKey) || racketKey.includes(normalizedKey)) return row[key];
    const keyParts = normalizedKey.split(' ');
    const nameParts = normalizedRacketName.split(' ');
    if (keyParts.some(p => nameParts.some(n => n.includes(p) || p.includes(n)))) return row[key];
  }
  return null;
};

const EXCLUDED_FEATURES = ['peso', 'weight'];

const isPriceRow = (feature: string) => /precio|price/i.test(feature);

const getRacketPrice = (metric: RacketComparisonData, rackets?: Racket[]): string | null => {
  if (!rackets) return null;
  const racket = rackets.find(r => r.id === metric.racketId);
  if (!racket) return null;
  const price = racket.precio_actual;
  return price ? `${price.toFixed(2)} €` : null;
};

// ── Component ─────────────────────────────────────────────────

const ComparisonTable: React.FC<ComparisonTableProps> = ({ data, metrics, rackets }) => {
  if (!data || data.length === 0 || !metrics || metrics.length === 0) return null;

  const filteredData = data.filter(row => {
    const f = row.feature?.toLowerCase() || '';
    return !EXCLUDED_FEATURES.some(e => f.includes(e));
  });

  if (filteredData.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ color: 'var(--primary-hover)', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
        Comparativa Detallada
      </h3>

      {/* Desktop table */}
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th>Característica</Th>
              {metrics.map((racket, i) => (
                <Th key={i}>
                  {toTitleCase(racket.racketName)}
                  {racket.isCertified && <CheckMark size={16} title='Datos certificados por Testea Padel' />}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, ri) => (
              <Tr key={ri}>
                <Td>{row.feature}</Td>
                {metrics.map((racket, ci) => {
                  const val = isPriceRow(row.feature)
                    ? (getRacketPrice(racket, rackets) ?? findMatchingValue(row, racket.racketName))
                    : findMatchingValue(row, racket.racketName);
                  return <Td key={ci}>{val ?? <EmptyMark />}</Td>;
                })}
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      {/* Mobile cards */}
      <MobileCards>
        {filteredData.map((row, ri) => (
          <FeatureCard key={ri}>
            <FeatureHeader>{row.feature}</FeatureHeader>
            {metrics.map((racket, ci) => {
              const val = isPriceRow(row.feature)
                ? (getRacketPrice(racket, rackets) ?? findMatchingValue(row, racket.racketName))
                : findMatchingValue(row, racket.racketName);
              return (
                <RacketRow key={ci}>
                  <RacketDot $color={RACKET_COLORS[ci] ?? 'var(--text-muted)'} />
                  <RacketNameMobile>
                    {toTitleCase(racket.racketName)}
                    {racket.isCertified && (
                      <FiCheckCircle size={11} color='var(--primary-hover)' style={{ marginLeft: 4, verticalAlign: 'middle' }} />
                    )}
                  </RacketNameMobile>
                  <RacketValueMobile>{val ?? '—'}</RacketValueMobile>
                </RacketRow>
              );
            })}
          </FeatureCard>
        ))}
      </MobileCards>
    </div>
  );
};

export default ComparisonTable;
