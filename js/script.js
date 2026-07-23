document.addEventListener("DOMContentLoaded", () => { 
// URL de endpoint de la API. 
const API_URL = "https://02wbpx6ww4.execute-api.us-east-1.amazonaws.com/default/contact";

    const form = document.getElementById("contactForm");
    const submitButton = document.getElementById("submitButton");
    const submitButtonText = document.getElementById("submitButtonText");
    const submitSpinner = document.getElementById("submitSpinner");
    const messageCounter = document.getElementById("messageCounter");
    const formStatus = document.getElementById("formStatus");

    if (
        !form ||
        !submitButton ||
        !submitButtonText ||
        !submitSpinner ||
        !messageCounter
    ) {
        console.error("No se encontraron los elementos del formulario.");
        return;
    }

    const fields = {
        name: document.getElementById("name"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        subject: document.getElementById("subject"),
        message: document.getElementById("message")
    };

    let isSubmitting = false;

    // Reglas de validación de cada campo.
    const validators = {
        name: (value) =>
            /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{4,}$/.test(value.trim()),

        email: (value) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()),

        phone: (value) =>
            /^\d{9}$/.test(value.trim()),

        subject: (value) =>
            value.trim().length >= 2,

        message: (value) =>
            value.trim().length >= 4
    };

    // Obtiene los datos del formulario.
    function getFormData() {
        return {
            name: fields.name.value.trim(),
            email: fields.email.value.trim(),
            phone: fields.phone.value.trim(),
            subject: fields.subject.value.trim(),
            message: fields.message.value.trim()
        };
    }

    // Actualiza el contador de caracteres.
    function updateMessageCounter() {
        const count = fields.message.value.length;
        messageCounter.textContent =
            `${count} ${count === 1 ? "carácter" : "caracteres"}`;
    }

    function setFieldState(fieldName, forceFeedback = false) {
        const field = fields[fieldName];
        const value = field.value.trim();
        const valid = validators[fieldName](field.value);

        field.classList.remove("is-valid", "is-invalid");

        if (forceFeedback || value.length > 0) {
            field.classList.add(valid ? "is-valid" : "is-invalid");
        }

        return valid;
    }

    function validateForm(forceFeedback = false) {
        const valid = Object.keys(fields)
            .map((fieldName) => setFieldState(fieldName, forceFeedback))
            .every(Boolean);

        if (!isSubmitting) {
            submitButton.disabled = !valid;
        }

        return valid;
    }

    function setSubmitting(submitting) {
        isSubmitting = submitting;

        submitSpinner.classList.toggle("d-none", !submitting);
        submitButtonText.textContent =
            submitting ? "Enviando..." : "Enviar mensaje";

        submitButton.disabled = submitting || !validateForm(false);
        form.setAttribute("aria-busy", String(submitting));
    }

    function announce(message) {
        if (formStatus) {
            formStatus.textContent = message;
        }
    }

    Object.entries(fields).forEach(([fieldName, field]) => {
        field.addEventListener("input", () => {
            if (fieldName === "phone") {
                field.value = field.value.replace(/\D/g, "").slice(0, 9);
            }

            if (fieldName === "message") {
                updateMessageCounter();
            }

            setFieldState(fieldName, false);
            validateForm(false);
        });

        field.addEventListener("blur", () => {
            setFieldState(fieldName, true);
        });
    });

    // Evento principal: envío del formulario.
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        if (!validateForm(true)) {
            const firstInvalid = Object.values(fields)
                .find((field) => field.classList.contains("is-invalid"));

            firstInvalid?.focus();
            announce("Revisa los campos marcados.");

            await Swal.fire({
                icon: "warning",
                title: "Revisa los datos",
                text: "Completa correctamente los campos marcados.",
                confirmButtonColor: "#198754"
            });

            return;
        }

        setSubmitting(true);
        announce("Enviando mensaje.");

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(getFormData())
            });

            let result = {};

            try {
                result = await response.json();
            } catch {
                result = {};
            }

            if (!response.ok) {
                throw new Error(
                    result.message || "No fue posible enviar el mensaje."
                );
            }

            announce("Mensaje enviado correctamente.");

            await Swal.fire({
                icon: "success",
                title: "¡Mensaje enviado!",
                text: result.message || "Te contactaremos a la brevedad.",
                confirmButtonColor: "#198754"
            });

            form.reset();
            updateMessageCounter();

            Object.values(fields).forEach((field) => {
                field.classList.remove("is-valid", "is-invalid");
            });

            fields.name.focus({ preventScroll: true });
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
            announce("No fue posible enviar el mensaje.");

            await Swal.fire({
                icon: "error",
                title: "No fue posible enviar el mensaje",
                text:
                    error.message ||
                    "Ocurrió un problema. Inténtalo nuevamente.",
                confirmButtonColor: "#198754"
            });
        } finally {
            setSubmitting(false);
        }
    });

    // Animación de aparición de las secciones.
    const revealSections = document.querySelectorAll(".reveal-section");

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        currentObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -50px 0px"
            }
        );

        revealSections.forEach((section) => observer.observe(section));
    } else {
        revealSections.forEach((section) => {
            section.classList.add("is-visible");
        });
    }

    const hero = document.querySelector(".hero");

    document.addEventListener(
        "scroll",
        () => {
            hero?.classList.toggle("scrolled", window.scrollY > 50);
        },
        { passive: true }
    );

    updateMessageCounter();
    validateForm(false);

    setTimeout(() => validateForm(false), 300);
    setTimeout(() => validateForm(false), 1000);
    window.addEventListener("pageshow", () => validateForm(false));

});