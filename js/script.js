document.addEventListener("DOMContentLoaded", () => {

    //  Endpoint de producción del formulario Dadunex
    const API_URL =
"https://02wbpx6ww4.execute-api.us-east-1.amazonaws.com/default/contact";

    const form = document.getElementById("contactForm");
    const submitButton = document.getElementById("submitButton");

    if (!form || !submitButton) {
        console.error("No se encontró el formulario.");
        return;
    }

    /**
     * Obtiene los datos del formulario
     */
    function getFormData() {
        return {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            subject: document.getElementById("subject").value.trim(),
            message: document.getElementById("message").value.trim(),
            website: document.getElementById("website")?.value.trim() || ""
        };
    }

    /**
     * Valida el formulario
     */
    function validateForm() {

        const data = getFormData();

        const nameValid =
            /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{4,}$/.test(data.name);

        const emailValid =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);

        const phone =
            data.phone.replace(/[\s()-]/g, "");

        const phoneValid =
            /^(?:\+56)?9\d{8}$/.test(phone);

        const subjectValid =
            data.subject.length > 0 &&
            data.subject.length <= 150;

        const messageValid =
            data.message.length >= 4 &&
            data.message.length <= 2000;

        submitButton.disabled = !(
            nameValid &&
            emailValid &&
            phoneValid &&
            subjectValid &&
            messageValid
        );

        return (
          nameValid &&
          emailValid &&
          phoneValid &&
          subjectValid &&
          messageValid
        );
    }

    /**
     * Validación en tiempo real
     */
    form.addEventListener("input", validateForm);
    form.addEventListener("change", validateForm);
    form.addEventListener("blur", validateForm, true);

    // Revisa campos completados automáticamente por el navegador
    setTimeout(validateForm, 300);
    setTimeout(validateForm, 1000);

    window.addEventListener("pageshow", validateForm);

    /**
     * Envío del formulario
     */
    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!validateForm()) {

            Swal.fire({
                icon: "warning",
                title: "Datos incompletos",
                text: "Completa correctamente todos los campos."
            });

            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = "Enviando...";

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(getFormData())

            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    "No fue posible enviar el mensaje."
                );
            }

            await Swal.fire({

                icon: "success",
                title: "¡Mensaje enviado!",
                text:
                    "Te contactaremos a la brevedad.",

                confirmButtonColor: "#27ae60"

            });

            form.reset();

            validateForm();

        } catch (error) {

            console.error(error);

            Swal.fire({

                icon: "error",
                title: "Error",

                text:
                    error.message ||
                    "No fue posible enviar el mensaje."

            });

        } finally {

            submitButton.disabled = false;
            submitButton.textContent = "Enviar mensaje";

        }

    });

    /**
     * Efecto Hero
     */
    document.addEventListener("scroll", () => {

        const hero = document.querySelector(".hero");

        if (!hero) return;

        if (window.scrollY > 50)
            hero.classList.add("scrolled");
        else
            hero.classList.remove("scrolled");

    });

    // Validación inicial
    validateForm();

});