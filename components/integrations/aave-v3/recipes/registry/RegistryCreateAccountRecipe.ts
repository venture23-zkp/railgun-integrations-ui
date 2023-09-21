// import { Recipe, StepInput } from '@railgun-community/cookbook';
// import { Step } from '@railgun-community/cookbook';
// import { NetworkName } from '@railgun-community/shared-models';
// import { BigNumber } from 'ethers';
// import { isAddress } from 'ethers/lib/utils.js';
// import { RegistryCreateAccountStep, RegistryCreateAccountData } from '../../steps/registry/RegistryCreateAccountStep';
// import { Address } from '../../utils/address';
// import { SNARK_SCALAR_FIELD } from '../../utils/big-number';

// export class RegistryCreateAccountRecipe extends Recipe {
//   readonly config = {
//     name: 'Registry create account',
//     description: 'Deploys account for registy ',
//   };

//   protected readonly createData: RegistryCreateAccountData;
//   protected readonly registry:string;


//   constructor(createData: RegistryCreateAccountData, registry: Address) {
//     super();
//     const bigId = BigNumber.from(createData.tokenId);
//     // if (!bigId.lt(SNARK_SCALAR_FIELD)) {
//     //   throw new Error(
//     //     `CreateAccount: id should be less that SNARK_SCALAR_FIELD (${SNARK_SCALAR_FIELD})`
//     //   );
//     // }
//     if (!isAddress(createData.tokenContract)) {
//       throw new Error(`CreateAccount:): token contract should be a contract address`);
//     }
//     this.createData = createData;
//     this.registry = registry;
//   }

//   // eslint-disable-next-line no-unused-vars
//   protected supportsNetwork(networkName: NetworkName): boolean {
//     return true;
//   }

//   // eslint-disable-next-line no-unused-vars
//   protected async getInternalSteps(firstInternalStepInput: StepInput): Promise<Step[]> {
//     return [new RegistryCreateAccountStep(this.createData,this.registry)];
//   }
// }

export default () => {};
