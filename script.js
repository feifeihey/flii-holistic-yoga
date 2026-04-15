(function () {
  const enBtn = document.getElementById("en-btn");
  const zhBtn = document.getElementById("zh-btn");
  const hamburger = document.querySelector(".hamburger-menu");
  const topNav = document.querySelector(".top-nav");

  function setLang(lang) {
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
})();
