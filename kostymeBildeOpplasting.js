// kostymeBildeOpplasting.js
// This script handles the image upload functionality for costume images to Google Drive using a Google Apps Script
const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');

const imageUploadURL = 'https://script.google.com/macros/s/AKfycbwlyA3wA0il_nb7Ls0apCnhtcyXKCy5ZCgBCaQUzqy5d2vQN8PKnBr_mqtGdD-v61sfBw/exec';

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
        body: formData
      });

      const uploadData = await uploadRes.json();
      if (uploadData.status !== 'success') throw new Error(uploadData.message);

      messageBox.classList.remove('alert-info');
      messageBox.classList.add('alert-success');
      messageBox.textContent = '✅ Image uploaded successfully!';
      console.log("✅ Uploaded image URL:", uploadData.url);

    } catch (err) {
      messageBox.classList.remove('alert-info');
      messageBox.classList.add('alert-danger');
      messageBox.textContent = `❌ Upload failed: ${err.message}`;
    }
  };

  reader.readAsDataURL(imageFile);
});