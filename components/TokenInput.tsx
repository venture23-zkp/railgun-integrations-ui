import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Input, InputGroup, InputRightElement } from '@chakra-ui/input';
import { useDisclosure } from '@chakra-ui/react';
import TokenSelectionModal from '@/components/TokenSelectionModal';
import { TokenListContextItem } from '@/contexts/TokenContext';
import TokenFilterType from '@/types/TokenFilterType';

type TokenInputProps = {
  exclude?: string[];
  onSelect: (token: TokenListContextItem) => void; // eslint-disable-line no-unused-vars
  tokenFilter?: TokenFilterType
} & UseFormRegisterReturn;

const TokenInput = React.forwardRef(
  ({ onSelect, exclude, tokenFilter, ...rest }: TokenInputProps, ref: React.Ref<HTMLInputElement>) => {
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
        <TokenSelectionModal
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

TokenInput.displayName = 'TokenInput';

export default TokenInput;
