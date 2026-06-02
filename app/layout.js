import "./globals.css";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import ProfileCompletionModal from "@/components/ProfileCompletionModal";
import BugReportButton from "@/components/BugReportButton";

export const metadata = {
  title: "Mission ON - Smart Choices — YI Erode Chapter",
  description: "Substance Abuse Awareness Management Platform by Young Indians Erode Chapter. Manage school assessments, module deployment, mentor allocation, and program feedback.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { getDeviceInfo } from "@/utils/device-detect";

export default async function RootLayout({ children }) {
  const deviceInfo = await getDeviceInfo();

  return (
    <html lang="en" className={`${deviceInfo.type} ${deviceInfo.os}`}>
      <body className={`device-${deviceInfo.type} os-${deviceInfo.os}`}>
        <ThemeProvider>
          {children}
          <ProfileCompletionModal />
          <ThemeToggle />
          <BugReportButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
