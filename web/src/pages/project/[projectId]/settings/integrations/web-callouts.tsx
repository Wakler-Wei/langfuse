import ContainerPage from "@/src/components/layouts/container-page";
import { WebCalloutSettingsPage } from "@/src/features/web-callouts/components/WebCalloutSettingsPage";
import { useRouter } from "next/router";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export default function WebCalloutsSettings() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  const projectId = router.query.projectId as string | undefined;

  if (!projectId) {
    return null;
  }

  return (
    <ContainerPage
      headerProps={{
        title: tAuto("web_callouts_c78f412"),
        breadcrumb: [
          { name: "Settings", href: `/project/${projectId}/settings` },
        ],
      }}
    >
      <WebCalloutSettingsPage projectId={projectId} />
    </ContainerPage>
  );
}
