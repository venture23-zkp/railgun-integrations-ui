import { Step, StepInput } from '@railgun-community/cookbook';
import { AaveV3BorrowData, AaveV3BorrowStep } from '../../steps/acm/AaveV3BorrowStep';
import { Address } from '../../utils/address';
import { AaveV3Recipe } from './AaveV3Recipe';

export class AaveV3BorrowRecipe extends AaveV3Recipe {
  readonly config = {
    name: 'Aave V3 Borrow',
    description: 'Borrows funds from Aave V3 via ACM',
  };

  protected readonly acm: Address;
  protected readonly data: AaveV3BorrowData;
  protected readonly decimals: number;

  constructor(acm: Address, data: AaveV3BorrowData, decimals: number) {
    super();
    this.acm = acm;
    this.data = data;
    this.decimals = decimals;
  }

  // eslint-disable-next-line no-unused-vars
  protected async getInternalSteps(firstInternalStepInput: StepInput): Promise<Step[]> {
    return [new AaveV3BorrowStep(this.acm, this.data, this.decimals)];
  }
}
