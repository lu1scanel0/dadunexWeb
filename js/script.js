document.addEventListener("DOMContentLoaded", () => {
    emailjs.init("dadunexWeb"); // Reemplaza con tu User ID de EmailJS

    const form = document.getElementById("contactForm");
    const submitButton = document.getElementById("submitButton");

    const validateForm = () => {
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();

        const nameValid = /^[A-Za-záéíóúÁÉÍÓÚ ]{6,}$/.test(name);
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const phoneValid = /^(?:\+56|9)[0-9]{8}$/.test(phone);
        const messageValid = message.length >= 10;

        submitButton.disabled =
            !(nameValid && emailValid && phoneValid && subject && messageValid);
    };

    form.addEventListener("input", validateForm);

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        // Configura los datos a enviar
        const templateParams = {
            name: formData.get("name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            subject: formData.get("subject"),
            message: formData.get("message"),
        };

        // Envía el correo usando EmailJS
        emailjs.send("dadunexWeb", "DadunexTemplate", templateParams)
            .then(() => {
                alert("El formulario se ha enviado correctamente.");
                form.reset();
            })
            .catch((error) => {
                console.error("Error al enviar el correo:", error);
                alert("Hubo un error al enviar el formulario.");
            });
    });

    document.addEventListener("scroll", () => {
        const hero = document.querySelector(".hero");
        if (window.scrollY > 50) {
            hero.classList.add("scrolled");
        } else {
            hero.classList.remove("scrolled");
        }
    });
});
