import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { RegistryCreateAccountData, RegistryCreateAccountStep } from '../RegistryCreateAccountStep';
import { polygonMumbai } from '@wagmi/core/chains';
import { BigNumber } from 'ethers';
import { RecipeERC20Info, StepInput } from '@railgun-community/cookbook';
import { NetworkName, NFTTokenType } from "@railgun-community/shared-models";

chai.use(chaiAsPromised);
const {expect} = chai;

const networkName = NetworkName.PolygonMumbai;
const tokenId = '138549285934853';
const registryAddress = '0x7A0a06735E41dc59F90228686f44bf2E13CC1724';

const createAccountData: RegistryCreateAccountData = {
    implementation: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    chainId: BigNumber.from(polygonMumbai.id),
    tokenContract: "0xfFEE087852cb4898e6c3532E776e68BC68b1143B",
    tokenId,
    salt: BigNumber.from(Math.floor(Math.random() * 100)),
    initData: "0x0000",

}

const tokenInfo: RecipeERC20Info = {
    tokenAddress: '0xe76C6c83af64e4C60245D8C7dE953DF673a7A33D',
    decimals: 18,
  };
  const spender = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
  const amountString = '1';

describe('create-account-step', function(){
    it('should generate an user nft without any input nfts', async () => {
        const createAccountStep = new RegistryCreateAccountStep(createAccountData, registryAddress);

        const stepInput: StepInput = {
            networkName,
            erc20Amounts: [{
                tokenAddress: tokenInfo.tokenAddress,
                decimals: tokenInfo.decimals,
                expectedBalance: BigNumber.from('1200'),
                minBalance: BigNumber.from('1200'),
                approvedSpender: undefined,
            }],
            nfts: []
        };

        const output = await createAccountStep.getValidStepOutput(stepInput);

        expect(output.name).to.equal('Create Account');
        expect(output.description).to.equal('Deploys new account for the given data');

        expect(output.outputERC20Amounts).to.deep.equal(stepInput.erc20Amounts);

        expect(output.spentNFTs).to.deep.equal([]);
        expect(output.outputNFTs).to.deep.equal([{
            nftTokenType: NFTTokenType.ERC721,
            nftAddress: registryAddress,
            tokenSubID: tokenId,
            amountString, // todo: what's this
        }])
    })

    it('should generate additional nft with input nfts', async () => {
        const createAccountStep = new RegistryCreateAccountStep(createAccountData, registryAddress);

        const stepInput: StepInput = {
            networkName,
            erc20Amounts: [{
                tokenAddress: tokenInfo.tokenAddress,
                decimals: tokenInfo.decimals,
                expectedBalance: BigNumber.from('1200'),
                minBalance: BigNumber.from('1200'),
                approvedSpender: undefined,
            }],
            nfts: [{
                nftTokenType: NFTTokenType.ERC721,
                nftAddress: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
                tokenSubID: "12385783",
                amountString, // todo: what's this
            }]
        };

        const output = await createAccountStep.getValidStepOutput(stepInput);

        expect(output.name).to.equal('Create Account');
        expect(output.description).to.equal('Deploys new account for the given data');

        expect(output.outputERC20Amounts).to.deep.equal(stepInput.erc20Amounts);

        expect(output.spentNFTs).to.deep.equal([]);
        expect(output.outputNFTs).to.deep.equal([{
            nftTokenType: NFTTokenType.ERC721,
            nftAddress: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
            tokenSubID: "12385783",
            amountString, // todo: what's this
        },{
            nftTokenType: NFTTokenType.ERC721,
            nftAddress: registryAddress,
            tokenSubID: tokenId,
            amountString, // todo: what's this
        }])
    })
})
