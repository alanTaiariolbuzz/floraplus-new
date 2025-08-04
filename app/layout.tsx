import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "@fontsource/roboto";
import "@fontsource/roboto/100.css";
import "@fontsource/roboto/200.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/600.css";
import "@fontsource/roboto/700.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import { createClient } from "@/utils/supabase/server";
import ClientLayout from "./components/ClientLayout";

export const metadata = {
  metadataBase: new URL("https://app.getfloraplus.com/"),
  title: "FloraPlus",
  description: "Book Tours & Activities",
  openGraph: {
    images: [
      {
        url: "/images/flora-logo.svg",
        width: 44,
        height: 14,
        alt: "FloraPlus Logo",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="text-foreground">
        <ThemeRegistry>
          <AppRouterCacheProvider>
            <ClientLayout initialUser={session?.user ?? null}>
              <main className="">{children}</main>
            </ClientLayout>
          </AppRouterCacheProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
