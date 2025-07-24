const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');
const imgbbApiKey = 'bf189b771afc247e23db317a703b5e4d';
const sheetyUrl = 'https://api.sheety.co/939198e750dcf5981e21d4ad618f6849/kostymeUtleie/sheet1';

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const imageFile = document.getElementById('imageInput').files[0];
  const formData = new FormData();

  formData.append("image", imageFile);

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
  // print image url
  console.log("📄 Submitting costume metadata:", imageUrl);
  const title = document.getElementById('title').value.trim();
  const subcategory = document.getElementById('subcategory').value.trim();
  const size = document.getElementById('size').value.trim();
  const description = document.getElementById('description').value.trim();
  const imageurl = imageUrl.trim();
  // print new image_url
  console.log("📄 Image URL:", imageurl);

  if (!title) {
    alert("❌ Tittel er påkrevd ved registrering av kostyme.");
    return;
  }

  const costumeData = {
    sheet1: {
      title: title,
      subcategory: subcategory,
      size: size,
      description: description,
      imageurl: imageurl,
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
  // print image_url
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