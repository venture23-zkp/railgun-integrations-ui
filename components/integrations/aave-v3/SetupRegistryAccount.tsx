
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
import { randomBytes } from 'crypto';
import { BigNumber } from 'ethers';
import { useNetwork } from 'wagmi';
import useNotifications from '@/hooks/useNotifications';
import useRailgunTx from '@/hooks/useRailgunTx';
import { getNetwork } from '@/utils/networks';
import { RegistryCreateAccountRecipe } from './recipes/registry/RegistryCreateAccountRecipe';
import { CONTRACT_ADDRESS as REGISTRY_CONTRACT_ADDRESS } from '@/contract/erc-6551-registry-contract';
import { CONTRACT_ADDRESS as DEFAULT_ACCOUNT_ADDRESS } from '@/contract/default-erc-6551-account';
import { MAX_UINT256_HEX } from "./utils/big-number";

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

            const createAccount = new RegistryCreateAccountRecipe({
                implementation: DEFAULT_ACCOUNT_ADDRESS,
                chainId: BigNumber.from(chainId),
                tokenContract: ZERO_ADDRESS,
                tokenId: MAX_UINT256_HEX,
                salt: BigNumber.from(process.env.NEXT_PUBLIC_ERC6551_ACCOUNT_SALT as unknown as number),
                initData: []
            }, REGISTRY_CONTRACT_ADDRESS);

            try {
                setTxError(undefined);
                const tx = await executeRecipe(createAccount, {
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
                <ModalHeader>Setup Account</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {/* <FormControl isRequired={true} isInvalid={nftIdInputError !== ''}>
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
                    </FormControl> */}
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
                        Create
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SetupACModal;
