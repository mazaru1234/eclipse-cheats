import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TelegramFloat } from "@/components/layout/TelegramFloat";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1 pb-20">{children}</main>
      <Footer />
      <TelegramFloat />
    </div>
  );
}