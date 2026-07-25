import {
  getSession,
  removeSession
} from "./auth.js";

import {
  getContacts
} from "./api.js";

let messageTimeout = null;

function getElement(id) {
  return document.getElementById(id);
}

function protectPage() {
  const session = getSession();

  if (!session?.authenticated) {
    window.location.replace("./index.html");
    return null;
  }

  return session;
}

function showAuthenticatedUser(session) {
  const sidebarUser =
    document.querySelector("[data-user-email]");

  const settingsUser =
    getElement("settings-user-email");

  if (sidebarUser) {
    sidebarUser.textContent =
      session.email || "Usuario autenticado";
  }

  if (settingsUser) {
    settingsUser.textContent =
      session.email || "Correo no disponible";
  }
}

function initializeLogout() {
  const logoutButtons = [
    getElement("logout-button"),
    getElement("settings-logout-button")
  ].filter(Boolean);

  logoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      removeSession();
      window.location.replace("./index.html");
    });
  });
}

function setStatus(
  elementId,
  text,
  statusType
) {
  const element = getElement(elementId);

  if (!element) {
    return;
  }

  element.textContent = text;

  element.classList.remove(
    "settings-status--loading",
    "settings-status--success",
    "settings-status--error"
  );

  element.classList.add(
    `settings-status--${statusType}`
  );
}

function renderConfiguration(session) {
  const awsRegion =
    window.CONFIG?.COGNITO_REGION || "No disponible";

  const awsRegionElement =
    getElement("settings-aws-region");

  if (awsRegionElement) {
    awsRegionElement.textContent =
      awsRegion;
  }

  setStatus(
    "settings-session-status",
    session?.authenticated
      ? "Sesión activa"
      : "Sesión no válida",
    session?.authenticated
      ? "success"
      : "error"
  );

  const cognitoConfigured =
    Boolean(
      window.CONFIG?.COGNITO_USER_POOL_ID &&
      window.CONFIG?.COGNITO_CLIENT_ID &&
      window.CONFIG?.COGNITO_REGION
    );

  setStatus(
    "settings-cognito-status",
    cognitoConfigured
      ? "Configurado"
      : "Configuración incompleta",
    cognitoConfigured
      ? "success"
      : "error"
  );

  const environmentElement =
    getElement("settings-environment");

  if (environmentElement) {
    const isLocalEnvironment =
      ["localhost", "127.0.0.1"].includes(
        window.location.hostname
      );

    environmentElement.textContent =
      isLocalEnvironment
        ? "Desarrollo local"
        : "Producción";
  }
}

function setCheckingApi(isChecking) {
  const button =
    getElement("settings-check-api-button");

  const spinner =
    getElement("settings-check-api-spinner");

  const text =
    getElement("settings-check-api-text");

  if (button) {
    button.disabled = isChecking;
  }

  if (spinner) {
    spinner.hidden = !isChecking;
  }

  if (text) {
    text.textContent =
      isChecking
        ? "Verificando..."
        : "Verificar conexión";
  }
}

function showMessage(
  message,
  isError = false
) {
  const element =
    getElement("settings-message");

  if (!element) {
    return;
  }

  if (messageTimeout) {
    window.clearTimeout(messageTimeout);
  }

  element.textContent = message;
  element.hidden = false;
  element.classList.toggle(
    "is-error",
    isError
  );

  messageTimeout = window.setTimeout(() => {
    element.hidden = true;
    element.textContent = "";
    element.classList.remove("is-error");
  }, 4000);
}

async function checkApiConnection(
  showConfirmation = false
) {
  setCheckingApi(true);

  setStatus(
    "settings-api-status",
    "Verificando...",
    "loading"
  );

  try {
    await getContacts();

    setStatus(
      "settings-api-status",
      "Conectada",
      "success"
    );

    if (showConfirmation) {
      showMessage(
        "La conexión con la API funciona correctamente."
      );
    }

    return true;
  } catch (error) {
    console.error(
      "No fue posible verificar la API."
    );

    setStatus(
      "settings-api-status",
      "Sin conexión",
      "error"
    );

    if (showConfirmation) {
      showMessage(
        "No fue posible conectar con la API administrativa.",
        true
      );
    }

    return false;
  } finally {
    setCheckingApi(false);
  }
}

function initializeApiCheck() {
  const button =
    getElement("settings-check-api-button");

  button?.addEventListener(
    "click",
    () => checkApiConnection(true)
  );
}

async function initializeSettingsPage() {
  const session = protectPage();

  if (!session) {
    return;
  }

  showAuthenticatedUser(session);
  initializeLogout();
  initializeApiCheck();
  renderConfiguration(session);

  await checkApiConnection(false);
}

document.addEventListener(
  "DOMContentLoaded",
  initializeSettingsPage
);