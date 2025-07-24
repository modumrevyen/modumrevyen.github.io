// kostymeBildeOpplasting.js
// This script handles the image upload functionality for costume images to Google Drive using a Google Apps Script
const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');

const imageUploadURL = 'https://script.google.com/macros/s/AKfycbwlyA3wA0il_nb7Ls0apCnhtcyXKCy5ZCgBCaQUzqy5d2vQN8PKnBr_mqtGdD-v61sfBw/exec';

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const imageFile = document.getElementById('imageInput').files[0];
  const reader = new FileReader();

  messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
  messageBox.classList.add('alert-info');
  messageBox.textContent = 'Uploading image to Google Drive...';

  reader.onload = function () {
    const base64Data = reader.result.split(',')[1];

    const imagePayload = {
      filename: imageFile.name,
      mimeType: imageFile.type,
      base64: base64Data
    };

    const xhr = new XMLHttpRequest();
    xhr.open('POST', imageUploadURL, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onload = function () {
      try {
        const response = JSON.parse(xhr.responseText);
        if (response.status === 'success') {
          messageBox.classList.remove('alert-info');
          messageBox.classList.add('alert-success');
          messageBox.textContent = '✅ Image uploaded successfully!';
          console.log('Image URL:', response.url);
        } else {
          throw new Error(response.message || 'Unknown error');
        }
      } catch (err) {
        messageBox.classList.remove('alert-info');
        messageBox.classList.add('alert-danger');
        messageBox.textContent = `❌ Upload failed: ${err.message}`;
      }
    };

    xhr.onerror = function () {
      messageBox.classList.remove('alert-info');
      messageBox.classList.add('alert-danger');
      messageBox.textContent = '❌ Upload failed: network error.';
    };

    xhr.send(JSON.stringify(imagePayload));
  };

  reader.readAsDataURL(imageFile);
});