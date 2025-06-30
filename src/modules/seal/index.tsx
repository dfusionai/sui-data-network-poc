import { useSeal } from "@/modules/seal/hooks/useSeal";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/app-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2Icon, Upload } from "lucide-react";
import { CONFIG } from "@/utils";

const Seal = () => {
  const { sealInfo, updateFile } = useAppContext();
  const { onProcessData, onEncrypt, sealingStatus, buttonStatus } = useSeal();
  const { isProcessBtnDisabled, isEncryptButtonDisabled } = buttonStatus;
  
  return (
    <div className="container mx-auto pt-8 ">
      <Card className="bg-gray-800/50 border-gray-700 py-0 overflow-hidden gap-0">
        <CardHeader className="bg-gray-800/80 border-b border-gray-700 pt-6">
          <CardTitle className="text-lg text-white font-bold">
            File Upload
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload and execute encryption and decryption
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6 bg-[#141b29]">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  className="bg-[#7c3aed] hover:bg-[#6d28e9]"
                  onClick={onEncrypt}
                  disabled={isEncryptButtonDisabled}
                >
                  {sealingStatus.isEncrypting && (
                    <Loader2Icon className="animate-spin" />
                  )}{" "}
                  Encrypt
                </Button>
                <Button
                  className="bg-[#7c3aed] hover:bg-[#6d28e9]"
                  onClick={onProcessData}
                  disabled={isProcessBtnDisabled}
                >
                  {sealingStatus.isProcessing && (
                    <Loader2Icon className="animate-spin" />
                  )}{" "}
                  Process Data
                </Button>
              </div>
              <h3 className="text-purple-500 font-bold mt-5 text-lg">
                Encryption Information
              </h3>
              <div className="mt-4">
                <div>
                  <strong className="text-gray-200">Policy ID:</strong>{" "}
                  <a
                    className="cursor-pointer"
                    href={`${CONFIG.SUISCAN_URL}/${sealInfo?.policyObjectId}`}
                    target="_blank"
                  >
                    {sealInfo?.policyObjectId || "-"}
                  </a>
                </div>
                <div>
                  <strong className="text-gray-200">Blob ID:</strong>{" "}
                  <a
                    className="cursor-pointer"
                    href={`${CONFIG.WALRUS_AGGREGATOR_URL}/v1/blobs/${sealInfo?.blobId}`}
                    target="_blank"
                  >
                    {sealInfo?.blobId || "-"}
                  </a>
                </div>
                <div>
                  <strong className="text-gray-200">
                    On Chain Encrypted File ID:
                  </strong>{" "}
                  <a
                    className="cursor-pointer"
                    href={`${CONFIG.SUISCAN_URL}/${sealInfo?.onChainFileObjId}`}
                    target="_blank"
                  >
                    {sealInfo?.onChainFileObjId || "-"}
                  </a>
                </div>
              </div>
              <h3 className="text-purple-500 font-bold mt-5 text-lg">
                Processed Data Information
              </h3>
              <div className="mt-4">
                <div>
                  <strong className="text-gray-200">Attestation ID:</strong>{" "}
                  <a
                    className="cursor-pointer"
                    href={`${CONFIG.SUISCAN_URL}/${sealInfo?.attestationObjectId}`}
                    target="_blank"
                  >
                    {sealInfo?.attestationObjectId || "-"}
                  </a>
                </div>
                <div>
                  <strong className="text-gray-200">
                    On Chain Refined File ID:
                  </strong>{" "}
                  <a
                    className="cursor-pointer"
                    href={`${CONFIG.SUISCAN_URL}/${sealInfo?.refinedFileOnChainObjId}`}
                    target="_blank"
                  >
                    {sealInfo?.refinedFileOnChainObjId || "-"}
                  </a>
                </div>
                <div>
                  <strong className="text-gray-200">
                    Refined File Blob ID:
                  </strong>{" "}
                  <a
                    className="cursor-pointer"
                    href={`${CONFIG.WALRUS_AGGREGATOR_URL}/v1/blobs/${sealInfo?.refinedFileBlobId}`}
                    target="_blank"
                  >
                    {sealInfo?.refinedFileBlobId || "-"}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Choose file:
              </label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer bg-gray-900/50">
                <input
                  accept=".json"
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      updateFile(file);
                    }
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="h-12 w-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="text-sm text-gray-400">
                    {sealInfo.file ? (
                      <span className="text-purple-400 font-medium">
                        {sealInfo.file.name}
                      </span>
                    ) : (
                      <span>Click to select or drag and drop</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    only JSON files are allowed
                  </div>
                </label>
              </div>
            </div>
          </div>
          {/* download decrypted file */}
          {/* <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 mr-4">
              Download decrypted file:
            </label>
            <Button
              className="bg-[#7c3aed] hover:bg-[#6d28e9]"
              onClick={() => {
                if (sealInfo.file) {
                  downloadJsonFile(
                    new File([JSON.stringify(teleChatExample)], "decrypted-file.json", { type: "application/json" }),
                    "decrypted-file.json"
                  );
                }
              }}
            >
              Download
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
};

export default Seal;
