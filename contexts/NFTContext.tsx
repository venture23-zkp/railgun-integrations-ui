import React, { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Balances, TokenType } from '@railgun-community/engine';
import { parseRailgunTokenAddress } from '@railgun-community/quickstart';
import { ChainType } from '@railgun-community/shared-models';
import { useNetwork } from 'wagmi';
import { NFTListItem, useNFTList } from '@/hooks/useNFTList';
import { useRailgunWallet } from './RailgunWalletContext';
import { useToken } from '@/contexts/TokenContext';
import { CONTRACT_ADDRESS as ACM_CONTRACT_ADDRESS } from '@/contract/acm';
import { readContracts } from 'wagmi';
import { abi } from '@/abi-typechain/abi';
import AcmAccountType from '@/types/AcmAccount';

const ERC20_ABI = [
  {
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

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
  accounts: AcmAccountType[]
};

const initialContext: NFTContextType = {
  hasLoaded: false,
  nftList: [],
  accounts: []
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
  const { tokenList } = useToken();

  const aaveSupportedTokens = useMemo(() => {
    return tokenList.filter((token) => token.aaveSupported);
  }, [tokenList])

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
      console.log(nftListWithBalance)
      const acm = nftListWithBalance.find(({ address }) => address === ACM_CONTRACT_ADDRESS);
      if (!acm) return;
      const accountIds = acm.privateSubIds;
      const contracts = (await readContracts({
        contracts: accountIds.map((accountId) => ({
          abi: abi.ACM,
          address: ACM_CONTRACT_ADDRESS,
          functionName: 'nftAc',
          args: [accountId],
        })),
      })) as string[];

      // // getting balances for ac addresses
      // for (let acAddr of contracts) {
      //   const balanceOfContract = (await readContracts({
      //     contracts: aaveSupportedTokens.map((token) => ({
      //       abi: ERC20_ABI,
      //       address: token.address,
      //       functionName: 'balanceOf',
      //       args: [acAddr],
      //     })),
      //   })) as string[];
      // }

      setAccounts(accountIds.map((id, i) => ({ id, contract: contracts[i] })));
    };
    fn();
  }, [nftListWithBalance, hasLoaded]);

  return (
    <NFTContext.Provider
      value={{
        hasLoaded,
        nftList: nftListWithBalance || [],
        accounts
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};

export const useNFT = () => useContext(NFTContext);
