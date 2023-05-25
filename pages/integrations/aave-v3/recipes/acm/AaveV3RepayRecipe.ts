import {
  ApproveERC20SpenderStep,
  RecipeERC20Info,
  Step,
  StepInput,
} from '@railgun-community/cookbook';
import { AaveV3RepayData, AaveV3RepayStep } from '../../steps/acm/AaveV3RepayStep';
import { Address } from '../../utils/address';
import { AaveV3Recipe } from './AaveV3Recipe';

export class AaveV3RepayRecipe extends AaveV3Recipe {
  readonly config = {
    name: 'Aave V3 Repay',
    description: 'Repays funds to Aave V3 via ACM',
  };

  protected readonly acm: Address;
  protected readonly data: AaveV3RepayData;
  protected readonly decimals: number;

  constructor(acm: Address, data: AaveV3RepayData, decimals: number) {
    super();
    this.acm = acm;
    this.data = data;
    this.decimals = decimals;
  }

  // eslint-disable-next-line no-unused-vars
  protected async getInternalSteps(firstInternalStepInput: StepInput): Promise<Step[]> {
    const { tokenAddress } = this.data;
    const repayERC20Info: RecipeERC20Info = {
      tokenAddress,
      decimals: this.decimals,
    };
    return [
      new ApproveERC20SpenderStep(this.acm, repayERC20Info),
      new AaveV3RepayStep(this.acm, this.data, this.decimals),
    ];
  }
}
