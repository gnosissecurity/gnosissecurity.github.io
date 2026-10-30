(() => {
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector("[data-menu]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const modal = document.querySelector("[data-contact-modal]");
  const form = document.querySelector("#contact-form");
  const formStatus = document.querySelector("#form-status");
  const interestField = document.querySelector("#contact-interest");
  const openButtons = document.querySelectorAll("[data-open-contact]");
  const closeButtons = document.querySelectorAll("[data-close-contact]");
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([data-open-contact])');
  const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastFocusedElement = null;
  const legacyAnchors = {
    "#desafio": "#servicos",
    "#quem-somos": "#sobre",
    "#confianca": "#diferenciais",
    "#abordagem": "#sobre",
    "#ajuda": "#metodologia",
  };

  const setMenuState = (isOpen) => {
    if (!menu || !menuToggle) return;
    menu.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  };

  const closeMenu = () => setMenuState(false);

  const scrollToTarget = (target) => {
    if (!target) return;
    target.scrollIntoView({
      behavior: motionReduced ? "auto" : "smooth",
      block: "start",
    });
  };

  if (legacyAnchors[window.location.hash]) {
    const currentHash = legacyAnchors[window.location.hash];
    const currentTarget = document.querySelector(currentHash);
    history.replaceState(null, "", currentHash);
    window.requestAnimationFrame(() => scrollToTarget(currentTarget));
  }

  const focusableElements = () => {
    if (!modal) return [];
    return Array.from(
      modal.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
      )
    ).filter((element) => element.offsetParent !== null);
  };

  const openContactModal = (event) => {
    event?.preventDefault();
    if (!modal) return;

    const requestedInterest = event?.currentTarget?.dataset?.interest;
    if (requestedInterest && interestField) {
      interestField.value = requestedInterest;
    }

    lastFocusedElement = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    closeMenu();

    window.requestAnimationFrame(() => {
      document.querySelector("#contact-name")?.focus();
    });
  };

  const closeContactModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.classList.remove("is-error");
    }
    lastFocusedElement?.focus?.();
  };

  const buildEmailBody = (data) => [
    "Nova solicitação pelo site da GNOSIS Security",
    "",
    `Nome: ${data.get("name") || "-"}`,
    `Empresa: ${data.get("company") || "-"}`,
    `E-mail: ${data.get("email") || "-"}`,
    `Telefone / WhatsApp: ${data.get("phone") || "-"}`,
    `Interesse: ${data.get("interest") || "-"}`,
    "",
    "Mensagem:",
    data.get("message") || "-",
  ].join("\n");

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  });

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", hash);
      closeMenu();
      scrollToTarget(target);
    });
  });

  openButtons.forEach((button) => button.addEventListener("click", openContactModal));
  closeButtons.forEach((button) => button.addEventListener("click", closeContactModal));

  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeContactModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modal?.classList.contains("is-open")) {
        closeContactModal();
      } else {
        closeMenu();
      }
    }

    if (event.key === "Tab" && modal?.classList.contains("is-open")) {
      const elements = focusableElements();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  form?.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      field.removeAttribute("aria-invalid");
      if (formStatus) {
        formStatus.textContent = "";
        formStatus.classList.remove("is-error");
      }
    });
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.querySelectorAll(":invalid").forEach((field) => field.setAttribute("aria-invalid", "true"));
      if (formStatus) {
        formStatus.textContent = "Revise os campos obrigatórios antes de continuar.";
        formStatus.classList.add("is-error");
      }
      form.querySelector(":invalid")?.focus();
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const subject = encodeURIComponent(`Contato pelo site — ${data.get("interest")}`);
    const body = encodeURIComponent(buildEmailBody(data));

    if (formStatus) {
      formStatus.textContent = "Abrindo seu aplicativo de e-mail. Revise a mensagem e conclua o envio por lá.";
      formStatus.classList.remove("is-error");
    }

    window.setTimeout(() => {
      window.location.href = `mailto:comercial@gnosissecurity.com.br?subject=${subject}&body=${body}`;
    }, 250);
  });

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".main-nav a[href^='#']"));
  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${visible.target.id}`) {
            link.setAttribute("aria-current", "true");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.2, 0.5] }
    );
    sections.forEach((section) => observer.observe(section));
  }
})();
