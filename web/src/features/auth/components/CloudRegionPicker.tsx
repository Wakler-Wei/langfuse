import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/src/components/ui/select";
import type { CloudRegion } from "@/src/features/organizations/cloudRegions";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

export function CloudRegionPicker({
  regions,
  selectedRegion,
  onValueChange,
  isSignUpPage,
}: {
  regions: CloudRegion[];
  selectedRegion?: CloudRegion;
  onValueChange: (value: CloudRegion["name"]) => void;
  isSignUpPage?: boolean;
}) {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();
  return (
    <div className="bg-card mt-8 -mb-10 rounded-lg px-6 py-6 text-sm sm:mx-auto sm:w-full sm:max-w-[480px] sm:rounded-lg sm:px-10">
      <div className="flex w-full flex-col gap-2">
        <div>
          <span className="text-sm leading-none font-bold">
            {tAuto("data_region_301ee19")} <DataRegionInfo />
          </span>
          {isSignUpPage && selectedRegion?.name === "HIPAA" ? (
            <p className="text-muted-foreground text-xs">
              {tAuto(
                "demo_project_is_not_available_in_the_hipaa_data_regi_3785631",
              )}{" "}
            </p>
          ) : null}
        </div>
        <Select value={selectedRegion?.name} onValueChange={onValueChange}>
          <SelectTrigger
            className="w-full"
            disableValueLineClamp
            aria-label={
              selectedRegion
                ? tAuto("value0_data_region_c7f4b89", {
                    value0: selectedRegion.name,
                  })
                : undefined
            }
          >
            {selectedRegion ? (
              <CloudRegionLabel region={selectedRegion} />
            ) : null}
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) => (
              <SelectItem key={region.name} value={region.name}>
                <CloudRegionLabel region={region} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedRegion?.name === "HIPAA" && (
          <div className="bg-muted/50 text-muted-foreground mt-2 rounded-md p-3 text-xs">
            <p>
              {tAutoI18n(
                "the_business_associate_agreement_baa_is_only_effecti_332a193",
              )}{" "}
              <a
                href="https://langfuse.com/security/hipaa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover underline"
              >
                {tAuto("learn_more_about_hipaa_compliance_cb72b60")}{" "}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CloudRegionLabel({ region }: { region: CloudRegion }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={
          region.name === "HIPAA"
            ? "translate-y-[-3px] text-xl leading-none"
            : "-translate-y-px text-xl leading-none"
        }
      >
        {region.flag}
      </span>
      <span>{region.name}</span>
    </span>
  );
}

const DataRegionInfo = () => {
  const tAutoI18n = useAutoTranslations();
  const tAuto = useAutoTranslations();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <a
          href="#"
          className="text-link hover:text-link-hover ml-1 text-xs"
          title={tAuto("what_is_this_title_b4e2f1c")}
          tabIndex={-1}
        >
          {tAutoI18n("what_is_this_2ebc93b")}{" "}
        </a>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tAutoI18n("data_regions_f685dc8")}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DialogDescription className="flex flex-col gap-2">
            <p>
              {tAutoI18n(
                "langfuse_cloud_is_available_in_four_data_regions_93137d7",
              )}
            </p>
            <ul className="list-disc pl-5">
              <li>{tAutoI18n("us_oregon_aws_us_west_2_b72aa39")}</li>
              <li>{tAutoI18n("eu_ireland_aws_eu_west_1_b22a6f0")}</li>
              <li>{tAutoI18n("jp_tokyo_aws_ap_northeast_1_22d3c1c")}</li>
              <li>
                {tAutoI18n(
                  "hipaa_oregon_aws_us_west_2_hipaa_compliant_region_av_c62b1cc",
                )}{" "}
              </li>
            </ul>
            <p>
              {tAutoI18n(
                "regions_are_strictly_separated_and_no_data_is_shared_f48da5b",
              )}{" "}
            </p>
            <p>
              {tAutoI18n(
                "you_can_have_accounts_in_multiple_regions_each_regio_39c932c",
              )}{" "}
            </p>
            <p>
              {tAutoI18n("learn_more_about_2b2b87c")}{" "}
              <a
                href="https://langfuse.com/security/data-regions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover underline"
              >
                {tAutoI18n("data_regions_4d679f8")}{" "}
              </a>{" "}
              {tAutoI18n("and_cffa50a")}{" "}
              <a
                href="https://langfuse.com/docs/data-security-privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:text-link-hover underline"
              >
                {tAutoI18n("data_security_privacy_091d833")}{" "}
              </a>
              .
            </p>
          </DialogDescription>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
