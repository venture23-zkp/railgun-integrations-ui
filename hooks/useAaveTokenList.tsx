import { useNetwork } from 'wagmi';
import aTokenListJson from '@/public/aTokenList.json';
import dVariableTokenList from '@/public/dVariableTokenList.json';
import dStableTokenList from '@/public/dStableTokenList.json';
import { TOKEN_PRIORITY_SORT } from '@/utils/constants';

export interface AaveTokenListItem {
    chainId: number;
    symbol: string;
    address: string;
    decimals: number;
    name: string;
    logoURI: string;
    originalTokenAddress: string;
}

export const useAaveTokenList = () => {
    const { chain } = useNetwork();

    const aTokenList = aTokenListJson.tokens
        .sort((a, b) => {
            // sorts most common tokens to the top of the tokenList
            for (const symbol of TOKEN_PRIORITY_SORT) {
                if (b.symbol === symbol) return 1;
                if (a.symbol === symbol) return -1;
            }
            return 0;
        });

    const dVariableToken = dVariableTokenList.tokens
        .sort((a, b) => {
            // sorts most common tokens to the top of the tokenList
            for (const symbol of TOKEN_PRIORITY_SORT) {
                if (b.symbol === symbol) return 1;
                if (a.symbol === symbol) return -1;
            }
            return 0;
        });

    const dStableToken = dStableTokenList.tokens
        .sort((a, b) => {
            // sorts most common tokens to the top of the tokenList
            for (const symbol of TOKEN_PRIORITY_SORT) {
                if (b.symbol === symbol) return 1;
                if (a.symbol === symbol) return -1;
            }
            return 0;
        });

    return { aTokenList, dVariableToken, dStableToken };
};
