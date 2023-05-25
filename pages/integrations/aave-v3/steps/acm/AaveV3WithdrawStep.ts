import { BigNumber } from '@ethersproject/bignumber';
import {
  Step,
  StepInput,
  StepOutputERC20Amount,
  UnvalidatedStepOutput,
} from '@railgun-community/cookbook';
import { ACM } from '../../contract/acm';
import { Address } from '../../utils/address';

export type AaveV3WithdrawData = {
  id: BigNumber;
  tokenAddress: string;
  amount: BigNumber;
};

export class AaveV3WithdrawStep extends Step {
  readonly config = {
    name: 'Withdraw token',
    description: 'Withdraws the specified token from Aave V3 via ACM',
  };

  private readonly acm: Address;
  private readonly data: AaveV3WithdrawData;
  private readonly decimals: number;

  constructor(acm: Address, data: AaveV3WithdrawData, decimals: number) {
    super();
    this.acm = acm;
    this.data = data;
    this.decimals = decimals;
  }

  protected async getStepOutput(input: StepInput): Promise<UnvalidatedStepOutput> {
    const { id, tokenAddress, amount } = this.data;
    const contract = new ACM(this.acm);
    const receivedToken: StepOutputERC20Amount = {
      isBaseToken: false,
      approvedSpender: this.acm,
      decimals: this.decimals,
      tokenAddress: tokenAddress,
      expectedBalance: amount,
      minBalance: amount,
    };
    const populatedTransaction = await contract.createWithdraw(id, tokenAddress, amount);
    return {
      populatedTransactions: [populatedTransaction],
      spentERC20Amounts: [],
      outputERC20Amounts: [receivedToken],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
