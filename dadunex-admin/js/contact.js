import {
  getSession,
  removeSession
} from "./auth.js";

import {
  getContacts,
  getContactById,
  updateContact
} from "./api.js";

const STATUS_CONFIG = {
  NEW: {
    label: "Nuevo",
    badgeClass: "badge--new"
  },

  PENDING: {
    label: "Pendiente",
    badgeClass: "badge--pending"
  },

  ANSWERED: {
    label: "Respondido",
    badgeClass: "badge--answered"
  }
};

let currentContact = null;

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
  const element =
    document.querySelector("[data-user-email]");

  if (element) {
    element.textContent = session.email;
  }
}

function initializeLogout() {
  const logoutButton =
    getElement("logout-button");

  logoutButton?.addEventListener(
    "click",
    () => {
      removeSession();
      window.location.replace("./index.html");
    }
  );
}

function getContactIdFromUrl() {
  const parameters =
    new URLSearchParams(
      window.location.search
    );

  return parameters.get("id");
}

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatEmailStatus(status) {
  const statuses = {
    SENT: "Enviado correctamente",
    FAILED: "Error al enviar",
    PENDING: "Pendiente de envío"
  };

  return statuses[status] ??
    status ??
    "No disponible";
}

function updateSidebarCounter(contacts) {
  const counter =
    getElement("sidebar-new-contacts-count");

  if (!counter) {
    return;
  }

  const count = contacts.filter(
    (contact) => contact.status === "NEW"
  ).length;

  counter.textContent = String(count);
}

function renderHeaderStatus(statusValue) {
  const badge =
    getElement("contact-header-status");

  if (!badge) {
    return;
  }

  const status =
    STATUS_CONFIG[statusValue] ??
    STATUS_CONFIG.NEW;

  badge.className =
    `badge ${status.badgeClass}`;

  badge.textContent = status.label;
  badge.hidden = false;
}

function setText(id, value, fallback = "—") {
  const element = getElement(id);

  if (element) {
    element.textContent =
      value || fallback;
  }
}

function renderContact(contact) {
  currentContact = contact;

  setText(
    "contact-page-title",
    contact.name,
    "Contacto sin nombre"
  );

  setText(
    "contact-page-description",
    `Contacto recibido el ${formatDate(
      contact.createdAt
    )}`
  );

  setText("contact-name", contact.name);

  const emailLink =
    getElement("contact-email");

  if (emailLink) {
    emailLink.textContent =
      contact.email || "Correo no disponible";

    emailLink.href = contact.email
      ? `mailto:${contact.email}`
      : "#";
  }

  const phoneLink =
    getElement("contact-phone");

  if (phoneLink) {
    phoneLink.textContent =
      contact.phone || "No informado";

    phoneLink.href = contact.phone
      ? `tel:${contact.phone.replace(/\s+/g, "")}`
      : "#";
  }

  setText(
    "contact-created-at",
    formatDate(contact.createdAt)
  );

  setText(
    "contact-updated-at",
    formatDate(contact.updatedAt)
  );

  setText(
    "contact-email-status",
    formatEmailStatus(contact.emailStatus)
  );

  setText(
    "contact-subject",
    contact.subject,
    "Sin asunto"
  );

  setText(
    "contact-message",
    contact.message,
    "Sin mensaje"
  );

  const statusSelect =
    getElement("contact-status");

  if (statusSelect) {
    statusSelect.value =
      contact.status || "NEW";
  }

  const notes =
    getElement("contact-notes");

  if (notes) {
    notes.value = contact.notes || "";
  }

  renderHeaderStatus(contact.status);

  getElement("contact-loading").hidden = true;
  getElement("contact-error").hidden = true;
  getElement("contact-content").hidden = false;
}

function showError(title, message) {
  getElement("contact-loading").hidden = true;
  getElement("contact-content").hidden = true;
  getElement("contact-error").hidden = false;

  setText(
    "contact-error-title",
    title
  );

  setText(
    "contact-error-message",
    message
  );
}

function setSaving(isSaving) {
  const button =
    getElement("contact-save-button");

  const text =
    getElement("contact-save-text");

  const spinner =
    getElement("contact-save-spinner");

  if (button) {
    button.disabled = isSaving;
  }

  if (text) {
    text.textContent = isSaving
      ? "Guardando..."
      : "Guardar cambios";
  }

  if (spinner) {
    spinner.hidden = !isSaving;
  }
}

function showFormMessage(
  message,
  isError = false
) {
  const element =
    getElement("contact-form-message");

  if (!element) {
    return;
  }

  element.textContent = message;
  element.hidden = false;

  element.classList.toggle(
    "is-error",
    isError
  );
}

function hideFormMessage() {
  const element =
    getElement("contact-form-message");

  if (!element) {
    return;
  }

  element.hidden = true;
  element.textContent = "";
  element.classList.remove("is-error");
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!currentContact) {
    return;
  }

  hideFormMessage();
  setSaving(true);

  try {
    const status =
      getElement("contact-status").value;

    const notes =
      getElement("contact-notes").value.trim();

    const updatedContact =
      await updateContact(
        currentContact.contactId,
        {
          status,
          notes
        }
      );

    renderContact(updatedContact);

    showFormMessage(
      "Los cambios fueron guardados correctamente."
    );
  } catch (error) {
    console.error(
      "Error al guardar el contacto:",
      error
    );

    showFormMessage(
      "No fue posible guardar los cambios.",
      true
    );
  } finally {
    setSaving(false);
  }
}

async function loadContact() {
  const contactId =
    getContactIdFromUrl();

  if (!contactId) {
    showError(
      "Contacto no identificado",
      "El enlace no contiene un identificador de contacto."
    );

    return;
  }

  try {
    const [contact, contacts] =
      await Promise.all([
        getContactById(contactId),
        getContacts()
      ]);

    updateSidebarCounter(contacts);

    if (!contact) {
      showError(
        "Contacto no encontrado",
        "El contacto solicitado no existe o fue eliminado."
      );

      return;
    }

    renderContact(contact);
  } catch (error) {
    console.error(
      "Error al cargar el contacto:",
      error
    );

    showError(
      "No fue posible cargar el contacto",
      "Ocurrió un problema al recuperar la información."
    );
  }
}

async function initializeContactPage() {
  const session = protectPage();

  if (!session) {
    return;
  }

  showAuthenticatedUser(session);
  initializeLogout();

  getElement("contact-form")
    ?.addEventListener(
      "submit",
      handleSubmit
    );

  await loadContact();
}

document.addEventListener(
  "DOMContentLoaded",
  initializeContactPage
);