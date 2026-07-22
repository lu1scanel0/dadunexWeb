import {
  SESv2Client,
  SendEmailCommand
} from "@aws-sdk/client-sesv2";

/**
 * CONFIGURACIÓN
 *
 * Estas variables se configuran en AWS Lambda:
 *
 * DESTINATION_EMAIL=luis.canelolastra@gmail.com
 * FROM_EMAIL=contacto@dadunex.cl
 *
 * AWS_REGION no se configura manualmente.
 * Lambda la proporciona automáticamente.
 */

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION
});

const DESTINATION_EMAIL = process.env.DESTINATION_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL;

const ALLOWED_ORIGINS = new Set([
  "https://dadunex.cl",
  "https://www.dadunex.cl"
]);

const MAX_BODY_SIZE = 15_000;

/**
 * Obtiene el origen desde el cual se realizó la solicitud.
 */
function getRequestOrigin(event) {
  return (
    event?.headers?.origin ||
    event?.headers?.Origin ||
    ""
  );
}

/**
 * Genera los encabezados CORS.
 *
 * Si la solicitud viene desde Dadunex, devuelve ese dominio.
 * Para pruebas directas desde Lambda se utiliza dadunex.cl.
 */
function getCorsHeaders(event) {
  const requestOrigin = getRequestOrigin(event);

  const allowedOrigin = ALLOWED_ORIGINS.has(requestOrigin)
    ? requestOrigin
    : "https://dadunex.cl";

  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Cache-Control": "no-store"
  };
}

/**
 * Crea una respuesta compatible con API Gateway.
 */
function createResponse(event, statusCode, message) {
  return {
    statusCode,
    headers: getCorsHeaders(event),
    body: JSON.stringify({
      message
    })
  };
}

/**
 * Limpia texto general.
 *
 * Elimina caracteres de control y limita su longitud.
 */
function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

/**
 * Limpia campos utilizados en encabezados del correo.
 *
 * Evita saltos de línea que podrían alterar los encabezados.
 */
function cleanHeader(value, maxLength) {
  return cleanText(value, maxLength)
    .replace(/[\r\n]+/g, " ")
    .trim();
}

/**
 * Escapa contenido para mostrarlo de forma segura en HTML.
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Valida un correo electrónico con un patrón básico.
 */
function isValidEmail(email) {
  if (email.length > 254) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Valida teléfonos móviles chilenos.
 *
 * Formatos admitidos:
 *
 * +56912345678
 * 912345678
 * +56 9 1234 5678
 * 9 1234 5678
 */
function isValidChileanPhone(phone) {
  const normalizedPhone = phone.replace(/[\s()-]/g, "");

  return /^(?:\+56)?9\d{8}$/.test(normalizedPhone);
}

/**
 * Obtiene el método HTTP tanto en API Gateway HTTP API
 * como en eventos de prueba.
 */
function getHttpMethod(event) {
  return (
    event?.requestContext?.http?.method ||
    event?.httpMethod ||
    "POST"
  ).toUpperCase();
}

/**
 * Convierte el body recibido a un objeto.
 */
function parseRequestBody(event) {
  if (!event) {
    return {};
  }

  if (typeof event.body === "string") {
    if (event.body.length > MAX_BODY_SIZE) {
      throw new Error("REQUEST_TOO_LARGE");
    }

    return JSON.parse(event.body);
  }

  if (event.body && typeof event.body === "object") {
    return event.body;
  }

  // Permite realizar pruebas directas desde Lambda
  // enviando los campos en la raíz del evento.
  return event;
}

/**
 * Extrae información básica para CloudWatch.
 *
 * No se registra el contenido del mensaje.
 */
function getRequestMetadata(event) {
  return {
    requestId:
      event?.requestContext?.requestId ||
      event?.requestContext?.requestId ||
      "sin-request-id",

    sourceIp:
      event?.requestContext?.http?.sourceIp ||
      event?.requestContext?.identity?.sourceIp ||
      "no-disponible",

    userAgent:
      event?.requestContext?.http?.userAgent ||
      event?.headers?.["user-agent"] ||
      event?.headers?.["User-Agent"] ||
      "no-disponible"
  };
}

/**
 * Construye la versión de texto plano del correo.
 */
function buildTextEmail({
  name,
  email,
  phone,
  subject,
  message
}) {
  return [
    "Nuevo mensaje recibido desde el sitio web de Agrícola Dadunex",
    "",
    `Nombre: ${name}`,
    `Correo: ${email}`,
    `Teléfono: ${phone}`,
    `Asunto: ${subject}`,
    "",
    "Mensaje:",
    message,
    "",
    "Este correo fue generado automáticamente desde https://dadunex.cl"
  ].join("\n");
}

/**
 * Construye la versión HTML del correo.
 */
function buildHtmlEmail({
  name,
  email,
  phone,
  subject,
  message
}) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");

  const formattedPhone = phone.replace(/[\s()-]/g, "");

  const receivedAt = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "long",
    timeStyle: "short"
  }).format(new Date());

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Nuevo contacto desde Dadunex</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f1f5f2;
    font-family:Arial, Helvetica, sans-serif;
    color:#26332b;
  "
