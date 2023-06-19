
import React, { useState } from 'react';
import { useCallback } from 'react';
import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  UseModalProps,
} from '@chakra-ui/react';
import { readContract } from '@wagmi/core';
import { randomBytes } from 'crypto';
import { BigNumber } from 'ethers';
import { useNetwork } from 'wagmi';
import useNotifications from '@/hooks/useNotifications';
import useRailgunTx from '@/hooks/useRailgunTx';
import { getNetwork } from '@/utils/networks';
import { abi } from '@/abi-typechain/abi';
import { ACMSetupACRecipe } from './recipes/acm/ACMSetupACRecipe';
import { SNARK_SCALAR_FIELD } from './utils/big-number';
import { REGISTRY_CONTRACT_ADDRESS as ACM_CONTRACT_ADDRESS } from '@/contract/acm';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const SetupACModal = ({ isOpen, onClose }: UseModalProps) => {
  const { chain } = useNetwork();
  const chainId = chain?.id || 1;
  const { railgunNetworkName: networkName } = getNetwork(chainId);
  const { executeRecipe } = useRailgunTx();
  const { txNotify } = useNotifications();

  const [nftId, setNFTId] = useState<string>('');
  const [nftIdInputError, setNFTIdInputError] = useState<string>('');
  const [txError, setTxError] = useState<string>();

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      e.stopPropagation();

      const nftIdArg = BigNumber.from(nftId);

      const address = await readContract({
        abi: abi.ACM,
        address: ACM_CONTRACT_ADDRESS,
        functionName: 'nftAc',
        args: [nftIdArg],
      });

      const nftIsAvailable = address === ZERO_ADDRESS;

      if (!nftIsAvailable) {
        setNFTIdInputError('Account ID is available!');
        return;
      }

      const setupAc = new ACMSetupACRecipe(nftId, ACM_CONTRACT_ADDRESS);

      try {
        setTxError(undefined);
        const tx = await executeRecipe(setupAc, {
          networkName,
          erc20Amounts: [],
          nfts: [],
        });
        txNotify(tx.hash);
        onClose();
      } catch (e) {
        console.error(e);
        const err = e as Error & { reason?: string };
        setTxError(err.reason ? err.reason : err.message);
      }
    },
    [networkName, nftId, executeRecipe, txNotify, onClose]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Setup Public Account</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired={true} isInvalid={nftIdInputError !== ''}>
            <FormLabel>Account ID</FormLabel>
            <InputGroup size="lg">
              <Input
                type="number"
                placeholder="Enter an integer for NFT ID"
                size="lg"
                value={nftId}
                onChange={(e) => {
                  const value = e.target.value;
                  try {
                    BigNumber.from(value);
                    setNFTId(value);
                  } catch (error) {
                    setNFTIdInputError(error as string);
                  }
                }}
              />
              <InputRightElement width="4.5rem">
                <Button
                  onClick={() => {
                    setNFTId(BigNumber.from(randomBytes(32)).mod(SNARK_SCALAR_FIELD).toString());
                  }}
                >
                  Auto
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{nftIdInputError}</FormErrorMessage>
          </FormControl>
          {txError && (
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
              <Flex>{txError}</Flex>
            </Alert>
          )}
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Button mr={3} onClick={handleSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SetupACModal;
