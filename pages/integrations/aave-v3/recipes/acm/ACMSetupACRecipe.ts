import { Recipe, StepInput } from '@railgun-community/cookbook';
import { Step } from '@railgun-community/cookbook';
import { NetworkName } from '@railgun-community/shared-models';
import { BigNumber } from 'ethers';
import { isAddress } from 'ethers/lib/utils.js';
import { ACMSetupACStep } from '../../steps/acm/ACMSetupACStep';
import { Address } from '../../utils/address';
import { SNARK_SCALAR_FIELD } from '../../utils/big-number';

export class ACMSetupACRecipe extends Recipe {
  readonly config = {
    name: 'ACM setup AC',
    description: 'Deploys and configures AC and mints an NFT (accountId) to own the AC',
  };

  protected readonly id: BigNumber;
  protected readonly acm: Address;

  constructor(id: string, acm: Address) {
    super();
    const bigId = BigNumber.from(id);
    if (!bigId.lt(SNARK_SCALAR_FIELD)) {
      throw new Error(
        `SetupACRecipe(id, acm): id should be less that SNARK_SCALAR_FIELD (${SNARK_SCALAR_FIELD})`
      );
    }
    if (!isAddress(acm)) {
      throw new Error(`SetupACRecipe(id, acm): acm should be a contract address`);
    }
    this.id = bigId;
    this.acm = acm;
  }

  // eslint-disable-next-line no-unused-vars
  protected supportsNetwork(networkName: NetworkName): boolean {
    return true;
  }

  // eslint-disable-next-line no-unused-vars
  protected async getInternalSteps(firstInternalStepInput: StepInput): Promise<Step[]> {
    return [new ACMSetupACStep(this.id, this.acm)];
  }
}
