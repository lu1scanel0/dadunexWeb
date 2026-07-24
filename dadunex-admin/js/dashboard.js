import {
  getSession,
  removeSession
} from "./auth.js";

import {
  getDashboardData
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

function getElement(id) {
  return document.getElementById(id);
}

function protectDashboard() {
  const session = getSession();

  if (!session?.authenticated) {
    window.location.replace("./index.html");
    return null;
  }

  return session;
}

function showAuthenticatedUser(session) {
  const userEmailElement =
    document.querySelector("[data-user-email]");

  if (userEmailElement) {
    userEmailElement.textContent = session.email;
  }
}

function initializeLogout() {
  const logoutButton = getElement("logout-button");

  if (!logoutButton) {
    console.warn(
      'No se encontró el botón con id="logout-button".'
    );

    return;
  }

  logoutButton.addEventListener("click", () => {
    removeSession();
    window.location.replace("./index.html");
  });
}

function getInitials(name = "") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "DN";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function formatRelativeDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  const now = new Date();
  const differenceInMilliseconds =
    now.getTime() - date.getTime();

  const differenceInMinutes = Math.floor(
    differenceInMilliseconds / 60000
  );

  if (differenceInMinutes < 1) {
    return "Hace un momento";
  }

  if (differenceInMinutes < 60) {
    return `Hace ${differenceInMinutes} min`;
  }

  const differenceInHours = Math.floor(
    differenceInMinutes / 60
  );

  if (differenceInHours < 24) {
    return differenceInHours === 1
      ? "Hace 1 hora"
      : `Hace ${differenceInHours} horas`;
  }

  const differenceInDays = Math.floor(
    differenceInHours / 24
  );

  if (differenceInDays === 1) {
    return "Ayer";
  }

  if (differenceInDays < 7) {
    return `Hace ${differenceInDays} días`;
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

function updateElementText(id, value) {
  const element = getElement(id);

  if (element) {
    element.textContent = String(value);
  }
}

function getCountDescription(count, singular, plural) {
  if (count === 0) {
    return "Sin contactos";
  }

  if (count === 1) {
    return `1 ${singular}`;
  }

  return `${count} ${plural}`;
}

function renderSummary(summary) {
  updateElementText(
    "new-contacts-count",
    summary.new
  );

  updateElementText(
    "pending-contacts-count",
    summary.pending
  );

  updateElementText(
    "answered-contacts-count",
    summary.answered
  );

  updateElementText(
    "total-contacts-count",
    summary.total
  );

  updateElementText(
    "sidebar-new-contacts-count",
    summary.new
  );

  updateElementText(
    "new-contacts-meta",
    getCountDescription(
      summary.new,
      "contacto sin revisar",
      "contactos sin revisar"
    )
  );

  updateElementText(
    "pending-contacts-meta",
    getCountDescription(
      summary.pending,
      "contacto pendiente",
      "contactos pendientes"
    )
  );

  updateElementText(
    "answered-contacts-meta",
    getCountDescription(
      summary.answered,
      "contacto respondido",
      "contactos respondidos"
    )
  );

  updateElementText(
    "total-contacts-meta",
    getCountDescription(
      summary.total,
      "contacto registrado",
      "contactos registrados"
    )
  );
}

function createContactElement(contact) {
  const status =
    STATUS_CONFIG[contact.status] ??
    STATUS_CONFIG.NEW;

  const contactLink = document.createElement("a");

  contactLink.className = "recent-contact";
  contactLink.href =
    `#contact-${encodeURIComponent(contact.contactId)}`;

  const avatar = document.createElement("span");

  avatar.className = "avatar avatar--small";
  avatar.textContent = getInitials(contact.name);
  avatar.setAttribute("aria-hidden", "true");

  const identity = document.createElement("span");

  identity.className = "recent-contact__identity";

  const name = document.createElement("strong");

  name.className = "recent-contact__name";
  name.textContent = contact.name || "Contacto sin nombre";

  const email = document.createElement("span");

  email.className = "recent-contact__email";
  email.textContent = contact.email || "Correo no disponible";

  identity.append(name, email);

  const subject = document.createElement("span");

  subject.className = "recent-contact__subject";
  subject.textContent =
    contact.subject || "Sin asunto";

  const date = document.createElement("span");

  date.className = "recent-contact__date";
  date.textContent = formatRelativeDate(contact.createdAt);

  const badge = document.createElement("span");

  badge.className = `badge ${status.badgeClass}`;
  badge.textContent = status.label;

  const arrow = document.createElement("span");

  arrow.className = "recent-contact__arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";

  contactLink.append(
    avatar,
    identity,
    subject,
    date,
    badge,
    arrow
  );

  return contactLink;
}

function renderRecentContacts(contacts) {
  const contactsList =
    getElement("recent-contacts-list");

  if (!contactsList) {
    return;
  }

  contactsList.replaceChildren();

  if (!Array.isArray(contacts) || contacts.length === 0) {
    const emptyState = document.createElement("div");

    emptyState.className =
      "dashboard-state dashboard-state--empty";

    const title = document.createElement("strong");

    title.textContent = "No hay contactos registrados";

    const description = document.createElement("p");

    description.textContent =
      "Los nuevos mensajes recibidos aparecerán aquí.";

    emptyState.append(title, description);
    contactsList.append(emptyState);

    return;
  }

  const fragment = document.createDocumentFragment();

  contacts.forEach((contact) => {
    fragment.append(createContactElement(contact));
  });

  contactsList.append(fragment);
}

function renderDashboardError() {
  const contactsList =
    getElement("recent-contacts-list");

  if (contactsList) {
    contactsList.innerHTML = `
      <div class="dashboard-state dashboard-state--error">
        <strong>No fue posible cargar el dashboard</strong>

        <p>
          Revisa la conexión e intenta recargar la página.
        </p>

        <button
          class="button button--secondary"
          id="retry-dashboard-button"
          type="button"
        >
          Intentar nuevamente
        </button>
      </div>
    `;

    const retryButton =
      getElement("retry-dashboard-button");

    retryButton?.addEventListener(
      "click",
      loadDashboard
    );
  }

  [
    "new-contacts-count",
    "pending-contacts-count",
    "answered-contacts-count",
    "total-contacts-count"
  ].forEach((id) => {
    updateElementText(id, "—");
  });

  [
    "new-contacts-meta",
    "pending-contacts-meta",
    "answered-contacts-meta",
    "total-contacts-meta"
  ].forEach((id) => {
    updateElementText(id, "Información no disponible");
  });
}

async function loadDashboard() {
  const contactsList =
    getElement("recent-contacts-list");

  if (contactsList) {
    contactsList.innerHTML = `
      <div class="dashboard-state" id="dashboard-loading">
        <span
          class="dashboard-spinner"
          aria-hidden="true"
        ></span>

        <p>Cargando contactos recientes...</p>
      </div>
    `;
  }

  try {
    const dashboardData =
      await getDashboardData();

    renderSummary(dashboardData.summary);

    renderRecentContacts(
      dashboardData.recentContacts
    );
  } catch (error) {
    console.error(
      "Error al cargar el dashboard:",
      error
    );

    renderDashboardError();
  }
}

async function initializeDashboard() {
  const session = protectDashboard();

  if (!session) {
    return;
  }

  showAuthenticatedUser(session);
  initializeLogout();

  await loadDashboard();
}

document.addEventListener(
  "DOMContentLoaded",
  initializeDashboard
);