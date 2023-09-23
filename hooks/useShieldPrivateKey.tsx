import { useEffect, useState } from 'react';
import { getShieldPrivateKeySignatureMessage } from '@railgun-community/wallet';
import { keccak256 } from 'ethers';
import { WalletClient, useAccount, useWalletClient } from 'wagmi';

const useShieldPrivateKey = () => {
  const { data: signer } = useWalletClient();
  const [shieldPrivateKey, setShieldPrivateKey] = useState<string>();
  const { address } = useAccount();

  useEffect(() => {
    setShieldPrivateKey(undefined);
  }, [address]);

  const getShieldPrivateKey = async () => {
    if (shieldPrivateKey) return shieldPrivateKey;
    const spk = keccak256(
      await (signer as WalletClient).signMessage({ message: getShieldPrivateKeySignatureMessage() })
    );
    setShieldPrivateKey(spk);
    return spk;
  };
  return { shieldPrivateKey, getShieldPrivateKey };
};

export default useShieldPrivateKey;
