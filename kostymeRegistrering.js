const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');

const imageUploadURL = 'https://script.google.com/macros/s/AKfycbwlyA3wA0il_nb7Ls0apCnhtcyXKCy5ZCgBCaQUzqy5d2vQN8PKnBr_mqtGdD-v61sfBw/exec'; // Google Drive upload script
const costumeSubmitURL = 'https://script.google.com/macros/s/AKfycbzkFlchmijZwSPucAfIWlX6A7YF1tSpMC2JTZJVTfGHmHLk1u8pDv3EuVtgZx0Lt7I5/exec'; // Google Sheets data script

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const imageFile = document.getElementById('imageInput').files[0];
  const reader = new FileReader();

  messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
  messageBox.classList.add('alert-info');
  messageBox.textContent = 'Converting and uploading image...';

  reader.onload = async function () {
    try {
      const base64Data = reader.result.split(',')[1]; // remove data:image/... prefix
      const imagePayload = {
        filename: imageFile.name,
        mimeType: imageFile.type,
        base64: base64Data
      };

    const uploadRes = await fetch(imageUploadURL, {
        method: 'POST',
        mode: 'no-cors', // ← bypass CORS block
        body: JSON.stringify(imagePayload),
        headers: {
            'Content-Type': 'application/json'
        }
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
  };

  reader.readAsDataURL(imageFile); // Start reading file as base64
});