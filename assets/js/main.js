(function () {
  var root = document.documentElement;
  var toggle = document.querySelector("[data-theme-toggle]");
  var label = document.querySelector("[data-theme-label]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function setTheme(theme, persist) {
    var selected = theme === "light" ? "light" : "dark";
    var darkLabel = toggle ? toggle.getAttribute("data-theme-dark") : "Dark";
    var lightLabel = toggle ? toggle.getAttribute("data-theme-light") : "Light";
    var toggleLabel = toggle ? toggle.getAttribute("data-theme-toggle-label") : "Switch theme";

    root.setAttribute("data-theme", selected);

    if (toggle) {
      toggle.setAttribute("aria-pressed", selected === "light" ? "true" : "false");
      toggle.setAttribute("aria-label", toggleLabel);
    }

    if (label) {
      label.textContent = selected === "light" ? darkLabel : lightLabel;
    }

    if (persist) {
      try {
        window.localStorage.setItem("fa-theme", selected);
      } catch (error) {
        return;
      }
    }
  }

  setTheme(currentTheme(), false);

  if (toggle) {
    toggle.addEventListener("click", function () {
      setTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }

  document.querySelectorAll("[data-project-gallery]").forEach(function (gallery) {
    var track = gallery.querySelector(".gallery-track");
    var previous = gallery.querySelector("[data-gallery-prev]");
    var next = gallery.querySelector("[data-gallery-next]");
    var openers = Array.prototype.slice.call(gallery.querySelectorAll("[data-gallery-open]"));
    var dialog = gallery.querySelector("[data-gallery-dialog]");
    var lightboxImage = gallery.querySelector("[data-gallery-lightbox-image]");
    var lightboxCaption = gallery.querySelector("[data-gallery-lightbox-caption]");
    var lightboxCounter = gallery.querySelector("[data-gallery-counter]");
    var lightboxPrevious = gallery.querySelector("[data-lightbox-prev]");
    var lightboxNext = gallery.querySelector("[data-lightbox-next]");
    var lightboxClose = gallery.querySelector("[data-gallery-close]");
    var activeIndex = 0;
    var lastTrigger = null;
    var closeTimer = null;

    function move(direction) {
      if (!track) {
        return;
      }

      var firstItem = track.querySelector(".gallery-item");
      var gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
      var amount = firstItem ? firstItem.getBoundingClientRect().width + gap : Math.max(track.clientWidth * 0.82, 260);
      track.scrollBy({ left: amount * direction, behavior: reduceMotion.matches ? "auto" : "smooth" });
    }

    function renderLightbox(index) {
      if (!openers.length || !lightboxImage) {
        return;
      }

      activeIndex = (index + openers.length) % openers.length;
      var figure = openers[activeIndex].closest(".gallery-item");
      var sourceImage = openers[activeIndex].querySelector("img");
      var caption = figure ? figure.querySelector("figcaption") : null;

      lightboxImage.src = sourceImage.currentSrc || sourceImage.src;
      lightboxImage.alt = sourceImage.alt;

      if (lightboxCaption) {
        lightboxCaption.textContent = caption ? caption.textContent : "";
      }

      if (lightboxCounter) {
        lightboxCounter.textContent = activeIndex + 1 + " / " + openers.length;
      }
    }

    function finishClosing() {
      if (dialog && dialog.open) {
        dialog.close();
      }
    }

    function closeLightbox() {
      if (!dialog || !dialog.open) {
        return;
      }

      window.clearTimeout(closeTimer);
      dialog.classList.remove("is-open");
      closeTimer = window.setTimeout(finishClosing, reduceMotion.matches ? 0 : 180);
    }

    function openLightbox(index, trigger) {
      if (!dialog) {
        return;
      }

      window.clearTimeout(closeTimer);
      lastTrigger = trigger;
      renderLightbox(index);
      dialog.showModal();
      document.body.classList.add("gallery-lightbox-open");
      window.requestAnimationFrame(function () {
        dialog.classList.add("is-open");
        if (lightboxClose) {
          lightboxClose.focus();
        }
      });
    }

    if (previous) {
      previous.addEventListener("click", function () {
        move(-1);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        move(1);
      });
    }

    openers.forEach(function (opener, index) {
      opener.addEventListener("click", function () {
        openLightbox(index, opener);
      });
    });

    if (lightboxPrevious) {
      lightboxPrevious.addEventListener("click", function () {
        renderLightbox(activeIndex - 1);
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener("click", function () {
        renderLightbox(activeIndex + 1);
      });
    }

    if (lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
    }

    if (dialog) {
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) {
          closeLightbox();
        }
      });

      dialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        closeLightbox();
      });

      dialog.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          renderLightbox(activeIndex - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          renderLightbox(activeIndex + 1);
        }
      });

      dialog.addEventListener("close", function () {
        dialog.classList.remove("is-open");
        document.body.classList.remove("gallery-lightbox-open");
        if (lastTrigger) {
          lastTrigger.focus();
        }
      });
    }
  });

  var revealTargets = document.querySelectorAll(
    ".section-band, .project-card, .skill-card, .timeline article, .post-row, .cv-aside, .contact-list a, .project-action-panel, .gallery-item, .project-section"
  );

  revealTargets.forEach(function (item) {
    item.classList.add("reveal");
  });

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (item) {
      item.classList.add("is-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  revealTargets.forEach(function (item) {
    observer.observe(item);
  });
})();
