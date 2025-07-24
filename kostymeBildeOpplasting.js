let uploadedImageURL = null;

window.addEventListener("message", (event) => {
  // Optional: add origin check
  if (!event.data || !event.data.imageUrl) return;

  uploadedImageURL = event.data.imageUrl;
  console.log("✅ Received image URL from iframe:", uploadedImageURL);

  const messageBox = document.getElementById("messageBox");
  messageBox.classList.remove("d-none", "alert-info", "alert-danger");
  messageBox.classList.add("alert-success");
  messageBox.textContent = "✅ Image uploaded! Ready to register costume.";
});