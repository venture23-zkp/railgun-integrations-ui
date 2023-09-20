import { useState } from 'react';
import { parseUnits } from '@ethersproject/units';
import { Recipe, RecipeInput } from '@railgun-community/cookbook';
import { setRailgunFees } from '@railgun-community/cookbook';
import {
  gasEstimateForUnprovenCrossContractCalls,
  gasEstimateForUnprovenTransfer,
  gasEstimateForUnprovenUnshield,
  gasEstimateForUnprovenUnshieldBaseToken,
  generateCrossContractCallsProof,
  generateTransferProof,
  generateUnshieldBaseTokenProof,
  generateUnshieldProof,
  populateProvedCrossContractCalls,
  populateProvedTransfer,
  populateProvedUnshield,
  populateProvedUnshieldBaseToken,
  populateShield,
  populateShieldBaseToken,
  validateRailgunAddress,
} from '@railgun-community/quickstart';
import {
  EVMGasType,
  NETWORK_CONFIG,
  RailgunERC20Amount,
  RailgunERC20AmountRecipient,
  TransactionGasDetailsSerialized,
  deserializeTransaction,
  serializeUnsignedTransaction,
} from '@railgun-community/shared-models';
import { ethers } from 'ethers';
import { isAddress } from 'ethers/lib/utils.js';
import { useSigner } from 'wagmi';
import { useNetwork } from 'wagmi';
import { useRailgunWallet } from '@/contexts/RailgunWalletContext';
import useShieldPrivateKey from '@/hooks/useShieldPrivateKey';
import { ethAddress } from '@/utils/constants';
import { getNetwork } from '@/utils/networks';

export type TokenTransferType = {
  address: string;
  amount: string;
  decimals: number;
  recipient: string;
};

