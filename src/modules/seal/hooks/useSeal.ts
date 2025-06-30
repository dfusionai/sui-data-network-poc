import { useAppContext } from "@/app-context";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { CONFIG, transformFile, uploadToWalrus, type IFileMetadata } from "@/utils";
import { Transaction } from "@mysten/sui/transactions";
import { EncryptedObject } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { useMystenClient } from "@/hooks/useMystenClient";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { IProcessDataRes } from "./type";
import { THRESHOLD } from "./constant";

export const useSeal = () => {
  const [sealingStatus, setSealingStatus] = useState<{
    isEncrypting: boolean;
    isProcessing: boolean;
  }>({
    isEncrypting: false,
    isProcessing: false,
  });
  const { sealClient, signAndExecuteTransaction, suiClient } =
    useMystenClient();
  const account = useCurrentAccount();
  const {
    updateOnChainFileObjId,
    updatePolicyId,
    updateBlobId,
    updateAttestationObjectId,
    updateRefinedFileBlobId,
    updateRefinedFileOnChainObjId,
    resetSealInfo,
    sealInfo,
  } = useAppContext();
  const { blobId, policyObjectId, onChainFileObjId, file } = sealInfo;

  const onProcessData = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      setSealingStatus((prev) => ({
        ...prev,
        isProcessing: true,
      }));

      const processDataRes: IProcessDataRes = await fetch(
        `${CONFIG.NAUTILUS_URL}/process_data`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            payload: {
              timeout_secs: 120,
              args: [
                account?.address,
                blobId,
                onChainFileObjId,
                policyObjectId,
                String(THRESHOLD),
              ],
            },
          }),
        }
      ).then((res) => res.json());

      updateAttestationObjectId(processDataRes.data.attestationObjId);
      updateRefinedFileBlobId(processDataRes.data.blobId);
      updateRefinedFileOnChainObjId(processDataRes.data.onChainFileObjId);
    } catch (error) {
      console.log("🚀 ~ onDecrypt ~ error:", error);
    } finally {
      setSealingStatus((prev) => ({
        ...prev,
        isProcessing: false,
      }));
    }
  };

  const createPolicy = async () => {
    const tx = new Transaction();
    tx.setGasBudget(10000000);

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::seal_manager::create_access_policy`,
      arguments: [tx.pure.vector("address", [account?.address || ""])],
    });

    const result = await signAndExecuteTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });

    let policyObjId: string | null = null;

    while (!policyObjId) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const tx = await suiClient.getTransactionBlock({
          digest: result.digest,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        });
        policyObjId = tx.effects?.created?.[0]?.reference?.objectId || null;
      } catch (error) {
        console.log("🚀 ~ createPolicy ~ error:", error);
      }
    }

    updatePolicyId(policyObjId);

    return policyObjId;
  };

  const saveEncryptedFileOnChain = async (
    blobId: string,
    policyObjId: string,
    metadata: IFileMetadata
  ) => {
    const encryptedFile = await fetch(
      `${CONFIG.WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`,
      {
        headers: {
          "Content-Type": "application/octet-stream",
        },
        method: "GET",
      }
    ).then((res) => res.arrayBuffer());

    const encryptedData = new Uint8Array(encryptedFile);
    const encryptedObject = EncryptedObject.parse(encryptedData);
    const tx = new Transaction();
    tx.setGasBudget(10000000);

    const metadataBytes = new Uint8Array(
      new TextEncoder().encode(JSON.stringify(metadata))
    );

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::seal_manager::save_encrypted_file`,
      arguments: [
        tx.pure.vector("u8", fromHex(encryptedObject.id)),
        tx.object(policyObjId),
        tx.pure.vector("u8", metadataBytes),
      ],
    });

    const result = await signAndExecuteTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });

    let encryptedFileObjId: string | null = null;
    // polling to make sure the obj is created
    while (!encryptedFileObjId) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const tx = await suiClient.getTransactionBlock({
          digest: result.digest,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        });
        encryptedFileObjId =
          tx.effects?.created?.[0]?.reference?.objectId || null;
      } catch (error) {
        console.log("🚀 ~ saveEncryptedFileOnChain ~ error:", error);
      }
    }

    updateOnChainFileObjId(encryptedFileObjId);

    return encryptedFileObjId;
  };

  const onEncrypt = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!file) {
      toast.error("Please select a jsonfile");
      return;
    }

    try {
      resetSealInfo();
      setSealingStatus((prev) => ({
        ...prev,
        isEncrypting: true,
      }));
  
      const policyObjId = await createPolicy();
      const policyObjectBytes = fromHex(policyObjId);
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
      const jsonData = await transformFile(file);
      const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: THRESHOLD,
        packageId: CONFIG.PACKAGE_ID,
        id,
        data: new Uint8Array(
          new TextEncoder().encode(JSON.stringify(jsonData))
        ),
      });

      const walrusUploadRes = await uploadToWalrus(encryptedBytes);
      console.log("🚀 ~ onEncrypt ~ encryptedBytes:", encryptedBytes)
      updateBlobId(walrusUploadRes.blobId);

      await saveEncryptedFileOnChain(
        walrusUploadRes.blobId,
        policyObjId,
        walrusUploadRes.metadata
      );
    } catch (error) {
      console.log("🚀 ~ onEncrypt ~ error:", error);
    } finally {
      setSealingStatus((prev) => ({
        ...prev,
        isEncrypting: false,
      }));
    }
  };

  const buttonStatus = useMemo(() => {
    const isProcessBtnDisabled =
      !sealInfo.onChainFileObjId ||
      !sealInfo.policyObjectId ||
      sealingStatus.isEncrypting ||
      sealingStatus.isProcessing;

    const isEncryptButtonDisabled =
      sealingStatus.isEncrypting || sealingStatus.isProcessing;

    return {
      isProcessBtnDisabled,
      isEncryptButtonDisabled,
    };
  }, [sealInfo.onChainFileObjId, sealInfo.policyObjectId, sealingStatus.isEncrypting, sealingStatus.isProcessing]);

  return {
    onProcessData,
    onEncrypt,
    sealingStatus,
    buttonStatus,
  };
};
