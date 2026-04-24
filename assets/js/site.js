(function () {
  const page = document.body.dataset.page;
  document.querySelectorAll(".micro-nav a, .footer-links a").forEach(function (link) {
    const target = link.getAttribute("href");
    if (
      (page === "about" && target === "./about.html") ||
      (page === "contact" && target === "./contact.html")
    ) {
      link.classList.add("is-active");
    }
  });
})();
