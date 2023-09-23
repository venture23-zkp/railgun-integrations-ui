import { useCallback } from 'react';
import { BigNumber } from '@ethersproject/bignumber';
import { readContracts } from '@wagmi/core';
import useSWR from 'swr';
import { parseAbi } from 'viem';
import { useAccount, useBalance, useNetwork } from 'wagmi';
import { TokenListItem } from '@/hooks/useTokenList';
import { ethAddress } from '@/utils/constants';

export const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256 balance)'];

const useTokenBalances = ({ tokenList }: { tokenList: TokenListItem[] }) => {
  const { chain } = useNetwork();
  const { address } = useAccount();
  const {
    data: balance,
    isError,
    isLoading: balanceLoading,
    refetch,
  } = useBalance({
    address,
  });

  const chainId = chain?.id || 1; // default to mainnet if no chain id
  const { isLoading, error, data, mutate } = useSWR(
    `userTokenList-${chainId}-${tokenList.length}`,
    async () => {
      if (!tokenList || tokenList.length === 0) {
        return;
      }

      const readContractsArgs = tokenList
        .filter((token) => token.address !== ethAddress)
        .map((token) => {
          return {
            abi: parseAbi(ERC20_ABI),
            functionName: 'balanceOf',
            address: token.address as `0x${string}`,
            args: [address as `0x${string}`],
          };
        });
      const data = await readContracts({
        contracts: readContractsArgs,
      });

      const tokenListWithUserBalance = Promise.all(
        tokenList.slice(1).map(async (token, i) => {
          // hadlilng expectional case
          if (!data[i])
            return {
              ...token,
              balance: 0n,
            };

          let { result, status, error } = data[i];
          if (status === 'failure') throw error;

          // Converting to eth

          if (token.address === ethAddress)
            return {
              ...token,
              balance: balance?.value || null,
            };
          return {
            ...token,
            balance: result as bigint | null, // Subtract 1 because the native token is the first token and is handled by the conditional above
          };
        })
      );

      return tokenListWithUserBalance;
    }
  );

  const refetchBalances = useCallback(async () => {
    await Promise.all([refetch(), mutate()]);
  }, [refetch, mutate]);

  return {
    isLoading: isLoading || balanceLoading,
    error: error || isError,
    data,
    refetchBalances,
  };
};

export default useTokenBalances;
