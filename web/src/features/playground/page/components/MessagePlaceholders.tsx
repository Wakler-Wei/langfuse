import { Separator } from "@/src/components/ui/separator";
import { usePlaygroundContext } from "../context";
import { MessagePlaceholderComponent } from "./MessagePlaceholderComponent";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export const MessagePlaceholders = () => {
  const tAuto = useAutoTranslations();
  const { messagePlaceholders } = usePlaygroundContext();

  return (
    <div className="flex h-full flex-col">
      {messagePlaceholders.length === 0 ? (
        <div className="text-xs">
          <p className="mb-2">
            {tAuto("no_message_placeholders_defined_5d7facb")}
          </p>
          <p>
            {tAuto(
              "placeholders_can_be_used_to_e_g_inject_message_histo_b8d6e45",
            )}{" "}
          </p>
        </div>
      ) : (
        <div className="h-full overflow-auto">
          {messagePlaceholders
            .slice()
            .sort((a, b) => {
              if (a.isUsed && !b.isUsed) return -1;
              if (!a.isUsed && b.isUsed) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((placeholder, index) => (
              <div key={placeholder.name}>
                <MessagePlaceholderComponent messagePlaceholder={placeholder} />
                {index !== messagePlaceholders.length - 1 && (
                  <Separator className="my-2" />
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
