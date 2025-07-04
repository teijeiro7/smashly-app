import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheck,
  FiDollarSign,
  FiStar,
  FiTrendingUp,
  FiUser,
  FiX,
  FiZap,
} from "react-icons/fi";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";
import { useRackets } from "../contexts/RacketsContext";
import { FormData, MultipleRacketRecommendations } from "../types/racket";
import { getRacketRecommendations } from "../utils/gemini";

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8faf8 0%, #e8f5e8 100%);
  padding: 2rem 0;
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 3rem 0;
  max-width: 800px;
  margin: 0 auto;
  padding-left: 1rem;
  padding-right: 1rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 1rem;

  .highlight {
    color: #16a34a;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const FormContainer = styled(motion.div)`
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(22, 163, 74, 0.1);
  border: 1px solid rgba(22, 163, 74, 0.1);

  @media (max-width: 768px) {
    margin: 0 1rem;
    padding: 1.5rem;
  }
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SectionDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RadioOption = styled.label<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid ${(props) => (props.selected ? "#16a34a" : "#e5e7eb")};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.selected ? "#f0f9ff" : "white")};

  &:hover {
    border-color: #16a34a;
    background: #f0f9ff;
  }
`;

const RadioCircle = styled.div<{ selected: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${(props) => (props.selected ? "#16a34a" : "#d1d5db")};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  ${(props) =>
    props.selected &&
    `
    &::after {
      content: '';
      width: 8px;
      height: 8px;
      background: #16a34a;
      border-radius: 50%;
    }
  `}
`;

const RadioText = styled.span<{ selected: boolean }>`
  font-weight: ${(props) => (props.selected ? "600" : "400")};
  color: ${(props) => (props.selected ? "#16a34a" : "#374151")};
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InputContainer = styled.div`
  flex: 1;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
  }
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
  font-style: italic;
`;

const SubmitButton = styled(motion.button)<{ disabled: boolean }>`
  width: 100%;
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: ${(props) => (props.disabled ? "none" : "translateY(-2px)")};
    box-shadow: ${(props) =>
      props.disabled ? "none" : "0 10px 30px rgba(22, 163, 74, 0.3)"};
  }
`;

const LoadingSpinner = styled.div`
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 2rem 2rem 0;
  text-align: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
`;

const ModalTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const ModalSubtitle = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #e5e7eb;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 2rem;
  margin-bottom: 1rem;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => (props.active ? "#16a34a" : "#f9fafb")};
  color: ${(props) => (props.active ? "white" : "#6b7280")};

  &:hover {
    background: ${(props) => (props.active ? "#15803d" : "#f3f4f6")};
  }
`;

const RecommendationCard = styled.div`
  padding: 2rem;
  margin: 0 2rem 2rem;
  background: #f9fafb;
  border-radius: 16px;
`;

const RacketHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const RacketImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  background: white;
  border-radius: 12px;
  padding: 0.5rem;
`;

const RacketInfo = styled.div`
  flex: 1;
`;

const RacketName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const RacketPrice = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  color: #16a34a;
`;

const MatchPercentage = styled.div`
  background: #16a34a;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RacketDescription = styled.p`
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const SpecItem = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
`;

const SpecLabel = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const SpecValue = styled.p`
  font-weight: 600;
  color: #1f2937;
`;

const ProsConsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProsSection = styled.div`
  background: #ecfdf5;
  padding: 1rem;
  border-radius: 8px;
`;

const ConsSection = styled.div`
  background: #fef3c7;
  padding: 1rem;
  border-radius: 8px;
`;

const ProsConsTitle = styled.h4`
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProsConsList = styled.ul`
  list-style: none;
  padding: 0;
`;

const ProsConsItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const BestRacketPage: React.FC = () => {
  const { rackets } = useRackets();
  const { userProfile } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    gameLevel: "",
    playingStyle: "",
    weight: "",
    height: "",
    budget: "",
    preferredShape: "",
  });

  // Cargar datos del perfil del usuario si está disponible
  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        gameLevel: userProfile.nivel_juego || prev.gameLevel,
        weight: userProfile.peso?.toString() || prev.weight,
        height: userProfile.altura?.toString() || prev.height,
      }));
    }
  }, [userProfile]);

  const [isLoading, setIsLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] =
    useState<MultipleRacketRecommendations | null>(null);
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] =
    useState(0);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.gameLevel) {
      toast.error("Por favor selecciona tu nivel de juego");
      return false;
    }
    if (!formData.playingStyle) {
      toast.error("Por favor selecciona tu estilo de juego");
      return false;
    }
    if (!formData.weight) {
      toast.error("Por favor introduce tu peso");
      return false;
    }
    if (!formData.height) {
      toast.error("Por favor introduce tu altura");
      return false;
    }
    if (!formData.budget) {
      toast.error("Por favor introduce tu presupuesto máximo");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      toast.loading("Generando recomendaciones con IA...", { id: "loading" });

      const results = await getRacketRecommendations(formData, rackets);

      setRecommendations(results);
      setShowRecommendations(true);

      toast.success("¡Recomendaciones generadas con éxito!", { id: "loading" });
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      toast.error(
        error.message ||
          "Error al obtener recomendaciones. Inténtalo de nuevo.",
        { id: "loading" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const closeRecommendations = () => {
    setShowRecommendations(false);
    setRecommendations(null);
    setSelectedRecommendationIndex(0);
  };

  return (
    <Container>
      <HeroSection>
        <Title>
          Encuentra tu <span className="highlight">Pala Ideal</span>
        </Title>
        <Subtitle>
          Nuestro asistente con IA analiza tu perfil y te recomienda las 3
          mejores palas personalizadas para tu estilo de juego
        </Subtitle>
      </HeroSection>

      <FormContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Game Level Section */}
        <FormSection>
          <SectionTitle>
            <FiUser /> ¿Cuál es tu nivel de juego?
          </SectionTitle>
          <RadioGroup>
            {["Principiante", "Intermedio", "Avanzado"].map((level) => (
              <RadioOption
                key={level}
                selected={formData.gameLevel === level}
                onClick={() => updateFormData("gameLevel", level)}
              >
                <RadioCircle selected={formData.gameLevel === level} />
                <RadioText selected={formData.gameLevel === level}>
                  {level}
                </RadioText>
              </RadioOption>
            ))}
          </RadioGroup>
        </FormSection>

        {/* Playing Style Section */}
        <FormSection>
          <SectionTitle>
            <FiTrendingUp /> ¿Cuál es tu estilo de juego?
          </SectionTitle>
          <RadioGroup>
            {["Defensivo", "Polivalente", "Ofensivo"].map((style) => (
              <RadioOption
                key={style}
                selected={formData.playingStyle === style}
                onClick={() => updateFormData("playingStyle", style)}
              >
                <RadioCircle selected={formData.playingStyle === style} />
                <RadioText selected={formData.playingStyle === style}>
                  {style}
                </RadioText>
              </RadioOption>
            ))}
          </RadioGroup>
        </FormSection>

        {/* Physical Characteristics */}
        <FormSection>
          <SectionTitle>
            <FiZap /> Características físicas
          </SectionTitle>
          <SectionDescription>
            Estas medidas nos ayudan a recomendarte el peso y balance adecuado
          </SectionDescription>
          <InputGroup>
            <InputContainer>
              <Label>Peso corporal (kg)</Label>
              <Input
                type="number"
                placeholder="Ej: 75"
                value={formData.weight}
                onChange={(e) => updateFormData("weight", e.target.value)}
              />
            </InputContainer>
            <InputContainer>
              <Label>Altura (cm)</Label>
              <Input
                type="number"
                placeholder="Ej: 180"
                value={formData.height}
                onChange={(e) => updateFormData("height", e.target.value)}
              />
            </InputContainer>
          </InputGroup>
        </FormSection>

        {/* Budget Section */}
        <FormSection>
          <SectionTitle>
            <FiDollarSign /> Presupuesto máximo (€)
          </SectionTitle>
          <Input
            type="number"
            placeholder="Ej: 200"
            value={formData.budget}
            onChange={(e) => updateFormData("budget", e.target.value)}
          />
          <HelperText>
            Te mostraremos 3 opciones dentro de tu rango de precio
          </HelperText>
        </FormSection>

        {/* Shape Preference */}
        <FormSection>
          <SectionTitle>Forma preferida (opcional)</SectionTitle>
          <RadioGroup>
            {["Redonda", "Lágrima", "Diamante"].map((shape) => (
              <RadioOption
                key={shape}
                selected={formData.preferredShape === shape}
                onClick={() => updateFormData("preferredShape", shape)}
              >
                <RadioCircle selected={formData.preferredShape === shape} />
                <RadioText selected={formData.preferredShape === shape}>
                  {shape}
                </RadioText>
              </RadioOption>
            ))}
          </RadioGroup>
        </FormSection>

        <SubmitButton
          disabled={isLoading}
          onClick={handleSubmit}
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
        >
          {isLoading && <LoadingSpinner />}
          {isLoading ? "Analizando tu perfil..." : "Encontrar mi pala ideal"}
        </SubmitButton>
      </FormContainer>

      {/* Recommendations Modal */}
      <AnimatePresence>
        {showRecommendations && recommendations && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRecommendations}
          >
            <ModalContent
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <CloseButton onClick={closeRecommendations}>
                <FiX size={20} />
              </CloseButton>

              <ModalHeader>
                <ModalTitle>Tus Palas Recomendadas</ModalTitle>
                <ModalSubtitle>
                  Hemos encontrado 3 palas perfectas para tu perfil
                </ModalSubtitle>

                <TabsContainer>
                  {recommendations.recommendations.map(
                    (_: any, index: number) => (
                      <Tab
                        key={index}
                        active={selectedRecommendationIndex === index}
                        onClick={() => setSelectedRecommendationIndex(index)}
                      >
                        Opción {index + 1}
                      </Tab>
                    )
                  )}
                </TabsContainer>
              </ModalHeader>

              {/* Current recommendation */}
              {recommendations.recommendations[selectedRecommendationIndex] && (
                <RecommendationCard>
                  <RacketHeader>
                    <RacketImage
                      src={
                        recommendations.recommendations[
                          selectedRecommendationIndex
                        ].imageUrl
                      }
                      alt={
                        recommendations.recommendations[
                          selectedRecommendationIndex
                        ].racketName
                      }
                    />
                    <RacketInfo>
                      <RacketName>
                        {
                          recommendations.recommendations[
                            selectedRecommendationIndex
                          ].racketName
                        }
                      </RacketName>
                      <RacketPrice>
                        {
                          recommendations.recommendations[
                            selectedRecommendationIndex
                          ].price
                        }
                      </RacketPrice>
                    </RacketInfo>
                    <MatchPercentage>
                      <FiStar size={16} />
                      {
                        recommendations.recommendations[
                          selectedRecommendationIndex
                        ].matchPercentage
                      }
                      % Match
                    </MatchPercentage>
                  </RacketHeader>

                  <RacketDescription>
                    {
                      recommendations.recommendations[
                        selectedRecommendationIndex
                      ].whyThisRacket
                    }
                  </RacketDescription>

                  <SpecsGrid>
                    <SpecItem>
                      <SpecLabel>Peso</SpecLabel>
                      <SpecValue>
                        {
                          recommendations.recommendations[
                            selectedRecommendationIndex
                          ].technicalSpecs.weight
                        }
                      </SpecValue>
                    </SpecItem>
                    <SpecItem>
                      <SpecLabel>Balance</SpecLabel>
                      <SpecValue>
                        {
                          recommendations.recommendations[
                            selectedRecommendationIndex
                          ].technicalSpecs.balance
                        }
                      </SpecValue>
                    </SpecItem>
                    <SpecItem>
                      <SpecLabel>Forma</SpecLabel>
                      <SpecValue>
                        {
                          recommendations.recommendations[
                            selectedRecommendationIndex
                          ].technicalSpecs.shape
                        }
                      </SpecValue>
                    </SpecItem>
                    <SpecItem>
                      <SpecLabel>Material</SpecLabel>
                      <SpecValue>
                        {
                          recommendations.recommendations[
                            selectedRecommendationIndex
                          ].technicalSpecs.material
                        }
                      </SpecValue>
                    </SpecItem>
                  </SpecsGrid>

                  <ProsConsContainer>
                    <ProsSection>
                      <ProsConsTitle>
                        <FiCheck size={16} color="#10b981" />
                        Ventajas
                      </ProsConsTitle>
                      <ProsConsList>
                        {recommendations.recommendations[
                          selectedRecommendationIndex
                        ].pros.map((pro: string, index: number) => (
                          <ProsConsItem key={index}>
                            <FiCheck size={16} color="#10b981" />
                            {pro}
                          </ProsConsItem>
                        ))}
                      </ProsConsList>
                    </ProsSection>
                    <ConsSection>
                      <ProsConsTitle>
                        <FiAlertCircle size={16} color="#f59e0b" />
                        Consideraciones
                      </ProsConsTitle>
                      <ProsConsList>
                        {recommendations.recommendations[
                          selectedRecommendationIndex
                        ].cons.map((con: string, index: number) => (
                          <ProsConsItem key={index}>
                            <FiAlertCircle size={16} color="#f59e0b" />
                            {con}
                          </ProsConsItem>
                        ))}
                      </ProsConsList>
                    </ConsSection>
                  </ProsConsContainer>
                </RecommendationCard>
              )}
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default BestRacketPage;