const useRailgunTx = () => {
  const { data: signer } = useSigner();
  const { shieldPrivateKey, getShieldPrivateKey } = useShieldPrivateKey();
  const { chain } = useNetwork();
  const chainId = chain?.id || 1; // default to mainnet if no chain id
  const { railgunNetworkName: network, wethAddress } = getNetwork(chainId);
  const [isExecuting, setIsExecuting] = useState(false);

  const { wallet, encryptionKey } = useRailgunWallet();

  const shield = async (args: TokenTransferType) => {
    setIsExecuting(true);
    try {
      const resp =
        args.address === ethAddress ? await shieldBaseToken(args) : await shieldToken(args);
      setIsExecuting(false);
      return resp;
    } catch (e) {
      setIsExecuting(false);
      throw e;
    }
  };

  const shieldBaseToken = async ({ amount, recipient, decimals }: TokenTransferType) => {
    // The shieldPrivateKey enables the sender to decrypt
    // the receiver's address in the future.
    const shieldPrivateKey = await getShieldPrivateKey();

    const wrappedERC20Amount: RailgunERC20Amount = {
      tokenAddress: wethAddress, // wETH
      amountString: parseUnits(amount!, decimals).toHexString(), // hexadecimal amount
    };

    const { serializedTransaction, error } = await populateShieldBaseToken(
      network,
      recipient,
      shieldPrivateKey,
      wrappedERC20Amount
    );
    if (error) {
      throw error;
    }

    const { chain } = NETWORK_CONFIG[network];

    const transactionRequest: ethers.providers.TransactionRequest = deserializeTransaction(
      serializedTransaction!,
      undefined, // nonce (optional)
      chain.id
    );

    // Public wallet to shield from.
    transactionRequest.from = await signer?.getAddress();

    return signer!.sendTransaction(transactionRequest);
  };

  const shieldToken = async ({ address, amount, recipient, decimals }: TokenTransferType) => {
    // The shieldPrivateKey enables the sender to decrypt
    // the receiver's address in the future.
    const shieldPrivateKey = await getShieldPrivateKey();

    // Formatted token amounts and recipients.
    const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
      {
        tokenAddress: address!,
        amountString: ethers.utils.parseUnits(amount, decimals).toHexString(), // must be hex
        recipientAddress: recipient!, // RAILGUN address
      },
    ];

    const { serializedTransaction, error } = await populateShield(
      network,
      shieldPrivateKey,
      erc20AmountRecipients,
      [] // nftAmountRecipients
    );
    if (error) {
      throw error;
    }

    const { chain } = NETWORK_CONFIG[network];

    const transactionRequest: ethers.providers.TransactionRequest = deserializeTransaction(
      serializedTransaction as string,
      undefined, // nonce (optional)
      chain.id
    );

    // Public wallet to shield from.
    transactionRequest.from = await signer?.getAddress();

    return signer!.sendTransaction(transactionRequest);
  };

  const unshield = async (args: TokenTransferType) => {
    setIsExecuting(true);
    try {
      const resp =
        args.address === ethAddress ? await unshieldBaseToken(args) : await unshieldToken(args);
      setIsExecuting(false);
      return resp;
    } catch (e) {
      setIsExecuting(false);
      throw e;
    }
  };

  const unshieldBaseToken = async ({ amount, recipient, decimals }: TokenTransferType) => {
    const wrappedERC20Amount: RailgunERC20Amount = {
      tokenAddress: wethAddress, // wETH
      amountString: parseUnits(amount!, decimals).toHexString(), // hexadecimal amount
    };

    if (!isAddress(recipient)) {
      throw new Error(`Not a valid public 0x address: '${recipient}'`);
    }

    // Gas price, used to calculate Relayer Fee iteratively.
    const feeData = await signer?.getFeeData();
    const originalGasDetailsSerialized: TransactionGasDetailsSerialized = {
      evmGasType: EVMGasType.Type2, // Depends on the chain (BNB uses type 0)
      gasEstimateString: '0x00', // Always 0, we don't have this yet.
      maxFeePerGasString: feeData?.maxFeePerGas?.toHexString() || '0x100000', // Current gas Max Fee
      maxPriorityFeePerGasString: feeData?.maxPriorityFeePerGas?.toHexString() || '0x010000', // Current gas Max Priority Fee
    };
    const feeTokenDetails = undefined;

    // Whether to use a Relayer or self-signing wallet.
    // true for self-signing, false for Relayer.
    const sendWithPublicWallet = true;

    const { gasEstimateString, error: gasEstimateForUnprovenUnshieldBaseTokenError } =
      await gasEstimateForUnprovenUnshieldBaseToken(
        network,
        recipient,
        wallet?.id!,
        encryptionKey!,
        wrappedERC20Amount,
        originalGasDetailsSerialized,
        feeTokenDetails,
        sendWithPublicWallet
      );
    if (gasEstimateForUnprovenUnshieldBaseTokenError || gasEstimateString === undefined) {
      throw new Error(gasEstimateForUnprovenUnshieldBaseTokenError || 'No gasEstimateString!');
    }

    const relayerFeeERC20AmountRecipient = undefined;

    // Minimum gas price, only required for relayed transaction.
    const overallBatchMinGasPrice: string = '0x10000';

    const progressCallback = (progress: number) => {
      // Handle proof progress (show in UI).
      // Proofs can take 20-30 seconds on slower devices.
      console.log('progress', progress);
    };

    const { error: generateUnshieldBaseTokenProofError } = await generateUnshieldBaseTokenProof(
      network,
      recipient,
      wallet?.id!,
      encryptionKey!,
      wrappedERC20Amount,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      progressCallback
    );
    if (generateUnshieldBaseTokenProofError) {
      // Proof generated successfully.
      throw new Error(generateUnshieldBaseTokenProofError);
    }

    // NOTE: Must follow proof generation.
    // Use the exact same parameters as proof or this will throw invalid error.

    // // Gas to use for the transaction.
    // const gasDetailsSerialized: TransactionGasDetailsSerialized = {
    //   evmGasType: EVMGasType.Type2, // Depends on the chain (BNB uses type 0)
    //   gasEstimateString: "0x0100", // Output from gasEstimateForDeposit
    //   maxFeePerGasString: "0x100000", // Current gas Max Fee
    //   maxPriorityFeePerGasString: "0x010000", // Current gas Max Priority Fee
    // };
    const gasDetailsSerialized: TransactionGasDetailsSerialized = {
      ...originalGasDetailsSerialized,
      gasEstimateString,
    };

    const {
      nullifiers,
      serializedTransaction,
      error: populateProvedUnshieldBaseTokenError,
    } = await populateProvedUnshieldBaseToken(
      network,
      recipient,
      wallet?.id!,
      wrappedERC20Amount,
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      gasDetailsSerialized
    );
    if (populateProvedUnshieldBaseTokenError || serializedTransaction === undefined) {
      // Error populating transaction.
      throw new Error(populateProvedUnshieldBaseTokenError || 'No serializedTransaction!');
    }

    console.log('nullifiers:', nullifiers);

    const nonce = await signer?.getTransactionCount();

    const transactionRequest = deserializeTransaction(serializedTransaction, nonce, chainId);

    // Public wallet to shield from.
    transactionRequest.from = await signer?.getAddress();

    // send transactionRequest to Relay.sol
    return await signer!.sendTransaction(transactionRequest);
  };

  const unshieldToken = async ({ address, amount, recipient, decimals }: TokenTransferType) => {
    if (!isAddress(recipient)) {
      throw new Error(`Not a valid public 0x address: '${recipient}'`);
    }

    const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [
      {
        tokenAddress: address, // wETH
        amountString: parseUnits(amount!, decimals).toHexString(), // hexadecimal amount
        recipientAddress: recipient,
      },
    ];

    // Gas price, used to calculate Relayer Fee iteratively.
    const feeData = await signer?.getFeeData();
    const originalGasDetailsSerialized: TransactionGasDetailsSerialized = {
      evmGasType: EVMGasType.Type2, // Depends on the chain (BNB uses type 0)
      gasEstimateString: '0x00', // Always 0, we don't have this yet.
      maxFeePerGasString: feeData?.maxFeePerGas?.toHexString() || '0x100000', // Current gas Max Fee
      maxPriorityFeePerGasString: feeData?.maxPriorityFeePerGas?.toHexString() || '0x010000', // Current gas Max Priority Fee
    };
    const feeTokenDetails = undefined;

    // Whether to use a Relayer or self-signing wallet.
    // true for self-signing, false for Relayer.
    const sendWithPublicWallet = true;

    const { gasEstimateString, error: gasEstimateForUnprovenUnshieldError } =
      await gasEstimateForUnprovenUnshield(
        network,
        wallet?.id!,
        encryptionKey!,
        erc20AmountRecipients,
        [],
        originalGasDetailsSerialized,
        feeTokenDetails,
        sendWithPublicWallet
      );
    if (gasEstimateForUnprovenUnshieldError || gasEstimateString === undefined) {
      throw new Error(gasEstimateForUnprovenUnshieldError || 'No gasEstimateString!');
    }

    const relayerFeeERC20AmountRecipient = undefined;

    // Minimum gas price, only required for relayed transaction.
    const overallBatchMinGasPrice: string = '0x10000';

    const progressCallback = (progress: number) => {
      // Handle proof progress (show in UI).
      // Proofs can take 20-30 seconds on slower devices.
      console.log('progress', progress);
    };

    const { error: generateUnshieldProofError } = await generateUnshieldProof(
      network,
      wallet?.id!,
      encryptionKey!,
      erc20AmountRecipients,
      [],
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      progressCallback
    );
    if (generateUnshieldProofError) {
      // Proof generated successfully.
      throw new Error(generateUnshieldProofError);
    }

    // NOTE: Must follow proof generation.
    // Use the exact same parameters as proof or this will throw invalid error.

    // // Gas to use for the transaction.
    // const gasDetailsSerialized: TransactionGasDetailsSerialized = {
    //   evmGasType: EVMGasType.Type2, // Depends on the chain (BNB uses type 0)
    //   gasEstimateString: "0x0100", // Output from gasEstimateForDeposit
    //   maxFeePerGasString: "0x100000", // Current gas Max Fee
    //   maxPriorityFeePerGasString: "0x010000", // Current gas Max Priority Fee
    // };
    const gasDetailsSerialized: TransactionGasDetailsSerialized = {
      ...originalGasDetailsSerialized,
      gasEstimateString,
    };

    const {
      nullifiers,
      serializedTransaction,
      error: populateProvedUnshieldError,
    } = await populateProvedUnshield(
      network,
      wallet?.id!,
      erc20AmountRecipients,
      [],
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      gasDetailsSerialized
    );
    if (populateProvedUnshieldError || serializedTransaction === undefined) {
      // Error populating transaction.
      throw new Error(populateProvedUnshieldError || 'No serializedTransaction!');
    }

    console.log('nullifiers:', nullifiers);

    const nonce = await signer?.getTransactionCount();

    const transactionRequest = deserializeTransaction(serializedTransaction, nonce, chainId);

    // Public wallet to shield from.
    transactionRequest.from = await signer?.getAddress();

    // send transactionRequest to Relay.sol
    return await signer!.sendTransaction(transactionRequest);
  };

  const transfer = async (args: TokenTransferType[]) => {
    setIsExecuting(true);
    try {
      const resp = await _transfer(args);
      setIsExecuting(false);
      return resp;
    } catch (e) {
      setIsExecuting(false);
      throw e;
    }
  };

  const _transfer = async (recipients: TokenTransferType[]) => {
    const memoText = ''; // this can be used for remarks

    // Formatted token amounts and recipients.
    const erc20AmountRecipients: RailgunERC20AmountRecipient[] = [];

    for (let recipientObj of recipients) {
      const { address, amount, recipient, decimals } = recipientObj;

      if (!validateRailgunAddress(recipient)) {
        throw new Error(`Not a valid railgun 0zk address: '${recipient}'`);
      }

      erc20AmountRecipients.push({
        tokenAddress: address!,
        amountString: ethers.utils.parseUnits(amount, decimals).toHexString(), // must be hex
        recipientAddress: recipient!, // RAILGUN address
      });
    }

    // Gas price, used to calculate Relayer Fee iteratively.
    const feeData = await signer?.getFeeData();
    const originalGasDetailsSerialized: TransactionGasDetailsSerialized = {
      evmGasType: EVMGasType.Type2, // Depends on the chain (BNB uses type 0)
      gasEstimateString: '0x00', // Always 0, we don't have this yet.
      maxFeePerGasString: feeData?.maxFeePerGas?.toHexString() || '0x100000', // Current gas Max Fee
      maxPriorityFeePerGasString: feeData?.maxPriorityFeePerGas?.toHexString() || '0x010000', // Current gas Max Priority Fee
    };
    const feeTokenDetails = undefined;

    // Whether to use a Relayer or self-signing wallet.
    // true for self-signing, false for Relayer.
    const sendWithPublicWallet = true;

    const { gasEstimateString, error: gasEstimateForUnprovenTransferError } =
      await gasEstimateForUnprovenTransfer(
        network,
        wallet?.id!,
        encryptionKey!,
        memoText,
        erc20AmountRecipients,
        [], // nftAmountRecipients
        originalGasDetailsSerialized,
        feeTokenDetails,
        sendWithPublicWallet
      );
    if (gasEstimateForUnprovenTransferError || gasEstimateString === undefined) {
      throw new Error(gasEstimateForUnprovenTransferError || 'No gasEstimateString!');
    }

    const relayerFeeERC20AmountRecipient = undefined;

    // Minimum gas price, only required for relayed transaction.
    const overallBatchMinGasPrice: string = '0x10000';

    const progressCallback = (progress: number) => {
      // Handle proof progress (show in UI).
      // Proofs can take 20-30 seconds on slower devices.
      console.log('progress', progress);
    };

    const { error: generateTransferProofError } = await generateTransferProof(
      network,
      wallet?.id!,
      encryptionKey!,
      false,
      memoText,
      erc20AmountRecipients,
      [], // nftAmountRecipients
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      progressCallback
    );
    if (generateTransferProofError) {
      throw new Error(generateTransferProofError);
    }

    // NOTE: Must follow proof generation.
    // Use the exact same parameters as proof or this will throw invalid error.

    // // Gas to use for the transaction.
    // const gasDetailsSerialized: TransactionGasDetailsSerialized = {
    //   evmGasType: EVMGasType.Type2, // Depends on the chain (BNB uses type 0)
    //   gasEstimateString: "0x0100", // Output from gasEstimateForDeposit
    //   maxFeePerGasString: "0x100000", // Current gas Max Fee
    //   maxPriorityFeePerGasString: "0x010000", // Current gas Max Priority Fee
    // };
    const gasDetailsSerialized: TransactionGasDetailsSerialized = {
      ...originalGasDetailsSerialized,
      gasEstimateString,
    };

    // console.log(
    //   'PARAM::: ',
    //   network,
    //   wallet?.id!,
    //   false,
    //   memoText,
    //   erc20AmountRecipients,
    //   [], // nftAmountRecipients
    //   relayerFeeERC20AmountRecipient,
    //   sendWithPublicWallet,
    //   overallBatchMinGasPrice,
    //   gasDetailsSerialized
    // );

    const {
      nullifiers,
      serializedTransaction,
      error: populateProvedTransferError,
    } = await populateProvedTransfer(
      network,
      wallet?.id!,
      false,
      memoText,
      erc20AmountRecipients,
      [], // nftAmountRecipients
      relayerFeeERC20AmountRecipient,
      sendWithPublicWallet,
      overallBatchMinGasPrice,
      gasDetailsSerialized
    );
    if (populateProvedTransferError || serializedTransaction === undefined) {
      // Error populating transaction.
      throw new Error(populateProvedTransferError || 'No serializedTransaction!');
    }

    const nonce = await signer?.getTransactionCount();

    const transactionRequest = deserializeTransaction(serializedTransaction, nonce, chainId);

    // Public wallet to shield from.
    transactionRequest.from = await signer?.getAddress();

    // send transactionRequest to Relay.sol
    return await signer!.sendTransaction(transactionRequest);
  };

  const executeRecipe = async (recipe: Recipe, input: RecipeInput) => {
    setIsExecuting(true);
    try {
      const {
        networkName,
        erc20Amounts: inputERC20Amounts,
        nfts: relayAdaptUnshieldNFTAmounts,
      } = input;

      setRailgunFees(networkName, '25', '25');

      const recipeOutput = await recipe.getRecipeOutput(input);

      const { populatedTransactions, erc20Amounts, nfts: relayAdaptShieldNFTs } = recipeOutput;

      const crossContractCallsSerialized = populatedTransactions.map(serializeUnsignedTransaction);

      const relayAdaptUnshieldERC20Amounts: RailgunERC20Amount[] = inputERC20Amounts.map(
        ({ tokenAddress, amount }) => {
          return { tokenAddress, amountString: amount.toHexString() };
        }
      );

      const relayAdaptShieldERC20Addresses = erc20Amounts.map(({ tokenAddress }) => tokenAddress);

      // Gas price, used to calculate Relayer Fee iteratively.
      const feeData = await signer?.getFeeData();
      const originalGasDetailsSerialized: TransactionGasDetailsSerialized = {
        evmGasType: EVMGasType.Type2, // Depends on the chain (BNB uses type 0)
        gasEstimateString: '0x00', // Always 0, we don't have this yet.
        maxFeePerGasString: feeData?.maxFeePerGas?.toHexString() || '0x100000', // Current gas Max Fee
        maxPriorityFeePerGasString: feeData?.maxPriorityFeePerGas?.toHexString() || '0x010000', // Current gas Max Priority Fee
      };
      const feeTokenDetails = undefined;

      // Whether to use a Relayer or self-signing wallet.
      // true for self-signing, false for Relayer
      const sendWithPublicWallet = true;

      console.log(relayAdaptUnshieldERC20Amounts, relayAdaptShieldERC20Addresses);
      // const { gasEstimateString, error: gasEstimateForUnprovenCrossContractCallsError } =
      //   await gasEstimateForUnprovenCrossContractCalls(
      //     networkName,
      //     wallet?.id!,
      //     encryptionKey!,
      //     relayAdaptUnshieldERC20Amounts,
      //     relayAdaptUnshieldNFTAmounts,
      //     relayAdaptShieldERC20Addresses,
      //     relayAdaptShieldNFTs,
      //     crossContractCallsSerialized,
      //     originalGasDetailsSerialized,
      //     feeTokenDetails,
      //     sendWithPublicWallet
      //   );
      // if (gasEstimateForUnprovenCrossContractCallsError || gasEstimateString === undefined) {
      //   throw new Error(gasEstimateForUnprovenCrossContractCallsError || 'No gasEstimateString!');
      // }

      const relayerFeeERC20AmountRecipient = undefined;

      // Minimum gas price, only required for relayed transaction.
      const overallBatchMinGasPrice: string = '0x10000';

      const progressCallback = (progress: number) => {
        // Handle proof progress (show in UI).
        // Proofs can take 20-30 seconds on slower devices.
        console.log('progress', progress);
      };

      const { error: generateCrossContractCallsProofError } = await generateCrossContractCallsProof(
        networkName,
        wallet?.id!,
        encryptionKey!,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
        progressCallback
      );
      if (generateCrossContractCallsProofError) {
        // Proof generated successfully.
        throw new Error(generateCrossContractCallsProofError);
      }

      // NOTE: Must follow proof generation.
      // Use the exact same parameters as proof or this will throw invalid error.

      // // Gas to use for the transaction.
      // const gasDetailsSerialized: TransactionGasDetailsSerialized = {
      //   evmGasType: EVMGasType.Type2, // Depends on the chain (BNB uses type 0)
      //   gasEstimateString: "0x0100", // Output from gasEstimateForDeposit
      //   maxFeePerGasString: "0x100000", // Current gas Max Fee
      //   maxPriorityFeePerGasString: "0x010000", // Current gas Max Priority Fee
      // };
      const gasDetailsSerialized: TransactionGasDetailsSerialized = {
        ...originalGasDetailsSerialized,
        gasEstimateString: '0x4C4B40',
      };

      const {
        nullifiers,
        serializedTransaction,
        error: populateProvedCrossContractCallsError,
      } = await populateProvedCrossContractCalls(
        networkName,
        wallet?.id!,
        relayAdaptUnshieldERC20Amounts,
        relayAdaptUnshieldNFTAmounts,
        relayAdaptShieldERC20Addresses,
        relayAdaptShieldNFTs,
        crossContractCallsSerialized,
        relayerFeeERC20AmountRecipient,
        sendWithPublicWallet,
        overallBatchMinGasPrice,
        gasDetailsSerialized
      );
      if (populateProvedCrossContractCallsError || serializedTransaction === undefined) {
        // Error populating transaction.
        throw new Error(populateProvedCrossContractCallsError || 'No serializedTransaction!');
      }

      console.log('nullifiers:', nullifiers);

      const nonce = await signer?.getTransactionCount();

      const transactionRequest = deserializeTransaction(serializedTransaction, nonce, chainId);

      // Public wallet to shield from.
      transactionRequest.from = await signer?.getAddress();

      console.log(transactionRequest);

      // send transactionRequest to Relay.sol
      return await signer!.sendTransaction(transactionRequest);
    } catch (err) {
      throw err;
    } finally {
      setIsExecuting(false);
    }
  };

  return { isExecuting, shieldPrivateKey, shield, unshield, transfer, executeRecipe };
};

export default useRailgunTx;
