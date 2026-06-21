import React from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from '@tanstack/react-router';
import AdminLayout from "../components/features/AdminLayout";
import AdminDashboard from "../components/features/AdminDashboard";

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const AdminPanelPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingContainer>
        <div>Cargando...</div>
      </LoadingContainer>
    );
  }

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
};

export default AdminPanelPage;
