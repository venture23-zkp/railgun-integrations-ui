import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { abi } from '@/abi-typechain/abi';
import { validateAddress } from '@/components/integrations/aave-v3/utils/address';
import { BigNumber } from '@ethersproject/bignumber';
import { BaseProvider } from '@ethersproject/providers';
import {  DefaultERC6551Account} from '../abi-typechain/DefaultERC6551Account/DefaultERC6551Account';
import { Bytes, BytesLike } from 'ethers';



export class DefaultAccount {
  private readonly contract: DefaultERC6551Account;

  constructor(account: string, provider?: BaseProvider) {
    if (!account) {
      throw new Error('Address is required for account contract');
    }
    if (!validateAddress(account)) {
      throw new Error('Invalid account address');
    }
    this.contract = new Contract(
        account,
      abi.Default_Account,
      provider,
    ) as DefaultERC6551Account;
  }

  createExecuteCall(
    to:string,
    value:BigNumber,
    data:BytesLike

  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.executeCall(to,value,data);
  }
}
