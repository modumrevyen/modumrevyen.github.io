const costumeSubmitURL = 'https://script.google.com/macros/s/AKfycbzkFlchmijZwSPucAfIWlX6A7YF1tSpMC2JTZJVTfGHmHLk1u8pDv3EuVtgZx0Lt7I5/exec';

let uploadedImageURL = null;

// Call this after uploading the image and getting the URL
function submitCostumeMetadata(imageUrl) {
  uploadedImageURL = imageUrl;

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

  fetch(costumeSubmitURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(costumeData)
  })
  .then(res => res.json())
  .then(result => {
    if (result.status === 'success') {
      messageBox.classList.remove('alert-info');
      messageBox.classList.add('alert-success');
      messageBox.textContent = '✅ Costume registered successfully!';
      form.reset();
    } else {
      throw new Error(result.message);
    }
  })
  .catch(err => {
    messageBox.classList.remove('alert-info');
    messageBox.classList.add('alert-danger');
    messageBox.textContent = `❌ Metadata error: ${err.message}`;
  });
}