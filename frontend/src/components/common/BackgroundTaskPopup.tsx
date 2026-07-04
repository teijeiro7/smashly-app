import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMinimize2, FiCpu, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  useBackgroundTasks,
  TaskType,
  BackgroundTask,
} from '../../contexts/BackgroundTasksContext';

const PopupContainer = styled(motion.div)<{ $minimized: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: ${props => (props.$minimized ? '80px' : '500px')};
  max-width: calc(100vw - 16px);
  height: ${props => (props.$minimized ? '80px' : 'auto')};
  background: var(--surface);
  border-radius: ${props => (props.$minimized ? '50%' : '20px')};
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
  border: ${props => (props.$minimized ? 'none' : '2px solid var(--border)')};
  cursor: ${props => (props.$minimized ? 'pointer' : 'default')};
  will-change: transform, opacity;

  @media (max-width: 768px) {
    right: 8px;
    bottom: calc(8px + env(safe-area-inset-bottom, 0));
    width: ${props => (props.$minimized ? '72px' : 'min(500px, calc(100vw - 16px))')};
    height: ${props => (props.$minimized ? '72px' : 'auto')};
  }
`;

const CircularProgress = styled.svg<{ $status: string }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 76px;
  height: 76px;
  transform: translate(-50%, -50%) rotate(-90deg);
  filter: drop-shadow(0 0 6px rgba(var(--primary-rgb), 0.2));
  pointer-events: none;

  circle {
    fill: none;
    stroke-width: 4;
    stroke-linecap: round;
  }

  .background {
    stroke: rgba(229, 231, 235, 0.3);
  }

  .progress {
    stroke: ${props =>
      props.$status === 'completed'
        ? 'var(--primary)'
        : props.$status === 'error'
          ? 'var(--danger)'
          : 'url(#animatedGradient)'};
    stroke-dasharray: 220;
    stroke-dashoffset: 220;
    transition: stroke-dashoffset 0.5s ease;
  }
`;

const MinimizedContent = styled.div<{ $status: string }>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props =>
    props.$status === 'completed'
      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
      : props.$status === 'error'
        ? 'linear-gradient(135deg, var(--danger) 0%, var(--danger) 100%)'
        : 'var(--surface-3)'};
  border-radius: 50%;
  color: ${props => (props.$status === 'running' ? 'var(--text-muted)' : 'var(--brand-on-surface)')};
  position: relative;
  z-index: 1;
  border: ${props => (props.$status === 'running' ? '3px solid var(--primary)' : 'none')};
`;

const MinimizedIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: -2px;
`;

const MinimizedLabel = styled.div`
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
  margin-top: 4px;
  letter-spacing: 0.3px;
`;

const CompletionBadge = styled(motion.div)`
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(20%, -20%);
  width: 24px;
  height: 24px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-on-surface);
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.4);
  border: 2px solid var(--surface);
`;

const CompletionTooltip = styled(motion.div)`
  position: absolute;
  bottom: 90px;
  right: 0;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
  color: var(--brand-on-surface);
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(var(--primary-rgb), 0.4);
  z-index: 1001;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    right: 20px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid var(--primary-hover);
  }
`;

const Header = styled.div<{ $minimized: boolean; $status: string }>`
  display: ${props => (props.$minimized ? 'none' : 'flex')};
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${props =>
    props.$status === 'completed'
      ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
      : props.$status === 'error'
        ? 'linear-gradient(135deg, var(--danger) 0%, var(--danger) 100%)'
        : 'linear-gradient(135deg, var(--info) 0%, var(--info) 100%)'};
  color: var(--brand-on-surface);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

const Subtitle = styled.p<{ $minimized: boolean }>`
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.9;
  display: ${props => (props.$minimized ? 'none' : 'block')};
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: var(--brand-on-surface);
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Content = styled(motion.div)`
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
`;

const ProgressSection = styled.div`
  margin-bottom: 20px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
`;

const ProgressFill = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
  border-radius: 4px;
`;

const ProgressText = styled.p`
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 8px 0 0 0;
`;

const ResultSection = styled.div`
  background: var(--surface-2);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
`;

const ResultTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ViewResultButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface-hover) 100%);
  color: var(--brand-on-surface);
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--primary-rgb), 0.3);
  }
`;

const ErrorMessage = styled.div`
  background: var(--surface-3);
  color: var(--danger);
  padding: 12px;
  border-radius: 10px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskItem = styled.div`
  background: var(--surface-2);
  border-radius: 10px;
  padding: 12px;
  border-left: 4px solid var(--primary);
