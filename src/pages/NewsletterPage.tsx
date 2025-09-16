import { motion } from "framer-motion";
import React, { useState } from "react";
import { FiCheck, FiMail } from "react-icons/fi";
import styled from "styled-components";

const Container = styled.div`
  min-height: calc(100vh - 200px); /* Adjust for header and footer height */
  background: linear-gradient(135deg, #f8faf8 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  width: 100%;
`;

const NewsletterCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 60px 50px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  text-align: center;
  border: 1px solid #f1f5f9;

  @media (max-width: 768px) {
    padding: 40px 30px;
    margin: 0 20px;
  }

  @media (max-width: 480px) {
    padding: 30px 20px;
    margin: 0 10px;
  }
`;

const Badge = styled(motion.div)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #16a34a;
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 32px;
  letter-spacing: 0.5px;
`;

const Title = styled(motion.h1)`
  font-size: clamp(2.5rem, 4vw, 3.5rem);
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.2;
  color: #1f2937;

  .highlight {
    color: #16a34a;
  }
`;

const Description = styled(motion.p)`
  font-size: 1.125rem;
  color: #6b7280;
  margin-bottom: 40px;
  line-height: 1.7;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
`;

const FormContainer = styled(motion.div)`
  margin-bottom: 32px;
`;

const EmailForm = styled.form`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const EmailInput = styled.input`
  flex: 1;
  max-width: 300px;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.2s ease;
  background: #f8fafc;

  &:focus {
    outline: none;
    border-color: #16a34a;
    background: white;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const SubmitButton = styled.button<{ isSubmitted: boolean }>`
  background: ${(props: { isSubmitted: boolean }) =>
    props.isSubmitted ? "#059669" : "#16a34a"};
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
  justify-content: center;

  &:hover {
    background: ${(props: { isSubmitted: boolean }) =>
      props.isSubmitted ? "#059669" : "#15803d"};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(22, 163, 74, 0.25);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const SuccessMessage = styled(motion.div)`
  background: #dcfce7;
  color: #166534;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #bbf7d0;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const AdditionalText = styled(motion.p)`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
`;

const NewsletterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || isLoading) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
      setEmail("");
    }, 1000);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <Container>
      <NewsletterCard
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Badge variants={itemVariants}>
          <FiMail size={16} />
          Próximamente
        </Badge>

        <Title variants={itemVariants}>
          Algo <span className="highlight">increíble</span> se acerca
        </Title>

        <Description variants={itemVariants}>
          Estamos preparando la mejor aplicación para los amantes del pádel.
          Buscamos tener lo que no se ha hecho antes. Únete a nuestra lista de
          espera y sé el primero en enterarte de todas las novedades.
        </Description>

        <FormContainer variants={itemVariants}>
          {!isSubmitted ? (
            <>
              <EmailForm onSubmit={handleSubmit}>
                <EmailInput
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                />
                <SubmitButton
                  type="submit"
                  disabled={isLoading}
                  isSubmitted={false}
                >
                  {isLoading ? "..." : "Notificarme"}
                </SubmitButton>
              </EmailForm>
            </>
          ) : (
            <SuccessMessage
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <FiCheck size={20} />
              ¡Gracias! Te notificaremos cuando esté lista.
            </SuccessMessage>
          )}
        </FormContainer>

        <AdditionalText variants={itemVariants}>
          ¡Sé el primero en saberlo!
          <br />
          Regístrate con tu correo y te mantendremos al tanto de cada novedad.
          Acceso prioritario y contenido exclusivo te esperan.
        </AdditionalText>
      </NewsletterCard>
    </Container>
  );
};

export default NewsletterPage;
