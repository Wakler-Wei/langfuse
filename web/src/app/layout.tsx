import { I18nText } from "@/src/features/i18n/I18nText";
export const metadata = {
  title: "Next.js",
  description: <I18nText id="generated_by_next_js_f701538" />,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
