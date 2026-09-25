(function () {
  var tabs = document.querySelectorAll(".recipe-tab");
  var panels = document.querySelectorAll(".recipe-panel");
  if (!tabs.length) return;

  function showTab(id) {
    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-tab") === id;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-panel") !== id;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      showTab(tab.getAttribute("data-tab"));
    });
  });

  var recipeId = document.body.getAttribute("data-recipe-id") || "recipe";
  var key = "flii-shop-" + recipeId;
  var saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(key) || "{}");
  } catch (e) {}

  document.querySelectorAll(".recipe-shop-item input[type='checkbox']").forEach(function (box) {
    var id = box.getAttribute("data-item");
    if (id && saved[id]) box.checked = true;
    box.addEventListener("change", function () {
      if (!id) return;
      saved[id] = box.checked;
      try {
        localStorage.setItem(key, JSON.stringify(saved));
      } catch (e) {}
    });
  });
})();
