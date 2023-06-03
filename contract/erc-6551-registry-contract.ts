import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { abi } from '@/abi-typechain/abi';
import { validateAddress } from '@/components/integrations/aave-v3/utils/address';
import { BigNumber } from '@ethersproject/bignumber';
import { BaseProvider } from '@ethersproject/providers';
import { ERC6551Registry } from '../abi-typechain/ERC6551Registry/ERC6551Registry';
import { BytesLike } from 'ethers';

export const CONTRACT_ADDRESS = "0xe314df549a6aC3c0F7D18E123CC985f8916eD988"
export class ERC6551_Registry {
  private readonly contract: ERC6551Registry;

  constructor(Registry: string, provider?: BaseProvider) {
    if (!Registry) {
      throw new Error('Address is required for Registry contract');
    }
    if (!validateAddress(Registry)) {
      throw new Error('Invalid registry address for contract');
    }
    this.contract = new Contract(
      Registry,
      abi.ERC6551_Registry,
      provider,
    ) as ERC6551Registry;
  }

  createCreateAccount(
    implementation:string,
    chainId:BigNumber,
    tokenContract:string,
    tokenId:BigNumber,
    salt:BigNumber,
    initData:BytesLike

  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.createAccount(implementation,chainId,tokenContract,tokenId,salt,initData);
  }
}
