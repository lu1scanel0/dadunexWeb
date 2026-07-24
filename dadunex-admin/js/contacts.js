import {
  getSession,
  removeSession
} from "./auth.js";

import {
  getContacts
} from "./api.js";

const PAGE_SIZE = 5;

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

const state = {
  contacts: [],
  filteredContacts: [],
  searchTerm: "",
  status: "ALL",
  sort: "DATE_DESC",
  currentPage: 1
};

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
  const userEmailElement =
    document.querySelector("[data-user-email]");

  if (userEmailElement) {
    userEmailElement.textContent = session.email;
  }
}

function initializeLogout() {
  const logoutButton =
    getElement("logout-button");

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

function formatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function normalizeText(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getNewContactsCount() {
  return state.contacts.filter(
    (contact) => contact.status === "NEW"
  ).length;
}

function updateSidebarCounter() {
  const counter =
    getElement("sidebar-new-contacts-count");

  if (counter) {
    counter.textContent =
      String(getNewContactsCount());
  }
}

function getFilteredContacts() {
  const normalizedSearch =
    normalizeText(state.searchTerm);

  const filtered = state.contacts.filter((contact) => {
    const matchesStatus =
      state.status === "ALL" ||
      contact.status === state.status;

    const searchableText = normalizeText([
      contact.name,
      contact.email,
      contact.phone,
      contact.subject
    ].join(" "));

    const matchesSearch =
      !normalizedSearch ||
      searchableText.includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  return sortContacts(filtered);
}

function sortContacts(contacts) {
  return [...contacts].sort(
    (firstContact, secondContact) => {
      switch (state.sort) {
        case "DATE_ASC":
          return (
            new Date(firstContact.createdAt).getTime() -
            new Date(secondContact.createdAt).getTime()
          );

        case "NAME_ASC":
          return (firstContact.name || "")
            .localeCompare(
              secondContact.name || "",
              "es",
              { sensitivity: "base" }
            );

        case "NAME_DESC":
          return (secondContact.name || "")
            .localeCompare(
              firstContact.name || "",
              "es",
              { sensitivity: "base" }
            );

        case "DATE_DESC":
        default:
          return (
            new Date(secondContact.createdAt).getTime() -
            new Date(firstContact.createdAt).getTime()
          );
      }
    }
  );
}

function getTotalPages() {
  return Math.max(
    1,
    Math.ceil(
      state.filteredContacts.length / PAGE_SIZE
    )
  );
}

function getPaginatedContacts() {
  const startIndex =
    (state.currentPage - 1) * PAGE_SIZE;

  const endIndex =
    startIndex + PAGE_SIZE;

  return state.filteredContacts.slice(
    startIndex,
    endIndex
  );
}

function createStatusBadge(statusValue) {
  const status =
    STATUS_CONFIG[statusValue] ??
    STATUS_CONFIG.NEW;

  const badge = document.createElement("span");

  badge.className =
    `badge ${status.badgeClass}`;

  badge.textContent = status.label;

  return badge;
}

function createContactRow(contact) {
  const row = document.createElement("tr");

  const statusCell =
    document.createElement("td");

  statusCell.append(
    createStatusBadge(contact.status)
  );

  const identityCell =
    document.createElement("td");

  const identityWrapper =
    document.createElement("div");

  identityWrapper.className = "contact-cell";

  const avatar =
    document.createElement("span");

  avatar.className =
    "avatar avatar--small contact-cell__avatar";

  avatar.textContent =
    getInitials(contact.name);

  avatar.setAttribute(
    "aria-hidden",
    "true"
  );

  const identity =
    document.createElement("div");

  identity.className =
    "contact-cell__identity";

  const name =
    document.createElement("strong");

  name.className =
    "contact-cell__name";

  name.textContent =
    contact.name || "Contacto sin nombre";

  const email =
    document.createElement("span");

  email.className =
    "contact-cell__email";

  email.textContent =
    contact.email || "Correo no disponible";

  identity.append(name, email);
  identityWrapper.append(avatar, identity);
  identityCell.append(identityWrapper);

  const phoneCell =
    document.createElement("td");

  phoneCell.className = "contact-phone";

  phoneCell.textContent =
    contact.phone || "No informado";

  const subjectCell =
    document.createElement("td");

  subjectCell.className = "contact-subject";

  subjectCell.textContent =
    contact.subject || "Sin asunto";

  const dateCell =
    document.createElement("td");

  dateCell.className = "contact-date";

  dateCell.textContent =
    formatDate(contact.createdAt);

  const actionCell =
    document.createElement("td");

  const actionLink =
    document.createElement("a");

  actionLink.className = "contact-action";

  actionLink.href =
    `./contact.html?id=${encodeURIComponent(
      contact.contactId
    )}`;

  actionLink.innerHTML = `
    <span>Ver</span>
    <span aria-hidden="true">→</span>
  `;

  actionCell.append(actionLink);

  row.append(
    statusCell,
    identityCell,
    phoneCell,
    subjectCell,
    dateCell,
    actionCell
  );

  return row;
}

function createContactsTable(contacts) {
  const table =
    document.createElement("table");

  table.className = "contacts-table";

  table.innerHTML = `
    <thead>
      <tr>
        <th scope="col">Estado</th>
        <th scope="col">Contacto</th>
        <th scope="col">Teléfono</th>
        <th scope="col">Asunto</th>
        <th scope="col">Fecha</th>
        <th scope="col">Acción</th>
      </tr>
    </thead>
  `;

  const body =
    document.createElement("tbody");

  contacts.forEach((contact) => {
    body.append(createContactRow(contact));
  });

  table.append(body);

  return table;
}

function renderEmptyState() {
  const wrapper =
    getElement("contacts-table-wrapper");

  if (!wrapper) {
    return;
  }

  const emptyState =
    document.createElement("div");

  emptyState.className =
    "contacts-empty-state";

  const title =
    document.createElement("strong");

  title.textContent =
    "No se encontraron contactos";

  const description =
    document.createElement("p");

  description.textContent =
    state.searchTerm || state.status !== "ALL"
      ? "Prueba cambiando la búsqueda o los filtros."
      : "Los nuevos mensajes aparecerán aquí.";

  emptyState.append(title, description);

  wrapper.replaceChildren(emptyState);
}

function renderTable() {
  const wrapper =
    getElement("contacts-table-wrapper");

  if (!wrapper) {
    return;
  }

  const pageContacts =
    getPaginatedContacts();

  if (pageContacts.length === 0) {
    renderEmptyState();
    return;
  }

  wrapper.replaceChildren(
    createContactsTable(pageContacts)
  );
}

function updateResultCount() {
  const resultCount =
    getElement("contacts-result-count");

  if (!resultCount) {
    return;
  }

  const count =
    state.filteredContacts.length;

  if (count === 0) {
    resultCount.textContent =
      "No hay contactos para mostrar";

    return;
  }

  resultCount.textContent =
    count === 1
      ? "1 contacto encontrado"
      : `${count} contactos encontrados`;
}

function updatePagination() {
  const pagination =
    getElement("contacts-pagination");

  const summary =
    getElement("pagination-summary");

  const previousButton =
    getElement("previous-page-button");

  const nextButton =
    getElement("next-page-button");

  if (
    !pagination ||
    !summary ||
    !previousButton ||
    !nextButton
  ) {
    return;
  }

  const totalPages =
    getTotalPages();

  summary.textContent =
    `Página ${state.currentPage} de ${totalPages}`;

  previousButton.disabled =
    state.currentPage <= 1;

  nextButton.disabled =
    state.currentPage >= totalPages;

  pagination.hidden =
    state.filteredContacts.length === 0;
}

function updateActiveSidebarFilter() {
  const buttons =
    document.querySelectorAll(
      "[data-status-filter]"
    );

  buttons.forEach((button) => {
    const isActive =
      button.dataset.statusFilter ===
      state.status;

    button.classList.toggle(
      "is-active",
      isActive
    );
  });
}

function renderContacts() {
  state.filteredContacts =
    getFilteredContacts();

  const totalPages =
    getTotalPages();

  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }

  renderTable();
  updateResultCount();
  updatePagination();
  updateActiveSidebarFilter();
}

function handleSearch(event) {
  state.searchTerm =
    event.target.value.trim();

  state.currentPage = 1;

  renderContacts();
}

function handleStatusChange(event) {
  state.status =
    event.target.value;

  state.currentPage = 1;

  renderContacts();
}

function handleSortChange(event) {
  state.sort =
    event.target.value;

  state.currentPage = 1;

  renderContacts();
}

function handleSidebarFilter(event) {
  const button =
    event.currentTarget;

  const status =
    button.dataset.statusFilter;

  state.status = status;
  state.currentPage = 1;

  const statusFilter =
    getElement("status-filter");

  if (statusFilter) {
    statusFilter.value = status;
  }

  renderContacts();
}

function initializeFilters() {
  const searchInput =
    getElement("contacts-search");

  const statusFilter =
    getElement("status-filter");

  const sortSelect =
    getElement("contacts-sort");

  searchInput?.addEventListener(
    "input",
    handleSearch
  );

  statusFilter?.addEventListener(
    "change",
    handleStatusChange
  );

  sortSelect?.addEventListener(
    "change",
    handleSortChange
  );

  document
    .querySelectorAll("[data-status-filter]")
    .forEach((button) => {
      button.addEventListener(
        "click",
        handleSidebarFilter
      );
    });
}

function initializePagination() {
  const previousButton =
    getElement("previous-page-button");

  const nextButton =
    getElement("next-page-button");

  previousButton?.addEventListener(
    "click",
    () => {
      if (state.currentPage > 1) {
        state.currentPage -= 1;
        renderContacts();
      }
    }
  );

  nextButton?.addEventListener(
    "click",
    () => {
      const totalPages =
        getTotalPages();

      if (state.currentPage < totalPages) {
        state.currentPage += 1;
        renderContacts();
      }
    }
  );
}

function applyStatusFromUrl() {
  const parameters =
    new URLSearchParams(
      window.location.search
    );

  const status =
    parameters.get("status");

  const validStatuses = [
    "ALL",
    "NEW",
    "PENDING",
    "ANSWERED"
  ];

  if (
    status &&
    validStatuses.includes(status)
  ) {
    state.status = status;

    const statusFilter =
      getElement("status-filter");

    if (statusFilter) {
      statusFilter.value = status;
    }
  }
}

function renderError() {
  const wrapper =
    getElement("contacts-table-wrapper");

  const resultCount =
    getElement("contacts-result-count");

  if (resultCount) {
    resultCount.textContent =
      "No fue posible cargar los contactos";
  }

  if (!wrapper) {
    return;
  }

  wrapper.innerHTML = `
    <div class="dashboard-state dashboard-state--error">
      <strong>
        No fue posible cargar los contactos
      </strong>

      <p>
        Revisa la conexión e intenta nuevamente.
      </p>

      <button
        class="button button--secondary"
        id="retry-contacts-button"
        type="button"
      >
        Intentar nuevamente
      </button>
    </div>
  `;

  getElement("retry-contacts-button")
    ?.addEventListener(
      "click",
      loadContacts
    );
}

async function loadContacts() {
  const wrapper =
    getElement("contacts-table-wrapper");

  const resultCount =
    getElement("contacts-result-count");

  if (resultCount) {
    resultCount.textContent =
      "Cargando contactos...";
  }

  if (wrapper) {
    wrapper.innerHTML = `
      <div class="dashboard-state">
        <span
          class="dashboard-spinner"
          aria-hidden="true"
        ></span>

        <p>Cargando contactos...</p>
      </div>
    `;
  }

  try {
    state.contacts = await getContacts();

    updateSidebarCounter();
    renderContacts();
  } catch (error) {
    console.error(
      "Error al cargar los contactos:",
      error
    );

    renderError();
  }
}

async function initializeContactsPage() {
  const session = protectPage();

  if (!session) {
    return;
  }

  showAuthenticatedUser(session);
  initializeLogout();
  initializeFilters();
  initializePagination();
  applyStatusFromUrl();

  await loadContacts();
}

document.addEventListener(
  "DOMContentLoaded",
  initializeContactsPage
);