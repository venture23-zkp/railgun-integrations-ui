import { BigNumber } from '@ethersproject/bignumber';
import {
  Step,
  StepInput,
  StepOutputERC20Amount,
  UnvalidatedStepOutput,
} from '@railgun-community/cookbook';
import { DefaultAccount } from '@/contract/default-account-contract';

export type CallData = {
  to: string;
  value: BigNumber;
  // data: Bytes;
  data: any
};
 

export class ExecuteCallStep extends Step {
  readonly config = {
    name: 'Execute call',
    description: 'Executes call on the default account contract',
  };

  private readonly callData: CallData;
  private readonly account:string;
  

  constructor(data: CallData,account:string) {
    super();
    this.callData = data;
    this.account = account;
  }

  protected async getStepOutput(input: StepInput): Promise<UnvalidatedStepOutput> {
    const { to, value, data } = this.callData;
    const contract = new DefaultAccount(this.account);
    
    const populatedTransaction = await contract.createExecuteCall(to,value,data);
    return {
      populatedTransactions: [populatedTransaction],
      spentERC20Amounts: [],
      outputERC20Amounts: [],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
