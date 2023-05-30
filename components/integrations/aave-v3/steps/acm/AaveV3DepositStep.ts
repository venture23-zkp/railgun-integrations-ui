import { BigNumber } from '@ethersproject/bignumber';
import {
  RecipeERC20AmountRecipient,
  Step,
  StepInput,
  UnvalidatedStepOutput,
} from '@railgun-community/cookbook';
import { ACM } from '@/contract/acm';
import { Address } from '../../utils/address';

export type AaveV3DepositData = {
  id: BigNumber;
  tokenAddress: string;
  amount: BigNumber;
};

export class AaveV3DepositStep extends Step {
  readonly config = {
    name: 'Deposit token',
    description: 'Deposits the specified token to Aave V3 via ACM',
  };

  private readonly acm: Address;
  private readonly data: AaveV3DepositData;
  private readonly decimals: number;

  constructor(acm: Address, data: AaveV3DepositData, decimals: number) {
    super();
    this.acm = acm;
    this.data = data;
    this.decimals = decimals;
  }

  protected async getStepOutput(input: StepInput): Promise<UnvalidatedStepOutput> {
    const { id, tokenAddress, amount } = this.data;
    const contract = new ACM(this.acm);

    const amountAfterFee = amount.sub(amount.mul(25).div(10000));
    const spentToken: RecipeERC20AmountRecipient = {
      amount: amountAfterFee,
      decimals: this.decimals,
      tokenAddress: tokenAddress,
      recipient: this.acm,
    };

    const populatedTransaction = await contract.createDeposit(id, tokenAddress, amount);
    return {
      populatedTransactions: [populatedTransaction],
      spentERC20Amounts: [spentToken],
      outputERC20Amounts: [],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
