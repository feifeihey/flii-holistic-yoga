(function () {
  var path = window.location.pathname;
  if (/\.html$/i.test(path)) path = path.replace(/[^/]+$/, "");
  if (!path.endsWith("/")) path += "/";
  var head = document.getElementsByTagName("head")[0];
  if (!head || head.querySelector("base[data-site-base]")) return;
  var base = document.createElement("base");
  base.href = path;
  base.setAttribute("data-site-base", "");
  head.insertBefore(base, head.firstChild);
})();
