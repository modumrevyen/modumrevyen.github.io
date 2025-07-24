// kostymeBildeOpplasting.js
function submitCostumeMetadata() {


  // Grab values from form fields
  const costumeData = {
    title: document.getElementById('title').value.trim(),
    subcategory: document.getElementById('subcategory').value.trim(),
    size: document.getElementById('size').value.trim(),
    description: document.getElementById('description').value.trim(),
    image_url: window.uploadedImageURL,
    created_at: new Date().toISOString(),
    reserved_by: null,
    reserved_from: null,
    reserved_to: null,
    returned: false
  };

  // Optional: validate required fields
  if (!costumeData.title || !costumeData.size) {
    alert("Please fill out the required fields: Title and Size.");
    return;
  }

  // Show feedback if messageBox exists
  const messageBox = document.getElementById("messageBox");
  if (messageBox) {
    messageBox.classList.remove("d-none", "alert-success", "alert-danger");
    messageBox.classList.add("alert-info");
    messageBox.textContent = "⏳ Submitting costume...";
  }

  // Send to Google Sheet via Apps Script
  fetch("https://script.google.com/macros/s/AKfycbzkFlchmijZwSPucAfIWlX6A7YF1tSpMC2JTZJVTfGHmHLk1u8pDv3EuVtgZx0Lt7I5/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(costumeData)
  })
    .then(res => res.json())
    .then(data => {
        console.log("📄 Sheet response:", data);
      if (data.status === "success") {
        if (messageBox) {
          messageBox.classList.remove("alert-info");
          messageBox.classList.add("alert-success");
          messageBox.textContent = "✅ Costume registered!";
        } else {
          alert("✅ Costume registered!");
        }

        // Reset form + image state
        document.getElementById("costumeForm").reset();
        window.uploadedImageURL = null;
      } else {
        throw new Error(data.message);
      }
    })
    .catch(err => {
      if (messageBox) {
        messageBox.classList.remove("alert-info");
        messageBox.classList.add("alert-danger");
        messageBox.textContent = "❌ Failed to register: " + err.message;
      } else {
        alert("❌ Failed to register: " + err.message);
      }
    });
}