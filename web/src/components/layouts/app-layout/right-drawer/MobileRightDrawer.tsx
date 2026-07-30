import { type PropsWithChildren } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { useSupportDrawer } from "@/src/features/support-chat/SupportDrawerProvider";
import { SupportDrawer } from "@/src/features/support-chat/SupportDrawer";
import { useV4MigrationPanel } from "@/src/features/v4-migration/V4MigrationPanelProvider";
import { V4MigrationPanel } from "@/src/features/v4-migration/V4MigrationPanel";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function MobileRightDrawer({ children }: PropsWithChildren) {
  const tAuto = useAutoTranslations();
  const { open: supportOpen, setOpen: setSupportOpen } = useSupportDrawer();
  const { open: migrationOpen, setOpen: setMigrationOpen } =
    useV4MigrationPanel();

  return (
    <>
      <main className="h-full flex-1" style={{ overscrollBehaviorY: "none" }}>
        {children}
      </main>

      <Drawer
        open={supportOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSupportOpen(false);
          }
        }}
        forceDirection="bottom"
      >
        <DrawerContent
          id="support-drawer"
          className="min-h-screen-with-banner inset-x-0 top-[calc(var(--banner-offset)+10px)] bottom-0"
          size="full"
        >
          <DrawerHeader className="absolute inset-x-0 top-0 p-0 text-left">
            <div className="flex w-full items-center justify-center pt-3">
              <div className="bg-muted h-2 w-20 rounded-full" />
            </div>
            {/* sr-only for screen readers and accessibility */}
            <DrawerTitle className="sr-only">
              {tAuto("support_f32d5a3")}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {tAuto(
                "a_list_of_resources_and_options_to_help_you_with_you_a35ed6b",
              )}{" "}
            </DrawerDescription>
          </DrawerHeader>
          <div className="mt-4 max-h-full">
            <SupportDrawer showCloseButton={false} className="h-full pb-20" />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer
        open={migrationOpen}
        onOpenChange={(open) => {
          if (!open) {
            setMigrationOpen(false);
          }
        }}
        forceDirection="bottom"
      >
        <DrawerContent
          id="v4-migration-drawer"
          className="min-h-screen-with-banner inset-x-0 top-[calc(var(--banner-offset)+10px)] bottom-0"
          size="full"
        >
          <DrawerHeader className="absolute inset-x-0 top-0 p-0 text-left">
            <div className="flex w-full items-center justify-center pt-3">
              <div className="bg-muted h-2 w-20 rounded-full" />
            </div>
            {/* sr-only for screen readers and accessibility */}
            <DrawerTitle className="sr-only">
              {tAuto("migrate_to_v4_5967566")}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {tAuto(
                "information_about_migrating_to_langfuse_v4_and_upcom_6f692c9",
              )}{" "}
            </DrawerDescription>
          </DrawerHeader>
          <div className="mt-4 max-h-full">
            <V4MigrationPanel
              showCloseButton={false}
              className="h-full pb-20"
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
