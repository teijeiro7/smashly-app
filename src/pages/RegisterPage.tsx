import React, { useState } from "react";
import {
  FiArrowRight,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import styled from "styled-components";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  general?: string;
}

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
`;

const Card = styled.div`
  background: white;
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #16a34a, #059669, #047857);
  }

  @media (max-width: 640px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  position: relative;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const InputContainer = styled.div`
  position: relative;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid ${(props) => (props.hasError ? "#ef4444" : "#e5e7eb")};
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: #fafafa;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? "#ef4444" : "#16a34a")};
    background: white;
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.hasError ? "rgba(239, 68, 68, 0.1)" : "rgba(22, 163, 74, 0.1)"};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  z-index: 1;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;

  &:hover {
    color: #16a34a;
    background: #f3f4f6;
  }
`;

const ErrorMessage = styled.span`
  display: block;
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const SuccessMessage = styled.span`
  display: block;
  color: #16a34a;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const PasswordStrengthIndicator = styled.div`
  margin-top: 0.5rem;
`;

const StrengthBar = styled.div<{ strength: number }>`
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  overflow: hidden;

  &::after {
    content: "";
    display: block;
    height: 100%;
    width: ${(props) => props.strength * 25}%;
    background: ${(props) => {
      if (props.strength <= 1) return "#ef4444";
      if (props.strength <= 2) return "#f59e0b";
      if (props.strength <= 3) return "#eab308";
      return "#16a34a";
    }};
    transition: all 0.3s ease;
  }
`;

const StrengthText = styled.div<{ strength: number }>`
  font-size: 0.75rem;
  margin-top: 0.25rem;
  color: ${(props) => {
    if (props.strength <= 1) return "#ef4444";
    if (props.strength <= 2) return "#f59e0b";
    if (props.strength <= 3) return "#eab308";
    return "#16a34a";
  }};
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const CheckboxInput = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  cursor: pointer;
  accent-color: #16a34a;

  &:focus {
    outline: 2px solid #16a34a;
    outline-offset: 2px;
  }
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: #4b5563;
  line-height: 1.5;
  cursor: pointer;

  a {
    color: #16a34a;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 1rem;
  background: ${(props) =>
    props.disabled
      ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
      : "linear-gradient(135deg, #16a34a 0%, #059669 100%)"};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;

  &:hover {
    background: ${(props) =>
      props.disabled
        ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)"
        : "linear-gradient(135deg, #059669 0%, #047857 100%)"};
    transform: ${(props) => (props.disabled ? "none" : "translateY(-2px)")};
    box-shadow: ${(props) =>
      props.disabled ? "none" : "0 8px 25px rgba(22, 163, 74, 0.3)"};
  }

  &:active {
    transform: ${(props) => (props.disabled ? "none" : "translateY(0)")};
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  span {
    padding: 0 1rem;
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const LoginLink = styled.div`
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;

  a {
    color: #16a34a;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Calcular fuerza de la contraseña
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

  const getPasswordStrengthText = (strength: number): string => {
    switch (strength) {
      case 0:
      case 1:
        return "Muy débil";
      case 2:
        return "Débil";
      case 3:
        return "Fuerte";
      case 4:
        return "Muy fuerte";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpiar errores al escribir
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Calcular fuerza de contraseña
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre
    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "El email es obligatorio";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = "La contraseña es obligatoria";
    } else if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    // Validar términos
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debes aceptar los términos y condiciones";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simular registro (aquí integrarías con tu API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Éxito - aquí podrías redirigir al usuario
      console.log("Usuario registrado:", {
        name: formData.name,
        email: formData.email,
        // No loguear la contraseña por seguridad
      });

      // Resetear formulario
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptTerms: false,
      });
      setPasswordStrength(0);

      alert("¡Registro exitoso! Bienvenido a Smashly.");
    } catch (error) {
      setErrors({
        general: "Error al crear la cuenta. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Header>
          <Title>Crear cuenta</Title>
          <Subtitle>
            Únete a Smashly y descubre tu pala ideal con inteligencia artificial
          </Subtitle>
        </Header>

        <Form onSubmit={handleSubmit}>
          {/* Nombre completo */}
          <FormGroup>
            <Label htmlFor="name">Nombre completo</Label>
            <InputContainer>
              <InputIcon>
                <FiUser size={18} />
              </InputIcon>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Tu nombre completo"
                value={formData.name}
                onChange={handleInputChange}
                hasError={!!errors.name}
              />
            </InputContainer>
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </FormGroup>

          {/* Email */}
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <InputContainer>
              <InputIcon>
                <FiMail size={18} />
              </InputIcon>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                hasError={!!errors.email}
              />
            </InputContainer>
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </FormGroup>

          {/* Contraseña */}
          <FormGroup>
            <Label htmlFor="password">Contraseña</Label>
            <InputContainer>
              <InputIcon>
                <FiLock size={18} />
              </InputIcon>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={handleInputChange}
                hasError={!!errors.password}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </PasswordToggle>
            </InputContainer>
            {formData.password && (
              <PasswordStrengthIndicator>
                <StrengthBar strength={passwordStrength} />
                <StrengthText strength={passwordStrength}>
                  {getPasswordStrengthText(passwordStrength)}
                </StrengthText>
              </PasswordStrengthIndicator>
            )}
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
          </FormGroup>

          {/* Confirmar contraseña */}
          <FormGroup>
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <InputContainer>
              <InputIcon>
                <FiLock size={18} />
              </InputIcon>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                hasError={!!errors.confirmPassword}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FiEyeOff size={18} />
                ) : (
                  <FiEye size={18} />
                )}
              </PasswordToggle>
            </InputContainer>
            {errors.confirmPassword && (
              <ErrorMessage>{errors.confirmPassword}</ErrorMessage>
            )}
            {formData.confirmPassword &&
              formData.password === formData.confirmPassword && (
                <SuccessMessage>✓ Las contraseñas coinciden</SuccessMessage>
              )}
          </FormGroup>

          {/* Términos y condiciones */}
          <FormGroup>
            <CheckboxContainer>
              <CheckboxInput
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
              />
              <CheckboxLabel htmlFor="acceptTerms">
                Acepto los{" "}
                <a href="/terms" target="_blank">
                  términos y condiciones
                </a>{" "}
                y la{" "}
                <a href="/privacy" target="_blank">
                  política de privacidad
                </a>
              </CheckboxLabel>
            </CheckboxContainer>
            {errors.acceptTerms && (
              <ErrorMessage>{errors.acceptTerms}</ErrorMessage>
            )}
          </FormGroup>

          {/* Error general */}
          {errors.general && <ErrorMessage>{errors.general}</ErrorMessage>}

          {/* Botón de registro */}
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner />
                Creando cuenta...
              </>
            ) : (
              <>
                Crear cuenta
                <FiArrowRight size={18} />
              </>
            )}
          </SubmitButton>
        </Form>

        <Divider>
          <span>¿Ya tienes cuenta?</span>
        </Divider>

        <LoginLink>
          <Link to="/login">Iniciar sesión</Link>
        </LoginLink>
      </Card>
    </Container>
  );
};

export default RegisterPage;
