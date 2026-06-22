document.documentElement.classList.add("js-ready");

const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const serviceNav = document.querySelector("[data-service-nav]");
const serviceTrigger = document.querySelector("[data-service-trigger]");
const serviceCards = document.querySelector("[data-service-cards]");
const heroMedia = document.querySelector("[data-hero-media] img");
const heroImageSource = document.querySelector("[data-hero-images]");
const chat = document.querySelector("[data-chat]");
const chatToggle = document.querySelector("[data-chat-toggle]");
const bookingModal = document.querySelector("[data-booking-modal]");
const bookingForm = document.querySelector("[data-booking-form]");
const bookingService = document.querySelector("[data-booking-service]");
const bookingStatus = document.querySelector("[data-booking-status]");

const serviceInteractionState = { pausedUntil: 0, resetTimer: 0 };
let revealObserver;
let lastFocusedBeforeModal = null;

const revealVisibleContent = () => {
  document.querySelectorAll(".reveal:not(.is-visible)").forEach((item) => item.classList.add("is-visible"));
};

window.addEventListener("error", revealVisibleContent);
window.addEventListener("unhandledrejection", revealVisibleContent);

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

const setupRevealObserver = () => {
  if (!("IntersectionObserver" in window)) {
    revealVisibleContent();
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal:not(.is-visible)").forEach((item) => revealObserver.observe(item));
};

const bindNavigation = () => {
  if (!nav || !navToggle || !serviceNav || !serviceTrigger) return;

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  const setServiceMenu = (isOpen) => {
    serviceNav.classList.toggle("is-open", isOpen);
    serviceTrigger.setAttribute("aria-expanded", String(isOpen));
  };

  let serviceTouchNavigationPending = false;
  const desktopNavQuery = window.matchMedia("(min-width: 960px)");
  const serviceDropdown = serviceNav.querySelector("[data-service-dropdown]");

  const isServiceDropdownInteractive = () => {
    if (!desktopNavQuery.matches) return true;

    return (
      serviceNav.classList.contains("is-hover-armed") &&
      (serviceTrigger.matches(":hover, :focus-visible") || serviceDropdown?.matches(":hover, :focus-within"))
    );
  };

  const navigateToServiceLink = (event, serviceLink) => {
    if (!serviceLink) return false;

    if (!isServiceDropdownInteractive()) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    if (event.type === "click" && (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
      closeMobileNav();
      return false;
    }

    const target = serviceLink.getAttribute("href") || serviceLink.dataset.serviceNavLink;
    if (!target) return false;

    event.preventDefault();
    event.stopPropagation();
    closeMobileNav();
    setServiceMenu(false);
    serviceTouchNavigationPending = event.type === "pointerup";
    window.location.assign(new URL(target, window.location.href).href);
    return true;
  };

  const closeMobileNav = () => {
    if (!window.matchMedia("(max-width: 959px)").matches) return;

    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    serviceNav.classList.remove("is-open", "is-click-closed");
    serviceTrigger.setAttribute("aria-expanded", "false");
    serviceTrigger.blur();
  };

  nav.addEventListener("click", (event) => {
    const navLink = event.target.closest("a");
    if (!navLink || !nav.contains(navLink)) return;

    closeMobileNav();
  });

  serviceNav.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") return;

    const serviceLink = event.target.closest("[data-service-nav-link]");
    navigateToServiceLink(event, serviceLink);
  });

  serviceNav.addEventListener("click", (event) => {
    const serviceLink = event.target.closest("[data-service-nav-link]");
    if (serviceLink) {
      if (serviceTouchNavigationPending) {
        event.preventDefault();
        event.stopPropagation();
        serviceTouchNavigationPending = false;
        return;
      }

      navigateToServiceLink(event, serviceLink);
      return;
    }

    if (event.target.closest("[data-service-dropdown]")) {
      event.stopPropagation();
      return;
    }

    if (!event.target.closest("[data-service-trigger]")) return;

    event.preventDefault();
    event.stopPropagation();
    const shouldOpen = !serviceNav.classList.contains("is-open") || serviceNav.classList.contains("is-click-closed");
    serviceNav.classList.toggle("is-click-closed", !shouldOpen);
    setServiceMenu(shouldOpen);
    if (!shouldOpen) {
      serviceTrigger.blur();
    }
  });

  serviceTrigger.addEventListener("pointerenter", () => {
    if (!desktopNavQuery.matches) return;

    serviceNav.classList.add("is-hover-armed");
    serviceNav.classList.remove("is-click-closed");
    setServiceMenu(true);
  });

  serviceNav.addEventListener("pointerleave", () => {
    serviceNav.classList.remove("is-hover-armed");
    setServiceMenu(false);
    serviceTrigger.blur();
    window.setTimeout(() => {
      if (!serviceNav.matches(":hover")) {
        serviceNav.classList.remove("is-click-closed");
      }
    }, 80);
  });

  document.addEventListener("click", (event) => {
    if (!serviceNav.contains(event.target)) {
      serviceNav.classList.remove("is-click-closed");
      setServiceMenu(false);
    }
  });
};

