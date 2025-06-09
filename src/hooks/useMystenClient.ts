import { useMemo } from "react";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { SealClient, getAllowlistedKeyServers } from "@mysten/seal";
import {
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
} from "@mysten/dapp-kit";

export const useMystenClient = () => {
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  const { suiClient, sealClient } = useMemo(() => {
    const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
    const keyServers = getAllowlistedKeyServers("testnet") || [];
    const sealClient = new SealClient({
      suiClient,
      serverObjectIds: keyServers.map((id) => [id, 1] as [string, number]),
      verifyKeyServers: false,
    });

    return { suiClient, sealClient };
  }, []);

  return {
    suiClient,
    sealClient,
    signAndExecuteTransaction,
    signPersonalMessage,
  };
};
