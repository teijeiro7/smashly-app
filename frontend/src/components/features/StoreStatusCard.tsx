import React from 'react';
import styled from 'styled-components';
import { FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const Card = styled.div`
  background: var(--surface);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const IconBox = styled.div<{ $status: string }>`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  background: ${({ $status }) =>
    $status === 'verified'
      ? 'var(--primary-subtle)'
      : $status === 'rejected'
        ? 'var(--danger-subtle)'
        : 'var(--accent-subtle)'};
  color: ${({ $status }) =>
    $status === 'verified'
      ? 'var(--primary-hover)'
      : $status === 'rejected'
        ? 'var(--danger)'
        : 'var(--accent)'};
`;

const Content = styled.div`
  flex: 1;
`;

const StatusLabel = styled.div<{ $status: string }>`
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
  color: ${({ $status }) =>
    $status === 'verified'
      ? 'var(--primary-hover)'
      : $status === 'rejected'
        ? 'var(--danger)'
        : 'var(--accent)'};
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
`;

const Message = styled.p`
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0.25rem 0 0;
  line-height: 1.5;
`;

const ReasonBox = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  background: rgba(var(--danger-rgb), 0.06);
  border-radius: 10px;
  font-size: 0.875rem;
  color: var(--danger);
  line-height: 1.5;
`;

interface StoreStatusCardProps {
  status: 'pending' | 'verified' | 'rejected';
  storeName: string;
  rejectionReason?: string;
}

const config = {
  pending: {
    icon: FiClock,
    label: 'Pendiente de revisión',
    title: 'Tu tienda está en revisión',
    message:
      'El equipo de Smashly verificará tu información en las próximas 24-48 horas. Te notificaremos cuando esté lista.',
  },
  verified: {
    icon: FiCheckCircle,
    label: 'Verificada',
    title: 'Tienda verificada',
    message: 'Tu tienda ya está activa y visible para los usuarios de Smashly.',
  },
  rejected: {
    icon: FiXCircle,
    label: 'Rechazada',
    title: 'Solicitud rechazada',
    message: 'Tu solicitud de tienda no ha sido aprobada. Revisa el motivo a continuación.',
  },
};

const StoreStatusCard: React.FC<StoreStatusCardProps> = ({
  status,
  storeName: _storeName,
  rejectionReason,
}) => {
  const { icon: Icon, label, title, message } = config[status];

  return (
    <Card>
      <IconBox $status={status}>
        <Icon />
      </IconBox>
      <Content>
        <StatusLabel $status={status}>{label}</StatusLabel>
        <Title>{title}</Title>
        <Message>{message}</Message>
        {status === 'rejected' && rejectionReason && (
          <ReasonBox>
            <strong>Motivo:</strong> {rejectionReason}
          </ReasonBox>
        )}
      </Content>
    </Card>
  );
};

export default StoreStatusCard;
