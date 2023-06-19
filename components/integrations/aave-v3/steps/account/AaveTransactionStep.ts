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
  private readonly AAVE_PROXY_CONTRACT = "0x0b913A76beFF3887d35073b8e5530755D60F78C7";
  private readonly RELAY_ADAPT_CONTRACT = "0x722937B98f0a98A9d9D23489E72Bd483E509f08b";



  constructor(txnData: BasicTxnData) {
    super();
    this.txnData = txnData;
  }

  private getCallData(toCall: string, args: { key: { type: string, value: any } }): Bytes {
    let encoded = '';
    console.log(args)
    encoded += encodeSignature(toCall);
    encoded += abiCoder.encode(Object.values(args).map(item => item.type), Object.values(args).map(item => item.value)).slice(2);
    console.log(encoded)
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
            interestRateMode: { type: 'uint256', value: interestRateMode },
            refCode: { type: 'uint256', value: 0 },
            account: { type: 'address', value: account },
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
            interestRateMode: { type: 'uint256', value: interestRateMode },
            account: { type: 'address', value: account }
          }
          break;
        }
      default: {
        throw new Error('Invalid transaction type')
      }

    }

    const callData = this.getCallData(functionSig, args);

    const populatedTransaction = await contract.createExecuteCall(this.AAVE_PROXY_CONTRACT, BigNumber.from(0), callData);
    
    if(action === TxnType.DEPOSIT || action === TxnType.REPAY)  {
      // 1. approve step (only for deposit and repay)
      const approveFuncSig = "approve(address,uint256)"
      const approveCallData = this.getCallData(approveFuncSig, {
        approveTo: {
          type: "address",
          value: this.AAVE_PROXY_CONTRACT
        },
        amount: {
          type: "uint256",
          value: amount
        }
      })
      const approveTransaction = await contract.createExecuteCall(asset, BigNumber.from(0), approveCallData);

      return {
        populatedTransactions: [approveTransaction, populatedTransaction],
        spentERC20Amounts: spentTokens ? [spentTokens] : [],
        outputERC20Amounts: receivedTokens ? [receivedTokens] : [],
        spentNFTs: [],
        outputNFTs: input.nfts,
        feeERC20AmountRecipients: [],
      };
    }

    if(action === TxnType.WITHDRAW || action === TxnType.BORROW) {
      // 1. approve step (only for deposit and repay)
      const transferFuncSig = "transfer(address,uint256)"
      const transferCallData = this.getCallData(transferFuncSig, {
        receipent: {
          type: "address",
          value: this.RELAY_ADAPT_CONTRACT
        },
        amount: {
          type: "uint256",
          value: amount
        }
      })
      const transferTransaction = await contract.createExecuteCall(asset, BigNumber.from(0), transferCallData);

      console.log({
        populatedTransactions: [populatedTransaction],
        spentERC20Amounts: spentTokens ? [spentTokens] : [],
        outputERC20Amounts: receivedTokens ? [receivedTokens] : [],
        spentNFTs: [],
        outputNFTs: input.nfts,
        feeERC20AmountRecipients: [],
      })

      return {
        populatedTransactions: [transferTransaction, populatedTransaction],
        spentERC20Amounts: spentTokens ? [spentTokens] : [],
        outputERC20Amounts: receivedTokens ? [receivedTokens] : [],
        spentNFTs: [],
        outputNFTs: input.nfts,
        feeERC20AmountRecipients: [],
      };
    }


    return {
      populatedTransactions: [populatedTransaction],
      spentERC20Amounts: spentTokens ? [spentTokens] : [],
      outputERC20Amounts: receivedTokens ? [receivedTokens] : [],
      spentNFTs: [],
      outputNFTs: input.nfts,
      feeERC20AmountRecipients: [],
    };
  }
}
