/* ============================================================
   The Old House Playbook — site config
   Replace the three values below before your first public launch.
   ============================================================ */

window.SITE_CONFIG = {
  // 1) Your Ko-fi / checkout product URL
  kofiUrl: "https://ko-fi.com/s/86751002e2",
  checkoutUrl: "https://ko-fi.com/s/86751002e2",
  gumroadUrl: "https://ko-fi.com/s/86751002e2",

  // 2) Unlock password SHA-256 hash.
  //    LIVE PASSWORD: "Ch2-Reno-2026!" (set 2026-09; update the Ko-fi
  //    delivery email with the SAME plaintext password)
  //    To rotate: hash a new password and paste it here, then update the
  //    Ko-fi delivery email to match.
  //    bash/macOS:  echo -n "YOUR_PASSWORD" | shasum -a 256
  unlockHash: "e51f55411784ad57f189d015a12ed7ab7e986499b2696df53b81f2926a979ece",

  // 3) Ko-fi API key — verifies a buyer's Ko-fi email on the product page
  //    (client-side GET to ko-fi.com/api/verify?api_token=...&email=...).
  //    Ko-fi documents this key for client-side verification; it cannot be
  //    used to charge or read supporter lists beyond yes/no per email.
  koFiApiKey: "15081d98-b414-47a6-a56d-47d01f9fb14b",

  // 4) Optional: free-checklist email capture endpoint (Formspree or
  //    similar). Leave empty to show the "not open yet" fallback state.
  formEndpoint: "",

  // Sale note shown under pricing (leave empty to hide).
  saleNote: "One-time payment · $19.90. Instant delivery by email.",
};