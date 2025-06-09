export interface WalrusUploadResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
      storedEpoch: number;
      blobId: string;
      size: number;
      erasureCodeType: string;
      certifiedEpoch: number;
      storage: {
        id: string;
        startEpoch: number;
        endEpoch: number;
        storageSize: number;
      };
    };
    resourceOperation: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      RegisterFromScratch?: any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Extend?: any;
    };
  };
  alreadyCertified?: {
    blobId: string;
    event: {
      txDigest: string;
      eventSeq: string;
    };
    endEpoch: number;
  };
}

export interface IFileMetadata {
    walrusUrl: string;
    size: number;
    storageSize: number;
  }

export interface IWalrusUpload {
    blobId: string;
    metadata: IFileMetadata;
  }
  