// kostymeRegistrering.js
// This script handles the costume registration form submission, image upload to Google Drive,
const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');

const imageUploadURL = 'https://script.google.com/macros/s/AKfycbwlyA3wA0il_nb7Ls0apCnhtcyXKCy5ZCgBCaQUzqy5d2vQN8PKnBr_mqtGdD-v61sfBw/exec'; // Google Drive upload script
const costumeSubmitURL = 'https://script.google.com/macros/s/AKfycbzkFlchmijZwSPucAfIWlX6A7YF1tSpMC2JTZJVTfGHmHLk1u8pDv3EuVtgZx0Lt7I5/exec'; // Google Sheets data script

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const imageFile = document.getElementById('imageInput').files[0];
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("filename", imageFile.name);

  messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
  messageBox.classList.add('alert-info');
  messageBox.textContent = 'Uploading image to Google Drive...';

  try {
    // Upload image
    const imgRes = await fetch(imageUploadURL, {
      method: 'POST',
      body: formData
    });

    const imgData = await imgRes.json();
    if (imgData.status !== 'success') throw new Error(imgData.message || 'Image upload failed');

    const imageUrl = imgData.url;

    const costumeData = {
      title: document.getElementById('title').value,
      subcategory: document.getElementById('subcategory').value,
      size: document.getElementById('size').value,
      description: document.getElementById('description').value,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      reserved_by: null,
      reserved_from: null,
      reserved_to: null,
      returned: false
    };

    const response = await fetch(costumeSubmitURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(costumeData)
    });

    if (!response.ok) throw new Error('Failed to register costume');

    messageBox.classList.remove('alert-info');
    messageBox.classList.add('alert-success');
    messageBox.textContent = '✅ Costume registered successfully!';
    form.reset();
  } catch (err) {
    messageBox.classList.remove('alert-info');
    messageBox.classList.add('alert-danger');
    messageBox.textContent = `❌ Error: ${err.message}`;
  }
});