const bindServiceCards = () => {
  if (!serviceCards) return;

  let pointerStartX = 0;
  let pointerStartY = 0;
  let didDrag = false;
  let didTouchNavigate = false;

  serviceCards.addEventListener(
    "pointerdown",
    (event) => {
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      didDrag = false;
      serviceCards.classList.add("is-touching");
    },
    { passive: true }
  );

  serviceCards.addEventListener(
    "pointermove",
    (event) => {
      const deltaX = Math.abs(event.clientX - pointerStartX);
      const deltaY = Math.abs(event.clientY - pointerStartY);

      if (deltaX > 18 && deltaX > deltaY + 6) {
        didDrag = true;
        serviceCards.classList.add("is-dragging");
      }
    },
    { passive: true }
  );

  serviceCards.addEventListener("pointerup", (event) => {
    const deltaX = Math.abs(event.clientX - pointerStartX);
    const deltaY = Math.abs(event.clientY - pointerStartY);
    const card = event.target.closest("[data-service-card]");

    if (event.pointerType !== "mouse" && card && !didDrag && deltaX < 10 && deltaY < 10) {
      const link = event.target.closest("a");
      const url = link?.href || card.dataset.serviceUrl;
      if (url) {
        didTouchNavigate = true;
        window.location.href = url;
      }
    }

    window.setTimeout(() => {
      serviceCards.classList.remove("is-touching", "is-dragging");
    }, 120);
  });

  ["pointercancel", "pointerleave"].forEach((eventName) => {
    serviceCards.addEventListener(eventName, () => {
      window.setTimeout(() => {
        serviceCards.classList.remove("is-touching", "is-dragging");
      }, 120);
    });
  });

  serviceCards.addEventListener("click", (event) => {
    if (didTouchNavigate) {
      event.preventDefault();
      didTouchNavigate = false;
      return;
    }

    if (didDrag) {
      event.preventDefault();
      event.stopPropagation();
      didDrag = false;
      return;
    }

    const card = event.target.closest("[data-service-card]");
    if (!card) return;

    const link = event.target.closest("a");
    window.location.href = link?.href || card.dataset.serviceUrl;
  });

  serviceCards.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const card = event.target.closest("[data-service-card]");
    if (!card) return;

    event.preventDefault();
    window.location.href = card.dataset.serviceUrl;
  });
};

const bindChat = () => {
  if (!chat || !chatToggle) return;

  const closeChat = () => {
    chat.classList.remove("is-open");
    chatToggle.setAttribute("aria-expanded", "false");
    chatToggle.setAttribute("aria-label", "Open chat options");
  };

  chatToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = chat.classList.toggle("is-open");
    chatToggle.setAttribute("aria-expanded", String(isOpen));
    chatToggle.setAttribute("aria-label", isOpen ? "Close chat options" : "Open chat options");
  });

  document.addEventListener("click", (event) => {
    if (!chat.contains(event.target)) closeChat();
  });
};

