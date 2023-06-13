import {
    ApproveERC20SpenderStep,
    RecipeERC20Info,
    Step,
    StepInput,
    TransferERC20Step
  } from '@railgun-community/cookbook';
  import { AaveTransactionStep,BasicTxnData } from '../../steps/account/AaveTransactionStep';
  import { Address } from '../../utils/address';
  import { AaveV3Recipe } from '../acm/AaveV3Recipe';
  
  export class AaveV3RepayRecipe extends AaveV3Recipe {
    readonly config = {
      name: 'Aave V3 Repay',
      description: 'Repays borrowed funds to Aave V3 via ACM',
    };
  

    protected readonly data: BasicTxnData;

  
    constructor(data: BasicTxnData) {
      super();
      this.data = data;
    }
  
    // eslint-disable-next-line no-unused-vars
    protected async getInternalSteps(firstInternalStepInput: StepInput): Promise<Step[]> {
      const { asset,decimal,account } = this.data;
      const repayERC20Info: RecipeERC20Info = {
        tokenAddress:asset,
        decimals:decimal ,
      };
      return [
        new ApproveERC20SpenderStep(account, repayERC20Info),
        new TransferERC20Step(account,repayERC20Info),
        new AaveTransactionStep(this.data),
      ];
    }
  }
  