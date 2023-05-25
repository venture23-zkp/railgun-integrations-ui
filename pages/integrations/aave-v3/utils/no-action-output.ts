import { StepInput, UnvalidatedStepOutput } from "@railgun-community/cookbook";

export const createNoActionStepOutput = (
  input: StepInput,
): UnvalidatedStepOutput => {
  return {
    populatedTransactions: [],
    spentERC20Amounts: [],
    outputERC20Amounts: input.erc20Amounts,
    spentNFTs: [],
    outputNFTs: input.nfts,
    feeERC20AmountRecipients: [],
  };
};
