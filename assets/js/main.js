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

    function move(direction) {
      if (!track) {
        return;
      }

      var amount = Math.max(track.clientWidth * 0.82, 260);
      track.scrollBy({ left: amount * direction, behavior: "smooth" });
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
