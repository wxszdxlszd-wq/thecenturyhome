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
  //    DEMO PASSWORD: "oldhouse2026"  (for local preview & testing)
  //    IMPORTANT: generate a fresh password + hash before going live.
  //    PowerShell:  [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes("YOUR_PASSWORD"))).Replace("-","").ToLower()
  //    bash/macOS:  echo -n "YOUR_PASSWORD" | shasum -a 256
  //    The password in your Ko-fi delivery message/email MUST match the
  //    plaintext you hash here.
  unlockHash: "9e51be03e5cd0a021db891f3b61c607b9ed1a8a4db86bea931b2d05ca94f1c99",

  // 3) Optional: free-checklist email capture endpoint (Formspree or
  //    similar). Leave empty to show the "not open yet" fallback state.
  formEndpoint: "",

  // Sale note shown under pricing (leave empty to hide).
  saleNote: "One-time payment · $19.90. Instant delivery by email.",
};

