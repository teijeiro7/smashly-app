import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { FiX, FiSave, FiUser, FiCalendar, FiActivity, FiCamera, FiTrash2 } from "react-icons/fi";
import { GiTennisRacket } from "react-icons/gi";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile } from "../../services/userProfileService";
import { UploadService } from "../../services/uploadService";
import { useRackets } from "../../contexts/RacketsContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
`;

const Modal = styled(motion.div)`
  background: var(--surface);
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin: 2rem 0;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: var(--surface-3);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--border-strong);
    border-radius: 4px;

    &:hover {
      background: var(--text-subtle);
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--surface-3);
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 8px;

  &:hover {
    background: var(--surface-3);
    color: var(--text);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }

  &:disabled {
    background: var(--surface-3);
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: var(--surface);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
  }
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  ${(props) =>
    props.variant === "primary"
      ? `
    background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
    color: var(--text-inverse);
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
    }
    &:disabled {
      background: var(--text-subtle);
      cursor: not-allowed;
      transform: none;
    }
  `
      : `
    background: var(--surface-3);
    color: var(--text);
    &:hover {
      background: var(--border);
    }
  `}
`;

const HelperText = styled.span`
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: -0.25rem;
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--surface-2);
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const AvatarPreview = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--primary);
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  svg {
    color: var(--text-subtle);
  }
