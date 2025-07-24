// kostymeRegistrering.js
// This script handles the costume registration form submission, image upload to Google Drive,
const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');

const imageUploadURL = 'https://script.google.com/macros/s/AKfycbwlyA3wA0il_nb7Ls0apCnhtcyXKCy5ZCgBCaQUzqy5d2vQN8PKnBr_mqtGdD-v61sfBw/exec';
const costumeSubmitURL = 'https://script.google.com/macros/s/AKfycbzkFlchmijZwSPucAfIWlX6A7YF1tSpMC2JTZJVTfGHmHLk1u8pDv3EuVtgZx0Lt7I5/exec';

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const imageFile = document.getElementById('imageInput').files[0];
  const reader = new FileReader();

  messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
  messageBox.classList.add('alert-info');
  messageBox.textContent = 'Uploading image to Google Drive...';

  reader.onload = async function () {
    const base64Data = reader.result.split(',')[1];

    const formData = new FormData();
    formData.append("filename", imageFile.name);
    formData.append("mimeType", imageFile.type);
    formData.append("base64", base64Data);

    try {
      const uploadRes = await fetch(imageUploadURL, {
        method: 'POST',
        body: formData  // ❌ no headers set — prevents preflight!
      });

      const uploadData = await uploadRes.json();
      if (uploadData.status !== 'success') throw new Error(uploadData.message);

      const costumeData = {
        title: document.getElementById('title').value,
        subcategory: document.getElementById('subcategory').value,
        size: document.getElementById('size').value,
        description: document.getElementById('description').value,
        image_url: uploadData.url,
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

      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message);

      messageBox.classList.remove('alert-info');
      messageBox.classList.add('alert-success');
      messageBox.textContent = '✅ Costume registered successfully!';
      form.reset();

    } catch (err) {
      messageBox.classList.remove('alert-info');
      messageBox.classList.add('alert-danger');
      messageBox.textContent = `❌ Error: ${err.message}`;
    }
  };

  reader.readAsDataURL(imageFile);
});