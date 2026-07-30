import { useWatch } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { PasswordInput } from "@/src/components/ui/password-input";
import { Switch } from "@/src/components/design-system/Switch/Switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { BlobStorageIntegrationType } from "@langfuse/shared";
import { useLangfuseCloudRegion } from "@/src/features/organizations/hooks";
import { type BlobStorageFormControl } from "@/src/features/blobstorage-integration/components/formValues";
import { useAutoTranslations } from "@/src/features/i18n/I18nText";

// Provider selection plus the connection fields whose labels and visibility
// depend on it: bucket/container, endpoint, region, path style, credentials,
// and prefix.
export const StorageProviderFields = ({
  control,
}: {
  control: BlobStorageFormControl;
}) => {
  const tAuto = useAutoTranslations();
  const { isLangfuseCloud } = useLangfuseCloudRegion();
  // Check if this is a self-hosted instance (no cloud region set)
  const isSelfHosted = !isLangfuseCloud;
  const integrationType =
    useWatch({ control, name: "type" }) ?? BlobStorageIntegrationType.S3;

  return (
    <>
      <FormField
        control={control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tAuto("storage_provider_cc4c92d")}</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={tAuto("select_provider_c7a9e8e")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S3">{tAuto("aws_s3_d14c093")}</SelectItem>
                  <SelectItem value="S3_COMPATIBLE">
                    {tAuto("s3_compatible_storage_adc7801")}{" "}
                  </SelectItem>
                  <SelectItem value="AZURE_BLOB_STORAGE">
                    {tAuto("azure_blob_storage_32c5383")}{" "}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              {tAuto("choose_your_cloud_storage_provider_ec2863e")}{" "}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="bucketName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? tAuto("container_name_5ccc984")
                : tAuto("bucket_name_04ba7bb")}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? tAuto(
                    "azure_container_name_3_63_chars_lowercase_letters_nu_a0708e9",
                  )
                : tAuto("the_s3_bucket_name_413f3b8")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Endpoint URL field - Only shown for S3-compatible and Azure */}
      {integrationType !== "S3" && (
        <FormField
          control={control}
          name="endpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAuto("endpoint_url_65aaaa4")}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                {integrationType === "AZURE_BLOB_STORAGE"
                  ? "Azure Blob Storage endpoint URL (e.g., https://accountname.blob.core.windows.net)"
                  : "S3 compatible endpoint URL (e.g., https://play.min.io)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Region field - Only shown for AWS S3 or compatible storage */}
      {integrationType !== "AZURE_BLOB_STORAGE" && (
        <FormField
          control={control}
          name="region"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAuto("region_0f21717")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                {integrationType === "S3"
                  ? tAuto("aws_region_e_g_us_east_1_c73f8cd")
                  : tAuto("s3_compatible_storage_region_ad34ed2")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Force Path Style switch - Only shown for S3-compatible */}
      {integrationType === "S3_COMPATIBLE" && (
        <FormField
          control={control}
          name="forcePathStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tAuto("force_path_style_6638dd2")}</FormLabel>
              <FormControl>
                <div className="mt-1 ml-4">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              </FormControl>
              <FormDescription>
                {tAuto(
                  "enable_for_minio_and_some_other_s3_compatible_provid_cf08709",
                )}{" "}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="accessKeyId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? tAuto("storage_account_name_a6ed9d3")
                : integrationType === "S3"
                  ? tAuto("aws_access_key_id_800021b")
                  : tAuto("access_key_id_5d85075")}
              {/* Show optional indicator for S3 types on self-hosted instances with entitlement */}
              {isSelfHosted && integrationType === "S3" && (
                <span className="text-muted-foreground">
                  {" "}
                  {tAuto("optional_b16c7ac")}
                </span>
              )}
            </FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? tAuto("your_azure_storage_account_name_ff31fc0")
                : integrationType === "S3"
                  ? isSelfHosted
                    ? tAuto(
                        "your_aws_iam_user_access_key_id_leave_empty_to_use_h_871f973",
                      )
                    : tAuto("your_aws_iam_user_access_key_id_67ddfe8")
                  : tAuto("access_key_for_your_s3_compatible_storage_9ec6091")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="secretAccessKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? tAuto("storage_account_key_4ffa4c4")
                : integrationType === "S3"
                  ? tAuto("aws_secret_access_key_8b9bdfe")
                  : tAuto("secret_access_key_c67584c")}
              {/* Show optional indicator for S3 types on self-hosted instances with entitlement */}
              {isSelfHosted && integrationType === "S3" && (
                <span className="text-muted-foreground">
                  {" "}
                  {tAuto("optional_b16c7ac")}
                </span>
              )}
            </FormLabel>
            <FormControl>
              <PasswordInput
                placeholder="********************"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? tAuto("your_azure_storage_account_access_key_8f1ba3a")
                : integrationType === "S3"
                  ? isSelfHosted
                    ? tAuto(
                        "your_aws_iam_user_secret_access_key_leave_empty_to_u_3990a03",
                      )
                    : tAuto("your_aws_iam_user_secret_access_key_db229aa")
                  : tAuto("secret_key_for_your_s3_compatible_storage_7ebc1cb")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{tAuto("export_prefix_614d096")}</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormDescription>
              {integrationType === "AZURE_BLOB_STORAGE"
                ? tAuto(
                    "optional_prefix_path_for_exported_files_in_your_azur_b86b4d0",
                  )
                : integrationType === "S3"
                  ? tAuto(
                      "optional_prefix_path_for_exported_files_in_your_s3_b_5bfb526",
                    )
                  : tAuto(
                      "optional_prefix_path_for_exported_files_e_g_langfuse_c87bf26",
                    )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
