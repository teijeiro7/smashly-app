import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ContactFormData,
  sendContactEmail,
  validateContactForm
} from '../../services/email.service';

interface ContactModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ visible, onClose }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    email: '',
    subject: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const updateFormData = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    // Limpiar errores anteriores
    setErrors({});

    // Validar formulario
    const validation = validateContactForm(formData);
    if (!validation.valid) {
      Alert.alert('Error de validación', validation.error);
      return;
    }

    setIsLoading(true);

    try {
      console.log('📤 Enviando formulario de contacto...');
      
      // Enviar email usando el servicio
      const result = await sendContactEmail(formData);

      if (result.success) {
        Alert.alert(
          'Mensaje enviado',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message);
      }

    } catch (error: any) {
      console.error('❌ Error inesperado:', error);
      Alert.alert(
        'Error inesperado', 
        'Ocurrió un error al enviar el mensaje. Por favor, inténtalo de nuevo.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      subject: '',
      description: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.closeButton, isLoading && styles.disabledButton]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color={isLoading ? "#9ca3af" : "#6b7280"} />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={32} color="#16a34a" />
              </View>
              <Text style={styles.title}>Contactar Soporte</Text>
              <Text style={styles.subtitle}>
                Cuéntanos cómo podemos ayudarte
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.formCard}>
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Electrónico *</Text>
                <View style={[
                  styles.inputContainer,
                  errors.email && styles.inputError
                ]}>
                  <Ionicons name="mail-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
              </View>

              {/* Subject Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Asunto *</Text>
                <View style={[
                  styles.inputContainer,
                  errors.subject && styles.inputError
                ]}>
                  <Ionicons name="chatbubble-outline" size={20} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Problema con el comparador de palas"
                    value={formData.subject}
                    onChangeText={(value) => updateFormData('subject', value)}
                    autoCapitalize="sentences"
                    editable={!isLoading}
                  />
                </View>
                {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
              </View>

              {/* Description Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Descripción de la duda *</Text>
                <View style={[
                  styles.inputContainer, 
                  styles.textAreaContainer,
                  errors.description && styles.inputError
                ]}>
                  <Ionicons name="document-text-outline" size={20} color="#6b7280" style={[styles.inputIcon, styles.textAreaIcon]} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe tu problema o duda con el mayor detalle posible..."
                    value={formData.description}
                    onChangeText={(value) => updateFormData('description', value)}
                    multiline={true}
                    numberOfLines={5}
                    textAlignVertical="top"
                    autoCapitalize="sentences"
                    editable={!isLoading}
                  />
                </View>
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
                <Text style={styles.helperText}>
                  Cuantos más detalles nos proporciones, mejor podremos ayudarte
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="white" style={styles.loadingSpinner} />
                    <Text style={styles.submitButtonText}>Enviando mensaje...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="send" size={16} color="white" />
                    <Text style={styles.submitButtonText}>Enviar Mensaje</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={[styles.cancelButton, isLoading && styles.disabledButton]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={[styles.cancelButtonText, isLoading && styles.disabledText]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8faf8',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  disabledButton: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 16,
    minHeight: 120,
  },
  inputIcon: {
    marginRight: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinner: {
    marginRight: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledText: {
    color: '#9ca3af',
  },
});