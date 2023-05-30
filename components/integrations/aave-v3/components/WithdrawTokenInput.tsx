import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Input, InputGroup, InputRightElement } from '@chakra-ui/input';
import { useDisclosure } from '@chakra-ui/react';
import WithdrawTokenSelectionModal from './WithdrawTokenSelectionModal';
import TokenFilterType from '@/types/TokenFilterType';
import { TokenListContextItem } from '@/contexts/TokenContext';

type ATokenInputProps = {
    exclude?: string[];
    onSelect: (token: TokenListContextItem) => void; // eslint-disable-line no-unused-vars
    tokenFilter?: TokenFilterType
} & UseFormRegisterReturn;

const ATokenInput = React.forwardRef(
    ({ onSelect, exclude, tokenFilter, ...rest }: ATokenInputProps, ref: React.Ref<HTMLInputElement>) => {
        const {
            isOpen: isTokenSelectionOpen,
            onOpen: onTokenSelectionOpen,
            onClose: onTokenSelectionClose,
        } = useDisclosure();
        const localOnSelect = (token: TokenListContextItem) => {
            onSelect(token);
            onTokenSelectionClose();
        };
        return (
            <>
                <InputGroup cursor="pointer" onClick={onTokenSelectionOpen}>
                    <Input
                        type="button"
                        pr="4.5rem"
                        size="lg"
                        height="4rem"
                        mb=".75rem"
                        {...rest}
                        ref={ref}
                    />
                    <InputRightElement alignItems="center" height="4rem" width="3rem">
                        <ChevronDownIcon boxSize="1.75rem" />
                    </InputRightElement>
                </InputGroup>
                <WithdrawTokenSelectionModal
                    exclude={exclude}
                    isOpen={isTokenSelectionOpen}
                    onClose={onTokenSelectionClose}
                    onSelect={localOnSelect}
                    tokenFilter={tokenFilter}
                />
            </>
        );
    }
);

ATokenInput.displayName = 'TokenInput';

export default ATokenInput;
