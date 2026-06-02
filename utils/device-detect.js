import { headers } from "next/headers";

/**
 * Detects device type and OS based on User-Agent header
 * @returns {Promise<{type: 'mobile' | 'tablet' | 'desktop', os: 'android' | 'ios' | 'other', isAndroid: boolean, isIOS: boolean}>}
 */
export async function getDeviceInfo() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  
  const isAndroid = /Android/i.test(userAgent);
  const isAndroidPhone = isAndroid && /Mobile/i.test(userAgent);
  const isAndroidTablet = isAndroid && !/Mobile/i.test(userAgent);
  
  const isIPhone = /iPhone|iPod/i.test(userAgent);
  const isIPad = /iPad/i.test(userAgent);
  
  const isOtherMobile = /webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isOtherTablet = /PlayBook|Silk/i.test(userAgent);

  let type = "desktop";
  if (isAndroidPhone || isIPhone || isOtherMobile) {
    type = "mobile";
  } else if (isAndroidTablet || isIPad || isOtherTablet) {
    type = "tablet";
  }

  let os = "other";
  if (isAndroid) {
    os = "android";
  } else if (isIPhone || isIPad) {
    os = "ios";
  }

  return {
    type,
    os,
    isAndroid: os === "android",
    isIOS: os === "ios"
  };
}
export async function getDeviceType() {
  const info = await getDeviceInfo();
  return info.type;
}
