import { BigNumber } from '@ethersproject/bignumber';
import {
  RecipeERC20AmountRecipient,
  Step,
  StepInput,
  UnvalidatedStepOutput,
} from '@railgun-community/cookbook';
import { ACM } from '@/contract/acm';
import { Address } from '../../utils/address';

export type AaveV3RepayData = {
  id: BigNumber;
  tokenAddress: string;
  amount: BigNumber;
  rateMode: BigNumber;
};

export class AaveV3RepayStep extends Step {
  readonly config = {
    name: 'Repay token',
    description: 'Repays the specified token to Aave V3 via ACM',
  };

  private readonly acm: Address;
  private readonly data: AaveV3RepayData;
  private readonly decimals: number;

  constructor(acm: Address, data: AaveV3RepayData, decimals: number) {
    super();
    this.acm = acm;
    this.data = data;
    this.decimals = decimals;
  }

  protected async getStepOutput(input: StepInput): Promise<UnvalidatedStepOutput> {
    const { id, tokenAddress, amount, rateMode } = this.data;
    const contract = new ACM(this.acm);
    const spendToken: RecipeERC20AmountRecipient = {
      amount: amount,
      decimals: this.decimals,
      tokenAddress: tokenAddress,
      recipient: this.acm,
    };
    const populatedTransaction = await contract.createRepay(id, tokenAddress, amount, rateMode);
    return {
      populatedTransactions: [populatedTransaction],
      spentERC20Amounts: [spendToken],
      outputERC20Amounts: [],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
