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

    // 👉 OPTIONAL: Store imageUrl globally for later
    window.uploadedImageURL = imageUrl;

  } catch (err) {
    messageBox.classList.remove('alert-info');
    messageBox.classList.add('alert-danger');
    messageBox.textContent = `❌ Upload failed: ${err.message}`;
  }
});
