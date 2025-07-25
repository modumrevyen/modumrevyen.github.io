const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');
const imgbbApiKey = 'bf189b771afc247e23db317a703b5e4d';
const sheetyUrl = 'https://api.sheety.co/939198e750dcf5981e21d4ad618f6849/kostymeUtleie/sheet1';

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const imageFile = document.getElementById('imageInput').files[0];

  const formData = new FormData();
  formData.append("image", imageFile);

  // Confirm the name you're uploading
  console.log("📦 Uploading file with name:", imageFile.name);


  messageBox.classList.remove('d-none', 'alert-success', 'alert-danger');
  messageBox.classList.add('alert-info');
  messageBox.textContent = 'Opplasting av bilde til ImgBB...';

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (!data || !data.data || !data.data.url) {
      throw new Error("ImgBB returned invalid response");
    }

    const imageUrl = data.data.image.url;
    console.log("✅ Image URL:", imageUrl);

    messageBox.textContent = '✅ Image opplastet! Nå sender vi kostymedata...';

    // Continue to metadata submission
    await submitCostumeMetadata(imageUrl);

  } catch (err) {
    messageBox.classList.remove('alert-info');
    messageBox.classList.add('alert-danger');
    messageBox.textContent = `❌ Opplasting feilet: ${err.message}`;
  }
});

async function submitCostumeMetadata(imageUrl) {
  console.log("📄 Submitting costume metadata:", imageUrl);

  const title = document.getElementById('title').value.trim();
  const subcategory = document.getElementById('subcategory').value.trim();
  const size = document.getElementById('size').value.trim();
  const description = document.getElementById('description').value.trim();
  const imageurl = imageUrl.trim();
  const imageFile = document.getElementById('imageInput').files[0];

  if (!title) {
    alert("❌ Tittel er påkrevd ved registrering av kostyme.");
    return;
  }

  // Generate base64 of image
  const imageBase64 = await fileToBase64(imageFile);

  // Generate a unique ID (timestamp-based)
  const kostymeid = `k_${Date.now()}`;

  const costumeData = {
    sheet1: {
      kostymeid: kostymeid,
      title: title,
      subcategory: subcategory,
      size: size,
      description: description,
      imageurl: imageurl,
      imagebase64: imageBase64,
      imagegurl: "", // Will be filled later by Apps Script
      createdat: new Date().toISOString().split('T')[0],
      reservedname: "",
      reservedphone: "",
      reservedemail: "",
      reservedfrom: "",
      reservedto: "",
      returned: false,
      deleted: false
    }
  };

  console.log("📄 Costume data:", costumeData);

  kostymeliste.addCostumeCard({
    title,
    subcategory,
    size,
    imageurl
  });

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
    messageBox.textContent = "✅ Kostyme registrert!";

    form.reset();
    window.uploadedImageURL = null;

  } catch (err) {
    messageBox.classList.remove("alert-info");
    messageBox.classList.add("alert-danger");
    messageBox.textContent = `❌ Feil ved registrering av kostyme: ${err.message}`;
  }
}

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // remove prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}