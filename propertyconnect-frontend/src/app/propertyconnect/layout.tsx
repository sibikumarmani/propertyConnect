import { Template } from "@/components/auth/template";

export default function PropertyConnectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Template>{children}</Template>;
}
