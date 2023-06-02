import { BigNumber } from '@ethersproject/bignumber';
import {
  RecipeERC20AmountRecipient,
  Step,
  StepInput,
  UnvalidatedStepOutput,
  StepOutputERC20Amount
} from '@railgun-community/cookbook';
import { DefaultAccount } from '@/contract/default-account-contract';
import { Address } from '../../utils/address';
import { Bytes, ethers } from 'ethers';

export enum TxnType {
  DEPOSIT,
  BORROW,
  WITHDRAW,
  REPAY
}
export type BasicTxnData = {
  account: string;
  asset: string;
  amount: BigNumber;
  action: TxnType;
  interestRateMode: Optional<BigNumber>;
  decimal: number;
}



export class AaveTransactionStep extends Step {
  readonly config = {
    name: 'Transact to aave',
    description: 'Performs deposit,borrow,repay,withdraw steps for aave',
  };

  private readonly txnData: BasicTxnData;
  private spentTokens: RecipeERC20AmountRecipient;
  private receivedTokens: StepOutputERC20Amount;



  constructor(txnData: BasicTxnData) {
    super();
    this.txnData = txnData;
  }

  private getCallData(toCall: string, args: {}): Bytes {
    const interface_ = new ethers.utils.Interface([]);
    const functionSelector = interface_.getSighash(toCall);
    const encodedParameters = ethers.utils.defaultAbiCoder.encode(Object.keys(args), Object.values(args));
    const calldata = functionSelector + encodedParameters.substring(2);
    const bytesArray = Buffer.from(calldata, 'hex');
    return bytesArray;

  }

  protected async getStepOutput(input: StepInput): Promise<UnvalidatedStepOutput> {
    const { account, asset, amount, action, interestRateMode, decimal } = this.txnData;
    const contract = new DefaultAccount(account);
    const amountAfterFee = amount.sub(amount.mul(25).div(10000));
    var functionSig: string = '';
    var args = {};
    var tokenSpent: RecipeERC20AmountRecipient = {
      amount: amountAfterFee,
      decimals: decimal,
      tokenAddress: asset,
      recipient: account

    };
    var tokenReceived: StepOutputERC20Amount = {
      isBaseToken: false,
      approvedSpender: account,
      decimals: decimal,
      tokenAddress: asset,
      expectedBalance: amount,
      minBalance: amount,
    };

    switch (action) {
      case (TxnType.DEPOSIT):
        {
          this.spentTokens = tokenSpent;
          functionSig = 'supply()';
          // args = [asset, amount, account, 0];
          args = {
            asset: asset,
            amount: amount,
            account: account,
            refCode: 0
          }
          if (interestRateMode != undefined) {
            throw new Error('Interest Mode not required for deposit');
          }
        }
        break;
      case (TxnType.WITHDRAW):
        {
          this.receivedTokens = tokenReceived
          functionSig = 'withdraw(address,uint256,address)';
          // args = [asset, amount, account];
          args = {
            asset: asset,
            amount: amount,
            account: account,
          }
          if (interestRateMode != undefined) {
            throw new Error('Interest Mode not required for withdraw');
          }
          break;
        }

      case (TxnType.BORROW):
        {
          this.receivedTokens = tokenReceived;
          functionSig = 'borrow(address,uint256,uint256,uint16,address)';
          // args = [asset, amount, interestRateMode, 0, account];
          args = {
            asset: asset,
            amount: amount,
            account: account,
            refCode: 0,
            interestRateMode: interestRateMode
          }
          break;
        }
      case (TxnType.REPAY):
        {
          this.spentTokens = tokenSpent
          functionSig = 'repay(address,uint256,uint256,address)';
          args = [asset, amount, interestRateMode, account];
          args = {
            asset: asset,
            amount: amount,
            account: account,
            interestRateMode: interestRateMode
          }
          break;
        }
      default: {
        throw new Error('Invalid transaction type')
      }

    }
    const callData = this.getCallData(functionSig, args);

    const populatedTransaction = await contract.createExecuteCall(account, BigNumber.from(0), callData);
    return {
      populatedTransactions: [populatedTransaction],
      spentERC20Amounts: [this.spentTokens],
      outputERC20Amounts: [this.receivedTokens],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
