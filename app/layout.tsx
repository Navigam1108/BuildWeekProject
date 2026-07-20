import "./globals.css";

export const metadata = {
  title: "Scout Interviews",
  description: "Fair, evidence-based live coding interviews"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