>

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="
      width:100%;
      background-color:#f1f5f2;
      padding:24px 12px;
    "
  >
    <tr>
      <td align="center">

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            width:100%;
            max-width:640px;
            background-color:#ffffff;
            border-radius:14px;
            overflow:hidden;
            box-shadow:0 6px 20px rgba(24, 75, 45, 0.12);
          "
        >

          <!-- Encabezado -->
          <tr>
            <td
              align="center"
              style="
                padding:28px 24px;
                background-color:#198754;
              "
            >
              <img
                src="https://dadunex.cl/images/logos/logo_dadunex_bco.webp"
                alt="Agrícola Dadunex"
                width="220"
                style="
                  display:block;
                  width:100%;
                  max-width:220px;
                  height:auto;
                  margin:0 auto 16px;
                  border:0;
                "
              >

              <h1
                style="
                  margin:0;
                  color:#ffffff;
                  font-size:24px;
                  line-height:1.3;
                "
              >
                Nuevo mensaje desde el sitio web
              </h1>

              <p
                style="
                  margin:8px 0 0;
                  color:#dff5e7;
                  font-size:14px;
                  line-height:1.5;
                "
              >
                Formulario de contacto de Agrícola Dadunex
              </p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding:30px 28px;">

              <p
                style="
                  margin:0 0 8px;
                  color:#26332b;
                  font-size:17px;
                  line-height:1.6;
                "
              >
                Se recibió una nueva solicitud de contacto.
              </p>

              <p
                style="
                  margin:0 0 26px;
                  color:#6a756e;
                  font-size:13px;
                  line-height:1.5;
                "
              >
                Recibido el ${escapeHtml(receivedAt)}.
              </p>

              <!-- Datos -->
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  width:100%;
                  border-collapse:separate;
                  border-spacing:0;
                  border:1px solid #dce7df;
                  border-radius:10px;
                  overflow:hidden;
                "
              >

                <tr>
                  <td
                    style="
                      width:115px;
                      padding:14px 16px;
                      background-color:#f4f8f5;
                      border-bottom:1px solid #dce7df;
                      font-weight:bold;
                      color:#435148;
                    "
                  >
                    Nombre
                  </td>

                  <td
                    style="
                      padding:14px 16px;
                      border-bottom:1px solid #dce7df;
                      color:#26332b;
                    "
                  >
                    ${safeName}
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:14px 16px;
                      background-color:#f4f8f5;
                      border-bottom:1px solid #dce7df;
                      font-weight:bold;
                      color:#435148;
                    "
                  >
                    Correo
                  </td>

                  <td
                    style="
                      padding:14px 16px;
                      border-bottom:1px solid #dce7df;
                    "
                  >
                    <a
                      href="mailto:${safeEmail}"
                      style="
                        color:#198754;
                        text-decoration:none;
                        font-weight:bold;
                        overflow-wrap:anywhere;
                      "
                    >
                      ${safeEmail}
                    </a>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:14px 16px;
                      background-color:#f4f8f5;
                      border-bottom:1px solid #dce7df;
                      font-weight:bold;
                      color:#435148;
                    "
                  >
                    Teléfono
                  </td>

                  <td
                    style="
                      padding:14px 16px;
                      border-bottom:1px solid #dce7df;
                    "
                  >
                    <a
                      href="tel:${escapeHtml(formattedPhone)}"
                      style="
                        color:#198754;
                        text-decoration:none;
                        font-weight:bold;
                      "
                    >
                      ${safePhone}
                    </a>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:14px 16px;
                      background-color:#f4f8f5;
                      font-weight:bold;
                      color:#435148;
                    "
                  >
                    Asunto
                  </td>

                  <td
                    style="
                      padding:14px 16px;
                      color:#26332b;
                    "
                  >
                    ${safeSubject}
                  </td>
                </tr>

              </table>

              <!-- Mensaje -->
              <div style="margin-top:28px;">

                <h2
                  style="
                    margin:0 0 12px;
                    color:#198754;
                    font-size:18px;
                    line-height:1.4;
                  "
                >
                  Mensaje
                </h2>

                <div
                  style="
                    padding:18px;
                    background-color:#f4f8f5;
                    border-left:5px solid #27ae60;
                    border-radius:6px;
                    color:#26332b;
                    font-size:15px;
                    line-height:1.7;
                    overflow-wrap:anywhere;
                  "
                >
                  ${safeMessage}
                </div>

              </div>

              <!-- Botones -->
              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin-top:28px;"
              >
                <tr>

                  <td style="padding:0 10px 10px 0;">
                    <a
                      href="mailto:${safeEmail}?subject=${encodeURIComponent(
                        `Respuesta de Agrícola Dadunex: ${subject}`
                      )}"
                      style="
                        display:inline-block;
                        padding:13px 20px;
                        background-color:#198754;
                        color:#ffffff;
                        text-decoration:none;
                        font-weight:bold;
                        font-size:14px;
                        border-radius:7px;
                      "
                    >
                      Responder correo
                    </a>
                  </td>

                  <td style="padding:0 0 10px;">
                    <a
                      href="tel:${escapeHtml(formattedPhone)}"
                      style="
                        display:inline-block;
                        padding:12px 20px;
                        background-color:#ffffff;
                        color:#198754;
                        text-decoration:none;
                        font-weight:bold;
                        font-size:14px;
                        border:1px solid #198754;
                        border-radius:7px;
                      "
                    >
                      Llamar
                    </a>
                  </td>

                </tr>
              </table>

              <p
                style="
                  margin:18px 0 0;
                  color:#748079;
                  font-size:12px;
                  line-height:1.6;
                "
              >
                También puedes responder directamente a este correo.
                La respuesta será enviada a ${safeEmail}.
              </p>

            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td
              align="center"
              style="
                padding:20px 24px;
                background-color:#eaf5ee;
                color:#5c6b62;
                font-size:12px;
                line-height:1.6;
              "
            >
              <strong style="color:#198754;">
                Agrícola Dadunex
              </strong>
              <br>
              Buin, Santiago de Chile
              <br>
              Mensaje generado automáticamente desde
              <a
                href="https://dadunex.cl"
                style="
                  color:#198754;
                  text-decoration:none;
                  font-weight:bold;
                "
              >
                dadunex.cl
              </a>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}
