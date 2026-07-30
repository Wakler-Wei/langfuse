import { env } from "@/src/env.mjs";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const RagasLogoIcon = () => {
  const tAuto = useAutoTranslations();
  const assetPath = `${env.NEXT_PUBLIC_BASE_PATH ?? ""}/assets/ragas-logo.png`;

  return (
    <div className="flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath}
        alt={tAuto("ragas_logo_0ffc42e")}
        width={12}
        height={12}
      />
    </div>
  );
};
