import { Contract, PopulatedTransaction } from '@ethersproject/contracts';
import { abi } from '../abi-typechain/abi';
import { validateAddress } from '../utils/address';
import { BigNumber } from '@ethersproject/bignumber';
import { BaseProvider } from '@ethersproject/providers';
import { AddressContractManager } from '../abi-typechain/acm/ACM';

export const CONTRACT_ADDRESS = '0x92F8B8B507Bb7742a0EC7336c22FaB1d0CBe2154';

export class ACM {
  private readonly contract: AddressContractManager;

  constructor(ACMAddress: string, provider?: BaseProvider) {
    if (!ACMAddress) {
      throw new Error('ACM address is required for Aave ACM Contract');
    }
    if (!validateAddress(ACMAddress)) {
      throw new Error('Invalid ACM address for Aave ACM contract');
    }
    this.contract = new Contract(
      ACMAddress,
      abi.ACM,
      provider,
    ) as AddressContractManager;
  }

  createSetupAC(
    id: BigNumber

  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.setupAC(id);
  }

  createDeposit(
    id: BigNumber,
    token: string,
    amount: BigNumber

  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.deposit(id, token, amount);
  }

  createWithdraw(
    id: BigNumber,
    token: string,
    amount: BigNumber
  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.withdraw(id,token,amount);
  }

  createBorrow(
    id: BigNumber,
    token: string,
    amount: BigNumber,
    rateMode: BigNumber
  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.borrow(id,token,amount,rateMode);
  }

  createRepay(
    id: BigNumber,
    token: string,
    amount: BigNumber,
    rateMode: BigNumber
  ): Promise<PopulatedTransaction> {
    return this.contract.populateTransaction.repay(id,token,amount,rateMode);
  }
}
