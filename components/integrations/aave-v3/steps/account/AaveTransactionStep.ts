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
  interestRateMode?: BigNumber;
  decimal: number;
}

const abiCoder = new ethers.utils.AbiCoder();

export const encodeSignature = (sig: string) =>
  ethers.utils.hexDataSlice(ethers.utils.id(sig), 0, 4).slice(2);


export class AaveTransactionStep extends Step {
  readonly config = {
    name: 'Transact to aave',
    description: 'Performs deposit,borrow,repay,withdraw steps for aave',
  };

  private readonly txnData: BasicTxnData;



  constructor(txnData: BasicTxnData) {
    super();
    this.txnData = txnData;
  }

  private getCallData(toCall: string, args: { key: { type: string, value: any } }): Bytes {
    let encoded = '';
    encoded += encodeSignature(toCall);
    console.log(Object.keys(args))
    encoded += abiCoder.encode(Object.values(args).map(item => item.type), Object.values(args).map(item => item.value)).slice(2);
    console.log("CALL_DATA:: ", encoded);
    return ethers.utils.arrayify(`0x${encoded}`)
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

    let spentTokens: RecipeERC20AmountRecipient | undefined = undefined;
    let receivedTokens: StepOutputERC20Amount | undefined = undefined;

    switch (action) {
      case (TxnType.DEPOSIT):
        {
          spentTokens = tokenSpent;
          functionSig = 'supply(address,uint256,address,uint16)';
          // args = [asset, amount, account, 0];
          args = {
            asset: { type: 'address', value: asset },
            amount: { type: 'uint256', value: amount },
            account: { type: 'address', value: account },
            refCode: { type: 'uint256', value: 0 }
          }
          if (interestRateMode != undefined) {
            throw new Error('Interest Mode not required for deposit');
          }
        }
        break;
      case (TxnType.WITHDRAW):
        {
          receivedTokens = tokenReceived
          functionSig = 'withdraw(address,uint256,address)';
          // args = [asset, amount, account];
          args = {
            asset: { type: 'address', value: asset },
            amount: { type: 'uint256', value: amount },
            account: { type: 'address', value: account }
          }
          if (interestRateMode != undefined) {
            throw new Error('Interest Mode not required for withdraw');
          }
          break;
        }

      case (TxnType.BORROW):
        {
          receivedTokens = tokenReceived;
          functionSig = 'borrow(address,uint256,uint256,uint16,address)';
          // args = [asset, amount, interestRateMode, 0, account];
          args = {
            asset: { type: 'address', value: asset },
            amount: { type: 'uint256', value: amount },
            account: { type: 'address', value: account },
            refCode: { type: 'uint256', value: 0 },
            interestRateMode: { type: 'uint256', value: interestRateMode }
          }
          break;
        }
      case (TxnType.REPAY):
        {
          spentTokens = tokenSpent
          functionSig = 'repay(address,uint256,uint256,address)';
          args = [asset, amount, interestRateMode, account];
          args = {
            asset: { type: 'address', value: asset },
            amount: { type: 'uint256', value: amount },
            account: { type: 'address', value: account },
            interestRateMode: { type: 'uint256', value: interestRateMode }
          }
          break;
        }
      default: {
        throw new Error('Invalid transaction type')
      }

    }

    const callData = this.getCallData(functionSig, args);

    // 1. approve step (only for deposit and repay)
    const approveFuncSig = "approve(address,uint256)"
    const approveCallData = this.getCallData(approveFuncSig, {
      approveTo: {
        type: "address",
        value: '0x0b913A76beFF3887d35073b8e5530755D60F78C7'
      },
      amount: {
        type: "uint256",
        value: amount
      }
    })

    const approveTransaction = await contract.createExecuteCall(asset, BigNumber.from(0), approveCallData)
    const populatedTransaction = await contract.createExecuteCall('0x0b913A76beFF3887d35073b8e5530755D60F78C7', BigNumber.from(0), callData);
    return {
      populatedTransactions: [approveTransaction, populatedTransaction],
      spentERC20Amounts: spentTokens ? [spentTokens] : [],
      outputERC20Amounts: receivedTokens ? [receivedTokens] : [],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
