import {
  getSession,
  removeSession
} from "./auth.js";

const API_BASE_URL =
  window.CONFIG?.API_BASE_URL;

function redirectToLogin() {
  removeSession();
  window.location.replace("./index.html");
}

async function apiRequest(
  endpoint,
  options = {}
) {
  if (!API_BASE_URL) {
    throw new Error(
      "La URL de la API no está configurada."
    );
  }

  const session = getSession();

  if (!session?.idToken) {
    redirectToLogin();

    throw new Error(
      "No existe una sesión autenticada."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          `Bearer ${session.idToken}`,
        ...(options.headers || {})
      }
    }
  );

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    redirectToLogin();

    throw new Error(
      "La sesión ha expirado o no está autorizada."
    );
  }

  if (!response.ok) {
    let apiMessage = "";

    try {
      const errorData =
        await response.json();

      apiMessage =
        errorData?.message || "";
    } catch {
      // La respuesta no contenía JSON.
    }

    throw new Error(
      apiMessage ||
      `La API respondió con el estado ${response.status}.`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function calculateSummary(contacts) {
  return contacts.reduce(
    (summary, contact) => {
      summary.total += 1;

      switch (contact.status) {
        case "NEW":
          summary.new += 1;
          break;

        case "PENDING":
          summary.pending += 1;
          break;

        case "ANSWERED":
          summary.answered += 1;
          break;

        default:
          break;
      }

      return summary;
    },
    {
      total: 0,
      new: 0,
      pending: 0,
      answered: 0
    }
  );
}

function getContactsArray(data) {
  return Array.isArray(data?.contacts)
    ? data.contacts
    : [];
}

export async function getDashboardData() {
  const data =
    await apiRequest("/contacts");

  const contacts =
    getContactsArray(data);

  return {
    summary:
      calculateSummary(contacts),

    recentContacts:
      contacts.slice(0, 5)
  };
}

export async function getContacts() {
  const data =
    await apiRequest("/contacts");

  return getContactsArray(data);
}

export async function getContactById(
  contactId
) {
  if (!contactId) {
    throw new Error(
      "El identificador del contacto es obligatorio."
    );
  }

  const encodedContactId =
    encodeURIComponent(contactId);

  const data =
    await apiRequest(
      `/contacts/${encodedContactId}`
    );

  return data?.contact || null;
}

export async function updateContact(
  contactId,
  changes
) {
  if (!contactId) {
    throw new Error(
      "El identificador del contacto es obligatorio."
    );
  }

  const encodedContactId =
    encodeURIComponent(contactId);

  const data =
    await apiRequest(
      `/contacts/${encodedContactId}`,
      {
        method: "PATCH",
        body: JSON.stringify(changes)
      }
    );

  return data?.contact || null;
}