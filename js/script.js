document.addEventListener("DOMContentLoaded", () => {
    // Reemplaza estos valores con los de tu cuenta EmailJS:
    const publicKey = '5Bqn1GVG7MA5L7zA2';  // Tu PUBLIC KEY
    const serviceId = 'service_p45giml';    // Tu SERVICE ID
    const templateId = 'template_erpj3p9';  // Tu TEMPLATE ID
  
    // Inicializa EmailJS con tu PUBLIC KEY
    emailjs.init(publicKey);
  
    // Referencia al formulario y botón
    const form = document.getElementById("contactForm");
    const submitButton = document.getElementById("submitButton");
  
    // Validación del formulario
    const validateForm = () => {
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const subject = document.getElementById("subject").value.trim();
      const message = document.getElementById("message").value.trim();
  
      // 1) Nombre al menos 4 letras
      const nameValid = /^[A-Za-záéíóúÁÉÍÓÚ ]{4,}$/.test(name);
  
      // 2) Email con un patrón básico
      const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
      // 3) Teléfono => +569XXXXXXXX o 9XXXXXXXX
      // Permite opcionalmente +56 antes de un 9 + 8 dígitos
      const phoneValid = /^(?:\+56)?9[0-9]{8}$/.test(phone);
  
      // 4) Asunto no vacío
      const subjectValid = subject.length > 0;
  
      // 5) Mensaje entre 10 y 2000 caracteres
      const messageValid = (message.length >= 4 && message.length <= 2000);
  
      // Habilita / deshabilita el botón
      submitButton.disabled = !(nameValid && emailValid && phoneValid && subjectValid && messageValid);
    };
  
    // Escucha cambios para validar en tiempo real
    form.addEventListener("input", validateForm);
  
    // Envío del formulario
    form.addEventListener("submit", (e) => {
      e.preventDefault();
  
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
  
      // Construye templateParams
      const templateParams = {
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        message: document.getElementById("message").value.trim(),
      };
  
      // Envía el correo con emailjs.send(...)
      emailjs.send(serviceId, templateId, templateParams)
        .then((result) => {
          // Mensaje de éxito
          Swal.fire("¡Mensaje enviado!", "Te contactaremos a la brevedad!", "success");
          
          // Limpia el formulario
          form.reset();
        })
        .catch((error) => {
          // Mensaje de error
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Algo salió mal, inténtalo nuevamente.",
          });
          console.error("Error al enviar el correo:", error);
        })
        .finally(() => {
          // Restaura el botón
          submitButton.disabled = false;
          submitButton.textContent = "Enviar";
        });
    });
  
    // Efecto scroll para hero
    document.addEventListener("scroll", () => {
      const hero = document.querySelector(".hero");
      if (window.scrollY > 50) {
        hero.classList.add("scrolled");
      } else {
        hero.classList.remove("scrolled");
      }
    });
  });
  