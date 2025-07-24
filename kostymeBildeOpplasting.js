// kostymeBildeOpplasting.js
const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');

const imgbbApiKey = '933a26998801c0f01940deadf23118e5'; // Your real API key

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const imageFile = document.getElementById('imageInput').files[0];
  const formData = new FormData();
  formData.append("image", imageFile);

  messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
  messageBox.classList.add('alert-info');
  messageBox.textContent = 'Uploading image to ImgBB...';

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (!data || !data.data || !data.data.url) {
      throw new Error("ImgBB returned invalid response");
    }

    const imageUrl = data.data.url;

    messageBox.classList.remove('alert-info');
    messageBox.classList.add('alert-success');
    messageBox.textContent = '✅ Image uploaded successfully!';

    console.log("✅ Image URL:", imageUrl);

    // Ensure an image has been uploaded
    if (imageUrl) {
      alert("❌ Please upload an image before submitting.");
      return;
    }

    // call the costume metadata submission function
    submitCostumeMetadata();

  } catch (err) {
    messageBox.classList.remove('alert-info');
    messageBox.classList.add('alert-danger');
    messageBox.textContent = `❌ Upload failed: ${err.message}`;
  }
});

// function to upload the costume metadata
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