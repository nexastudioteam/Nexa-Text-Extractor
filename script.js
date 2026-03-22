const elements = {
  preview: document.getElementById("preview"),
  loader: document.getElementById("loader"),
  result: document.getElementById("result"),
  ordersBox: document.getElementById("ordersBox"),
  orders: document.getElementById("orders"),
  copyBtn: document.getElementById("copy"),
  translateBtn: document.getElementById("translate"),
  themeBtn: document.getElementById("themeToggle")
};

// =======================
// OCR
// =======================
document.addEventListener("paste", handlePaste);

function handlePaste(e) {
  const items = e.clipboardData.items;

  for (let item of items) {
    if (item.type.includes("image")) {
      const file = item.getAsFile();
      const reader = new FileReader();

      reader.onload = () => {
        elements.preview.innerHTML = `<img src="${reader.result}">`;
        runOCR(reader.result);
      };

      reader.readAsDataURL(file);
    }
  }
}

async function runOCR(image) {
  toggleLoader(true);
  resetUI();

  try {
    const { data: { text } } = await Tesseract.recognize(image, "ara+eng");
    elements.result.value = text.trim();
    detectOrders(text);
  } catch (err) {
    console.error(err);
    alert("حصل خطأ في قراءة الصورة");
  }

  toggleLoader(false);
}

function toggleLoader(show) {
  elements.loader.style.display = show ? "block" : "none";
}

function resetUI() {
  elements.result.value = "";
  elements.orders.innerHTML = "";
  elements.ordersBox.classList.add("hidden");
}

// =======================
// Orders Detection
// =======================
function detectOrders(text) {
  const regex = /\b[A-Z]*\d{8,}[A-Z]*\b/gi;
  const matches = [...new Set(text.match(regex) || [])];

  if (!matches.length) return;

  elements.ordersBox.classList.remove("hidden");

  matches.forEach(order => {
    const div = document.createElement("div");
    div.className = "order-item";
    div.textContent = order;

    div.addEventListener("click", () => copyOrder(order, div));

    elements.orders.appendChild(div);
  });
}

function copyOrder(order, el) {
  navigator.clipboard.writeText(order);
  el.classList.add("copied");
  setTimeout(() => el.classList.remove("copied"), 500);
}

// =======================
// Theme System
// =======================
initTheme();

function initTheme() {
  const saved = localStorage.getItem("theme");

  if (saved) {
    setTheme(saved);
  } else {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(systemDark ? "dark" : "light");
  }
}

elements.themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
});

function setTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  elements.themeBtn.textContent = mode === "dark" ? "☀️" : "🌙";
  localStorage.setItem("theme", mode);
}

// =======================
// Copy Text
// =======================
elements.copyBtn.addEventListener("click", async () => {
  const text = elements.result.value.trim();

  if (!text) {
    alert("مفيش نص!");
    return;
  }

  await navigator.clipboard.writeText(text);
  elements.copyBtn.textContent = "✅ تم النسخ";

  setTimeout(() => {
    elements.copyBtn.textContent = "نسخ النص";
  }, 2000);
});

// =======================
// Translate
// =======================
elements.translateBtn.addEventListener("click", async () => {
  const text = elements.result.value.trim();

  if (!text) {
    alert("مفيش نص للترجمة!");
    return;
  }

  elements.translateBtn.disabled = true;

  const oldText = elements.result.value;
  elements.result.value = "⏳ جاري الترجمة...";

  try {
    const res = await fetch(
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ar&dt=t&q=" +
        encodeURIComponent(text)
    );

    const data = await res.json();

    const translated = data?.[0]
      ?.map(item => item?.[0])
      ?.join("") || "";

    elements.result.value = translated || "❌ مفيش نتيجة";
  } catch (err) {
    console.error(err);
    elements.result.value = oldText;
    alert("حصل خطأ في الترجمة");
  }

  elements.translateBtn.disabled = false;
});
// =======================
// Drag & Drop Support
// =======================
["dragenter", "dragover"].forEach(event => {
  preview.addEventListener(event, (e) => {
    e.preventDefault();
    e.stopPropagation();
    preview.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(event => {
  preview.addEventListener(event, (e) => {
    e.preventDefault();
    e.stopPropagation();
    preview.classList.remove("dragover");
  });
});

preview.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];

  if (!file || !file.type.startsWith("image/")) {
    alert("من فضلك اسحب صورة فقط!");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    preview.innerHTML = `<img src="${reader.result}">`;
    runOCR(reader.result);
  };

  reader.readAsDataURL(file);
});