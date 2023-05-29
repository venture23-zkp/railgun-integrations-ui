import { useEffect, useMemo, useState } from 'react';
import { ChainType } from '@railgun-community/engine';
import {
  ArtifactStore,
  Groth16,
  getEngine,
  getProver,
  loadProvider,
  setLoggers,
  setProviderForNetwork,
  startRailgunEngine,
  stopRailgunEngine,
} from '@railgun-community/quickstart';
import { BrowserLevel } from 'browser-level';
import { BigNumber } from 'ethers';
import localforage from 'localforage';
import { useNetwork, useProvider } from 'wagmi';
import { NetworkConfig, getNetwork, networks } from '@/utils/networks';

// Fee is in bips, e.g. a value of 25 is a 0.25% fee.
interface ShieldFee {
  [chainId: number]: BigNumber;
}

const fallbackShieldingFees: ShieldFee = {};
Object.keys(networks).forEach((chainId) => {
  // Current fees are 0.25% everywhere, so we initialize with that
  fallbackShieldingFees[Number(chainId)] = BigNumber.from('25');
});
const fallbackUnshieldingFees: ShieldFee = {};
Object.keys(networks).forEach((chainId) => {
  // Current fees are 0.25% everywhere, so we initialize with that
  fallbackUnshieldingFees[Number(chainId)] = BigNumber.from('25');
});

export const useRailgunProvider = () => {
  const [isProviderLoaded, setIsProviderLoaded] = useState(false);
  const [shieldingFees, setShieldingFees] = useState<ShieldFee>(fallbackShieldingFees);
  const [unshieldingFees, setunshieldingFees] = useState<ShieldFee>(fallbackUnshieldingFees);
  const { chain } = useNetwork();
  const [network, setNetwork] = useState<NetworkConfig>();
  const provider = useProvider();

  const chainId = useMemo(() => {
    return chain?.id || 1;
  }, [chain]);

  useEffect(() => {
    setIsProviderLoaded(false);
  }, [chainId]);

  useEffect(() => {
    if (network) {
      setProviderForNetwork(network.railgunNetworkName, provider);
    }
  }, [provider, network]);

  useEffect(() => {
    if (isProviderLoaded) return;

    const fn = async () => {
      await stopRailgunEngine();

      const { error: startRailgunEngineError } = startRailgunEngine(
        'hi',
        // @ts-ignore
        new BrowserLevel(''),
        true,
        new ArtifactStore(
          async (path: string) => {
            return localforage.getItem(path);
          },
          async (dir: string, path: string, item: string | Buffer) => {
            await localforage.setItem(path, item);
          },
          async (path: string) => (await localforage.getItem(path)) != null
        ),
        false,
        false,
      );
      if (startRailgunEngineError) {
        throw new Error(`Failed to startRailgunEngine: ${startRailgunEngineError}`);
      }

      setLoggers(console.log, console.error);
      getProver().setSnarkJSGroth16((window as any).snarkjs.groth16 as Groth16);

      const network = getNetwork(chainId);
      setNetwork(network);

      const { error: loadProviderError, feesSerialized } = await loadProvider(
        network.fallbackProviders,
        network.railgunNetworkName,
        true
      );
      if (loadProviderError) {
        throw new Error(`Failed to loadProvider(${chainId}): ${loadProviderError}`);
      }

      // Set the shield/unshield fees for each network.
      const shieldingFeesFromNetwork = {
        [chainId]: BigNumber.from(feesSerialized?.shield || fallbackShieldingFees[chainId]),
      };
      const unshieldingFeesFromNetwork = {
        [chainId]: BigNumber.from(feesSerialized?.unshield || fallbackUnshieldingFees[chainId]),
      };
      setShieldingFees({ ...shieldingFees, ...shieldingFeesFromNetwork });
      setunshieldingFees({ ...unshieldingFees, ...unshieldingFeesFromNetwork });

      await new Promise((resolve) => {
        const intervalId = setInterval(() => {
          const swcs = getEngine().railgunSmartWalletContracts;
          const swc = swcs?.[ChainType.EVM]?.[chainId];
          if (swc) resolve(swc);
          clearInterval(intervalId);
        }, 1000);
      });

      console.log('isProviderLoaded', true);
      setIsProviderLoaded(true);
    };

    fn();
  }, [chainId, isProviderLoaded]);

  return { isProviderLoaded, shieldingFees, unshieldingFees };
};
