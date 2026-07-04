export interface TesteaMetrics {
  potencia: number;
  control: number;
  manejabilidad: number;
  confort: number;
  iniciacion?: number;
  certificado: boolean;
}

export function getTesteaMetrics(racket: any): TesteaMetrics {
  if (hasTesteaCertification(racket)) {
    return {
      potencia: racket.testea_potencia ?? 5,
      control: racket.testea_control ?? 5,
      manejabilidad: racket.testea_manejabilidad ?? 5,
      confort: racket.testea_confort ?? 5,
      iniciacion: racket.testea_iniciacion,
      certificado: true,
    };
  }
  return calculateFallbackMetrics(racket);
}

function hasTesteaCertification(racket: any): boolean {
  return (
    racket.testea_certificado === true ||
    (racket.testea_potencia !== undefined &&
      racket.testea_control !== undefined &&
      racket.testea_manejabilidad !== undefined &&
      racket.testea_confort !== undefined)
  );
}

function calculateFallbackMetrics(racket: any): TesteaMetrics {
  const forma = (racket.caracteristicas_forma || '').toLowerCase();
  const balance = (racket.caracteristicas_balance || '').toLowerCase();
  const dureza = (racket.caracteristicas_dureza || '').toLowerCase();
  const peso = racket.peso || 365;

  let potencia = 5;
  if (forma.includes('diamante')) potencia += 2;
  else if (forma.includes('lágrima') || forma.includes('lagrima')) potencia += 1;
  if (balance.includes('alto')) potencia += 2;
  else if (balance.includes('medio')) potencia += 1;
  if (peso > 370) potencia += 1;
  potencia = Math.min(10, potencia);

  let control = 5;
  if (forma.includes('redonda')) control += 2;
  else if (forma.includes('lágrima') || forma.includes('lagrima')) control += 1;
  if (balance.includes('bajo')) control += 2;
  else if (balance.includes('medio')) control += 1;
  if (dureza.includes('blanda') || dureza.includes('soft')) control += 1;
  control = Math.min(10, control);

  let manejabilidad = 5;
  if (peso < 355) manejabilidad += 2;
  else if (peso < 365) manejabilidad += 1;
  if (balance.includes('bajo') || balance.includes('medio')) manejabilidad += 1;
  manejabilidad = Math.min(10, manejabilidad);

  let confort = 5;
  if (dureza.includes('blanda') || dureza.includes('soft')) confort += 2;
  else if (dureza.includes('media')) confort += 1;
  if (racket.tiene_antivibracion) confort += 1;
  confort = Math.min(10, confort);

  return { potencia, control, manejabilidad, confort, certificado: false };
}

/**
 * Returns certified DB radar values for a racket, or null if Testea data is unavailable.
 * puntoDulce and salidaDeBola are derived deterministically from shape and hardness.
 */
export function getDbRadarValues(racket: any): null | Record<string, number> {
  const hasCertified = [
    racket.testea_potencia,
    racket.testea_control,
    racket.testea_manejabilidad,
    racket.testea_confort,
  ].every(v => v !== null && v !== undefined);

  if (!hasCertified) return null;

  const forma = (racket.caracteristicas_forma || '').toLowerCase();
  const dureza = (racket.caracteristicas_dureza || '').toLowerCase();

  const puntoDulce =
    forma.includes('redonda') ? 8
    : forma.includes('lágrima') || forma.includes('lagrima') ? 6
    : 4;

  const salidaDeBola =
    dureza.includes('blanda') || dureza.includes('soft') ? 8
    : dureza.includes('media') ? 6
    : 4;

  return {
    potencia: racket.testea_potencia,
    control: racket.testea_control,
    manejabilidad: racket.testea_manejabilidad,
    puntoDulce,
    salidaDeBola,
  };
}
