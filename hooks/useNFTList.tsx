import { useEffect, useMemo, useState } from 'react';
import { useNetwork } from 'wagmi';
import useLocalForageGet from '@/hooks/useLocalForageGet';
import nftListJson from '@/public/nftlist.json';
import { CUSTOM_NFTS_STORAGE_KEY } from '@/utils/constants';

export interface NFTListItem {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  logoURI: string;
}

export const useNFTList = () => {
  const { chain } = useNetwork();
  const chainId = useMemo(() => chain?.id || 1, [chain]);

  const [nftList, setNFTList] = useState<NFTListItem[]>([]);

  const { data: localNFTList } = useLocalForageGet<NFTListItem[]>({
    itemPath: CUSTOM_NFTS_STORAGE_KEY,
  });

  useEffect(() => {
    const nftList = nftListJson.tokens.filter((token) => token.chainId === chainId);
    setNFTList([...nftList, ...(localNFTList || [])]);
  }, [chainId, localNFTList]);

  return { nftList };
};
