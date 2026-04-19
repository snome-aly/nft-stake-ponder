import type { Abi, Address } from "viem";

export type GenericContract = {
  address: Address;
  abi: Abi;
  inheritedFunctions?: {
    readonly [key: string]: string;
  };
  external?: true;
  deployedOnBlock?: number;
};

export type GenericContractsDeclaration = {
  readonly [chainId: number]: {
    readonly [contractName: string]: GenericContract;
  };
};

export const GenericContractsDeclaration = undefined;
