import React, { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Balances, TokenType } from '@railgun-community/engine';
import { parseRailgunTokenAddress } from '@railgun-community/wallet';
import { ChainType } from '@railgun-community/shared-models';
import { BigNumber } from 'ethers';
import { useNetwork } from 'wagmi';
import { readContracts } from 'wagmi';
import { abi } from '@/abi-typechain/abi';
import { useToken } from '@/contexts/TokenContext';
import { CONTRACT_ADDRESS as ACM_CONTRACT_ADDRESS } from '@/contract/acm';
import { CONTRACT_ADDRESS as DEFAULT_ACCOUNT_ADDRESS } from '@/contract/default-erc-6551-account';
import { CONTRACT_ADDRESS as REGISTRY_CONTRACT_ADDRESS } from '@/contract/erc-6551-registry-contract';
import { NFTListItem, useNFTList } from '@/hooks/useNFTList';
import AcmAccountType from '@/types/AcmAccount';
import { useRailgunWallet } from './RailgunWalletContext';

function getNFTBalances(balances: Balances, nftAddresses?: string[]) {
  const nftAddressMap = nftAddresses?.reduce((acc, address) => {
    return { ...acc, [address.toLowerCase()]: address };
  }, {} as { [key: string]: string });

  return Object.keys(balances)
    .filter((tokenHash) => {
      return (
        [TokenType.ERC721, TokenType.ERC1155].includes(balances[tokenHash].tokenData.tokenType) &&
        balances[tokenHash].balance > BigInt(0)
      );
    })
    .reduce((nftBalances, tokenHash) => {
      const { tokenAddress, tokenType, tokenSubID } = balances[tokenHash].tokenData;
      const railgunNFTAddress = parseRailgunTokenAddress(tokenAddress);
      const _nftAddress = railgunNFTAddress.toLowerCase();
      const nftAddress = nftAddressMap?.[_nftAddress] || railgunNFTAddress;
      if (!nftAddressMap || nftAddressMap[_nftAddress]) {
        if (!nftBalances[nftAddress]) {
          nftBalances[nftAddress] = {
            address: nftAddress,
            type: tokenType,
            subIds: [],
          };
        }
        nftBalances[nftAddress].subIds.push(tokenSubID);
      }
      return nftBalances;
    }, {} as { [key: string]: { address: string; type: TokenType; subIds: string[] } });
}

export type NFTListContextItem = NFTListItem & {
  subIds: string[];
  privateSubIds: string[];
};

export type NFTContextType = {
  hasLoaded: boolean;
  nftList: NFTListContextItem[];
  accounts: AcmAccountType[];
  selectedAccount?: AcmAccountType;
  setSelectedAccount: (newAccount: AcmAccountType) => void;
};

const initialContext: NFTContextType = {
  hasLoaded: false,
  nftList: [],
  accounts: [],
  selectedAccount: undefined,
  setSelectedAccount: () => {},
};

const NFTContext = createContext<NFTContextType>(initialContext);

export const NFTListProvider = ({ children }: { children: ReactNode }) => {
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id || 1, [chain]);
  const { nftList } = useNFTList();
  const { wallet } = useRailgunWallet();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [nftListWithBalance, setNFTListWithBalance] = useState<NFTListContextItem[]>([]);
  const [accounts, setAccounts] = useState<AcmAccountType[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AcmAccountType>();
  const { tokenList } = useToken();

  useEffect(() => {
    setHasLoaded(false);
  }, [chainId, wallet, nftList]);

  useEffect(() => {
    if (hasLoaded) return;
    const fn = async () => {
      const balances = await wallet?.balances({ id: chainId, type: ChainType.EVM });
      if (balances) {
        const nftBalances = getNFTBalances(
          balances,
          nftList.map(({ address }) => address)
        );
        const newNFTList: NFTListContextItem[] = nftList.map((nft) => {
          const nftBalance = nftBalances[nft.address];
          return {
            ...nft,
            subIds: [],
            privateSubIds: nftBalance ? nftBalance.subIds : [],
          };
        });
        setNFTListWithBalance(newNFTList);
      }
      setHasLoaded(true);
    };
    fn();
  }, [hasLoaded, chainId, nftList, wallet]);

  // Getting ac addresses and their balances
  useEffect(() => {
    if (!hasLoaded) return;
    const fn = async () => {
      console.log('nftListWithBalance', nftListWithBalance);
      const acm = nftListWithBalance.find(({ address }) =>address === REGISTRY_CONTRACT_ADDRESS);
      if (!acm) return;
      const tokenids = acm.privateSubIds;
      const contracts = (await readContracts({
        contracts: tokenids.map((accountId) => ({
          abi: abi.ERC6551_Registry,
          address: REGISTRY_CONTRACT_ADDRESS,
          functionName: 'account',
          args: [
            DEFAULT_ACCOUNT_ADDRESS,
            chainId,
            // ZERO_ADDRESS,
            REGISTRY_CONTRACT_ADDRESS,
            // MAX_UINT256_HEX,
            process.env.NEXT_PUBLIC_TOKEN_ID,
            BigNumber.from(process.env.NEXT_PUBLIC_ERC6551_ACCOUNT_SALT),
          ],
        })),
      })) as string[];
      setAccounts(tokenids.map((id, i) => ({ id, contract: contracts[i] })));
    };
    fn();
  }, [nftListWithBalance, hasLoaded]);

  return (
    <NFTContext.Provider
      value={{
        hasLoaded,
        nftList: nftListWithBalance || [],
        accounts,
        selectedAccount,
        setSelectedAccount,
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};

export const useNFT = () => useContext(NFTContext);
