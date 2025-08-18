import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiActivity,
  FiAlertCircle,
  FiArrowLeft,
  FiBarChart,
  FiCalendar,
  FiEdit,
  FiSave,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { UserProfileService } from "../services/userProfileService";

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fdf8 0%, #f0f9f0 100%);
  padding: 2rem 0;
`;

const Header = styled.div`
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  margin-bottom: 2rem;
`;

const HeaderContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #16a34a;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f0f9ff;
    color: #0369a1;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const ProfileCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  padding: 2rem;
  text-align: center;
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  border: 4px solid rgba(255, 255, 255, 0.3);
`;

const UserName = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
`;

const UserEmail = styled.p`
  font-size: 1rem;
  opacity: 0.8;
  margin: 0;
`;

const FormContainer = styled.div`
  padding: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SaveButton = styled.button<{ loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${(props) => (props.loading ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.loading ? 0.7 : 1)};

  &:hover {
    transform: ${(props) => (props.loading ? "none" : "translateY(-2px)")};
    box-shadow: ${(props) =>
      props.loading ? "none" : "0 8px 25px rgba(22, 163, 74, 0.4)"};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const EditToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  color: #16a34a;
  border: 2px solid #16a34a;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #16a34a;
    color: white;
  }
`;

const InfoCard = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
`;

const InfoText = styled.p`
  color: #0369a1;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

// Interfaces
interface UserProfileFormData {
  full_name: string;
  peso: string;
  altura: string;
  fecha_nacimiento: string;
  nivel_juego: string;
  limitaciones: string;
}

const UserProfilePage: React.FC = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserProfileFormData>({
    full_name: "",
    peso: "",
    altura: "",
    fecha_nacimiento: "",
    nivel_juego: "",
    limitaciones: "",
  });

  // Cargar datos del perfil cuando el componente se monta
  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || "",
        peso: userProfile.peso?.toString() || "",
        altura: userProfile.altura?.toString() || "",
        fecha_nacimiento: userProfile.fecha_nacimiento || "",
        nivel_juego: userProfile.nivel_juego || "",
        limitaciones: userProfile.limitaciones || "",
      });
    }
  }, [userProfile]);

  // Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (
      formData.peso &&
      (isNaN(Number(formData.peso)) || Number(formData.peso) <= 0)
    ) {
      toast.error("El peso debe ser un número válido mayor a 0");
      return false;
    }

    if (
      formData.altura &&
      (isNaN(Number(formData.altura)) || Number(formData.altura) <= 0)
    ) {
      toast.error("La altura debe ser un número válido mayor a 0");
      return false;
    }

    if (formData.fecha_nacimiento) {
      const birthDate = new Date(formData.fecha_nacimiento);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 5 || age > 120) {
        toast.error("Por favor, ingresa una fecha de nacimiento válida");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      toast.error("Usuario no autenticado");
      return;
    }

    setLoading(true);

    try {
      const updates = {
        full_name: formData.full_name || undefined,
        peso: formData.peso ? Number(formData.peso) : undefined,
        altura: formData.altura ? Number(formData.altura) : undefined,
        fecha_nacimiento: formData.fecha_nacimiento || undefined,
        nivel_juego: formData.nivel_juego || undefined,
        limitaciones: formData.limitaciones || undefined,
      };

      await UserProfileService.updateUserProfile(user.id, updates);
      await refreshUserProfile(); // Actualizar el perfil en el contexto
      toast.success("Perfil actualizado correctamente");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Error al actualizar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

  if (!user) {
    return null; // El useEffect redirigirá al login
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <BackButton to="/">
            <FiArrowLeft />
            Volver al inicio
          </BackButton>
          <HeaderTitle>Mi Perfil</HeaderTitle>
        </HeaderContent>
      </Header>

      <Content>
        <ProfileCard>
          <ProfileHeader>
            <Avatar>
              <FiUser size={40} />
            </Avatar>
            <UserName>
              {userProfile?.full_name || userProfile?.nickname || "Usuario"}
            </UserName>
            <UserEmail>{user.email}</UserEmail>
          </ProfileHeader>

          <FormContainer>
            <InfoCard>
              <InfoText>
                <FiAlertCircle size={16} />
                Completa tu perfil para recibir recomendaciones personalizadas
                de palas de pádel. Esta información nos ayuda a sugerir las
                mejores opciones según tu nivel y características físicas.
              </InfoText>
            </InfoCard>

            <form onSubmit={handleSubmit}>
              <SectionTitle>
                <FiUser />
                Información Personal
              </SectionTitle>

              <FormGrid>
                <FormGroup>
                  <Label htmlFor="full_name">
                    <FiUser size={16} />
                    Nombre Completo
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="fecha_nacimiento">
                    <FiCalendar size={16} />
                    Fecha de Nacimiento
                  </Label>
                  <Input
                    id="fecha_nacimiento"
                    name="fecha_nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  {formData.fecha_nacimiento && (
                    <HelperText>
                      Edad: {calculateAge(formData.fecha_nacimiento)} años
                    </HelperText>
                  )}
                </FormGroup>
              </FormGrid>

              <SectionTitle>
                <FiBarChart />
                Características Físicas
              </SectionTitle>

              <FormGrid>
                <FormGroup>
                  <Label htmlFor="peso">
                    <FiActivity size={16} />
                    Peso (kg)
                  </Label>
                  <Input
                    id="peso"
                    name="peso"
                    type="number"
                    placeholder="70"
                    min="20"
                    max="200"
                    step="0.1"
                    value={formData.peso}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  <HelperText>
                    Nos ayuda a recomendar el peso ideal de la pala
                  </HelperText>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="altura">
                    <FiBarChart size={16} />
                    Altura (cm)
                  </Label>
                  <Input
                    id="altura"
                    name="altura"
                    type="number"
                    placeholder="175"
                    min="120"
                    max="250"
                    value={formData.altura}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                  <HelperText>
                    Influye en el balance y longitud recomendada
                  </HelperText>
                </FormGroup>
              </FormGrid>

              <SectionTitle>
                <FiTrendingUp />
                Nivel de Juego
              </SectionTitle>

              <FormGrid>
                <FormGroup>
                  <Label htmlFor="nivel_juego">
                    <FiTrendingUp size={16} />
                    Nivel de Juego
                  </Label>
                  <Select
                    id="nivel_juego"
                    name="nivel_juego"
                    value={formData.nivel_juego}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  >
                    <option value="">Selecciona tu nivel</option>
                    <option value="Principiante">
                      Principiante (1.0 - 2.5)
                    </option>
                    <option value="Intermedio Bajo">
                      Intermedio Bajo (3.0 - 3.5)
                    </option>
                    <option value="Intermedio">Intermedio (4.0 - 4.5)</option>
                    <option value="Intermedio Alto">
                      Intermedio Alto (5.0 - 5.5)
                    </option>
                    <option value="Avanzado">Avanzado (6.0 - 6.5)</option>
                    <option value="Experto">Experto (7.0+)</option>
                  </Select>
                  <HelperText>
                    Basado en el sistema de clasificación Playtomic o similar
                  </HelperText>
                </FormGroup>
              </FormGrid>

              <SectionTitle>
                <FiAlertCircle />
                Limitaciones y Observaciones
              </SectionTitle>

              <FormGroup>
                <Label htmlFor="limitaciones">
                  <FiAlertCircle size={16} />
                  Limitaciones o Condiciones Especiales
                </Label>
                <TextArea
                  id="limitaciones"
                  name="limitaciones"
                  placeholder="Ej: Problemas de codo, espalda, muñeca, preferencias especiales, etc."
                  value={formData.limitaciones}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
                <HelperText>
                  Información opcional que nos ayuda a hacer mejores
                  recomendaciones
                </HelperText>
              </FormGroup>

              <ButtonContainer>
                <EditToggleButton
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <FiEdit />
                  {isEditing ? "Cancelar edición" : "Editar perfil"}
                </EditToggleButton>

                {isEditing && (
                  <SaveButton
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  >
                    <FiSave />
                    {loading ? "Guardando..." : "Guardar cambios"}
                  </SaveButton>
                )}
              </ButtonContainer>
            </form>
          </FormContainer>
        </ProfileCard>
      </Content>
    </Container>
  );
};

export default UserProfilePage;
