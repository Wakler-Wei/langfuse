import { prisma } from "@langfuse/shared/src/db";
import { type GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

// This url is deprecated, we keep this redirect page for backward compatibility
export const getServerSideProps: GetServerSideProps = async (context) => {
  if (!context.params) {
    return {
      notFound: true,
    };
  }

  const projectId = context.params.projectId as string;
  const evaluatorId = context.params.configId as string;

  const evaluator = await prisma.jobConfiguration.findUnique({
    where: {
      id: evaluatorId,
      projectId,
    },
    select: {
      project: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!evaluator) {
    return {
      notFound: true,
    };
  }

  return {
    redirect: {
      destination: `/project/${projectId}/evals/${evaluatorId}`,
      permanent: false,
    },
  };
};

export default function RedirectPage() {
  const tAuto = useAutoTranslations();
  const router = useRouter();
  if (router.isFallback) {
    return <div className="p-3">{tAuto("loading_b04ba49")}</div>;
  }

  return <div>{tAuto("redirecting_a7e1d42")}</div>;
}
