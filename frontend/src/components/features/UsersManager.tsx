import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiSearch, FiTrash2, FiShield, FiUser } from 'react-icons/fi';
import { sileo } from 'sileo';
import { AdminService, AdminUser } from '../../services/adminService';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const SearchBar = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-subtle);
  font-size: 1.25rem;
`;

const FilterButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.25rem;
  background: ${props => (props.active ? 'var(--primary)' : 'var(--surface)')};
  color: ${props => (props.active ? 'var(--text-inverse)' : 'var(--text-muted)')};
  border: 1px solid ${props => (props.active ? 'var(--primary)' : 'var(--border)')};
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => (props.active ? 'var(--primary-hover)' : 'var(--surface-2)')};
  }
`;

const Table = styled.div`
  background: var(--surface);
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1.5fr 1.5fr 1fr 1fr 1fr;
  padding: 1rem 1.5rem;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.875rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1.5fr 1fr;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1.5fr 1.5fr 1fr 1fr 1fr;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
  align-items: center;
  transition: background 0.2s ease;

  &:hover {
    background: var(--surface-2);
  }

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1.5fr 1fr;
    gap: 0.5rem;
  }
`;

const Cell = styled.div`
  color: var(--text);
  font-size: 0.875rem;

  @media (max-width: 1024px) {
    &:nth-child(n + 4) {
      display: none;
    }
  }
`;

const UserCell = styled(Cell)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
  color: var(--text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const UserName = styled.div`
  font-weight: 600;
  color: var(--text);
`;

const UserNickname = styled.div`
  font-size: 0.75rem;
  color: var(--text-subtle);
`;

const RoleBadge = styled.span<{ role: 'admin' | 'player' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: ${props => (props.role === 'admin' ? 'rgba(220, 38, 38, 0.10)' : 'rgba(37, 99, 235, 0.10)')};
  color: ${props => (props.role === 'admin' ? 'var(--danger)' : 'var(--info)')};

  svg {
    font-size: 0.875rem;
  }
`;

const ActionsCell = styled(Cell)`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const IconButton = styled.button<{ color?: string }>`
  padding: 0.5rem;
  background: ${props => props.color || 'var(--surface-3)'};
  color: ${props => (props.color ? 'var(--text-inverse)' : 'var(--text-muted)')};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.8;
    transform: translateY(-2px);
  }

  svg {
    font-size: 1rem;
  }
`;

const EmptyState = styled.div`
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: var(--text-muted);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: var(--surface);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: var(--text-muted);
  font-size: 0.875rem;
`;

type FilterType = 'all' | 'admin' | 'player';

const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users, filter]);

  const loadUsers = async () => {
    try {
      // Cargar usuarios reales desde la API
      const usersData = await AdminService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      sileo.error({ title: 'Error', description: 'Error al cargar los usuarios' });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtrar por rol
    if (filter !== 'all') {
      filtered = filtered.filter(u => u.role === filter);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        u =>
          u.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleRole = async (userId: string, currentRole: 'admin' | 'player') => {
    const newRole = currentRole === 'admin' ? 'player' : 'admin';
    const confirmMessage = `¿Estás seguro de cambiar el rol a ${
      newRole === 'admin' ? 'Administrador' : 'Jugador'
    }?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Llamar a la API para actualizar el rol
      await AdminService.updateUserRole(userId, newRole);

      // Actualizar el estado local
      setUsers(users.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
      sileo.success({ title: 'Éxito', description: 'Rol actualizado correctamente' });
    } catch (error) {
      console.error('Error updating user role:', error);
      sileo.error({ title: 'Error', description: 'Error al actualizar el rol' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm(
        '¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      // Llamar a la API para eliminar el usuario
      await AdminService.deleteUser(userId);

      // Actualizar el estado local
      setUsers(users.filter(u => u.id !== userId));
      sileo.success({ title: 'Éxito', description: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting user:', error);
      sileo.error({ title: 'Error', description: 'Error al eliminar el usuario' });
    }
  };

  const getInitials = (name: string, nickname: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();
    }
    return nickname.substring(0, 2).toUpperCase();
  };

  const totalAdmins = users.filter(u => u.role?.toLowerCase() === 'admin').length;
  const totalPlayers = users.filter(u => u.role?.toLowerCase() === 'player').length;

  if (loading) {
    return <LoadingContainer>Cargando usuarios...</LoadingContainer>;
  }

  return (
    <Container>
      <StatsGrid>
        <StatCard>
          <StatValue>{users.length}</StatValue>
          <StatLabel>Total Usuarios</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalPlayers}</StatValue>
          <StatLabel>Jugadores</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{totalAdmins}</StatValue>
          <StatLabel>Administradores</StatLabel>
        </StatCard>
      </StatsGrid>

      <TopBar>
        <SearchBar>
          <SearchIcon />
          <SearchInput
            type='text'
            placeholder='Buscar por nombre, email o nickname...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </SearchBar>
        <FilterButtons>
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
            Todos
          </FilterButton>
          <FilterButton active={filter === 'player'} onClick={() => setFilter('player')}>
            Jugadores
          </FilterButton>
          <FilterButton active={filter === 'admin'} onClick={() => setFilter('admin')}>
            Administradores
          </FilterButton>
        </FilterButtons>
      </TopBar>

      <Table>
        <TableHeader>
          <Cell>#</Cell>
          <Cell>Usuario</Cell>
          <Cell>Email</Cell>
          <Cell>Rol</Cell>
          <Cell>Registro</Cell>
          <Cell style={{ textAlign: 'right' }}>Acciones</Cell>
        </TableHeader>
        {filteredUsers.length === 0 ? (
          <EmptyState>
            {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios para mostrar'}
          </EmptyState>
        ) : (
          filteredUsers.map((user, index) => (
            <TableRow key={user.id}>
              <Cell>{index + 1}</Cell>
              <UserCell>
                <Avatar>{getInitials(user.full_name || '', user.nickname)}</Avatar>
                <UserInfo>
                  <UserName>{user.full_name || user.nickname}</UserName>
                  <UserNickname>@{user.nickname}</UserNickname>
                </UserInfo>
              </UserCell>
              <Cell>{user.email}</Cell>
              <Cell>
                <RoleBadge role={user.role}>
                  {user.role === 'admin' ? <FiShield /> : <FiUser />}
                  {user.role === 'admin' ? 'Admin' : 'Jugador'}
                </RoleBadge>
              </Cell>
              <Cell>{new Date(user.created_at).toLocaleDateString()}</Cell>
              <ActionsCell>
                <IconButton
                  color='var(--info)'
                  onClick={() => handleToggleRole(user.id, user.role)}
                  title={`Cambiar a ${user.role === 'admin' ? 'Jugador' : 'Admin'}`}
                >
                  {user.role === 'admin' ? <FiUser /> : <FiShield />}
                </IconButton>
                <IconButton
                  color='var(--error)'
                  onClick={() => handleDeleteUser(user.id)}
                  title='Eliminar usuario'
                >
                  <FiTrash2 />
                </IconButton>
              </ActionsCell>
            </TableRow>
          ))
        )}
      </Table>
    </Container>
  );
};

export default UsersManager;
