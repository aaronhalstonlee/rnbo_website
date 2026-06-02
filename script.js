import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, sendEmailVerification, applyActionCode } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7ub6laXL3hUdZ_cxMIIRaLQS-inZGJu4",
  authDomain: "rnbo-test-2.firebaseapp.com",
  projectId: "rnbo-test-2",
  storageBucket: "rnbo-test-2.firebasestorage.app",
  messagingSenderId: "225416844432",
  appId: "1:225416844432:web:1e12e87e77bbc20c5b7415",
  measurementId: "G-6JN094D5N9"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
//connectAuthEmulator(auth, "http://127.0.0.1:9099");

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

  const verified = urlParams.get("verified") === "true";
  const mode = urlParams.get("mode") || refMode;
  const actionCode = urlParams.get("oobCode") || refCode;

  const verificationPage = document.getElementById("verification-page");
  const messageEl = document.getElementById("verification-message");
  const homeBtn = document.getElementById("verification-home-btn");

  function showVerificationOverlay(message) {
    document.getElementById("welcome_cont").hidden = true;
    verificationPage.hidden = false;
    verificationPage.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    messageEl.textContent = message;
    homeBtn.hidden = false;
  }

  if (mode === "verifyEmail" && actionCode) {
    showVerificationOverlay("Verifying your email now...");

    applyActionCode(auth, actionCode)
      .then(() => {
        messageEl.textContent = "Hooray! Your email is verified. You can now log in to the app!";
      })
      .catch(() => {
        messageEl.textContent = "Verification failed. This link may be expired or already used.";
      });
  } else if (verified) {
    showVerificationOverlay("Your email has been verified. You can now return to RNBO.");
  }

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
});


if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch((err) => console.error("Service worker registration failed:", err));
}