// Same-origin: the apex Ingress routes /api to the nodejs backend, mirroring
// the cv.batpepe.online pattern, so no CORS is involved. One request paints
// every dot; failures leave the neutral "unknown" state.
(function () {
  var setDot = function (id, ok) {
    var el = document.getElementById(id);
    if (el) el.className = "dot " + (ok ? "dot-ok" : "dot-err");
  };

  fetch("/api/status")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      setDot("dot-api", d.status === "ok");
      var state = document.getElementById("api-state");
      if (state) {
        state.textContent = d.status === "ok" ? "operational" : "degraded";
        state.style.color = d.status === "ok" ? "var(--green)" : "var(--red)";
      }
      var services = d.services || {};
      ["cv", "museum", "game"].forEach(function (name) {
        if (services[name]) setDot("dot-" + name, services[name].ok);
      });
    })
    .catch(function () {
      var state = document.getElementById("api-state");
      if (state) state.textContent = "status unavailable";
    });
})();
