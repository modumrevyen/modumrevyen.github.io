function submitCostumeMetadata() {
  if (!uploadedImageURL) {
    alert("Please upload an image first.");
    return;
  }

  const costumeData = {
    title: document.getElementById('title').value,
    subcategory: document.getElementById('subcategory').value,
    size: document.getElementById('size').value,
    description: document.getElementById('description').value,
    image_url: uploadedImageURL,
    created_at: new Date().toISOString(),
    reserved_by: null,
    reserved_from: null,
    reserved_to: null,
    returned: false
  };

  fetch("https://script.google.com/macros/s/AKfycbzkFlchmijZwSPucAfIWlX6A7YF1tSpMC2JTZJVTfGHmHLk1u8pDv3EuVtgZx0Lt7I5/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(costumeData)
  }).then(res => res.json()).then(data => {
    if (data.status === "success") {
      alert("✅ Costume registered!");
    } else {
      alert("❌ Failed to register: " + data.message);
    }
  });
}
