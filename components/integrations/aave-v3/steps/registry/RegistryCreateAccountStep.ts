import { BigNumber } from '@ethersproject/bignumber';
import { Step, StepInput, UnvalidatedStepOutput } from '@railgun-community/cookbook';
import { NFTTokenType } from '@railgun-community/shared-models';
import { ERC6551_Registry } from '@/contract/erc-6551-registry-contract';
import { Address } from '../../utils/address';
import { BytesLike } from 'ethers';
import { ZERO_ADDRESS } from '@railgun-community/engine';

export type RegistryCreateAccountData = {
    implementation: string;
    chainId: BigNumber;
    tokenContract: string;
    tokenId: BigNumber;
    salt: BigNumber,
    initData: BytesLike
};
export class RegistryCreateAccountStep extends Step {
    readonly config = {
        name: 'Create Account',
        description: 'Deploys new account for the given data',
    };

    private readonly data: RegistryCreateAccountData;
    private readonly registry: string;

    constructor(data: RegistryCreateAccountData, registry: string) {
        super();
        this.data = data;
        this.registry = registry;
    }

    // eslint-disable-next-line no-unused-vars
    protected async getStepOutput(input: StepInput): Promise<UnvalidatedStepOutput> {
        const contract = new ERC6551_Registry(this.registry);
        const { implementation, chainId, tokenContract, tokenId, salt, initData } = this.data;
        var tokenSubID,nftAddress;
        const populatedTransaction = await contract.createCreateAccount(implementation, chainId, tokenContract, tokenId, salt, initData);
// TODO: if case for nft
        if (tokenContract == ZERO_ADDRESS && tokenId == BigNumber.from(0)){
            nftAddress = this.registry;
            tokenSubID = 0;

        }
        else {
            tokenSubID = tokenId;
            nftAddress = tokenContract;
        }

        return {
            populatedTransactions: [populatedTransaction],
            spentERC20Amounts: [],
            outputERC20Amounts: input.erc20Amounts,
            spentNFTs: [],
            outputNFTs: [
                ...input.nfts,
                {
                    nftTokenType: NFTTokenType.ERC721,
                    nftAddress:nftAddress,
                    tokenSubID: String(tokenSubID),
                    amountString: '1',
                },
            ],
            feeERC20AmountRecipients: [],
        };
    }
}
