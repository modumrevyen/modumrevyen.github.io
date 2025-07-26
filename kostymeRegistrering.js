// kostymeRegistrering.js
const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');
// const imgbbApiKey = 'bf189b771afc247e23db317a703b5e4d';
const googleurl = 'https://script.google.com/macros/s/AKfycbz0z5LgJHF8bzjz9nofyBT2hc0XEke_-QVxlRWSzIVr-MKlktakP19krYjIIfNIDKUO9g/exec';
// Compose the proxy POST URL
const proxy = "https://modumrevyen.sayver.net/proxy.php";
const proxiedUrl = `${proxy}?url=${encodeURIComponent(googleurl)}`;
// Google Apps Script URL for uploading image
const uploadScriptUrl = "https://script.google.com/macros/s/AKfycbwlyA3wA0il_nb7Ls0apCnhtcyXKCy5ZCgBCaQUzqy5d2vQN8PKnBr_mqtGdD-v61sfBw/exec";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const imageFile = document.getElementById("imageInput").files[0];
  const compressedBlob = await compressImage(imageFile, 0.6);
  const compressedFileName = `compressed_${Date.now()}_${imageFile.name.replace(/\s+/g, "-")}`;

  const originalForm = new FormData();
  originalForm.append("file", imageFile);
  originalForm.append("filename", imageFile.name);

  const compressedForm = new FormData();
  compressedForm.append("file", compressedBlob, compressedFileName);
  compressedForm.append("filename", compressedFileName);

  messageBox.classList.remove("d-none", "alert-success", "alert-danger");
  messageBox.classList.add("alert-info");
  messageBox.textContent = "Opplasting av bilde til Google Drive...";

  try {
    const [originalRes, compressedRes] = await Promise.all([
      fetch(uploadScriptUrl, {
        method: "POST",
        body: originalForm,
        headers: { Origin: "https://modumrevyen.github.io" }
      }),
      fetch(uploadScriptUrl, {
        method: "POST",
        body: compressedForm,
        headers: { Origin: "https://modumrevyen.github.io" }
      })
    ]);

    const originalData = await originalRes.json();
    const compressedData = await compressedRes.json();

    if (originalData.status !== "success" || compressedData.status !== "success") {
      throw new Error("Upload failed: " + originalData.message + " | " + compressedData.message);
    }

    const imageurl = originalData.url;
    const imagecurl = compressedData.url;

    console.log("✅ Original uploaded:", imageurl);
    console.log("✅ Compressed uploaded:", imagecurl);

    await submitCostumeMetadata(imageurl, imagecurl);
  } catch (err) {
    console.error("❌ Detailed upload error:", err);
    messageBox.classList.remove("alert-info");
    messageBox.classList.add("alert-danger");
    messageBox.textContent = `❌ Opplasting feilet: ${err.message}`;
  }
});

async function submitCostumeMetadata(imageurl, imagecurl) {
  const title = document.getElementById('title').value.trim();
  const subcategory = document.getElementById('subcategory').value.trim();
  const size = document.getElementById('size').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!title) {
    alert("❌ Tittel er påkrevd ved registrering av kostyme.");
    return;
  }

  const costumeData = {
    sheet1: {
      kostymeid: `k_${Date.now()}`,
      title,
      subcategory,
      size,
      description,
      imageurl,
      imagecurl,
      createdat: new Date().toISOString().split("T")[0],
      reservedname: "",
      reservedphone: "",
      reservedemail: "",
      reservedfrom: "",
      reservedto: "",
      returned: false,
      deleted: false
    }
  };

  kostymeliste.addCostumeCard({ title, subcategory, size, imageurl });

  try {
    const res = await fetch(proxiedUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(costumeData)
    });

    const result = await res.text();
    console.log("📄 Google Script response:", result);

    messageBox.classList.remove("alert-info");
    messageBox.classList.add("alert-success");
    messageBox.textContent = "✅ Kostyme registrert!";
    form.reset();
  } catch (err) {
    messageBox.classList.remove("alert-info");
    messageBox.classList.add("alert-danger");
    messageBox.textContent = `❌ Feil ved registrering av kostyme: ${err.message}`;
  }
}

// compress image to for better loading performance
function compressImage(file, quality = 0.6, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Resize logic (preserve aspect ratio)
      if (width > height && width > maxSize) {
        height *= maxSize / width;
        width = maxSize;
      } else if (height > maxSize) {
        width *= maxSize / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        quality // e.g., 0.6 = 60% quality
      );
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}