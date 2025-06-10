export interface IProcessDataRes {
    status: string;
    data: IProcessData;
    stderr: string;
    exit_code: number;
    execution_time_ms: number;
  }
  
  export interface IProcessData {
    walrusUrl: string;
    attestationObjId: string;
    onChainFileObjId: string;
    blobId: string;
  }