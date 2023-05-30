import { isAddress } from '@ethersproject/address';

export type Address = `0x${string}`;

export const validateAddress = (address: string) => {
  return isAddress(address);
};
