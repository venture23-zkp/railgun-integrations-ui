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
import useNotifications from '@/hooks/useNotifications';
import useRailgunTx from '@/hooks/useRailgunTx';
import { VALID_AMOUNT_REGEX, ethAddress } from '@/utils/constants';
import { getNetwork } from '@/utils/networks';
import { isAmountParsable } from '@/utils/token';
import { CONTRACT_ADDRESS as ACM_CONTRACT_ADDRESS } from '../contract/acm';
import { AaveV3DepositRecipe } from '../recipes/acm/AaveV3DepositRecipe';
import { Account } from './TxFrom';

type FormInput = {
  token: string;
  amount: string;
};

const DepositForm = ({ id }: Account) => {
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
          exclude={[ethAddress]}
          onSelect={(token) => {
            setValue('token', token.name);
            setSelectedToken(token);
          }}
          tokenFilter={{
            aaveSupported: true
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
        Deposit
      </Button>
      {selectedToken && (
        <ReviewDepositTransactionModal
          isOpen={isReviewOpen}
          onClose={closeReview}
          id={id}
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

type ReviewDepositTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  token: TokenListContextItem;
  amount: string;
  onSubmitClick: () => void;
};

const ReviewDepositTransactionModal = ({
  isOpen,
  onClose,
  amount,
  id,
  token,
  onSubmitClick,
}: ReviewDepositTransactionModalProps) => {
  const { txNotify } = useNotifications();
  const { isExecuting, executeRecipe } = useRailgunTx();
  const [error, setError] = useState<string>();
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id || 1, [chain]);
  const network = useMemo(() => getNetwork(chainId), [chainId]);

  const tokenAmount = parseUnits(amount! || '0', token.decimals);

  const doSubmit = useCallback(async () => {
    if (!token.address || !token.decimals) throw new Error('bad form');
    try {
      setError(undefined);
      console.log(id);
      const depositRecipe = new AaveV3DepositRecipe(
        ACM_CONTRACT_ADDRESS,
        {
          id: BigNumber.from(id),
          tokenAddress: token.address,
          amount: tokenAmount,
        },
        token.decimals
      );
      const tx = await executeRecipe(depositRecipe, {
        networkName: network.railgunNetworkName,
        nfts: [
          {
            nftTokenType: NFTTokenType.ERC721,
            nftAddress: ACM_CONTRACT_ADDRESS,
            tokenSubID: id,
            amountString: '1',
          },
        ],
        erc20Amounts: [
          {
            isBaseToken: false,
            tokenAddress: token.address,
            amount: tokenAmount,
            decimals: token.decimals,
          },
        ],
      });
      txNotify(tx.hash);
      onClose();
      onSubmitClick();
    } catch (e) {
      console.error(e);
      const err = e as Error & { reason?: string };
      setError(err.reason ? err.reason : err.message);
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
              <span style={{ padding: '0px 10px 0px 10px' }}>Deposit</span>
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DepositForm;
