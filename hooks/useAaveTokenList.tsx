import { useNetwork, useToken } from 'wagmi';
import useLocalForageGet from '@/hooks/useLocalForageGet';
import aaveTokenList from '@/public/aaveTokenList.json';
import { CUSTOM_TOKENS_STORAGE_KEY, TOKEN_PRIORITY_SORT } from '@/utils/constants';
import { buildBaseToken, getNetwork } from '@/utils/networks';

export interface AaveTokenListItem {
    chainId: number;
    symbol: string;
    address: string;
    decimals: number;
    name: string;
    logoURI: string;
}

export const useAaaveTokenList = () => {
    const { chain } = useNetwork();
    const chainId = chain?.id || 1; // default to mainnet if no chain id
    const network = getNetwork(chainId);
    const baseToken = buildBaseToken(network.baseToken, chain?.id || 1);
    const { data: wethToken } = useToken({ address: network.wethAddress as '0x{string}' });

    const tokenList = aaveTokenList.tokens
        .filter(
            (token) =>
                token.chainId === chainId && (!wethToken ? true : token.address !== network.wethAddress)
        )
        .sort((a, b) => {
            // sorts most common tokens to the top of the tokenList
            for (const symbol of TOKEN_PRIORITY_SORT) {
                if (b.symbol === symbol) return 1;
                if (a.symbol === symbol) return -1;
            }
            return 0;
        });

    const { data: localTokenList } = useLocalForageGet<AaveTokenListItem[]>({
        itemPath: CUSTOM_TOKENS_STORAGE_KEY,
    });

    if (wethToken) {
        tokenList.unshift({ ...wethToken, chainId, logoURI: '' });
    }
    const tokens = [baseToken, ...tokenList];
    const localTokens = localTokenList || [];
    return { aaveTokenList: [...tokens, ...localTokens] };
};
