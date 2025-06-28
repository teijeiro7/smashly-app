import emailjs from '@emailjs/react-native';

// Configuración de EmailJS con debugging mejorado
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;

// Debug de configuración
console.log('🔧 EmailJS Configuration Debug:');
console.log('EXPO_PUBLIC_EMAILJS_PUBLIC_KEY exists:', !!EMAILJS_PUBLIC_KEY);
console.log('EXPO_PUBLIC_EMAILJS_SERVICE_ID exists:', !!EMAILJS_SERVICE_ID);
console.log('EXPO_PUBLIC_EMAILJS_TEMPLATE_ID exists:', !!EMAILJS_TEMPLATE_ID);

if (EMAILJS_PUBLIC_KEY) {
  console.log('Public Key (first 10 chars):', EMAILJS_PUBLIC_KEY.substring(0, 10) + '...');
}

// Inicializar EmailJS solo si tenemos la clave pública
if (EMAILJS_PUBLIC_KEY) {
  try {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('✅ EmailJS inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando EmailJS:', error);
  }
} else {
  console.warn('⚠️ EmailJS Public Key no encontrada en variables de entorno');
  console.log('Variables disponibles:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC')));
}

export interface ContactFormData {
  email: string;
  subject: string;
  description: string;
}

export interface EmailResponse {
  success: boolean;
  message: string;
  error?: any;
}

// Función para enviar email de contacto
export const sendContactEmail = async (formData: ContactFormData): Promise<EmailResponse> => {
  try {
    console.log('📧 Iniciando envío de email de contacto...');
    console.log('📋 Datos del formulario:', {
      email: formData.email,
      subject: formData.subject,
      descriptionLength: formData.description.length
    });

    // Validar configuración antes de proceder
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
      const missingVars = [];
      if (!EMAILJS_PUBLIC_KEY) missingVars.push('EXPO_PUBLIC_EMAILJS_PUBLIC_KEY');
      if (!EMAILJS_SERVICE_ID) missingVars.push('EXPO_PUBLIC_EMAILJS_SERVICE_ID');
      if (!EMAILJS_TEMPLATE_ID) missingVars.push('EXPO_PUBLIC_EMAILJS_TEMPLATE_ID');
      
      console.error('❌ Variables faltantes:', missingVars);
      
      throw new Error(`Configuración de EmailJS incompleta. Faltan: ${missingVars.join(', ')}`);
    }

    // Preparar datos para la plantilla de EmailJS
    const templateParams = {
      user_email: formData.email,
      user_subject: formData.subject,
      user_message: formData.description,
      to_email: 'soporte@smashly.com',
      from_name: formData.email.split('@')[0], // Extraer nombre del email
      reply_to: formData.email,
      timestamp: new Date().toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      app_name: 'Smashly'
    };

    console.log('📤 Enviando con templateParams:', templateParams);

    // Enviar email con timeout
    const emailPromise = emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: El envío tardó más de 15 segundos')), 15000)
    );

    const response = await Promise.race([emailPromise, timeoutPromise]);

    console.log('✅ Email enviado exitosamente:', response);

    return {
      success: true,
      message: 'Tu mensaje ha sido enviado correctamente. Te responderemos en las próximas 24 horas.'
    };

  } catch (error: any) {
    console.error('❌ Error detallado enviando email:', error);
    
    let errorMessage = 'No se pudo enviar el mensaje. Inténtalo de nuevo.';
    
    // Manejo específico de diferentes tipos de errores
    if (error.message?.includes('public key is required')) {
      errorMessage = 'Error de configuración: Clave pública de EmailJS no configurada.';
    } else if (error.message?.includes('Timeout')) {
      errorMessage = 'El envío tardó demasiado. Verifica tu conexión e inténtalo de nuevo.';
    } else if (error.message?.includes('Configuración')) {
      errorMessage = 'Error de configuración del servicio de email.';
    } else if (error.text) {
      errorMessage = `Error del servicio: ${error.text}`;
    } else if (error.message?.includes('fetch')) {
      errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage,
      error: {
        type: error.constructor.name,
        message: error.message,
        details: error
      }
    };
  }
};

// Función para validar email con regex más estricta
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// Función para validar formulario completo
export const validateContactForm = (formData: ContactFormData): { valid: boolean; error?: string } => {
  if (!formData.email.trim()) {
    return { valid: false, error: 'El email es obligatorio' };
  }

  if (!validateEmail(formData.email)) {
    return { valid: false, error: 'Formato de email inválido' };
  }

  if (!formData.subject.trim()) {
    return { valid: false, error: 'El asunto es obligatorio' };
  }

  if (formData.subject.length < 3) {
    return { valid: false, error: 'El asunto debe tener al menos 3 caracteres' };
  }

  if (formData.subject.length > 100) {
    return { valid: false, error: 'El asunto no puede tener más de 100 caracteres' };
  }

  if (!formData.description.trim()) {
    return { valid: false, error: 'La descripción es obligatoria' };
  }

  if (formData.description.length < 10) {
    return { valid: false, error: 'La descripción debe tener al menos 10 caracteres' };
  }

  if (formData.description.length > 2000) {
    return { valid: false, error: 'La descripción no puede tener más de 2000 caracteres' };
  }

  return { valid: true };
};

// Función para testear la configuración
export const testEmailJSConfiguration = (): boolean => {
  console.log('🧪 Testing EmailJS configuration...');
  
  const hasPublicKey = !!EMAILJS_PUBLIC_KEY;
  const hasServiceId = !!EMAILJS_SERVICE_ID;
  const hasTemplateId = !!EMAILJS_TEMPLATE_ID;
  
  console.log('✅ Public Key:', hasPublicKey);
  console.log('✅ Service ID:', hasServiceId);
  console.log('✅ Template ID:', hasTemplateId);
  
  return hasPublicKey && hasServiceId && hasTemplateId;
};