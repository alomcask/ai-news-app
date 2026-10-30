import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Suspense>
        <SignIn path="/sign-in" routing="path" fallbackRedirectUrl="/dashboard" />
      </Suspense>
    </main>
  );
}
