import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, sendEmailVerification, applyActionCode } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "demo_project",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
connectAuthEmulator(auth, "http://127.0.0.1:9099");

let deferredPrompt = null;
const pwaButton = document.getElementById("pwa-btn");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (pwaButton) {
    pwaButton.style.display = "inline-flex";
  }
});

function handlePWA() {
  if (!deferredPrompt) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      alert('To install: tap the Share button in Safari, then choose "Add to Home Screen".');
    } else {
      alert("To install: open this page in Chrome or Edge and use your browser's install option.");
    }
    return;
  }

  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
  });
}

window.handlePWA = handlePWA;

window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  let refMode = null;
  let refCode = null;

  try {
    if (!window.location.search) {
      const ref = document.referrer;
      if (ref) {
        const rp = new URL(ref).searchParams;
        refMode = rp.get("mode");
        refCode = rp.get("oobCode");
      }
    }
  } catch (e) { /* ignore malformed referrer */ }

  const mode = urlParams.get("mode") || refMode;
  const actionCode = urlParams.get("oobCode") || refCode;

  if (mode === "verifyEmail" && actionCode) {
    const verificationPage = document.getElementById("verification-page");
    const messageEl = document.getElementById("verification-message");
    const homeBtn = document.getElementById("verification-home-btn");

    document.getElementById("welcome_cont").hidden = true;
    verificationPage.hidden = false;
    verificationPage.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    messageEl.textContent = "Verifying your email now...";

    applyActionCode(auth, actionCode)
      .then(() => {
        messageEl.textContent = "Success! Your email is verified. You can now return to RNBO.";
        homeBtn.hidden = false;
      })
      .catch(() => {
        messageEl.textContent = "Verification failed. This link may be expired or already used.";
        homeBtn.hidden = false;
      });

    homeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      verificationPage.classList.remove("active");
      verificationPage.addEventListener(
        "transitionend",
        () => {
          verificationPage.hidden = true;
        },
        { once: true }
      );
    });
  }
});


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch((err) => console.error("Service worker registration failed:", err));
}

async function createTestUser() {
  const email = "testuser@example.com";
  const password = "password123";
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(userCredential.user, {
    url: "http://127.0.0.1:8000/",
    handleCodeInApp: true
  });
  console.log("Verification email sent");
}

window.createTestUser = createTestUser;