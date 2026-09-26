import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// تسجيل Service Worker فور الإقلاع — شرط أساسي ليقدّم كروم "تثبيت التطبيق" (WebAPK)
// بدلاً من "إنشاء اختصار". مستقل عن تسجيل الدخول وعن إشعارات Push.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[SW] فشل تسجيل /sw.js:", err);
    });
  });
}
