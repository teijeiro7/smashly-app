import styled from 'styled-components';
import { Link as RouterLink } from '@tanstack/react-router';
import { FiArrowLeft } from 'react-icons/fi';
import SEO from '../components/seo/SEO';
import { organizationSchema, webPageSchema } from '../utils/seoSchemas';
import { buildUrl } from '../config/seo';

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  color: var(--text);
  line-height: 1.6;
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const BackLink = styled(RouterLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
  color: var(--text);
`;

const Section = styled.section`
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--surface-2);
  border-radius: 12px;
  border-left: 4px solid var(--accent);
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  color: var(--text);
`;

const Paragraph = styled.p`
  margin: 1rem 0;
  color: var(--text);
`;

const List = styled.ul`
  margin: 1rem 0;
  padding-left: 2rem;
  color: var(--text);
`;

const ListItem = styled.li`
  margin: 0.75rem 0;
`;

const InlineLink = styled.a`
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
    text-decoration: underline;
  }
`;

const LastUpdated = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
  font-size: 0.875rem;
  color: var(--text-subtle);
`;

export default function TermsAndConditionsPage() {
  return (
    <Container>
      <SEO
        title='Términos y Condiciones | Smashly'
        description='Términos y condiciones de uso de Smashly. Conoce las reglas, derechos y responsabilidades al usar nuestra plataforma de comparación de palas de pádel.'
        canonical={buildUrl('/terms-and-conditions')}
        type='website'
        schema={[
          organizationSchema(),
          webPageSchema({
            name: 'Términos y Condiciones — Smashly',
            description: 'Términos legales de uso de Smashly.',
            url: buildUrl('/terms-and-conditions'),
          }),
        ]}
      />
      <Header>
        <BackLink to='/'>
          <FiArrowLeft size={20} />
          Volver
        </BackLink>
      </Header>

      <Title>Términos y Condiciones</Title>

      <Section>
        <SectionTitle>1. Aceptación de los Términos</SectionTitle>
        <Paragraph>
          Al acceder y utilizar Smashlyapp (la "Plataforma"), usted acepta estar sujeto a estos
          Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, le
          recomendamos que no utilice la Plataforma.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>2. Descripción del Servicio</SectionTitle>
        <Paragraph>
          Smashlyapp es una plataforma digital que facilita la comparación de palas de pádel,
          catálogo de productos, gestión de perfiles de usuario y funcionalidades adicionales
          relacionadas con el deporte del pádel.
        </Paragraph>
        <List>
          <ListItem>Comparación detallada de características de palas</ListItem>
          <ListItem>Catálogo completo de productos disponibles</ListItem>
          <ListItem>Gestión de perfil de usuario personalizado</ListItem>
          <ListItem>Funcionalidades comunitarias y de reseñas</ListItem>
          <ListItem>Acceso a ofertas y promociones especiales</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>3. Registro y Cuenta de Usuario</SectionTitle>
        <Paragraph>
          Para utilizar ciertas funciones de la Plataforma, debe crear una cuenta. Usted es
          responsable de:
        </Paragraph>
        <List>
          <ListItem>Proporcionar información precisa, completa y actualizada</ListItem>
          <ListItem>Mantener la confidencialidad de su contraseña</ListItem>
          <ListItem>Todas las actividades realizadas bajo su cuenta</ListItem>
          <ListItem>Notificarnos inmediatamente de cualquier acceso no autorizado</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>4. Licencia de Uso</SectionTitle>
        <Paragraph>
          Le otorgamos una licencia limitada, no exclusiva y personal para usar la Plataforma de
          conformidad con estos términos. No puede:
        </Paragraph>
        <List>
          <ListItem>
            Reproducir, duplicar o copiar el contenido para propósitos comerciales
          </ListItem>
          <ListItem>Acceder a la Plataforma mediante medios automatizados sin permiso</ListItem>
          <ListItem>Reproducir información para crear servicios competidores</ListItem>
          <ListItem>Usar la Plataforma para actividades ilícitas o no autorizadas</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>5. Contenido del Usuario</SectionTitle>
        <Paragraph>
          Usted es el único responsable del contenido que publica en la Plataforma. Al enviar
          contenido, usted:
        </Paragraph>
        <List>
          <ListItem>Garantiza que posee todos los derechos sobre ese contenido</ListItem>
          <ListItem>
            Nos otorga una licencia mundial, no exclusiva y gratuita para usar, reproducir y
            distribuir su contenido
          </ListItem>
          <ListItem>Garantiza que el contenido no infringe derechos de terceros</ListItem>
          <ListItem>Comprende que el contenido puede ser eliminado a nuestro criterio</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>6. Conducta Prohibida</SectionTitle>
        <Paragraph>No debe utilizar la Plataforma para:</Paragraph>
        <List>
          <ListItem>Acosar, amenazar o discriminar a otros usuarios</ListItem>
          <ListItem>Publicar contenido obsceno, ofensivo o ilegal</ListItem>
          <ListItem>Facilitar transacciones ilegales</ListItem>
          <ListItem>Distribuir malware o código malicioso</ListItem>
          <ListItem>Impersonar a otro usuario o entidad</ListItem>
          <ListItem>Socavar la seguridad o integridad de la Plataforma</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>7. Limitación de Responsabilidad</SectionTitle>
        <Paragraph>
          La Plataforma se proporciona "tal cual" sin garantías de ningún tipo. En la máxima medida
          permitida por la ley:
        </Paragraph>
        <List>
          <ListItem>No somos responsables de daños directos, indirectos o consecuentes</ListItem>
          <ListItem>No garantizamos disponibilidad ininterrumpida de la Plataforma</ListItem>
          <ListItem>No nos responsabilizamos por pérdida de datos o acceso no autorizado</ListItem>
          <ListItem>Cualquier responsabilidad está limitada al monto pagado, si aplica</ListItem>
        </List>
      </Section>

      <Section>
        <SectionTitle>8. Indemnización</SectionTitle>
        <Paragraph>
          Usted se compromete a indemnizar y exonerar a Smashlyapp, sus directores, empleados y
          agentes de cualquier reclamación, daño o gasto resultante de su violación de estos
          términos o de su uso de la Plataforma.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>9. Modificación de Términos</SectionTitle>
        <Paragraph>
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
          serán efectivos inmediatamente al publicarse. Su uso continuado de la Plataforma
          constituye aceptación de los términos modificados.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>10. Terminación</SectionTitle>
        <Paragraph>
          Podemos terminar o suspender su cuenta y acceso a la Plataforma de inmediato, sin previo
          aviso, si viola estos términos o participa en conducta que consideramos inapropiada.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>11. Ley Aplicable</SectionTitle>
        <Paragraph>
          Estos términos se rigen según las leyes aplicables en España. Cualquier disputa será
          resuelta en los tribunales competentes de acuerdo con la legislación vigente.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>12. Contacto</SectionTitle>
        <Paragraph>
          Si tiene preguntas sobre estos Términos y Condiciones, por favor contacte a:{' '}
          <InlineLink href='mailto:legal@smashlyapp.com'>legal@smashlyapp.com</InlineLink>
        </Paragraph>
      </Section>

      <LastUpdated>
        <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-ES')}
      </LastUpdated>
    </Container>
  );
}
