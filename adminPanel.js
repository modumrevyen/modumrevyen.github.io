  const toggleButton = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");

  toggleButton?.addEventListener("click", () => {
    sidebar.classList.toggle("sidebar-open");
  });