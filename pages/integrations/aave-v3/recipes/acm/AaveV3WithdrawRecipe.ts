import { Step, StepInput } from '@railgun-community/cookbook';
import { AaveV3WithdrawData, AaveV3WithdrawStep } from '../../steps/acm/AaveV3WithdrawStep';
import { Address } from '../../utils/address';
import { AaveV3Recipe } from './AaveV3Recipe';

export class AaveV3WithdrawRecipe extends AaveV3Recipe {
  readonly config = {
    name: 'Aave V3 Withdraw',
    description: 'Withdraws funds from Aave V3 via ACM',
  };

  protected readonly acm: Address;
  protected readonly data: AaveV3WithdrawData;
  protected readonly decimals: number;

  constructor(acm: Address, data: AaveV3WithdrawData, decimals: number) {
    super();
    this.acm = acm;
    this.data = data;
    this.decimals = decimals;
  }

  // eslint-disable-next-line no-unused-vars
  protected async getInternalSteps(firstInternalStepInput: StepInput): Promise<Step[]> {
    return [new AaveV3WithdrawStep(this.acm, this.data, this.decimals)];
  }
}