`;

const AvatarButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const AvatarButton = styled.button<{ variant?: "primary" | "danger" }>`
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${(props) =>
    props.variant === "danger"
      ? `
    background: var(--danger-subtle);
    color: var(--danger);
    &:hover {
      background: var(--danger-strong);
    }
  `
      : `
    background: var(--brand-surface);
    color: var(--brand-on-surface);
    &:hover {
      background: var(--primary-hover);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: var(--danger);
  text-align: center;
`;

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave,
}) => {
  const { rackets, loading: racketsLoading } = useRackets();
  const [formData, setFormData] = useState({
    nickname: "",
    full_name: "",
    current_racket: "",
    weight: "",
    height: "",
    birthdate: "",
    game_level: "",
    limitations: "",
    gender: "",
    physical_condition: "",
    position: "",
    frequency: "",
    touch_preference: "",
    balance_preference: "",
    shape_preference: "",
    weight_preference: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && userProfile) {
      setFormData({
        nickname: userProfile.nickname || "",
        full_name: userProfile.full_name || "",
        current_racket: userProfile.current_racket || "",
        weight: userProfile.weight?.toString() || "",
        height: userProfile.height?.toString() || "",
        birthdate: userProfile.birthdate || "",
        game_level: userProfile.game_level || "",
        limitations: userProfile.limitations?.[0] || "", // Tomar el primer elemento del array
        gender: userProfile.gender || "",
        physical_condition: userProfile.physical_condition || "",
        position: userProfile.position || "",
        frequency: userProfile.frequency || "",
        touch_preference: userProfile.touch_preference || "",
        balance_preference: userProfile.balance_preference || "",
        shape_preference: userProfile.shape_preference || "",
        weight_preference: userProfile.weight_preference || "",
      });
      setAvatarPreview(userProfile.avatar_url || null);
      setAvatarFile(null);
      setAvatarError(null);
    }
  }, [isOpen, userProfile]);

  // Limpiar URL de vista previa al cerrar
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarFile) {
        UploadService.revokePreviewUrl(avatarPreview);
      }
    };
  }, [avatarPreview, avatarFile]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    // Validar el archivo
    const validation = UploadService.validateImageFile(file);
    if (!validation.isValid) {
      setAvatarError(validation.error || "Archivo no válido");
      return;
    }

    // Liberar URL anterior si existe
    if (avatarPreview && avatarFile) {
      UploadService.revokePreviewUrl(avatarPreview);
    }

    // Crear vista previa
    const previewUrl = UploadService.createPreviewUrl(file);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
  };

  const handleRemoveAvatar = async () => {
    if (!userProfile.avatar_url && !avatarFile) return;

    try {
      setIsUploadingAvatar(true);
      setAvatarError(null);

      // Si hay un avatar en el servidor, eliminarlo
      if (userProfile.avatar_url) {
        await UploadService.deleteAvatar();
      }

      // Limpiar estado local
      if (avatarPreview && avatarFile) {
        UploadService.revokePreviewUrl(avatarPreview);
      }
      setAvatarFile(null);
      setAvatarPreview(null);

      // Actualizar el perfil sin avatar
      await onSave({ avatar_url: null } as any);
    } catch (error: any) {
      console.error("Error removing avatar:", error);
      setAvatarError(error.message || "Error al eliminar el avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setAvatarError(null);
    
    try {
      // Subir avatar si hay uno nuevo
      let avatarUrl = userProfile.avatar_url;
      if (avatarFile) {
        try {
          setIsUploadingAvatar(true);
          avatarUrl = await UploadService.uploadAvatar(avatarFile);
        } catch (error: any) {
          setAvatarError(error.message || "Error al subir el avatar");
          setIsUploadingAvatar(false);
          setIsSubmitting(false);
          return;
        } finally {
          setIsUploadingAvatar(false);
        }
      }

      const updates: any = {
        nickname: formData.nickname.trim(),
        full_name: formData.full_name.trim() || undefined,
        current_racket: formData.current_racket || undefined,
        game_level: formData.game_level || undefined,
        gender: formData.gender || undefined,
        physical_condition: formData.physical_condition || undefined,
        position: formData.position || undefined,
        frequency: formData.frequency || undefined,
        touch_preference: formData.touch_preference || undefined,
        balance_preference: formData.balance_preference || undefined,
        shape_preference: formData.shape_preference || undefined,
        weight_preference: formData.weight_preference || undefined,
      };

      // Incluir avatar_url si cambió
      if (avatarUrl !== userProfile.avatar_url) {
        updates.avatar_url = avatarUrl;
      }

      // Convertir limitations de string a array si tiene contenido
      if (formData.limitations.trim()) {
        updates.limitations = [formData.limitations.trim()];
      }

      // Solo incluir peso y altura si tienen valores
      if (formData.weight) {
        updates.weight = parseFloat(formData.weight);
      }
      if (formData.height) {
        updates.height = parseFloat(formData.height);
      }
      if (formData.birthdate) {
        updates.birthdate = formData.birthdate;
      }

      await onSave(updates);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <Modal
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>
                <FiUser />
                Editar Perfil
              </Title>
              <CloseButton onClick={handleClose} disabled={isSubmitting}>
                <FiX size={24} />
              </CloseButton>
            </Header>

            <Form onSubmit={handleSubmit}>
              {/* Sección de Avatar */}
              <AvatarSection>
                <AvatarPreview>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" />
                  ) : (
                    <FiUser size={48} />
                  )}
                </AvatarPreview>
                <AvatarButtons>
                  <AvatarButton
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isSubmitting || isUploadingAvatar}
                  >
                    <FiCamera size={16} />
                    {avatarPreview ? "Cambiar Foto" : "Subir Foto"}
                  </AvatarButton>
                  {(avatarPreview || userProfile.avatar_url) && (
                    <AvatarButton
                      type="button"
                      variant="danger"
                      onClick={handleRemoveAvatar}
                      disabled={isSubmitting || isUploadingAvatar}
                    >
                      <FiTrash2 size={16} />
                      Eliminar
                    </AvatarButton>
                  )}
                </AvatarButtons>
                <HiddenInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleAvatarChange}
                />
                {avatarError && <ErrorText>{avatarError}</ErrorText>}
                {isUploadingAvatar && (
                  <HelperText>Subiendo imagen...</HelperText>
                )}
                <HelperText>
                  Formatos: JPEG, PNG, WebP. Tamaño máximo: 5MB
                </HelperText>
              </AvatarSection>

              <FormSection>
                <SectionTitle>
                  <FiUser />
                  Información Personal
                </SectionTitle>

                <FormGroup>
                  <Label htmlFor="nickname">Nickname *</Label>
                  <Input
                    id="nickname"
                    type="text"
                    name="nickname"
                    placeholder="Tu nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                    maxLength={50}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    type="text"
                    name="full_name"
                    placeholder="Tu nombre completo"
                    value={formData.full_name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={100}
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="current_racket">Pala actual</Label>
                  <Select
                    id="current_racket"
                    name="current_racket"
                    value={formData.current_racket}
                    onChange={handleChange}
                    disabled={isSubmitting || racketsLoading}
                  >
                    <option value="">Selecciona tu pala actual</option>
                    {rackets.map(racket => {
                      const displayName = `${racket.marca} ${racket.modelo || racket.nombre}`.trim();
                      return (
                        <option key={racket.id} value={displayName}>
                          {displayName}
                        </option>
                      );
                    })}
                  </Select>
                  <HelperText>Este dato se utilizará para personalizar recomendaciones futuras</HelperText>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="birthdate">
                    <FiCalendar />
                    Fecha de Nacimiento
                  </Label>
                  <Input
                    id="birthdate"
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </FormGroup>

                <InputGroup>
                  <FormGroup>
                    <Label htmlFor="weight">
                      <FiActivity />
                      Peso (kg)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      name="weight"
                      placeholder="70"
                      value={formData.weight}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      min="30"
                      max="200"
                      step="0.1"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="height">
                      <FiActivity />
                      Altura (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      name="height"
                      placeholder="175"
                      value={formData.height}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      min="100"
                      max="250"
                      step="1"
                    />
                  </FormGroup>
                </InputGroup>
              </FormSection>

              <FormSection>
                <SectionTitle>
                  <FiActivity />
                  Información de Juego
                </SectionTitle>

                <FormGroup>
                  <Label htmlFor="game_level">Nivel de Juego</Label>
                  <Select
                    id="game_level"
                    name="game_level"
                    value={formData.game_level}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecciona tu nivel</option>
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Profesional">Profesional</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="limitations">Limitaciones o Lesiones</Label>
                  <TextArea
                    id="limitations"
                    name="limitations"
                    placeholder="Describe cualquier limitación física o lesión que debamos tener en cuenta..."
                    value={formData.limitations}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                  <HelperText>
                    Esta información nos ayuda a recomendarte las palas más
                    adecuadas
                  </HelperText>
                </FormGroup>
              </FormSection>

              <FormSection>
                <SectionTitle>
                  <GiTennisRacket size={18} /> Preferencias de juego
                </SectionTitle>

                <InputGroup>
                  <FormGroup>
                    <Label htmlFor="gender">Género</Label>
                    <Select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Selecciona género</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="physical_condition">Condición física</Label>
                    <Select
                      id="physical_condition"
                      name="physical_condition"
                      value={formData.physical_condition}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Selecciona condición</option>
                      <option value="asiduo">Asiduo al deporte</option>
                      <option value="ocasional">Ocasional</option>
                    </Select>
                  </FormGroup>
                </InputGroup>

                <InputGroup>
                  <FormGroup>
                    <Label htmlFor="position">Posición en pista</Label>
                    <Select
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Selecciona posición</option>
                      <option value="reves">Revés</option>
                      <option value="drive">Drive</option>
                      <option value="ambos">Indiferente</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="frequency">Frecuencia de juego</Label>
                    <Select
                      id="frequency"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Selecciona frecuencia</option>
                      <option value="1">1 vez/semana o menos</option>
                      <option value="2-3">2-3 veces/semana</option>
                      <option value="4+">4+ veces/semana</option>
                    </Select>
                  </FormGroup>
                </InputGroup>

                <InputGroup>
                  <FormGroup>
                    <Label htmlFor="touch_preference">Tacto de pala</Label>
                    <Select
                      id="touch_preference"
                      name="touch_preference"
                      value={formData.touch_preference}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">Selecciona tacto</option>
                      <option value="duro">Duro</option>
                      <option value="medio">Medio</option>
                      <option value="blando">Blando</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="weight_preference">Peso de pala</Label>
                    <Select
                      id="weight_preference"
                      name="weight_preference"
                      value={formData.weight_preference}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">No sé</option>
                      <option value="ligera">Ligera (&lt;360g)</option>
                      <option value="media">Media (360-375g)</option>
                      <option value="pesada">Pesada (&gt;375g)</option>
                    </Select>
                  </FormGroup>
                </InputGroup>

                <InputGroup>
                  <FormGroup>
                    <Label htmlFor="balance_preference">Balance de pala</Label>
                    <Select
                      id="balance_preference"
                      name="balance_preference"
                      value={formData.balance_preference}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">No sé</option>
                      <option value="bajo">Bajo (Manejable)</option>
                      <option value="medio">Medio (Equilibrado)</option>
                      <option value="alto">Alto (Potencia)</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="shape_preference">Forma de pala</Label>
                    <Select
                      id="shape_preference"
                      name="shape_preference"
                      value={formData.shape_preference}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    >
                      <option value="">No sé</option>
                      <option value="redonda">Redonda</option>
                      <option value="lagrima">Lágrima</option>
                      <option value="diamante">Diamante</option>
                    </Select>
                  </FormGroup>
                </InputGroup>

                <HelperText>
                  Estas preferencias se usarán para pre-rellenar los formularios de recomendación
                </HelperText>
              </FormSection>

              <ButtonGroup>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!formData.nickname.trim() || isSubmitting}
                >
                  <FiSave size={20} />
                  {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </ButtonGroup>
            </Form>
          </Modal>
        </Overlay>
      )}
    </AnimatePresence>
  );
};