const getModalFocusable = () => {
  if (!bookingModal) return [];

  return [...bookingModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden") && element.offsetParent !== null);
};

const trapModalFocus = (event) => {
  if (!bookingModal?.classList.contains("is-open") || event.key !== "Tab") return;

  const focusable = getModalFocusable();
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const openBookingModal = (serviceTitle = "") => {
  if (!bookingModal) return;

  lastFocusedBeforeModal = document.activeElement;

  if (bookingService && serviceTitle) {
    bookingService.value = serviceTitle;
  }

  setBookingStatus("", "");
  bookingModal.classList.add("is-open");
  bookingModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  document.documentElement.classList.add("modal-open");
  window.setTimeout(() => getModalFocusable()[0]?.focus(), 24);
};

const closeBookingModal = () => {
  if (!bookingModal) return;

  bookingModal.classList.remove("is-open");
  bookingModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  document.documentElement.classList.remove("modal-open");
  lastFocusedBeforeModal?.focus?.();
};

const setBookingStatus = (message = "", type = "") => {
  if (!bookingStatus) return;

  bookingStatus.textContent = message;
  bookingStatus.dataset.status = type;
};

const buildBookingMailto = (formData) => {
  const email = window.JPN_BOOKING_CONFIG?.email || window.JPN_CONTACT_EMAIL || "joyandpeacenailspa@gmail.com";
  const subject = encodeURIComponent(`Booking request - ${formData.get("service")}`);
  const body = encodeURIComponent(
    [
      `Name: ${formData.get("name")}`,
      `Phone: ${formData.get("phone")}`,
      `Email: ${formData.get("email") || "Not provided"}`,
      `Service: ${formData.get("service")}`,
      `Specialist: ${formData.get("specialist") || "Any available specialist"}`,
      `Preferred day: ${formData.get("day") || "Not provided"}`,
      `Preferred time: ${formData.get("time") || "Not provided"}`,
      `Notes: ${formData.get("notes") || "None"}`,
    ].join("\n")
  );

  return `mailto:${email}?subject=${subject}&body=${body}`;
};

const bindBooking = () => {
  if (!bookingModal || !bookingForm) return;

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-booking-open]");
    if (!button) return;

    openBookingModal(button.dataset.bookingOpen || "");
  });

  bookingModal.querySelectorAll("[data-booking-close]").forEach((button) => {
    button.addEventListener("click", closeBookingModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && bookingModal.classList.contains("is-open")) {
      closeBookingModal();
      return;
    }

    trapModalFocus(event);
  });

  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!bookingForm.reportValidity()) return;

    const formData = new FormData(bookingForm);
    const submitButton = bookingForm.querySelector('button[type="submit"]');
    const config = window.JPN_BOOKING_CONFIG || {};

    setBookingStatus("Sending booking request...", "pending");
    submitButton?.setAttribute("disabled", "disabled");

    if (!config.ajaxUrl || !config.nonce) {
      window.location.href = buildBookingMailto(formData);
      submitButton?.removeAttribute("disabled");
      closeBookingModal();
      return;
    }

    formData.append("action", "jpn_submit_booking");
    formData.append("nonce", config.nonce);

    fetch(config.ajaxUrl, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    })
      .then((response) => response.json().then((result) => ({ response, result })))
      .then(({ response, result }) => {
        if (!result?.success) {
          const message = result?.data?.message || "Could not send booking request.";
          setBookingStatus(message, "error");

          if (response.status >= 500) {
            window.location.href = buildBookingMailto(formData);
            window.setTimeout(closeBookingModal, 600);
          }

          return;
        }

        setBookingStatus(result.data?.message || "Booking request sent.", "success");
        bookingForm.reset();
        window.setTimeout(closeBookingModal, 1100);
      })
      .catch(() => {
        setBookingStatus("Could not connect online. Opening email instead.", "error");
        window.location.href = buildBookingMailto(formData);
        window.setTimeout(closeBookingModal, 600);
      })
      .finally(() => {
        submitButton?.removeAttribute("disabled");
      });
  });
};

