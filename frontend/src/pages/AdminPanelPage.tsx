import React from 'react';
import AdminLayout from '../components/features/AdminLayout';
import AdminDashboard from '../components/features/AdminDashboard';

// No in-page auth/role guard needed: the router's requireAdmin beforeLoad on
// /admin already keeps a non-admin from ever mounting this page (and, unlike
// this component's former check, is the single source of truth for what
// "not admin" redirects to).
const AdminPanelPage: React.FC = () => (
  <AdminLayout>
    <AdminDashboard />
  </AdminLayout>
);

export default AdminPanelPage;
