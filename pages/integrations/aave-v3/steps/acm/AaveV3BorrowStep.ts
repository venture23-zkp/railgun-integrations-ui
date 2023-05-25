import { BigNumber } from '@ethersproject/bignumber';
import {
  Step,
  StepInput,
  StepOutputERC20Amount,
  UnvalidatedStepOutput,
} from '@railgun-community/cookbook';
import { ACM } from '../../contract/acm';
import { Address } from '../../utils/address';

export type AaveV3BorrowData = {
  id: BigNumber;
  tokenAddress: string;
  amount: BigNumber;
  rateMode: BigNumber;
};

export class AaveV3BorrowStep extends Step {
  readonly config = {
    name: 'Borrow token',
    description: 'Borrows the specified token from Aave V3 via ACM',
  };

  private readonly acm: Address;
  private readonly data: AaveV3BorrowData;
  private readonly decimals: number;

  constructor(acm: Address, data: AaveV3BorrowData, decimals: number) {
    super();
    this.acm = acm;
    this.data = data;
    this.decimals = decimals;
  }

  protected async getStepOutput(input: StepInput): Promise<UnvalidatedStepOutput> {
    const { id, tokenAddress, amount, rateMode } = this.data;
    const contract = new ACM(this.acm);
    const receivedToken: StepOutputERC20Amount = {
      isBaseToken: false,
      approvedSpender: this.acm,
      decimals: this.decimals,
      tokenAddress: tokenAddress,
      expectedBalance: amount,
      minBalance: amount,
    };
    const populatedTransaction = await contract.createBorrow(id, tokenAddress, amount, rateMode);
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
