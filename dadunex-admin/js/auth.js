const AUTH_STORAGE_KEY = "dadunex_admin_session";

let activeCognitoUser = null;

function getElement(id) {
  return document.getElementById(id);
}

function getCognitoSdk() {
  const sdk = window.AmazonCognitoIdentity;

  if (!sdk) {
    throw new Error(
      "El SDK de Amazon Cognito no está disponible."
    );
  }

  return sdk;
}

function getUserPool() {
  const sdk = getCognitoSdk();

  const userPoolId =
    window.CONFIG?.COGNITO_USER_POOL_ID;

  const clientId =
    window.CONFIG?.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error(
      "La configuración de Amazon Cognito está incompleta."
    );
  }

  return new sdk.CognitoUserPool({
    UserPoolId: userPoolId,
    ClientId: clientId
  });
}

function getSession() {
  const storedSession =
    localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession);

    if (!session?.authenticated) {
      removeStoredSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error(
      "No fue posible leer la sesión:",
      error
    );

    removeStoredSession();
    return null;
  }
}

function createSession(email, cognitoSession) {
  const accessToken =
    cognitoSession
      .getAccessToken()
      .getJwtToken();

  const idToken =
    cognitoSession
      .getIdToken()
      .getJwtToken();

  const expiration =
    cognitoSession
      .getAccessToken()
      .getExpiration();

  const session = {
    email,
    authenticated: true,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(
      expiration * 1000
    ).toISOString(),
    accessToken,
    idToken
  };

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(session)
  );

  return session;
}

function removeStoredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function removeSession() {
  try {
    const userPool = getUserPool();
    const currentUser =
      userPool.getCurrentUser();

    if (currentUser) {
      currentUser.signOut();
    }

    if (activeCognitoUser) {
      activeCognitoUser.signOut();
      activeCognitoUser = null;
    }
  } catch (error) {
    console.error(
      "No fue posible cerrar la sesión de Cognito:",
      error
    );
  } finally {
    removeStoredSession();
  }
}

function isLoginPage() {
  const path = window.location.pathname;

  return (
    path.endsWith("/") ||
    path.endsWith("/index.html")
  );
}

function redirectAuthenticatedUser() {
  const session = getSession();

  if (
    session?.authenticated &&
    isLoginPage()
  ) {
    window.location.replace(
      "./dashboard.html"
    );
  }
}

