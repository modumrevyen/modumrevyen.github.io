const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');
const imgbbApiKey = '933a26998801c0f01940deadf23118e5';
const sheetyUrl = 'https://api.sheety.co/939198e750dcf5981e21d4ad618f6849/kostymeUtleie/sheet1';

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
    console.log("✅ Image URL:", imageUrl);

    messageBox.textContent = '✅ Image uploaded! Now submitting costume data...';

    // Continue to metadata submission
    await submitCostumeMetadata(imageUrl);

  } catch (err) {
    messageBox.classList.remove('alert-info');
    messageBox.classList.add('alert-danger');
    messageBox.textContent = `❌ Upload failed: ${err.message}`;
  }
});

async function submitCostumeMetadata(imageUrl) {
  const title = document.getElementById('title').value.trim();
  const subcategory = document.getElementById('subcategory').value.trim();
  const size = document.getElementById('size').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!title || !size) {
    alert("❌ Title and size are required.");
    return;
  }

  const costumeData = {
    sheet1: {
      title: title,
      subcategory: subcategory,
      size: size,
      description: description,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      reserved_name: "",
      reserved_phone: "",
      reserved_email: "",
      reserved_from: "",
      reserved_to: "",
      returned: false,
      deleted: false
    }
  };

  try {
    const res = await fetch(sheetyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(costumeData)
    });

    const result = await res.json();
    console.log("📄 Sheety response:", result);

    messageBox.classList.remove("alert-info");
    messageBox.classList.add("alert-success");
    messageBox.textContent = "✅ Costume registered successfully!";

    form.reset();
    window.uploadedImageURL = null;

  } catch (err) {
    messageBox.classList.remove("alert-info");
    messageBox.classList.add("alert-danger");
    messageBox.textContent = `❌ Failed to register costume: ${err.message}`;
  }
}