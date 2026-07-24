const API_BASE_URL = CONFIG.API_BASE_URL;

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}`);
    }

    return response.json();
}

function calculateSummary(contacts) {
    return contacts.reduce(
        (summary, contact) => {
            summary.total++;

            switch (contact.status) {
                case "NEW":
                    summary.new++;
                    break;

                case "PENDING":
                    summary.pending++;
                    break;

                case "ANSWERED":
                    summary.answered++;
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

export async function getDashboardData() {
    const data = await apiRequest("/contacts");

    return {
        summary: calculateSummary(data.contacts),
        recentContacts: data.contacts.slice(0, 5)
    };
}

export async function getContacts() {
    const data = await apiRequest("/contacts");
    return data.contacts;
}

export async function getContactById(contactId) {
    const data = await apiRequest(`/contacts/${contactId}`);
    return data.contact;
}

export async function updateContact(contactId, changes) {
    const data = await apiRequest(`/contacts/${contactId}`, {
        method: "PATCH",
        body: JSON.stringify(changes)
    });

    return data.contact;
}