/**
 * FUNCIÓN PRINCIPAL DE LAMBDA
 */
export const handler = async (event) => {
  const metadata = getRequestMetadata(event);

  console.log("Solicitud recibida:", metadata);

  try {
    const method = getHttpMethod(event);

    /*
     * Responde solicitudes preflight de CORS.
     */
    if (method === "OPTIONS") {
      return {
        statusCode: 204,
        headers: getCorsHeaders(event),
        body: ""
      };
    }

    /*
     * Solo se acepta POST.
     */
    if (method !== "POST") {
      return createResponse(
        event,
        405,
        "Método no permitido."
      );
    }

    /*
     * Rechaza orígenes desconocidos cuando el navegador
     * proporciona el encabezado Origin.
     */
    const requestOrigin = getRequestOrigin(event);

    if (
      requestOrigin &&
      !ALLOWED_ORIGINS.has(requestOrigin)
    ) {
      console.warn("Origen rechazado:", requestOrigin);

      return createResponse(
        event,
        403,
        "Origen no permitido."
      );
    }

    /*
     * Verifica la configuración de Lambda.
     */
    if (!DESTINATION_EMAIL || !FROM_EMAIL) {
      console.error(
        "Faltan las variables DESTINATION_EMAIL o FROM_EMAIL."
      );

      return createResponse(
        event,
        500,
        "La función no está configurada correctamente."
      );
    }

    const body = parseRequestBody(event);

    const name = cleanText(body.name, 100);
    const email = cleanHeader(body.email, 254).toLowerCase();
    const phone = cleanText(body.phone, 30);
    const subject = cleanHeader(body.subject, 150);
    const message = cleanText(body.message, 2000);
    const website = cleanText(body.website, 200);

    /*
     * Honeypot antispam.
     *
     * Los usuarios reales no ven ni completan este campo.
     * Los bots suelen rellenarlo automáticamente.
     */
    if (website) {
      console.warn("Solicitud bloqueada por honeypot:", metadata);

      // Se responde 200 para no revelar al bot que fue detectado.
      return createResponse(
        event,
        200,
        "Tu mensaje fue recibido correctamente."
      );
    }

    /*
     * Validación de campos obligatorios.
     */
    if (
      !name ||
      !email ||
      !phone ||
      !subject ||
      !message
    ) {
      return createResponse(
        event,
        400,
        "Completa todos los campos obligatorios."
      );
    }

    if (name.length < 4) {
      return createResponse(
        event,
        400,
        "El nombre debe contener al menos 4 caracteres."
      );
    }

    if (!isValidEmail(email)) {
      return createResponse(
        event,
        400,
        "El correo electrónico no es válido."
      );
    }

    if (!isValidChileanPhone(phone)) {
      return createResponse(
        event,
        400,
        "El teléfono ingresado no es válido."
      );
    }

    if (subject.length < 2) {
      return createResponse(
        event,
        400,
        "El asunto es demasiado corto."
      );
    }

    if (message.length < 4) {
      return createResponse(
        event,
        400,
        "El mensaje es demasiado corto."
      );
    }

    const emailData = {
      name,
      email,
      phone,
      subject,
      message
    };

    const sendEmailCommand = new SendEmailCommand({
      FromEmailAddress:
        `Sitio web Dadunex <${FROM_EMAIL}>`,

      Destination: {
        ToAddresses: [
          DESTINATION_EMAIL
        ]
      },

      ReplyToAddresses: [
        email
      ],

      Content: {
        Simple: {
          Subject: {
            Data: `Contacto web Dadunex: ${subject}`,
            Charset: "UTF-8"
          },

          Body: {
            Text: {
              Data: buildTextEmail(emailData),
              Charset: "UTF-8"
            },

            Html: {
              Data: buildHtmlEmail(emailData),
              Charset: "UTF-8"
            }
          }
        }
      }
    });

    const sesResult = await sesClient.send(sendEmailCommand);

    console.log("Correo enviado correctamente:", {
      requestId: metadata.requestId,
      messageId: sesResult.MessageId
    });

    return createResponse(
      event,
      200,
      "Tu mensaje fue enviado correctamente."
    );
  } catch (error) {
    if (error?.message === "REQUEST_TOO_LARGE") {
      return createResponse(
        event,
        413,
        "La solicitud supera el tamaño permitido."
      );
    }

    if (error instanceof SyntaxError) {
      return createResponse(
        event,
        400,
        "El contenido de la solicitud no es válido."
      );
    }

    console.error("Error al procesar el formulario:", {
      requestId: metadata.requestId,
      errorName: error?.name,
      errorMessage: error?.message,
      stack: error?.stack
    });

    return createResponse(
      event,
      500,
      "No fue posible enviar el mensaje. Inténtalo nuevamente."
    );
  }
};