import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { CodeMirrorEditor } from "@/src/components/editor";
import { showErrorToast } from "@/src/features/notifications/showErrorToast";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

type JSONSchemaEditorMode = "json"; // Future: "json" | "builder"

type JSONSchemaEditorProps = {
  /**
   * The JSON Schema as a string
   */
  value: string;
  /**
   * Callback when schema changes
   */
  onChange: (value: string) => void;
  /**
   * Editor mode - currently only "json", future: visual "builder"
   */
  mode?: JSONSchemaEditorMode;
  /**
   * Maximum height CSS class
   */
  className?: string;
  /**
   * Whether the editor is disabled
   */
  disabled?: boolean;
  /**
   * Show help text with link to JSON Schema docs
   */
  showHelp?: boolean;
};

/**
 * Reusable JSON Schema editor component
 * Currently supports JSON text editing mode
 * Designed to be extended with visual schema builder in the future
 */
export const JSONSchemaEditor: React.FC<JSONSchemaEditorProps> = ({
  value,
  onChange,
  mode = "json",
  className = "max-h-[25vh]",
  disabled = false,
  showHelp = true,
}) => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  const prettifyJson = () => {
    try {
      const parsedJson = JSON.parse(value);
      const prettified = JSON.stringify(parsedJson, null, 2);
      onChange(prettified);
    } catch {
      showErrorToast(
        tAutoI18n("failed_to_prettify_json_074c7e8"),
        tAutoI18n("please_verify_your_input_is_valid_json_fe436a3"),
        "WARNING",
      );
    }
  };

  // Future: Add builder mode UI here
  if (mode === "json") {
    return (
      <div className="flex flex-col gap-2">
        {showHelp && (
          <p className="text-muted-foreground text-sm">
            {tAutoI18n("define_the_structure_using_json_schema_format_299665f")}{" "}
            <a
              href="https://json-schema.org/learn/miscellaneous-examples"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center underline"
            >
              {tAuto("see_json_schema_examples_27b4234")}{" "}
              <ArrowUpRight className="ml-0.5 h-3 w-3" />
            </a>
          </p>
        )}
        <div className="relative flex flex-col gap-1">
          <CodeMirrorEditor
            value={value}
            onChange={onChange}
            mode="json"
            minHeight={100}
            className={className}
            editable={!disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={prettifyJson}
            disabled={disabled}
            className="absolute top-3 right-3 text-xs"
          >
            {tAuto("prettify_1a7e7a5")}{" "}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          {tAuto("must_be_a_valid_json_schema_object_f0871e4")}{" "}
        </p>
      </div>
    );
  }

  // Future mode implementations go here
  return null;
};
