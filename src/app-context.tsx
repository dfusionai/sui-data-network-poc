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
  decryptedFile: File | null;
}

interface IAppContext {
  sealInfo: ISealInfo;
  updatePolicyId: (policyObjectId: string) => void;
  updateOnChainFileObjId: (onChainFileObjId: string) => void;
  updateAttestationObjectId: (attestationObjectId: string) => void;
  updateBlobId: (blobId: string) => void;
  updateFile: (file: File) => void;
  updateDecryptedFile: (decryptedFile: File) => void;
  resetSealInfo: () => void;
}

const initialSealInfo: ISealInfo = {
  policyObjectId: "",
  onChainFileObjId: "",
  attestationObjectId: "",
  blobId: "",
  file: null,
  decryptedFile: null,
};

export const AppContext = createContext<IAppContext>({
  sealInfo: initialSealInfo,
  updatePolicyId: missingInit,
  updateOnChainFileObjId: missingInit,
  updateAttestationObjectId: missingInit,
  updateBlobId: missingInit,
  updateFile: missingInit,
  updateDecryptedFile: missingInit,
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

  const updateDecryptedFile = (decryptedFile: File) => {
    setSealInfo((prev) => ({ ...prev, decryptedFile }));
  };

  const resetSealInfo = () => {
    setSealInfo(initialSealInfo);
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
        updateDecryptedFile,
        resetSealInfo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
