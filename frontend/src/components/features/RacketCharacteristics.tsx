import { motion } from "framer-motion";
import React from "react";
import styled from "styled-components";
import { RacketCharacteristics as RacketCharacteristicsType } from "../../types/racket";
import { shouldDisplayCharacteristic } from "../../utils/characteristicsUtils";

const CharacteristicsContainer = styled(motion.div)`
  background: var(--surface);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CharacteristicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const CharacteristicItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-2);
  border-radius: 8px;
  border: 1px solid rgba(var(--primary-rgb), 0.15);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

const CharacteristicLabel = styled.span`
  font-weight: 500;
  color: var(--text);
  text-transform: capitalize;
`;

const CharacteristicValue = styled.span`
  font-weight: 600;
  color: var(--primary);
`;

const DescriptionContainer = styled.div`
  background: var(--primary-subtle);
  border-radius: 12px;
  padding: 1.25rem;
  margin-top: 1rem;
  border: 1px solid rgba(var(--primary-rgb), 0.2);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
`;

const DescriptionTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.75rem;
`;

const DescriptionText = styled.p`
  color: var(--text);
  line-height: 1.6;
  margin: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-style: italic;
`;

interface RacketCharacteristicsProps {
  características?: RacketCharacteristicsType;
  descripcion?: string;
}

// Mapeo de nombres técnicos a nombres amigables
const characteristicLabels: Record<string, string> = {
  marca: "Marca",
  color: "Color",
  color_secundario: "Color Secundario",
  balance: "Balance",
  nucleo: "Núcleo",
  dureza: "Dureza",
  acabado: "Acabado",
  superficie: "Superficie",
  forma: "Forma",
  tipo_juego: "Tipo de Juego",
  nivel_jugador: "Nivel del Jugador",
  nivel_juego: "Nivel de Juego",
  peso: "Peso",
  grosor: "Grosor",
  material: "Material",
  material_cara: "Material de la Cara",
  material_marco: "Material del Marco",
};

const RacketCharacteristics: React.FC<RacketCharacteristicsProps> = ({
  características,
  descripcion,
}) => {
  const hasCharacteristics =
    características && Object.keys(características).length > 0;
  const hasDescription = descripcion && descripcion.trim().length > 0;

  if (!hasCharacteristics && !hasDescription) {
    return (
      <CharacteristicsContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <SectionTitle>Características Técnicas</SectionTitle>
        <EmptyState>
          No hay características técnicas disponibles para esta pala.
        </EmptyState>
      </CharacteristicsContainer>
    );
  }

  return (
    <CharacteristicsContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SectionTitle>Características Técnicas</SectionTitle>

      {hasCharacteristics && (
        <CharacteristicsGrid>
          {Object.entries(características!).map(([key, value]) => {
            if (!shouldDisplayCharacteristic(key, value)) return null;

            const label = characteristicLabels[key] || key.replace(/_/g, " ");

            return (
              <CharacteristicItem key={key}>
                <CharacteristicLabel>{label}</CharacteristicLabel>
                <CharacteristicValue>{value}</CharacteristicValue>
              </CharacteristicItem>
            );
          })}
        </CharacteristicsGrid>
      )}

      {hasDescription && (
        <DescriptionContainer>
          <DescriptionTitle>Descripción</DescriptionTitle>
          <DescriptionText>{descripcion}</DescriptionText>
        </DescriptionContainer>
      )}
    </CharacteristicsContainer>
  );
};

export default RacketCharacteristics;
