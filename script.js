(function () {
  const enBtn = document.getElementById("en-btn");
  const zhBtn = document.getElementById("zh-btn");
  const hamburger = document.querySelector(".hamburger-menu");
  const topNav = document.querySelector(".top-nav");

  function setLang(lang) {
    document.documentElement.lang = lang === "zh" ? "zh-Hans" : "en";
    document.querySelectorAll("[data-en][data-zh]").forEach(function (el) {
      var text = lang === "zh" ? el.getAttribute("data-zh") : el.getAttribute("data-en");
      if (text !== null) el.textContent = text;
    });
    if (enBtn && zhBtn) {
      enBtn.classList.toggle("active", lang === "en");
      zhBtn.classList.toggle("active", lang === "zh");
    }
    try {
      localStorage.setItem("flii-lang", lang);
    } catch (e) {}
  }

  var saved = null;
  try {
    saved = localStorage.getItem("flii-lang");
  } catch (e) {}
  if (saved === "zh" || saved === "en") {
    setLang(saved);
  } else {
    document.documentElement.lang = "en";
  }

  if (enBtn) enBtn.addEventListener("click", function () { setLang("en"); });
  if (zhBtn) zhBtn.addEventListener("click", function () { setLang("zh"); });

  if (hamburger && topNav) {
    hamburger.addEventListener("click", function () {
      topNav.classList.toggle("is-open");
    });
  }

  function initHorizontalScroll(wrapperSelector, leftSel, rightSel) {
    var wrap = document.querySelector(wrapperSelector);
    if (!wrap) return;
    var left = wrap.querySelector(leftSel);
    var right = wrap.querySelector(rightSel);
    var scrollEl = wrap.querySelector(".class-types, .blog-posts, .photo-gallery");
    if (!scrollEl || !left || !right) return;
    left.addEventListener("click", function () {
      scrollEl.scrollBy({ left: -320, behavior: "smooth" });
    });
    right.addEventListener("click", function () {
      scrollEl.scrollBy({ left: 320, behavior: "smooth" });
    });
  }

  initHorizontalScroll(".class-types-scroll-wrapper", ".class-scroll-arrow.left", ".class-scroll-arrow.right");
  initHorizontalScroll(".blog-scroll-wrapper", ".blog-scroll-arrow.left", ".blog-scroll-arrow.right");
  initHorizontalScroll(".photo-gallery-scroll-wrapper", ".photo-scroll-arrow.left", ".photo-scroll-arrow.right");

  if (new URLSearchParams(window.location.search).get("sent") === "1") {
    var successEl = document.getElementById("contact-form-success");
    if (successEl) successEl.hidden = false;
  }

  var formNext = document.getElementById("form-next");
  if (formNext) {
    var path = window.location.pathname;
    if (/\.html$/i.test(path)) path = path.replace(/[^/]+$/, "");
    if (!path.endsWith("/")) path += "/";
    formNext.value = window.location.origin + path + "contact.html?sent=1";
  }

  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var errorEl = document.getElementById("contact-form-error");
      var successEl = document.getElementById("contact-form-success");
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      if (errorEl) errorEl.hidden = true;
      if (successEl) successEl.hidden = true;

      var botcheck = contactForm.querySelector('input[name="botcheck"]');
      if (botcheck && botcheck.checked) return;

      var fd = new FormData(contactForm);
      var name = String(fd.get("name") || "").trim();
      var email = String(fd.get("email") || "").trim();
      var inquirySubject = String(fd.get("inquiry_subject") || "").trim();
      var message = String(fd.get("message") || "").trim();
      var accessKey = String(fd.get("access_key") || "").trim();
      var body = message;
      if (inquirySubject) {
        body = "Topic: " + inquirySubject + "\n\n" + message;
      }

      if (submitBtn) submitBtn.disabled = true;

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: "FLII HOLISTIC — Contact Us",
          from_name: name,
          name: name,
          email: email,
          replyto: email,
          message: body,
        }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            contactForm.reset();
            if (successEl) successEl.hidden = false;
            if (errorEl) errorEl.hidden = true;
            try {
              var u = new URL(window.location.href);
              u.searchParams.set("sent", "1");
              window.history.replaceState(null, "", u.pathname + u.search);
            } catch (err) {}
            return;
          }
          if (errorEl) errorEl.hidden = false;
        })
        .catch(function () {
          if (errorEl) errorEl.hidden = false;
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
