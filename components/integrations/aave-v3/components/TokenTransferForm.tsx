import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@chakra-ui/button';
import { FormControl, FormErrorMessage, FormLabel } from '@chakra-ui/form-control';
import { Input, InputGroup } from '@chakra-ui/input';
import { Flex, Heading, Text } from '@chakra-ui/layout';
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/modal';
import { useDisclosure } from '@chakra-ui/react';
import { Alert, AlertIcon } from '@chakra-ui/react';
import { NFTTokenType } from '@railgun-community/shared-models';
import { BigNumber, ethers } from 'ethers';
import { parseUnits } from 'ethers/lib/utils.js';
import { useAccount, useNetwork } from 'wagmi';
import TokenInput from '@/components/TokenInput';
import { useToken } from '@/contexts/TokenContext';
import { TokenListContextItem } from '@/contexts/TokenContext';
import { CONTRACT_ADDRESS as REGISTRY_CONTRACT_ADDRESS } from '@/contract/erc-6551-registry-contract';
import useNotifications from '@/hooks/useNotifications';
import useRailgunTx from '@/hooks/useRailgunTx';
import { VALID_AMOUNT_REGEX, ethAddress } from '@/utils/constants';
import { getNetwork } from '@/utils/networks';
import { isAmountParsable } from '@/utils/token';
import { AaveV3WithdrawRecipe } from '../recipes/account/AaveV3WithdrawRecipe';
// import { CONTRACT_ADDRESS as ACM_CONTRACT_ADDRESS } from '@/contract/acm';
// import { AaveV3WithdrawRecipe } from '../recipes/acm/AaveV3WithdrawRecipe';
import { TxnType } from '../steps/account/AaveTransactionStep';
import { Account } from './TxFrom';

type FormInput = {
  token: string;
  amount: string;
};

const WithdrawForm = ({ id, contract }: Account) => {
  const { tokenList } = useToken();
  const { chain } = useNetwork();
  const { isConnected } = useAccount();
  const {
    handleSubmit,
    register,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    mode: 'onChange',
    // defaultValues: {},
  });
  const { isOpen: isReviewOpen, onOpen: openReview, onClose: closeReview } = useDisclosure();
  const [selectedToken, setSelectedToken] = useState<TokenListContextItem>(tokenList[0]);
  const [tokenAmount, setTokenAmount] = useState<string>('');

  const onSubmit = handleSubmit(async (values) => {
    setTokenAmount(values.amount);
    openReview();
  });

  useEffect(() => {
    if (!selectedToken) {
      setSelectedToken(tokenList[0]);
    }
  }, [selectedToken, tokenList]);

  return (
    <form onSubmit={onSubmit}>
      <FormControl isInvalid={Boolean(errors.token?.message)} mt=".5rem">
        <FormLabel>Token</FormLabel>
        <TokenInput
          {...register('token')}
          onSelect={(token) => {
            setValue('token', token.name);
            setSelectedToken(token);
          }}
        />
      </FormControl>
      <FormControl isInvalid={Boolean(errors.amount?.message)}>
        <FormLabel>Amount</FormLabel>
        <InputGroup size="lg" width="auto" height="4rem">
          <Input
            variant="outline"
            size="lg"
            pr="4.5rem"
            height="100%"
            placeholder="0.1"
            {...register('amount', {
              required: 'This is required',
              onChange: (e) => {
                const isParseable = isAmountParsable(e.target.value, selectedToken.decimals);
                if (
                  e.target.value &&
                  !isNaN(e.target.value) &&
                  VALID_AMOUNT_REGEX.test(e.target.value) &&
                  isParseable
                ) {
                  setTokenAmount(e.target.value);
                }
              },
              validate: (value) => {
                try {
                  if (!VALID_AMOUNT_REGEX.test(value) && isNaN(parseFloat(value))) {
                    return 'Not a valid number';
                  }

                  return (
                    Boolean(
                      parseUnits(value || '0', selectedToken?.decimals).gt(BigNumber.from('0'))
                    ) || 'Amount must be greater than 0'
                  );
                } catch (e) {
                  return 'Not a valid number';
                }
              },
            })}
          />
        </InputGroup>
        <FormErrorMessage my=".25rem">{errors.amount && errors.amount.message}</FormErrorMessage>
      </FormControl>
      <Button
        isDisabled={!isConnected || chain?.unsupported}
        type="submit"
        size="lg"
        mt=".75rem"
        width="100%"
      >
        Transfer
      </Button>
      {selectedToken && (
        <TokenTransferTransactionModal
          isOpen={isReviewOpen}
          onClose={closeReview}
          id={id}
          contract={contract}
          token={selectedToken}
          amount={tokenAmount}
          onSubmitClick={() => {
            reset((values) => ({
              ...values,
              amount: '',
            }));
          }}
        />
      )}
    </form>
  );
};

type TokenTransferTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  token: TokenListContextItem;
  amount: string;
  contract: string;
  onSubmitClick: () => void;
};

