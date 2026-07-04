import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { AdminService } from '../services/adminService';
import { FiAlertTriangle, FiCheck, FiX, FiLayers, FiArrowLeft } from 'react-icons/fi';
import { Link } from '@tanstack/react-router';
import { sileo } from 'sileo';

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--surface-2);
  padding: 2rem;
`;

const Header = styled.div`
  max-width: 1400px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border-radius: 8px;
  box-shadow: 0 1px 3px var(--shadow-color);
  transition: all 0.2s;

  &:hover {
    background: var(--surface-3);
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  gap: 2rem;
`;

const ConflictCard = styled.div`
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 4px 6px var(--shadow-color);
  padding: 1.5rem;
  border: 1px solid var(--border);
`;

const ConflictHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
`;

const ConflictTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RacketColumn = styled.div<{ type: 'existing' | 'new' }>`
  background: ${props => (props.type === 'existing' ? 'var(--primary-subtle)' : '#fff7ed')};
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid ${props => (props.type === 'existing' ? 'var(--primary-subtle)' : '#fed7aa')};
`;

const ColumnTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: var(--text);
  display: flex;
  justify-content: space-between;
`;

const DataList = styled.div`
  display: grid;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const DataRow = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 0.5rem;
`;

const Label = styled.span`
  color: var(--text-muted);
  font-weight: 500;
`;

const Value = styled.span`
  color: var(--text);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
`;

const ActionButton = styled.button<{ variant: 'success' | 'danger' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;

  ${props => {
    switch (props.variant) {
      case 'success':
        return `
          background: var(--primary);
          color: white;
          &:hover { background: var(--primary-hover); }
        `;
      case 'danger':
        return `
          background: var(--error);
          color: white;
          &:hover { background: var(--danger); }
        `;
      case 'neutral':
        return `
          background: var(--surface-3);
          color: var(--text);
          &:hover { background: var(--border); }
        `;
    }
  }}
`;

const AdminRacketReviewPage: React.FC = () => {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConflicts();
  }, []);

  const loadConflicts = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getRacketConflicts();
      setConflicts(data);
    } catch (error) {
      console.error('Error loading conflicts:', error);
      sileo.error({ title: 'Error', description: 'Error al cargar conflictos' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number, action: 'replace' | 'reject' | 'keep_both') => {
    try {
      await AdminService.resolveRacketConflict(id, action);
      sileo.success({ title: 'Éxito', description: 'Conflicto resuelto' });
      // Remove from list locally
      setConflicts(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error resolving conflict:', error);
      sileo.error({ title: 'Error', description: 'Error al resolver conflicto' });
    }
  };

  if (loading) {
    return <PageContainer>Cargando...</PageContainer>;
  }

  return (
    <PageContainer>
      <Header>
        <BackButton to='/admin'>
          <FiArrowLeft /> Volver
        </BackButton>
        <Title>Revisión de Conflictos ({conflicts.length})</Title>
      </Header>

      <Content>
        {conflicts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <h3>🎉 No hay conflictos pendientes</h3>
            <p>Todas las palas están sincronizadas correctamente.</p>
          </div>
        ) : (
          conflicts.map(conflict => (
            <ConflictCard key={conflict.id}>
              <ConflictHeader>
                <ConflictTitle>
                  <FiAlertTriangle color='var(--accent)' />
                  Posible Duplicado Detectado
                </ConflictTitle>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Detectado el: {new Date(conflict.created_at).toLocaleDateString()}
                </div>
              </ConflictHeader>

              <ComparisonGrid>
                {/* Existing Racket */}
                <RacketColumn type='existing'>
                  <ColumnTitle>
                    Existente (ID: {conflict.related_racket?.id})
                    <small style={{ fontWeight: 'normal', color: 'var(--primary)' }}>Activa</small>
                  </ColumnTitle>
                  {conflict.related_racket && (
                    <DataList>
                      <DataRow>
                        <Label>Nombre</Label>
                        <Value>{conflict.related_racket.name}</Value>
                      </DataRow>
                      <DataRow>
                        <Label>Marca</Label>
                        <Value>{conflict.related_racket.brand}</Value>
                      </DataRow>
                      <DataRow>
                        <Label>Modelo</Label>
                        <Value>{conflict.related_racket.model}</Value>
                      </DataRow>
                      <DataRow>
                        <Label>P. PadelPro</Label>
                        <Value>{conflict.related_racket.padelproshop_actual_price || '-'}€</Value>
                      </DataRow>
                    </DataList>
                  )}
                </RacketColumn>

                {/* New Racket (Conflict) */}
                <RacketColumn type='new'>
                  <ColumnTitle>
                    Nueva / Entrante (ID: {conflict.id})
                    <small style={{ fontWeight: 'normal', color: 'var(--accent)' }}>Conflicto</small>
                  </ColumnTitle>
                  <DataList>
                    <DataRow>
                      <Label>Nombre</Label>
                      <Value>{conflict.name}</Value>
                    </DataRow>
                    <DataRow>
                      <Label>Marca</Label>
                      <Value>{conflict.brand}</Value>
                    </DataRow>
                    <DataRow>
                      <Label>Modelo</Label>
                      <Value>{conflict.model}</Value>
                    </DataRow>
                    <DataRow>
                      <Label>P. PadelPro</Label>
                      <Value>{conflict.padelproshop_actual_price || '-'}€</Value>
                    </DataRow>
                  </DataList>
                </RacketColumn>
              </ComparisonGrid>

              <Actions>
                <ActionButton
                  variant='neutral'
                  onClick={() => handleResolve(conflict.id, 'keep_both')}
                >
                  <FiLayers /> Mantener Ambos
                </ActionButton>
                <ActionButton variant='danger' onClick={() => handleResolve(conflict.id, 'reject')}>
                  <FiX /> Rechazar Nuevo
                </ActionButton>
                <ActionButton
                  variant='success'
                  onClick={() => handleResolve(conflict.id, 'replace')}
                >
                  <FiCheck /> Aprobar (Sobrescribir)
                </ActionButton>
              </Actions>
            </ConflictCard>
          ))
        )}
      </Content>
    </PageContainer>
  );
};

export default AdminRacketReviewPage;
