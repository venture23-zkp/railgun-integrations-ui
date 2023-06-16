import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ChainType } from '@railgun-community/shared-models';
import { BigNumber } from 'ethers';
import { useAccount, useNetwork } from 'wagmi';
import useNotifications from '@/hooks/useNotifications';
import useTokenAllowances from '@/hooks/useTokenAllowances';
import useTokenBalances from '@/hooks/useTokenBalances';
import { TokenListItem, useTokenList } from '@/hooks/useTokenList';
import { useRailgunWallet } from './RailgunWalletContext';

export type TokenListContextItem = TokenListItem & {
  balance: BigNumber | null;
  privateBalance: BigNumber | null;
  aTokenBalance?: BigNumber | null;
  dStableTokenBalance?: BigNumber | null;
  dVariableTokenBalance?: BigNumber | null;
};

export type TokenContextType = {
  tokenList: TokenListContextItem[];
  isLoading: boolean;
  tokenAllowances: Map<string, BigNumber>;
  shieldingFees: { [key: number]: BigNumber };
  unshieldingFees: { [key: number]: BigNumber };
  refreshBalances: () => Promise<void>;
};
const initialContext = {
  isLoading: false,
  tokenList: [],
  tokenAllowances: new Map(),
  shieldingFees: {},
  unshieldingFees: {},
  refreshBalances: async () => { },
};

const TokenContext = createContext<TokenContextType>(initialContext);

export const TokenListProvider = ({
  children,
  shieldingFees,
  unshieldingFees,
}: {
  children: ReactNode;
  shieldingFees: { [key: number]: BigNumber };
  unshieldingFees: { [key: number]: BigNumber };
}) => {
  const { chain } = useNetwork();
  const chainId = chain?.id || 1;

  const { notifyUser } = useNotifications();
  const { tokenList } = useTokenList();
  const { isConnected } = useAccount();

  const { wallet, refreshBalances: refreshRailgunBalances } = useRailgunWallet();

  const [tokenListWithPrivateBalance, setTokenListWithPrivateBalance] = useState<
    TokenListContextItem[]
  >([]);

  const {
    isLoading: balanceIsLoading,
    error: balanceError,
    data,
    refetchBalances: refetchPublicBalances,
  } = useTokenBalances({ tokenList: tokenList || [] });
  const {
    isLoading: allowanceIsLoading,
    error: allowanceError,
    data: allowances,
  } = useTokenAllowances({ tokenList: tokenList || [] });

  if (balanceError && isConnected) {
    console.error(balanceError);
    notifyUser({
      alertType: 'error',
      message: 'Something went wrong fetching the token balances',
    });
  }
  if (allowanceError && isConnected) {
    console.error(allowanceError);
    notifyUser({
      alertType: 'error',
      message: 'Something went wrong fetching the token allowances',
    });
  }

  const refreshBalances = useCallback(async () => {
    await Promise.all([refetchPublicBalances(), refreshRailgunBalances()]);
  }, [refetchPublicBalances, refreshRailgunBalances]);

  useEffect(() => {
    const fn = async () => {
      if (!data || data.length === 0) {
        return;
      }
      const tokenList: TokenListContextItem[] = await Promise.all(
        data.map(async (token) => {
          console.log("fetching balance!!!! ", wallet)
          const balance = await wallet?.getBalance(
            {
              id: chainId,
              type: ChainType.EVM,
            },
            token.address
          );
          return {
            ...token,
            privateBalance: balance === undefined ? null : BigNumber.from(balance),
          };
        })
      );
      setTokenListWithPrivateBalance(tokenList);
    };
    fn();
  }, [chainId, wallet, data]);

  return (
    <TokenContext.Provider
      value={{
        tokenList: tokenListWithPrivateBalance || [],
        isLoading: balanceIsLoading || allowanceIsLoading,
        tokenAllowances: allowances || new Map(),
        shieldingFees,
        unshieldingFees,
        refreshBalances,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
};

export const useToken = () => useContext(TokenContext);
