import React from 'react';
import styled from 'styled-components';
import AdminLayout from '../components/features/AdminLayout';
import UsersManager from '../components/features/UsersManager';

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
// /admin/users already keeps a non-admin from ever mounting this page.
const AdminUsersPage: React.FC = () => {
  return (
    <AdminLayout>
      <PageHeader>
        <PageTitle>Gestión de Usuarios</PageTitle>
        <PageSubtitle>Administra los usuarios de la plataforma</PageSubtitle>
      </PageHeader>
      <UsersManager />
    </AdminLayout>
  );
};

export default AdminUsersPage;
