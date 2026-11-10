(() => {
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector("[data-menu]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const modal = document.querySelector("[data-contact-modal]");
  const form = document.querySelector("#contact-form");
  const formStatus = document.querySelector("#form-status");
  const mailFallback = document.querySelector("#mail-fallback");
  const copyEmailButton = document.querySelector("[data-copy-email]");
  const contactEmail = "comercial@gnosissecurity.com.br";
  const interestField = document.querySelector("#contact-interest");
  const openButtons = document.querySelectorAll("[data-open-contact]");
  const closeButtons = document.querySelectorAll("[data-close-contact]");
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([data-open-contact])');
  const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastFocusedElement = null;
  const legacyAnchors = {
    "#desafio": "#servicos",
    "#quem-somos": "#sobre",
    "#confianca": "#sobre",
    "#diferenciais": "#sobre",
    "#certificacoes": "#sobre",
    "#entregas": "#metodologia",
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

  // Rola até o título da seção (não até a borda dela), descontando o cabeçalho fixo,
  // para o conteúdo aparecer logo abaixo do menu em vez de cair no meio da tela.
  const SCROLL_GAP = 28;
  const scrollToTarget = (target, behavior) => {
    if (!target) return;
    let top = 0;
    if (target.id !== "top") {
      const anchor = target.querySelector(".kicker, h2") || target;
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      top = anchor.getBoundingClientRect().top + window.scrollY - headerHeight - SCROLL_GAP;
    }
    window.scrollTo({
      top: Math.max(0, Math.round(top)),
      behavior: behavior || (motionReduced ? "auto" : "smooth"),
    });
  };

  const initialTarget =
    window.location.hash && !legacyAnchors[window.location.hash]
      ? document.querySelector(window.location.hash.replace(/[^#\w-]/g, ""))
      : null;
  if (initialTarget && initialTarget.closest("main")) {
    const alignInitial = () => window.setTimeout(() => scrollToTarget(initialTarget, "auto"), 60);
    if (document.readyState === "complete") alignInitial();
    else window.addEventListener("load", alignInitial, { once: true });
  }

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
    if (mailFallback) mailFallback.hidden = true;
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
      window.requestAnimationFrame(() => scrollToTarget(target));
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
      window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    }, 250);

    if (mailFallback) mailFallback.hidden = false;
  });

  copyEmailButton?.addEventListener("click", async () => {
    let copied = false;
    try {
      await navigator.clipboard.writeText(contactEmail);
      copied = true;
    } catch (error) {
      const temp = document.createElement("textarea");
      temp.value = contactEmail;
      temp.setAttribute("readonly", "");
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.select();
      try { copied = document.execCommand("copy"); } catch (e) { copied = false; }
      temp.remove();
    }
    copyEmailButton.textContent = copied ? "Copiado ✓" : "Selecione e copie o endereço";
    window.setTimeout(() => { copyEmailButton.textContent = "Copiar e-mail"; }, 2500);
  });

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  // Destaque do item do menu: segue a seção que está logo abaixo do cabeçalho.
  // Ao clicar, o item é marcado na hora e fica travado até a rolagem terminar.
  const navLinks = Array.from(document.querySelectorAll(".main-nav a[href^='#']:not([data-open-contact])"));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  let lockedHash = null;
  let unlockTimer = null;

  const setActiveLink = (hash) => {
    navLinks.forEach((link) => {
      if (hash && link.getAttribute("href") === hash) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const currentSectionHash = () => {
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const line = headerHeight + window.innerHeight * 0.3;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    let current = null;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= line) current = section;
    });
    if (atBottom && sections.length) current = sections[sections.length - 1];
    return current ? `#${current.id}` : null;
  };

  const updateActiveLink = () => {
    if (lockedHash) return;
    setActiveLink(currentSectionHash());
  };

  const releaseLock = () => {
    window.clearTimeout(unlockTimer);
    unlockTimer = window.setTimeout(() => {
      lockedHash = null;
      updateActiveLink();
    }, 180);
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      lockedHash = link.getAttribute("href");
      setActiveLink(lockedHash);
      releaseLock();
    });
  });

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (lockedHash) {
        releaseLock();
        return;
      }
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updateActiveLink();
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", updateActiveLink);
  updateActiveLink();
})();
