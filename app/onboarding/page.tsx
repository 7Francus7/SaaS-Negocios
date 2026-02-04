import { checkOnboardingStatus } from "@/app/actions/onboarding";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
       const { completed } = await checkOnboardingStatus();

       // Si ya completó el onboarding, redirigir al dashboard
       if (completed) {
              redirect("/dashboard");
       }

       return <OnboardingWizard />;
}
