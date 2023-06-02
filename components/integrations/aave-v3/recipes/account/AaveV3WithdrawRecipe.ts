import {
    ApproveERC20SpenderStep,
    RecipeERC20Info,
    Step,
    StepInput,
  } from '@railgun-community/cookbook';
  import { AaveTransactionStep,BasicTxnData } from '../../steps/account/AaveTransactionStep';
  import { Address } from '../../utils/address';
  import { AaveV3Recipe } from '../acm/AaveV3Recipe';
  
  export class AaveV3WithdrawRecipe extends AaveV3Recipe {
    readonly config = {
      name: 'Aave V3 Withdraw',
      description: 'Withdraws funds to Aave V3 via ACM',
    };
  

    protected readonly data: BasicTxnData;

  
    constructor(data: BasicTxnData) {
      super();
      this.data = data;
    }
  
    // eslint-disable-next-line no-unused-vars
    protected async getInternalSteps(firstInternalStepInput: StepInput): Promise<Step[]> {
      return [
        new AaveTransactionStep(this.data),
      ];
    }
  }
  