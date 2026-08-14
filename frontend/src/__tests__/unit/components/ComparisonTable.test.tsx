import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComparisonTable from '../../../components/features/ComparisonTable';
import { ComparisonTableItem, RacketComparisonData, Racket } from '../../../types/racket';

const metrics: RacketComparisonData[] = [
  {
    racketId: 0,
    racketName: 'Nox AT10 Genius 12K 2025',
    isCertified: true,
    radarData: { potencia: 9, control: 8, manejabilidad: 9, puntoDulce: 6, salidaDeBola: 6 },
  },
  {
    racketId: 1,
    racketName: 'Bullpadel Vertex 04 2025',
    isCertified: true,
    radarData: { potencia: 8, control: 9, manejabilidad: 8, puntoDulce: 4, salidaDeBola: 5 },
  },
];

// metric.racketId is the racket's POSITION in the request (see api/comparison.ts),
// not its database id — these ids are deliberately far from 0/1 to catch a
// regression to the old `rackets.find(r => r.id === metric.racketId)` lookup.
const rackets: Racket[] = [
  {
    id: 19174,
    slug: 'nox',
    nombre: 'Nox AT10 Genius 12K 2025',
    marca: 'Nox',
    modelo: '',
    imagenes: [],
    en_oferta: false,
    precio_actual: 149.95,
  } as any,
  {
    id: 19200,
    slug: 'bullpadel',
    nombre: 'Bullpadel Vertex 04 2025',
    marca: 'Bullpadel',
    modelo: '',
    imagenes: [],
    en_oferta: false,
    precio_actual: 208.95,
  } as any,
];

describe('ComparisonTable', () => {
  it('shows the real catalog price via position, not an id lookup that never matches', () => {
    // Racket names as keys (mirroring the AI's freeform JSON) can't be object
    // literal properties without tripping the camelCase lint rule, hence the
    // bracket assignment instead of `{ 'Nox ...': ... }`.
    const row = { feature: 'Precio aprox.' } as ComparisonTableItem;
    row['Nox AT10 Genius 12K 2025'] = '≈ 380 €'; // what the AI wrote — must be overridden
    row['Bullpadel Vertex 04 2025'] = '≈ 420 €';
    const data: ComparisonTableItem[] = [row];

    render(<ComparisonTable data={data} metrics={metrics} rackets={rackets} />);

    // Rendered twice (desktop table + mobile cards), both hidden/shown purely via CSS.
    expect(screen.getAllByText('149.95 €').length).toBeGreaterThan(0);
    expect(screen.getAllByText('208.95 €').length).toBeGreaterThan(0);
    expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
  });

  it('falls back to matching by column position when the AI renames a column', () => {
    // Deliberately doesn't match either racket name at all — only the column
    // order (same order as `metrics`) identifies which is which.
    const row = { feature: 'Forma' } as ComparisonTableItem;
    row['Pala 1'] = 'Lágrima';
    row['Pala 2'] = 'Diamante';
    const data: ComparisonTableItem[] = [row];

    render(<ComparisonTable data={data} metrics={metrics} rackets={rackets} />);

    expect(screen.getAllByText('Lágrima').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Diamante').length).toBeGreaterThan(0);
  });
});
