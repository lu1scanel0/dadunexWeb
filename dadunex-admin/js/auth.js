const AUTH_STORAGE_KEY = "dadunex_admin_session";

const TEMPORARY_USER = {
  email: "admin@dadunex.cl",
  password: "Dadunex123"
};

function getElement(id) {
  return document.getElementById(id);
}

function getSession() {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession);
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function createSession(email) {
  const session = {
    email,
    authenticated: true,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(session)
  );
}

function removeSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function redirectAuthenticatedUser() {
  const session = getSession();

  const isLoginPage =
    window.location.pathname.endsWith("/") ||
    window.location.pathname.endsWith("/index.html");

  if (
    session?.authenticated &&
    isLoginPage
  ) {
    window.location.replace("./dashboard.html");
  }
}

function showFieldError(input, errorElement, message) {
  input.classList.add("is-invalid");
  errorElement.textContent = message;
}

function clearFieldError(input, errorElement) {
  input.classList.remove("is-invalid");
  errorElement.textContent = "";
}

function validateLoginForm(email, password) {
  const emailInput = getElement("email");
  const passwordInput = getElement("password");

  const emailError = getElement("email-error");
  const passwordError = getElement("password-error");

  let isValid = true;

  clearFieldError(emailInput, emailError);
  clearFieldError(passwordInput, passwordError);

  if (!email) {
    showFieldError(
      emailInput,
      emailError,
      "Debes ingresar tu correo electrónico."
    );

    isValid = false;
  } else if (!emailInput.validity.valid) {
    showFieldError(
      emailInput,
      emailError,
      "Ingresa un correo electrónico válido."
    );

    isValid = false;
  }

  if (!password) {
    showFieldError(
      passwordInput,
      passwordError,
      "Debes ingresar tu contraseña."
    );

    isValid = false;
  }

  return isValid;
}

function setLoading(isLoading) {
  const loginButton = getElement("login-button");
  const buttonText = getElement("login-button-text");
  const spinner = getElement("login-spinner");

  loginButton.disabled = isLoading;
  buttonText.textContent = isLoading
    ? "Validando..."
    : "Iniciar sesión";

  spinner.hidden = !isLoading;
}

function showLoginMessage(message) {
  const loginMessage = getElement("login-message");

  loginMessage.textContent = message;
  loginMessage.hidden = false;
}

function hideLoginMessage() {
  const loginMessage = getElement("login-message");

  loginMessage.textContent = "";
  loginMessage.hidden = true;
}

async function handleLogin(event) {
  event.preventDefault();

  const email = getElement("email").value
    .trim()
    .toLowerCase();

  const password = getElement("password").value;

  hideLoginMessage();

  if (!validateLoginForm(email, password)) {
    return;
  }

  setLoading(true);

  try {
    await new Promise((resolve) => {
      setTimeout(resolve, 700);
    });

    const validEmail =
      email === TEMPORARY_USER.email.toLowerCase();

    const validPassword =
      password === TEMPORARY_USER.password;

    if (!validEmail || !validPassword) {
      showLoginMessage(
        "El correo electrónico o la contraseña son incorrectos."
      );

      return;
    }

    createSession(email);

    window.location.replace("./dashboard.html");
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    showLoginMessage(
      "No fue posible iniciar sesión. Intenta nuevamente."
    );
  } finally {
    setLoading(false);
  }
}

function handlePasswordVisibility() {
  const passwordInput = getElement("password");
  const toggleButton = getElement("toggle-password");

  const passwordIsVisible =
    passwordInput.type === "text";

  passwordInput.type =
    passwordIsVisible ? "password" : "text";

  toggleButton.textContent =
    passwordIsVisible ? "Mostrar" : "Ocultar";

  toggleButton.setAttribute(
    "aria-label",
    passwordIsVisible
      ? "Mostrar contraseña"
      : "Ocultar contraseña"
  );
}

function initializeLoginPage() {
  redirectAuthenticatedUser();

  const loginForm = getElement("login-form");
  const togglePassword = getElement("toggle-password");

  if (!loginForm) {
    return;
  }

  loginForm.addEventListener(
    "submit",
    handleLogin
  );

  togglePassword.addEventListener(
    "click",
    handlePasswordVisibility
  );
}

document.addEventListener(
  "DOMContentLoaded",
  initializeLoginPage
);

export {
  AUTH_STORAGE_KEY,
  getSession,
  removeSession
};