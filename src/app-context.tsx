//implemeting app context

import { createContext, useContext, useState } from "react";

const missingInit = () => {
  throw new Error("Missing app context init");
};

interface ISealInfo {
  policyObjectId: string;
  onChainFileObjId: string;
  attestationObjectId: string;
  blobId: string;
  file: File | null;
  refinedFileBlobId: string;
  refinedFileOnChainObjId: string;
}

interface IAppContext {
  sealInfo: ISealInfo;
  updatePolicyId: (policyObjectId: string) => void;
  updateOnChainFileObjId: (onChainFileObjId: string) => void;
  updateAttestationObjectId: (attestationObjectId: string) => void;
  updateBlobId: (blobId: string) => void;
  updateFile: (file: File) => void;
  updateRefinedFileBlobId: (refinedFileBlobId: string) => void;
  updateRefinedFileOnChainObjId: (refinedFileOnChainObjId: string) => void;
  resetSealInfo: () => void;
}

const initialSealInfo: ISealInfo = {
  policyObjectId: "",
  onChainFileObjId: "",
  attestationObjectId: "",
  blobId: "",
  file: null,
  refinedFileBlobId: "",
  refinedFileOnChainObjId: "",
};

export const AppContext = createContext<IAppContext>({
  sealInfo: initialSealInfo,
  updatePolicyId: missingInit,
  updateOnChainFileObjId: missingInit,
  updateAttestationObjectId: missingInit,
  updateBlobId: missingInit,
  updateFile: missingInit,
  updateRefinedFileBlobId: missingInit,
  updateRefinedFileOnChainObjId: missingInit,
  resetSealInfo: missingInit,
});

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sealInfo, setSealInfo] = useState<ISealInfo>(initialSealInfo);

  const updatePolicyId = (policyObjectId: string) => {
    setSealInfo((prev) => ({ ...prev, policyObjectId }));
  };

  const updateOnChainFileObjId = (onChainFileObjId: string) => {
    setSealInfo((prev) => ({ ...prev, onChainFileObjId }));
  };

  const updateAttestationObjectId = (attestationObjectId: string) => {
    setSealInfo((prev) => ({ ...prev, attestationObjectId }));
  };

  const updateBlobId = (blobId: string) => {
    setSealInfo((prev) => ({ ...prev, blobId }));
  };

  const updateFile = (file: File) => {
    setSealInfo((prev) => ({ ...prev, file }));
  };

  const resetSealInfo = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { file: _, ...rest } = initialSealInfo;
    setSealInfo((prev) => ({ file: prev.file, ...rest }));
  };

  const updateRefinedFileBlobId = (refinedFileBlobId: string) => {
    setSealInfo((prev) => ({ ...prev, refinedFileBlobId }));
  };

  const updateRefinedFileOnChainObjId = (refinedFileOnChainObjId: string) => {
    setSealInfo((prev) => ({ ...prev, refinedFileOnChainObjId }));
  };

  return (
    <AppContext.Provider
      value={{
        sealInfo,
        updatePolicyId,
        updateOnChainFileObjId,
        updateAttestationObjectId,
        updateBlobId,
        updateFile,
        updateRefinedFileBlobId,
        updateRefinedFileOnChainObjId,
        resetSealInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
