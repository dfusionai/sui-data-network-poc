import { CONFIG, type IWalrusUpload, type WalrusUploadResponse } from ".";

export const uploadToWalrus = async (
  encryptedData: Uint8Array<ArrayBufferLike>
): Promise<IWalrusUpload> => {
  const {
    WALRUS_AGGREGATOR_URL,
    WALRUS_PUBLISHER_URL,
    WALRUS_EPOCHS = 5,
  } = CONFIG;

  if (!WALRUS_AGGREGATOR_URL || !WALRUS_PUBLISHER_URL || !WALRUS_EPOCHS) {
    throw new Error(
      "WALRUS_AGGREGATOR_URL or WALRUS_PUBLISHER_URL or WALRUS_EPOCHS is not set"
    );
  }

  try {
    const uploadUrl = `${WALRUS_PUBLISHER_URL}/v1/blobs?epochs=${WALRUS_EPOCHS}`;

    const response: Response = await fetch(uploadUrl, {
      method: "PUT",
      body: encryptedData,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    const data: WalrusUploadResponse = await response.json();

    if (!data) {
      throw new Error("No response received from Walrus");
    }
    console.log("🚀 ~ upload ~ data:", data);

    let blobId: string;
    if (data.newlyCreated) {
      blobId = data.newlyCreated.blobObject.blobId;
    } else if (data.alreadyCertified) {
      blobId = data.alreadyCertified.blobId;
    } else {
      throw new Error("Invalid response format from Walrus");
    }

    const metadata = {
      walrusUrl: `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`,
      size: data.newlyCreated?.blobObject?.size || 0,
      storageSize: data.newlyCreated?.blobObject?.storage?.storageSize || 0,
    };
    // Return the URL to access the blob
    return { metadata, blobId };
  } catch (error) {
    console.error("Walrus upload failed", error);
    throw new Error(
      "Failed to upload encrypted data to Walrus storage. Please try again."
    );
  }
};

export const downloadFromWalrus = async (blobId: string): Promise<Blob> => {
  const { WALRUS_AGGREGATOR_URL, WALRUS_PUBLISHER_URL } = CONFIG;

  if (!WALRUS_AGGREGATOR_URL || !WALRUS_PUBLISHER_URL) {
    throw new Error("WALRUS_AGGREGATOR_URL or WALRUS_PUBLISHER_URL is not set");
  }

  const downloadUrl = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;

  const response: Response = await fetch(downloadUrl, {
    method: "GET",
    headers: {
      responseType: "blob",
    },
  });

  const data = await response.blob();
  console.log("🚀 ~ downloadFromWalrus ~ data:", data);

  if (!data) {
    throw new Error("No response received from Walrus");
  }

  return data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getBlobInfo = async (blobId: string): Promise<any> => {
  const { WALRUS_AGGREGATOR_URL } = CONFIG;

  if (!WALRUS_AGGREGATOR_URL) {
    throw new Error("Walrus configuration is not available");
  }

  try {
    const infoUrl = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}/info`;

    const response: Response = await fetch(infoUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log("🚀 ~ getBlobInfo ~ data:", data);
    return data;
  } catch (error) {
    console.error("Walrus blob info failed", error);
    throw new Error(
      "Failed to get blob info from Walrus storage. Please try again."
    );
  }
};

export const downloadJsonFile = (file: File, filename: string) => {
  const jsonString = JSON.stringify(file);
  const blob = new Blob([jsonString], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
