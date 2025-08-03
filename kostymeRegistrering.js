// kostymeRegistrering.js
const form = document.getElementById('costumeForm');
const messageBox = document.getElementById('messageBox');
// const imgbbApiKey = 'bf189b771afc247e23db317a703b5e4d';
const googleurl = 'https://script.google.com/macros/s/AKfycbz0z5LgJHF8bzjz9nofyBT2hc0XEke_-QVxlRWSzIVr-MKlktakP19krYjIIfNIDKUO9g/exec';
// Compose the proxy POST URL
const proxy = "https://modumrevyen.sayver.net/proxy.php";
const proxiedUrl = `${proxy}?url=${encodeURIComponent(googleurl)}`;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  console.log("📄 Form submitted");

  messageBox.classList.remove("alert-success", "alert-danger", "d-none");
  messageBox.classList.add("alert-info");
  messageBox.textContent = "⏳ Behandler bildet...";

  try {
    const imageFile = document.getElementById("imageInput").files[0];
    if (!imageFile) {
      throw new Error("Vennligst velg et bilde først.");
    }

    const timestamp = Date.now();
    const originalFileName = `${timestamp}_${imageFile.name.replace(/\s+/g, "-")}`;
    const compressedFileName = `compressed_${originalFileName}`;
 
    // Compress and convert
    const compressedimage = await compressImage(imageFile, 0.9);
    console.log("📦 Original file name:", originalFileName);
    // console.log("📦 Compressed file name:", compressedFileName);

    if (!compressedimage) {
      throw new Error("Feil under bildekomprimering.");
    }

    // Convert to base64
    messageBox.textContent = "⏳ Konverterer bilde...";
    // const imagebase64 = await imageToBase64(imageFile);
    const imagecbase64 = await imageToBase64(compressedimage);

    // Submit metadata
    await submitCostumeMetadata(compressedFileName, imagecbase64, "");

    messageBox.classList.remove("alert-info");
    messageBox.classList.add("alert-success");
    messageBox.textContent = "✅ Kostyme er lagt til!";
    form.reset();

  } catch (err) {
    console.error("❌ Skjema-feil:", err);
    messageBox.classList.remove("alert-info");
    messageBox.classList.add("alert-danger");
    messageBox.textContent = `❌ Feil: ${err.message || "Ukjent feil"}`;
  }
});

async function submitCostumeMetadata(imagecname, imagecbase64, imagecurl = "") {
  // console log for all parameters
  console.log("📄 Submitting costume metadata:", imagecname, imagecbase64, imagecurl);

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
      imagecname,
      imagecurl,
      imagecbase64,
      createdat: new Date().toISOString().split("T")[0],
      reservasjonid: "",
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


  const previewUrl = `data:image/jpeg;base64,${imagecbase64}`;
  kostymeliste.addCostumeCard({ title, subcategory, size, imagecurl: previewUrl });

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
function compressImage(file, quality = 0.9, maxSize = 1200) {
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
        quality // e.g., 0.9 = 90% quality
      );
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function imageToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result.split(",")[1]); // Remove prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}