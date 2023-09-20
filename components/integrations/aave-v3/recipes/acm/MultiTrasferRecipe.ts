import {
    // ApproveERC20SpenderStep,
    RecipeERC20Info,
    Step,
    StepInput,
  } from '@railgun-community/cookbook';
  import { AaveV3DepositData, AaveV3DepositStep } from '../../steps/acm/AaveV3DepositStep';
  import { Address } from '../../utils/address';
  import { AaveV3Recipe } from './AaveV3Recipe';
  
  export class MultiTrasferRecipe extends AaveV3Recipe {
    readonly config = {
      name: 'Multi Token Transfer',
      description: 'Transfer multiple tokens to multiple other private wallet addresses',
    };
  
    protected readonly acm: Address;
    protected readonly data: AaveV3DepositData;
    protected readonly decimals: number;
  
    constructor(acm: Address, data: AaveV3DepositData, decimals: number) {
      super();
      this.acm = acm;
      this.data = data;
      this.decimals = decimals;
    }
  
    // eslint-disable-next-line no-unused-vars
    protected async getInternalSteps(firstInternalStepInput: StepInput): Promise<Step[]> {
      const { tokenAddress } = this.data;
      const depositERC20Info: RecipeERC20Info = {
        tokenAddress,
        decimals: this.decimals,
      };
      return [
        // new ApproveERC20SpenderStep(this.acm, depositERC20Info),
        new AaveV3DepositStep(this.acm, this.data, this.decimals),
      ];
    }
  }
  