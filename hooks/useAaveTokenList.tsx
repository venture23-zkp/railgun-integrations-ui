import { useNetwork } from 'wagmi';
import tokenListJson from '@/public/aaveTokenList.json';
import { TOKEN_PRIORITY_SORT } from '@/utils/constants';

export interface AaveTokenListItem {
    chainId: number;
    symbol: string;
    address: string;
    decimals: number;
    name: string;
    logoURI: string;
}

export const useAaveTokenList = () => {
    const { chain } = useNetwork();
    const chainId = chain?.id || 1; // default to mainnet if no chain id

    const tokenList = tokenListJson.tokens
        .sort((a, b) => {
            // sorts most common tokens to the top of the tokenList
            for (const symbol of TOKEN_PRIORITY_SORT) {
                if (b.symbol === symbol) return 1;
                if (a.symbol === symbol) return -1;
            }
            return 0;
        });

    return { tokenList };
};
