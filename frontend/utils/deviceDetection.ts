/**
 * deviceDetection.ts - Utilitas untuk deteksi perangkat dan pengaturan container modal
 */

/**
 * Cek apakah perangkat saat ini adalah perangkat mobile
 * 
 * @returns boolean - true jika perangkat mobile, false jika desktop
 */
export function isMobileDevice(): boolean {
  // Hanya berjalan di lingkungan browser
  if (typeof window === 'undefined') return false;
  
  // Deteksi berdasarkan user agent
  const userAgent = window.navigator.userAgent;
  
  // Pola untuk mendeteksi perangkat mobile
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  return mobileRegex.test(userAgent);
}

/**
 * Cek apakah layar memiliki lebar yang cukup untuk sidebar
 * 
 * @param minWidth - Lebar minimum untuk sidebar dalam piksel (default: 768 - ukuran tablet)
 * @returns boolean - true jika layar memiliki lebar yang cukup
 */
export function isWideEnoughForSidebar(minWidth: number = 768): boolean {
  // Hanya berjalan di lingkungan browser
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth >= minWidth;
}

/**
 * Tentukan jenis container optimal berdasarkan perangkat
 * 
 * @param preferredContainer - Container yang disukai (default: sidebar)
 * @returns "dialog" | "sidebar" - Jenis container yang sesuai
 */
export function getDeviceOptimalContainer(
  preferredContainer: "dialog" | "sidebar" = "sidebar"
): "dialog" | "sidebar" {
  // Dialog lebih baik untuk perangkat mobile atau layar kecil
  // Sidebar lebih baik untuk desktop dan layar lebar
  
  // Explicit preference (dialog/sidebar) takes highest priority on non-mobile devices
  if (preferredContainer === "dialog" || preferredContainer === "sidebar") {
    // However, mobile always overrides to dialog unless it's already dialog
    if (isMobileDevice()) {
      return "dialog";
    }
    // If not mobile, and screen is too narrow for sidebar, force dialog
    if (preferredContainer === "sidebar" && !isWideEnoughForSidebar()) {
      return "dialog";
    }
    return preferredContainer; // Respect preference if on desktop and wide enough
  }
  
  // Fallback logic if preferredContainer was somehow not dialog or sidebar (should not happen with TS)
  // Mobile selalu dialog
  if (isMobileDevice()) {
    return "dialog";
  }
  
  // Jika layar terlalu kecil, gunakan dialog
  if (!isWideEnoughForSidebar()) {
    return "dialog";
  }
  
  // Default ke sidebar untuk desktop dengan layar lebar jika tidak ada preferensi kuat
  return "sidebar";
} 