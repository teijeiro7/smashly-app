import React from 'react';
import styled from 'styled-components';
import AdminLayout from '../components/features/AdminLayout';
import StoreRequestsManager from '../components/features/StoreRequestsManager';

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
  letter-spacing: -0.025em;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const PageSubtitle = styled.p`
  color: var(--text-muted);
  font-size: 1rem;
`;

// No in-page auth/role guard needed: the router's requireAdmin beforeLoad on
// /admin/stores already keeps a non-admin from ever mounting this page.
const AdminStoresPage: React.FC = () => {
  return (
    <AdminLayout>
      <PageHeader>
        <PageTitle>Gestión de Tiendas</PageTitle>
        <PageSubtitle>Administra las solicitudes y tiendas asociadas</PageSubtitle>
      </PageHeader>
      <StoreRequestsManager />
    </AdminLayout>
  );
};

export default AdminStoresPage;
