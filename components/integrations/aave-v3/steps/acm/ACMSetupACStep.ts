import { BigNumber } from '@ethersproject/bignumber';
import { Step, StepInput, UnvalidatedStepOutput } from '@railgun-community/cookbook';
import { NFTTokenType } from '@railgun-community/shared-models';
import { ACM } from '@/contract/acm';
import { Address } from '../../utils/address';


export class ACMSetupACStep extends Step {
  readonly config = {
    name: 'Setup AC',
    description: 'Deploys new AC for the given accountId',
  };

  private readonly id: BigNumber;
  private readonly acm: Address;

  constructor(id: BigNumber, acm: Address) {
    super();
    this.id = id;
    this.acm = acm;
  }

  // eslint-disable-next-line no-unused-vars
  protected async getStepOutput(input: StepInput): Promise<UnvalidatedStepOutput> {
    const contract = new ACM(this.acm);
    const populatedTransaction = await contract.createSetupAC(this.id);

    return {
      populatedTransactions: [populatedTransaction],
      spentERC20Amounts: [],
      outputERC20Amounts: input.erc20Amounts,
      spentNFTs: [],
      outputNFTs: [
        ...input.nfts,
        {
          nftTokenType: NFTTokenType.ERC721,
          nftAddress: this.acm,
          tokenSubID: this.id.toHexString(),
          amountString: '1',
        },
      ],
      feeERC20AmountRecipients: [],
    };
  }
}
