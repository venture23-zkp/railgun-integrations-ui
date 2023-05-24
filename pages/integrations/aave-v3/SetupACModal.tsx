import React, { useState } from 'react';
import { useCallback } from 'react';
import { AddIcon, CopyIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import {
  Button,
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
  useToast,
} from '@chakra-ui/react';
import { readContract, writeContract, prepareWriteContract } from '@wagmi/core';
import { randomBytes } from 'crypto';
import { BigNumber } from 'ethers';


const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ACM_CONTRACT_ADDRESS = '0x92F8B8B507Bb7742a0EC7336c22FaB1d0CBe2154';
const acmABI = [
  {
    type: 'function',
    name: 'nftAc',
    stateMutability: 'view',
    inputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
  },
  {
    type: 'function',
    name: 'setupAC',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: '_id',
        type: 'uint256',
      },
    ],
    outputs: [],
  },
];

const SetupACModal = ({ isOpen, onClose }: UseModalProps) => {
  const [nftId, setNFTId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const toast = useToast();

  const genRandomNFTId = useCallback(() => {
    setNFTId(BigNumber.from(randomBytes(32)).toString());
  }, []);

  const handleSubmit = useCallback(
    async (e: React.SyntheticEvent) => {
      const id = 'setup_ac';
      e.stopPropagation();

      const nftIdArg = BigNumber.from(nftId);

      const address = await readContract({
        // abi: new Interface(["nftAc(uint256) view returns (address)"]).getFunction(),
        abi: acmABI,
        address: ACM_CONTRACT_ADDRESS,
        functionName: 'nftAc',
        args: [nftIdArg],
      });

      console.log('addressnft', address, ZERO_ADDRESS);

      const nftIsAvailable = address === ZERO_ADDRESS;

      if (!nftIsAvailable) {
        setError('Account ID is available!');
        return;
      }

      const config = await prepareWriteContract({
        abi: acmABI,
        address: ACM_CONTRACT_ADDRESS,
        functionName: "setupAC",
        args: [nftIdArg],
      });

      console.log("prepareWrite", config)
    },
    [nftId, toast]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Setup Public Account</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl isRequired={true} isInvalid={error !== ''}>
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
                    setError(error as string);
                  }
                }}
              />
              <InputRightElement width="4.5rem">
                <Button onClick={genRandomNFTId}>Auto</Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
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