import { headers } from "next/headers";

/**
 * Detects device type based on User-Agent header
 * @returns {Promise<'mobile' | 'tablet' | 'desktop'>}
 */
export async function getDeviceType() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|PlayBook|Silk/i.test(userAgent);
  
  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}
