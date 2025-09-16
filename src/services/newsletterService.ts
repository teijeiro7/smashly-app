import { supabase } from "../config/supabase";

export interface NewsletterSubscription {
  id?: string;
  email: string;
  status?: "subscribed" | "unsubscribed" | "pending";
  source?: string;
  user_id?: string;
  preferences?: Record<string, any>;
  subscribed_at?: string;
  unsubscribed_at?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface NewsletterSubscriptionResponse {
  success: boolean;
  message: string;
  data?: NewsletterSubscription;
  error?: string;
}

export const newsletterService = {
  /**
   * Suscribir un email al newsletter
   */
  async subscribe(
    email: string,
    source: string = "website"
  ): Promise<NewsletterSubscriptionResponse> {
    try {
      // Validar el email
      if (!email || !this.isValidEmail(email)) {
        return {
          success: false,
          message: "El email proporcionado no es válido",
          error: "INVALID_EMAIL",
        };
      }

      // Verificar si el email ya está suscrito
      const { data: existingSubscription, error: checkError } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Error checking existing subscription:", checkError);
        return {
          success: false,
          message: "Error al verificar la suscripción existente",
          error: "CHECK_ERROR",
        };
      }

      // Si ya existe una suscripción activa
      if (
        existingSubscription &&
        existingSubscription.status === "subscribed"
      ) {
        return {
          success: false,
          message: "Este email ya está suscrito al newsletter",
          error: "ALREADY_SUBSCRIBED",
        };
      }

      // Si existe pero está desactivada, reactivarla
      if (
        existingSubscription &&
        existingSubscription.status !== "subscribed"
      ) {
        const { data: updatedSubscription, error: updateError } = await supabase
          .from("newsletter_subscribers")
          .update({
            status: "subscribed",
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
            source,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSubscription.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error reactivating subscription:", updateError);
          return {
            success: false,
            message: "Error al reactivar la suscripción",
            error: "REACTIVATION_ERROR",
          };
        }

        return {
          success: true,
          message: "¡Suscripción reactivada exitosamente!",
          data: updatedSubscription,
        };
      }

      // Crear nueva suscripción
      const subscriptionData = {
        email: email.toLowerCase(),
        status: "subscribed",
        source: source,
      };

      const { data: newSubscription, error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert(subscriptionData)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating subscription:", insertError);

        // Manejo específico para errores de constraint
        if (insertError.message.includes("violates check constraint")) {
          return {
            success: false,
            message:
              "Error de validación en el servidor. Por favor, inténtalo de nuevo.",
            error: "VALIDATION_ERROR",
          };
        }

        // Manejo específico para errores de políticas de seguridad
        if (insertError.message.includes("policy")) {
          return {
            success: false,
            message: "Error de permisos. Por favor, contacta al administrador.",
            error: "PERMISSION_ERROR",
          };
        }

        return {
          success: false,
          message: "Error al crear la suscripción: " + insertError.message,
          error: "CREATION_ERROR",
        };
      }

      return {
        success: true,
        message: "¡Suscripción exitosa! Te mantendremos informado.",
        data: newSubscription,
      };
    } catch (error) {
      console.error("Unexpected error in newsletter subscription:", error);
      return {
        success: false,
        message: "Error inesperado. Por favor, inténtalo de nuevo.",
        error: "UNEXPECTED_ERROR",
      };
    }
  },

  /**
   * Desuscribir un email del newsletter
   */
  async unsubscribe(email: string): Promise<NewsletterSubscriptionResponse> {
    try {
      const { data: updatedSubscription, error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("email", email.toLowerCase())
        .eq("status", "subscribed")
        .select()
        .single();

      if (error) {
        console.error("Error unsubscribing:", error);
        return {
          success: false,
          message: "Error al cancelar la suscripción",
          error: "UNSUBSCRIBE_ERROR",
        };
      }

      if (!updatedSubscription) {
        return {
          success: false,
          message: "No se encontró una suscripción activa para este email",
          error: "NOT_FOUND",
        };
      }

      return {
        success: true,
        message: "Suscripción cancelada exitosamente",
        data: updatedSubscription,
      };
    } catch (error) {
      console.error("Unexpected error in newsletter unsubscription:", error);
      return {
        success: false,
        message: "Error inesperado. Por favor, inténtalo de nuevo.",
        error: "UNEXPECTED_ERROR",
      };
    }
  },

  /**
   * Obtener estadísticas del newsletter
   */
  async getStats() {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("status, created_at");

      if (error) {
        console.error("Error getting newsletter stats:", error);
        return null;
      }

      const total = data.length;
      const subscribed = data.filter(
        (sub) => sub.status === "subscribed"
      ).length;
      const unsubscribed = data.filter(
        (sub) => sub.status === "unsubscribed"
      ).length;

      return {
        total,
        subscribed,
        unsubscribed,
        pending: total - subscribed - unsubscribed,
      };
    } catch (error) {
      console.error("Unexpected error getting newsletter stats:", error);
      return null;
    }
  },

  /**
   * Validar formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};