const setupHeroSlider = () => {
  if (!heroMedia || !heroImageSource) return;

  let images = [];
  try {
    images = JSON.parse(heroImageSource.dataset.heroImages || "[]");
  } catch (error) {
    images = [];
  }

  if (images.length < 2) return;

  let index = Math.max(0, images.indexOf(heroMedia.getAttribute("src")));
  window.setInterval(() => {
    let nextIndex = index;
    while (nextIndex === index) {
      nextIndex = Math.floor(Math.random() * images.length);
    }
    index = nextIndex;
    heroMedia.classList.add("is-changing");
    window.setTimeout(() => {
      heroMedia.src = images[index];
      heroMedia.classList.remove("is-changing");
    }, 260);
  }, 2000);
};

const markServiceInteraction = () => {
  if (!serviceCards) return;

  serviceInteractionState.pausedUntil = Date.now() + 5200;
  serviceCards.classList.add("is-user-interacting");
  window.clearTimeout(serviceInteractionState.resetTimer);
  serviceInteractionState.resetTimer = window.setTimeout(() => {
    serviceCards.classList.remove("is-user-interacting");
  }, 2000);
};

const setupServiceCarouselTransitions = () => {
  if (!serviceCards) return;

  const getCards = () => [...serviceCards.querySelectorAll("[data-service-card]")];
  let rafId = 0;
  let scrollEndTimer = 0;

  const updateActiveCard = () => {
    rafId = 0;
    const cards = getCards();
    if (!cards.length) return;

    const railRect = serviceCards.getBoundingClientRect();
    const railCenter = railRect.left + railRect.width / 2;
    let activeCard = cards[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(railCenter - cardCenter);

      card.classList.remove("is-active", "is-near");

      if (distance < closestDistance) {
        closestDistance = distance;
        activeCard = card;
      }
    });

    activeCard.classList.add("is-active");
  };

  const requestUpdate = () => {
    if (!rafId) rafId = window.requestAnimationFrame(updateActiveCard);
  };

  const requestSettledUpdate = () => {
    serviceCards.classList.add("is-user-scrolling");
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(() => {
      serviceCards.classList.remove("is-user-scrolling");
      requestUpdate();
    }, 120);
  };

  ["pointerdown", "wheel", "touchstart", "keydown"].forEach((eventName) => {
    serviceCards.addEventListener(eventName, markServiceInteraction, { passive: true });
  });

  serviceCards.addEventListener("scroll", requestSettledUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate, { passive: true });
  requestUpdate();
};

const setupServiceAutoScroll = () => {
  if (!serviceCards) return;

  const step = () => {
    if (document.hidden || Date.now() < serviceInteractionState.pausedUntil) return;

    const maxScroll = Math.max(0, serviceCards.scrollWidth - serviceCards.clientWidth - 8);
    const nextLeft = serviceCards.scrollLeft + Math.min(serviceCards.clientWidth * 0.8, 380);
    const targetLeft = nextLeft >= maxScroll ? 0 : nextLeft;

    serviceCards.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });
  };

  window.setInterval(step, 7600);
};

const highlightTodayOpeningHours = () => {
  const hourRows = document.querySelectorAll(".hero-hours span");
  if (!hourRows.length) return;

  const getAucklandWeekday = () => {
    try {
      return new Intl.DateTimeFormat("en-NZ", {
        weekday: "long",
        timeZone: "Pacific/Auckland",
      }).format(new Date());
    } catch (error) {
      return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
    }
  };

  const today = getAucklandWeekday();

  hourRows.forEach((row) => {
    const day = row.dataset.weekday || row.querySelector("strong")?.textContent.trim();
    const isToday = day === today;
    row.classList.toggle("is-today", isToday);
    if (isToday) {
      row.setAttribute("aria-current", "date");
      row.setAttribute("title", "Today in New Zealand");
    } else {
      row.removeAttribute("aria-current");
      row.removeAttribute("title");
    }
  });
};

setupRevealObserver();
bindNavigation();
bindServiceCards();
bindChat();
bindBooking();
setupHeroSlider();
highlightTodayOpeningHours();
setupServiceCarouselTransitions();
setupServiceAutoScroll();