function showFieldError(
  input,
  errorElement,
  message
) {
  if (input) {
    input.classList.add("is-invalid");
  }

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearFieldError(
  input,
  errorElement
) {
  if (input) {
    input.classList.remove("is-invalid");
  }

  if (errorElement) {
    errorElement.textContent = "";
  }
}

function validateLoginForm(
  email,
  password
) {
  const emailInput = getElement("email");
  const passwordInput =
    getElement("password");

  const emailError =
    getElement("email-error");

  const passwordError =
    getElement("password-error");

  let isValid = true;

  clearFieldError(
    emailInput,
    emailError
  );

  clearFieldError(
    passwordInput,
    passwordError
  );

  if (!email) {
    showFieldError(
      emailInput,
      emailError,
      "Debes ingresar tu correo electrónico."
    );

    isValid = false;
  } else if (
    emailInput &&
    !emailInput.validity.valid
  ) {
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
  const loginButton =
    getElement("login-button");

  const buttonText =
    getElement("login-button-text");

  const spinner =
    getElement("login-spinner");

  if (loginButton) {
    loginButton.disabled = isLoading;
  }

  if (buttonText) {
    buttonText.textContent =
      isLoading
        ? "Validando..."
        : "Iniciar sesión";
  }

  if (spinner) {
    spinner.hidden = !isLoading;
    spinner.style.display =
      isLoading ? "inline-block" : "none";
  }
}

function showLoginMessage(message) {
  const loginMessage =
    getElement("login-message");

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent = message;
  loginMessage.hidden = false;
  loginMessage.style.display = "block";
}

function hideLoginMessage() {
  const loginMessage =
    getElement("login-message");

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent = "";
  loginMessage.hidden = true;
  loginMessage.style.display = "none";
}

function getCognitoErrorMessage(error) {
  const errorCode =
    error?.code || error?.name;

  const messages = {
    NotAuthorizedException:
      "El correo electrónico o la contraseña son incorrectos.",

    UserNotFoundException:
      "El correo electrónico o la contraseña son incorrectos.",

    UserNotConfirmedException:
      "La cuenta todavía no ha sido confirmada.",

    PasswordResetRequiredException:
      "Debes restablecer tu contraseña antes de iniciar sesión.",

    TooManyRequestsException:
      "Se realizaron demasiados intentos. Espera unos minutos e inténtalo nuevamente.",

    LimitExceededException:
      "Se superó el límite de intentos permitido. Inténtalo más tarde.",

    InvalidParameterException:
      "Los datos ingresados no son válidos.",

    InvalidPasswordException:
      "La nueva contraseña no cumple con los requisitos de seguridad.",

    CodeMismatchException:
      "El código ingresado no es correcto.",

    ExpiredCodeException:
      "El código de verificación ha expirado.",

    NetworkError:
      "No fue posible conectar con el servicio de autenticación."
  };

  return (
    messages[errorCode] ||
    "No fue posible iniciar sesión. Intenta nuevamente."
  );
}

function requestNewPassword() {
  const newPassword = window.prompt(
    "Amazon Cognito solicita cambiar la contraseña temporal.\n\nIngresa una nueva contraseña:"
  );

  if (!newPassword) {
    throw new Error(
      "NEW_PASSWORD_CANCELLED"
    );
  }

  const passwordConfirmation =
    window.prompt(
      "Confirma la nueva contraseña:"
    );

  if (
    newPassword !== passwordConfirmation
  ) {
    throw new Error(
      "NEW_PASSWORD_MISMATCH"
    );
  }

  return newPassword;
}

function prepareRequiredAttributes(
  userAttributes,
  requiredAttributes
) {
  const immutableAttributes = [
    "sub",
    "email_verified",
    "phone_number_verified"
  ];

  const attributes = {};

  requiredAttributes.forEach(
    (attributeName) => {
      if (
        immutableAttributes.includes(
          attributeName
        )
      ) {
        return;
      }

      const existingValue =
        userAttributes?.[attributeName];

      if (existingValue) {
        attributes[attributeName] =
          existingValue;

        return;
      }

      const value = window.prompt(
        `Ingresa el valor requerido para ${attributeName}:`
      );

      if (value) {
        attributes[attributeName] =
          value;
      }
    }
  );

  return attributes;
}

function authenticateWithCognito(
  email,
  password
) {
  return new Promise(
    (resolve, reject) => {
      try {
        const sdk = getCognitoSdk();
        const userPool = getUserPool();

        const authenticationDetails =
          new sdk.AuthenticationDetails({
            Username: email,
            Password: password
          });

        const cognitoUser =
          new sdk.CognitoUser({
            Username: email,
            Pool: userPool
          });

        activeCognitoUser =
          cognitoUser;

        cognitoUser.authenticateUser(
          authenticationDetails,
          {
            onSuccess(cognitoSession) {
              resolve(cognitoSession);
            },

            onFailure(error) {
              reject(error);
            },

            newPasswordRequired(
              userAttributes,
              requiredAttributes
            ) {
              try {
                delete userAttributes
                  .email_verified;

                delete userAttributes
                  .phone_number_verified;

                const newPassword =
                  requestNewPassword();

                const attributes =
                  prepareRequiredAttributes(
                    userAttributes,
                    requiredAttributes
                  );

                cognitoUser
                  .completeNewPasswordChallenge(
                    newPassword,
                    attributes,
                    {
                      onSuccess(
                        cognitoSession
                      ) {
                        resolve(
                          cognitoSession
                        );
                      },

                      onFailure(error) {
                        reject(error);
                      }
                    }
                  );
              } catch (error) {
                reject(error);
              }
            },

            mfaRequired(
              challengeName,
              challengeParameters
            ) {
              const code =
                window.prompt(
                  "Ingresa el código de verificación enviado por Amazon Cognito:"
                );

              if (!code) {
                reject(
                  new Error(
                    "MFA_CANCELLED"
                  )
                );

                return;
              }

              cognitoUser.sendMFACode(
                code,
                {
                  onSuccess(
                    cognitoSession
                  ) {
                    resolve(
                      cognitoSession
                    );
                  },

                  onFailure(error) {
                    reject(error);
                  }
                },
                challengeName,
                challengeParameters
              );
            },

            totpRequired() {
              const code =
                window.prompt(
                  "Ingresa el código de tu aplicación de autenticación:"
                );

              if (!code) {
                reject(
                  new Error(
                    "MFA_CANCELLED"
                  )
                );

                return;
              }

              cognitoUser.sendMFACode(
                code,
                {
                  onSuccess(
                    cognitoSession
                  ) {
                    resolve(
                      cognitoSession
                    );
                  },

                  onFailure(error) {
                    reject(error);
                  }
                },
                "SOFTWARE_TOKEN_MFA"
              );
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    }
  );
}

async function handleLogin(event) {
  event.preventDefault();

  const emailInput =
    getElement("email");

  const passwordInput =
    getElement("password");

  const email =
    emailInput?.value
      .trim()
      .toLowerCase() || "";

  const password =
    passwordInput?.value || "";

  hideLoginMessage();

  if (
    !validateLoginForm(
      email,
      password
    )
  ) {
    return;
  }

  setLoading(true);

  try {
    const cognitoSession =
      await authenticateWithCognito(
        email,
        password
      );

    if (
      !cognitoSession ||
      !cognitoSession.isValid()
    ) {
      throw new Error(
        "INVALID_COGNITO_SESSION"
      );
    }

    createSession(
      email,
      cognitoSession
    );

    window.location.replace(
      "./dashboard.html"
    );
  } catch (error) {
    console.error(
      "Error al iniciar sesión:",
      error
    );

    if (
      error?.message ===
      "NEW_PASSWORD_CANCELLED"
    ) {
      showLoginMessage(
        "Debes establecer una nueva contraseña para continuar."
      );

      return;
    }

    if (
      error?.message ===
      "NEW_PASSWORD_MISMATCH"
    ) {
      showLoginMessage(
        "Las contraseñas nuevas no coinciden. Inténtalo nuevamente."
      );

      return;
    }

    if (
      error?.message ===
      "MFA_CANCELLED"
    ) {
      showLoginMessage(
        "Debes ingresar el código de verificación para continuar."
      );

      return;
    }

    showLoginMessage(
      getCognitoErrorMessage(error)
    );
  } finally {
    setLoading(false);
  }
}

function handlePasswordVisibility() {
  const passwordInput =
    getElement("password");

  const toggleButton =
    getElement("toggle-password");

  if (
    !passwordInput ||
    !toggleButton
  ) {
    return;
  }

  const passwordIsVisible =
    passwordInput.type === "text";

  passwordInput.type =
    passwordIsVisible
      ? "password"
      : "text";

  toggleButton.textContent =
    passwordIsVisible
      ? "Mostrar"
      : "Ocultar";

  toggleButton.setAttribute(
    "aria-label",
    passwordIsVisible
      ? "Mostrar contraseña"
      : "Ocultar contraseña"
  );
}

function initializeLoginPage() {
  redirectAuthenticatedUser();

  const loginForm =
    getElement("login-form");

  const togglePassword =
    getElement("toggle-password");

  if (!loginForm) {
    return;
  }

  loginForm.addEventListener(
    "submit",
    handleLogin
  );

  togglePassword?.addEventListener(
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