`;

const TaskInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const TaskName = styled.p`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
`;

const TaskStatus = styled.span<{ $status: string }>`
  font-size: 0.8rem;
  color: ${props =>
    props.$status === 'completed' ? 'var(--primary)' : props.$status === 'error' ? 'var(--danger)' : 'var(--info)'};
  font-weight: 600;
`;

const SpinnerIcon = styled(motion.div)`
  display: inline-block;
`;

const getTaskTitle = (type: TaskType): string => {
  switch (type) {
    case 'comparison':
      return 'Comparando Palas';
    case 'recommendation':
      return 'Buscando Recomendación';
    default:
      return 'Procesando';
  }
};

const getTaskSubtitle = (task: BackgroundTask): string => {
  if (task.status === 'completed') {
    return 'Tarea completada';
  }
  if (task.status === 'error') {
    return 'Error en la tarea';
  }
  if (task.type === 'comparison' && task.metadata?.racketNames) {
    return `Comparando ${task.metadata.racketNames.length} palas`;
  }
  return 'Procesando...';
};

export const BackgroundTaskPopup: React.FC = () => {
  const { tasks, dismissTask } = useBackgroundTasks();
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [minimized, setMinimized] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  // Mostrar popup cuando hay una tarea activa o completada recientemente
  useEffect(() => {
    if (tasks.length > 0) {
      const lastTask = tasks[tasks.length - 1];
      // Mostrar si hay una tarea en ejecución o completada
      if (
        lastTask.status === 'running' ||
        lastTask.status === 'completed' ||
        lastTask.status === 'error'
      ) {
        setShowPopup(true);
        setMinimized(true);
      }
    } else {
      setShowPopup(false);
    }
  }, [tasks]);

  // Removed setInterval-based pulse for performance. 
  // The pulse animation is now handled directly by Framer Motion.

  // Mostrar popup solo si hay tareas
  const visibleTask = tasks.length > 0 ? tasks[tasks.length - 1] : null;

  if (!visibleTask || !showPopup) {
    return null;
  }

  const handleClose = () => {
    if (visibleTask.status !== 'running') {
      dismissTask(visibleTask.id);
    }
  };

  const handleToggleMinimize = () => {
    if (minimized) {
      // Si está minimizado, solo navegar a la página correspondiente
      if (visibleTask.type === 'comparison') {
        navigate({ to: '/compare-rackets' });
      } else if (visibleTask.type === 'recommendation') {
        navigate({ to: '/best-racket' });
      }
      // Cerrar el popup después de navegar (dar tiempo para que se cargue la página)
      setTimeout(() => {
        dismissTask(visibleTask.id);
      }, 1500);
    } else {
      // Si está expandido, minimizar
      setMinimized(true);
    }
  };

  const handleViewResult = () => {
    // La lógica de navegación se manejará desde las páginas
    dismissTask(visibleTask.id);
  };

  const getStatusIcon = () => {
    if (visibleTask.status === 'completed') {
      return <FiCheckCircle size={20} />;
    }
    if (visibleTask.status === 'error') {
      return <FiAlertCircle size={20} />;
    }
    return (
      <SpinnerIcon
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <FiCpu size={20} />
      </SpinnerIcon>
    );
  };

  const getTaskIcon = () => {
    return <FiCpu size={28} />;
  };

  const getTaskLabel = () => {
    if (visibleTask.type === 'comparison') {
      return visibleTask.status === 'running' ? 'Comparando...' : 'Comparar';
    }
    return visibleTask.status === 'running' ? 'Buscando...' : 'Recomendar';
  };

  const circumference = 2 * Math.PI * 35; // radio = 35
  const progressOffset = circumference - (circumference * (visibleTask.progress || 0)) / 100;

  return (
    <AnimatePresence>
      <PopupContainer
        $minimized={minimized}
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{
          y: { type: 'spring', stiffness: 300, damping: 25 },
          opacity: { duration: 0.2 },
          scale: { type: 'spring', stiffness: 300, damping: 25 }
        }}
      >
        {minimized ? (
          <>
            {/* SVG de progreso circular */}
            {visibleTask.status === 'running' && (
              <CircularProgress $status={visibleTask.status}>
                <defs>
                  <linearGradient id='animatedGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
                    <stop offset='0%' stopColor='var(--primary)'>
                      <animate
                        attributeName='stop-color'
                        values='var(--primary); var(--primary-light); var(--primary-light); var(--primary-light); var(--primary)'
                        dur='3s'
                        repeatCount='indefinite'
                      />
                    </stop>
                    <stop offset='50%' stopColor='var(--primary-light)'>
                      <animate
                        attributeName='stop-color'
                        values='var(--primary-light); var(--primary-light); var(--primary); var(--primary-light); var(--primary-light)'
                        dur='3s'
                        repeatCount='indefinite'
                      />
                    </stop>
                    <stop offset='100%' stopColor='var(--primary-light)'>
                      <animate
                        attributeName='stop-color'
                        values='var(--primary-light); var(--primary); var(--primary-light); var(--primary); var(--primary-light)'
                        dur='3s'
                        repeatCount='indefinite'
                      />
                    </stop>
                  </linearGradient>
                </defs>
                <circle className='background' cx='38' cy='38' r='35' />
                <motion.circle
                  className='progress'
                  cx='38'
                  cy='38'
                  r='35'
                  initial={{ strokeDashoffset: circumference }}
                  animate={{
                    strokeDashoffset: progressOffset,
                  }}
                  transition={{
                    strokeDashoffset: { duration: 0.5 },
                  }}
                  style={{
                    strokeDasharray: `${circumference}px`,
                    strokeDashoffset: `${progressOffset}px`,
                  }}
                />
              </CircularProgress>
            )}

            {/* Contenido del círculo minimizado */}
            <MinimizedContent $status={visibleTask.status}>
              <MinimizedIcon
                animate={
                  visibleTask.status === 'running'
                    ? { rotate: 360 }
                    : {}
                }
                transition={
                  visibleTask.status === 'running'
                    ? { duration: 2, repeat: Infinity, ease: 'linear' }
                    : { duration: 0.3 }
                }
                style={{ willChange: 'transform' }}
              >
                {getTaskIcon()}
              </MinimizedIcon>
              <MinimizedLabel>{getTaskLabel()}</MinimizedLabel>
            </MinimizedContent>

            {/* Badge de completado */}
            {visibleTask.status === 'completed' && (
              <CompletionBadge
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <FiCheckCircle size={14} />
              </CompletionBadge>
            )}

            {/* Tooltip de completado - solo si no estás en la página de destino */}
            {visibleTask.status === 'completed' && (
              <>
                {visibleTask.type === 'comparison' && location.pathname !== '/compare-rackets' && (
                  <CompletionTooltip
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    Comparación terminada
                  </CompletionTooltip>
                )}
                {visibleTask.type === 'recommendation' && location.pathname !== '/best-racket' && (
                  <CompletionTooltip
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    Recomendación lista
                  </CompletionTooltip>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Header $minimized={minimized} $status={visibleTask.status}>
              <HeaderLeft>
                {getStatusIcon()}
                <HeaderTitle>
                  <Title>{getTaskTitle(visibleTask.type)}</Title>
                  <Subtitle $minimized={minimized}>{getTaskSubtitle(visibleTask)}</Subtitle>
                </HeaderTitle>
              </HeaderLeft>
              <HeaderActions>
                <IconButton onClick={handleToggleMinimize}>
                  <FiMinimize2 size={16} />
                </IconButton>
                {visibleTask.status !== 'running' && (
                  <IconButton onClick={handleClose}>
                    <FiX size={16} />
                  </IconButton>
                )}
              </HeaderActions>
            </Header>

            <Content>
              {visibleTask.status === 'running' && (
                <ProgressSection>
                  <ProgressBar>
                    <ProgressFill
                      initial={{ width: '0%' }}
                      animate={{ width: `${visibleTask.progress || 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </ProgressBar>
                  <ProgressText>{visibleTask.progress || 0}% completado</ProgressText>
                </ProgressSection>
              )}

              {visibleTask.status === 'completed' && (
                <ResultSection>
                  <ResultTitle>
                    <FiCheckCircle color='var(--primary)' />
                    ¡Análisis Completado!
                  </ResultTitle>
                  <ViewResultButton onClick={handleViewResult}>Ver Resultado</ViewResultButton>
                </ResultSection>
              )}

              {visibleTask.status === 'error' && (
                <ErrorMessage>
                  <FiAlertCircle />
                  {visibleTask.error || 'Ha ocurrido un error durante el procesamiento'}
                </ErrorMessage>
              )}

              {/* Mostrar tareas anteriores si las hay */}
              {tasks.length > 1 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Tareas Recientes
                  </h4>
                  <TaskList>
                    {tasks
                      .slice(0, -1)
                      .reverse()
                      .slice(0, 3)
                      .map((task: BackgroundTask) => (
                        <TaskItem key={task.id}>
                          <TaskInfo>
                            <TaskName>{getTaskTitle(task.type)}</TaskName>
                            <TaskStatus $status={task.status}>
                              {task.status === 'completed'
                                ? 'Completada'
                                : task.status === 'error'
                                  ? 'Error'
                                  : 'En proceso'}
                            </TaskStatus>
                          </TaskInfo>
                        </TaskItem>
                      ))}
                  </TaskList>
                </div>
              )}
            </Content>
          </>
        )}
      </PopupContainer>
    </AnimatePresence>
  );
};