// const amt = BigNumber.from(1);
// const account = "0xd7EA16B6dd857381275C4EB5F416d9Cba521b5E4"; // from "accounts" method of erc1655registry
// const tokenId = "9"; // nft id that gets minted when we create a new account

const TokenTransferTransactionModal = ({
  isOpen,
  onClose,
  amount,
  id,
  token,
  onSubmitClick,
  contract,
}: TokenTransferTransactionModalProps) => {
  const { txNotify } = useNotifications();
  const { isExecuting, executeRecipe, transfer } = useRailgunTx();
  const [error, setError] = useState<string>();
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id || 1, [chain]);
  const network = useMemo(() => getNetwork(chainId), [chainId]);

  const tokenAmount = parseUnits(amount! || '0', token.decimals);

  const doSubmit = useCallback(async () => {
    if (!token.address || !token.decimals) throw new Error('bad form');
    try {
      //   const withdrawRecipe = new AaveV3WithdrawRecipe({
      //     account: contract,
      //     asset: token.address, // usdc address
      //     amount: tokenAmount, // just 1 usdc
      //     action: TxnType.WITHDRAW, // deposit action
      //     decimal: token.decimals, // 6
      //   });
      //   const tx = await executeRecipe(withdrawRecipe, {
      //     networkName: network.railgunNetworkName,
      //     nfts: [
      //       {
      //         nftTokenType: NFTTokenType.ERC721,
      //         nftAddress: REGISTRY_CONTRACT_ADDRESS,
      //         tokenSubID: id,
      //         amountString: '1',
      //       },
      //     ],
      //     erc20Amounts: [
      //       // {
      //       //   isBaseToken: false,
      //       //   tokenAddress: token.address,
      //       //   amount: amt,
      //       //   decimals: token.decimals,
      //       // },
      //     ],
      //   });
      const tx = await transfer([
        {
          recipient:
            '0zk1qy345tz8qz87upcstrzdyuhg6wnstlyr06p2y4j6q2qjrtac7jryfrv7j6fe3z53l772ywsyvumcw8mx8yaghwewnwujcffz2p9h4qyyze6mhjsufh0rzh26p27',
          address: token.address,
          amount: tokenAmount.toString(),
          decimals: token.decimals,
        },
        // {
        //   recipient:
        //     '0zk1qyy4hwkdnvln6npplyukg5ltn9nlst3z2vvsv8h2dhl3pqh8lk9ufrv7j6fe3z53luv60w53nhvyznwpypul25v3pml9h8q0mppjus5c7gfkat29fgc2xgndvgv',
        //   address: '0x65aFADD39029741B3b8f0756952C74678c9cEC93',
        //   amount: "5",
        //   decimals: 6,
        // },
        {
          recipient:
            '0zk1qyy4hwkdnvln6npplyukg5ltn9nlst3z2vvsv8h2dhl3pqh8lk9ufrv7j6fe3z53luv60w53nhvyznwpypul25v3pml9h8q0mppjus5c7gfkat29fgc2xgndvgv',
          address: token.address,
          amount: tokenAmount.toString(),
          decimals: token.decimals,
        },
      ]);
      txNotify(tx.hash);
      onClose();
      onSubmitClick();
    } catch (e) {
      console.error(e);
      const err = e as Error & { reason?: string };
      setError(err.reason ? err.reason : err.tokenAmountmessage);
    }
  }, [network, id, token, tokenAmount, executeRecipe, onClose, txNotify, onSubmitClick]);

  return (
    <Modal
      onClose={() => {
        onClose();
        setError(undefined);
      }}
      isOpen={isOpen}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Review Transaction</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column">
            <Flex direction="column" borderRadius="1.5rem" border="1px solid black" padding="1rem">
              <Flex align="center" justify="space-between">
                <Heading size="xs" paddingX={2}>
                  Token name
                </Heading>
                <Text size="sm">{token.name}</Text>
              </Flex>
              <Flex align="center" justify="space-between">
                <Heading size="xs" paddingX={2}>
                  Amount
                </Heading>
                <Text size="sm">
                  {ethers.utils.formatUnits(tokenAmount, token.decimals)} {token.symbol}
                </Text>
              </Flex>
            </Flex>
          </Flex>
          {error && (
            <Alert
              status="error"
              mt=".5rem"
              borderRadius="md"
              wordBreak={'break-word'}
              maxH={'3xs'}
              overflowY={'auto'}
              alignItems={'flex-start'}
            >
              <AlertIcon />
              <Flex>{error}</Flex>
            </Alert>
          )}
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Flex justify="space-between">
            <Button
              variant="outline"
              w="100%"
              margin="0.3rem"
              isDisabled={isExecuting}
              isLoading={isExecuting}
              onClick={doSubmit}
            >
              <span style={{ padding: '0px 10px 0px 10px' }}>Transfer</span>
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default WithdrawForm;
