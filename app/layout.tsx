import "./globals.css";
export const metadata = { title: "CASE 047: THE MISSING FILE" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="font-sans">{children}</body></html>);
}
