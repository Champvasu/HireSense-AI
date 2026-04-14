import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { validateEnvironmentOrThrow } from "@/lib/config/envValidation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

// Validate environment variables at startup
if (typeof window === 'undefined') {
  try {
    validateEnvironmentOrThrow();
  } catch (error) {
    console.error('Environment validation failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export const metadata = {
  title: "HireSense AI - Find Your Dream Internship",
  description: "Discover verified internships with AI-powered matching. Connect with top employers and land your perfect role.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-[#F5F6FA] text-[#1A1A2E]`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
