import { useAppContext } from "@/app-context";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { CONFIG, uploadToWalrus, type IFileMetadata } from "@/utils";
import { Transaction } from "@mysten/sui/transactions";
import { EncryptedObject, SessionKey } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";
import { useMystenClient } from "@/hooks/useMystenClient";
import { useMemo, useState } from "react";
import teleChatExample from "@/assets/examples/miner-normal-chat-fileDto.json";
import { toast } from "sonner";

export const useSeal = () => {
  const [sealingStatus, setSealingStatus] = useState<{
    isEncrypting: boolean;
    isDecrypting: boolean;
  }>({
    isEncrypting: false,
    isDecrypting: false,
  });
  const {
    sealClient,
    signAndExecuteTransaction,
    suiClient,
    signPersonalMessage,
  } = useMystenClient();
  const account = useCurrentAccount();
  const {
    updateOnChainFileObjId,
    updatePolicyId,
    updateBlobId,
    updateAttestationObjectId,
    updateDecryptedFile,
    resetSealInfo,
    sealInfo,
  } = useAppContext();
  const { blobId, policyObjectId, onChainFileObjId } = sealInfo;

  const registerAttestation = async () => {
    const tx = new Transaction();
    tx.setGasBudget(10000000);

    const encryptedFileExample = await fetch(
      `${CONFIG.WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`,
      {
        headers: {
          "Content-Type": "application/octet-stream",
        },
        method: "GET",
      }
    ).then((res) => res.arrayBuffer());

    if (!encryptedFileExample) {
      throw new Error("Failed to fetch encrypted data");
    }

    const encryptedData = new Uint8Array(encryptedFileExample);
    const encryptedObject = EncryptedObject.parse(encryptedData);

    tx.moveCall({
      target: `${CONFIG.PACKAGE_ID}::seal_manager::register_tee_attestation`,
      arguments: [
        tx.pure.vector("u8", new TextEncoder().encode("enclave_id")),
        tx.pure.vector("u8", fromHex(encryptedObject.id)),
      ],
    });

    const result = await signAndExecuteTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });

    let attestationObjId = null;

    while (!attestationObjId) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      try {
        const tx = await suiClient.getTransactionBlock({
          digest: result.digest,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        });
        attestationObjId =
          tx.effects?.created?.[0]?.reference?.objectId || null;
      } catch (error) {
        console.log("🚀 ~ registerAttestation ~ error:", error);
      }
    }
    updateAttestationObjectId(attestationObjId);
    return attestationObjId;
  };

  const onDecrypt = async () => {
    if (!account?.address) {
      toast.error("Please connect your wallet");
      return;
    }

    setSealingStatus((prev) => ({
      ...prev,
      isDecrypting: true,
    }));

    const attestationObjId = await registerAttestation();

    if (!attestationObjId) return;

    const sessionKey = new SessionKey({
      address: account?.address || "",
      packageId: CONFIG.PACKAGE_ID,
      ttlMin: 10, // TTL of 10 minutes
      client: suiClient,
    });

    signPersonalMessage(
      {
        message: sessionKey.getPersonalMessage(),
      },
      {
        onSuccess: async (result: { signature: string }) => {
          await sessionKey.setPersonalMessageSignature(result.signature);

          const tx = new Transaction();
          tx.setGasBudget(10000000);
          const encryptedFileExample = await fetch(
            `${CONFIG.WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`,
            {
              headers: {
                "Content-Type": "application/octet-stream",
              },
              method: "GET",
            }
          ).then((res) => res.arrayBuffer());

          if (!encryptedFileExample) {
            throw new Error("Failed to fetch encrypted data");
          }

          const encryptedData = new Uint8Array(encryptedFileExample);
          const encryptedObject = EncryptedObject.parse(encryptedData);
          tx.moveCall({
            target: `${CONFIG.PACKAGE_ID}::seal_manager::seal_approve`,
            arguments: [
              tx.pure.vector("u8", fromHex(encryptedObject.id)),
              tx.object(onChainFileObjId),
              tx.object(policyObjectId),
              tx.object(attestationObjId),
            ],
          });

          const txBytes = await tx.build({
            client: suiClient,
            onlyTransactionKind: true,
          });

          const keys = await sealClient.fetchKeys({
            ids: [encryptedObject.id],
            txBytes,
            sessionKey,
            threshold: 2,
          });

          console.log("🚀 ~ onSuccess: ~ keys:", keys);

          const decryptedBytes = await sealClient.decrypt({
            data: encryptedData,
            sessionKey,
            txBytes,
          });

          const uint8Array = new Uint8Array(decryptedBytes);
          const decoder = new TextDecoder("utf-8");
          const jsonString = decoder.decode(uint8Array);
          const jsonObject = JSON.parse(jsonString);
          updateDecryptedFile(jsonObject);
          console.log("decrypted file:", jsonObject);
          setSealingStatus((prev) => ({
            ...prev,
            isDecrypting: false,
          }));
        },
      }
    );
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
    const encryptedFileExample = await fetch(
      `${CONFIG.WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`,
      {
        headers: {
          "Content-Type": "application/octet-stream",
        },
        method: "GET",
      }
    ).then((res) => res.arrayBuffer());

    const encryptedData = new Uint8Array(encryptedFileExample);
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
    resetSealInfo();
    setSealingStatus((prev) => ({
      ...prev,
      isEncrypting: true,
    }));

    try {
      const policyObjId = await createPolicy();

      const policyObjectBytes = fromHex(policyObjId);
      const nonce = crypto.getRandomValues(new Uint8Array(5));
      const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
      const { encryptedObject: encryptedBytes } = await sealClient.encrypt({
        threshold: 2,
        packageId: CONFIG.PACKAGE_ID,
        id,
        data: new Uint8Array(
          new TextEncoder().encode(JSON.stringify(teleChatExample))
        ),
      });

      const walrusUploadRes = await uploadToWalrus(encryptedBytes);

      updateBlobId(walrusUploadRes.blobId);

      await saveEncryptedFileOnChain(
        walrusUploadRes.blobId,
        policyObjId,
        walrusUploadRes.metadata
      );

      setSealingStatus((prev) => ({
        ...prev,
        isEncrypting: false,
      }));
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
    const isDecryptButtonDisabled =
      !sealInfo.onChainFileObjId ||
      !sealInfo.policyObjectId ||
      sealingStatus.isEncrypting ||
      sealingStatus.isDecrypting;
    const isEncryptButtonDisabled =
      sealingStatus.isEncrypting || sealingStatus.isDecrypting;

    const isDownloadButtonDisabled =
      sealingStatus.isEncrypting ||
      sealingStatus.isDecrypting ||
      !sealInfo.decryptedFile;
    return {
      isDecryptButtonDisabled,
      isEncryptButtonDisabled,
      isDownloadButtonDisabled,
    };
  }, [
    sealInfo.decryptedFile,
    sealInfo.onChainFileObjId,
    sealInfo.policyObjectId,
    sealingStatus.isDecrypting,
    sealingStatus.isEncrypting,
  ]);

  return {
    onDecrypt,
    onEncrypt,
    sealingStatus,
    buttonStatus,
  };
};
