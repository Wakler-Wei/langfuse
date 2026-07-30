import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { type EvalCapabilities } from "@/src/features/evals/hooks/useEvalCapabilities";
import {
  isTraceTarget,
  isEventTarget,
  isExperimentTarget,
  isDatasetTarget,
} from "@/src/features/evals/utils/typeHelpers";
import { I18nText } from "@/src/features/i18n/I18nText";

interface EvalVersionCalloutProps {
  targetObject: string;
  evalCapabilities: EvalCapabilities;
}

interface CalloutContent {
  visible: boolean;
  title: React.ReactNode;
  description: React.ReactNode;
}

const getCalloutContent = (
  targetObject: string,
  evalCapabilities: EvalCapabilities,
): CalloutContent => {
  const hidden = { visible: false, title: "", description: "" };

  // For event/observation target
  if (isEventTarget(targetObject)) {
    if (evalCapabilities.isNewCompatible) {
      return hidden;
    }

    return {
      visible: true,
      title: <I18nText id="please_verify_your_sdk_version_d6fd5a1" />,
      description: (
        <>
          <I18nText id="this_evaluator_targets_observations_which_require_js_43248f5" />{" "}
          <a
            href="https://langfuse.com/docs/observability/sdk/upgrade-path"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            <I18nText id="learn_more_824d76b" />{" "}
          </a>
          .
        </>
      ),
    };
  }

  // For experiment target (Experiment Runner SDK)
  if (isExperimentTarget(targetObject)) {
    if (!evalCapabilities.isNewCompatible) {
      return {
        visible: true,
        title: (
          <I18nText id="please_verify_you_are_using_the_experiment_runner_sd_8eba1cc" />
        ),
        description: (
          <>
            <I18nText id="the_experiment_runner_sdk_requires_js_sdk_v4_4_or_py_dc05482" />{" "}
            <a
              href="https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk#experiment-runner-sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-blue font-bold hover:opacity-80"
            >
              <I18nText id="learn_more_about_the_experiment_runner_sdk_9290166" />{" "}
            </a>
            .
          </>
        ),
      };
    }

    return hidden;
  }

  // For dataset target (legacy dataset run methods)
  if (isDatasetTarget(targetObject)) {
    return {
      visible: true,
      title: <I18nText id="legacy_low_level_sdk_methods_bc3d8cd" />,
      description: (
        <>
          <I18nText id="this_evaluator_targets_traces_from_legacy_low_level__ad86a5b" />{" "}
          <a
            href="https://langfuse.com/docs/evaluation/experiments/experiments-via-sdk#experiment-runner-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            <I18nText id="learn_more_824d76b" />{" "}
          </a>
          .
        </>
      ),
    };
  }

  // For trace target
  if (isTraceTarget(targetObject)) {
    return {
      visible: true,
      title: (
        <I18nText id="consider_upgrading_to_observation_evaluators_2e097dd" />
      ),
      description: (
        <>
          <I18nText id="observation_evaluators_provide_more_granular_control_ffe074e" />{" "}
          <a
            href="https://langfuse.com/faq/all/llm-as-a-judge-migration"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dark-blue font-bold hover:opacity-80"
          >
            <I18nText id="learn_more_824d76b" />{" "}
          </a>
          .
        </>
      ),
    };
  }

  return hidden;
};

export function EvalVersionCallout({
  targetObject,
  evalCapabilities,
}: EvalVersionCalloutProps) {
  const content = getCalloutContent(targetObject, evalCapabilities);

  if (!content.visible) {
    return null;
  }

  return (
    <Alert
      variant="default"
      className="border-dark-yellow bg-light-yellow mt-2 max-w-4xl"
    >
      <AlertTriangle className="text-dark-yellow h-4 w-4" />
      <AlertDescription>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-foreground font-bold">{content.title}</span>
            <span className="text-foreground text-sm">
              {content.description}
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
