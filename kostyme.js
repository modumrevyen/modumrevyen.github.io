document.addEventListener("DOMContentLoaded", () => {

  const modalImage = document.getElementById('modalImage');

  document.body.addEventListener('click', function (e) {
    const card = e.target.closest('[data-bs-toggle="modal"][data-img]');
    if (card) {
      const imageUrl = card.getAttribute('data-img');
      modalImage.src = imageUrl;
    }
  });

  kostymeliste.loadCostumes();
});
