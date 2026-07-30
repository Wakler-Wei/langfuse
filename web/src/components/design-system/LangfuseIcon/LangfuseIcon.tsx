import { env } from "@/src/env.mjs";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type LangfuseIconProps = {
  size?: 14 | 16 | 28 | 32 | 42;
};

export const LangfuseIcon = ({ size = 32 }: LangfuseIconProps) => {
  const tAuto = useAutoTranslations();

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg`}
      width={size}
      height={size}
      alt={tAuto("langfuse_icon_97715ac")}
    />
  );
};
