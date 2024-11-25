import type { Metadata } from "next";
import { ClientLayout } from "./ClientLayout";
import "./globals.css";
import { isBeforeLaunch } from "@/constants";
import ComingSoon from "./coming-soon";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "higherrrrrrr.fun",
  description: "A new meme coin trading platform for evolutionary memes",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookie = (await cookies()).get("launch-override");
  const beforeLaunch = await isBeforeLaunch();

  let shouldRenderComingSoon = false;
  if (cookie) {
    shouldRenderComingSoon = cookie.value !== "true";
  } else {
    shouldRenderComingSoon = beforeLaunch;
  }

  return (
    <html lang="en">
      <body>
        {shouldRenderComingSoon ? (
          <ComingSoon />
        ) : (
          <ClientLayout>{children}</ClientLayout>
        )}
      </body>
    </html>
  );
}
