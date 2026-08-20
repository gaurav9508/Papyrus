import { auth } from "@clerk/nextjs/server";
import { AppShell } from "./AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();

  return <AppShell>{children}</AppShell>;
}
