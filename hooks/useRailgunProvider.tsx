import { useEffect, useMemo, useState } from 'react';
import { ChainType } from '@railgun-community/engine';
import { createFallbackProviderFromJsonConfig } from '@railgun-community/shared-models';
import {
  ArtifactStore,
  Groth16,
  getEngine,
  getProver,
  loadProvider,
  setFallbackProviderForNetwork,
  setLoggers,
  startRailgunEngine,
  stopRailgunEngine,
} from '@railgun-community/wallet';
import { BrowserLevel } from 'browser-level';
import localforage from 'localforage';
import { useNetwork, usePublicClient } from 'wagmi';
import { NetworkConfig, getNetwork, networks } from '@/utils/networks';

// Fee is in bips, e.g. a value of 25 is a 0.25% fee.
interface ShieldFee {
  [chainId: number]: BigInt;
}

const fallbackShieldingFees: ShieldFee = {};
Object.keys(networks).forEach((chainId) => {
  // Current fees are 0.25% everywhere, so we initialize with that
  fallbackShieldingFees[Number(chainId)] = BigInt('25');
});
const fallbackUnshieldingFees: ShieldFee = {};
Object.keys(networks).forEach((chainId) => {
  // Current fees are 0.25% everywhere, so we initialize with that
  fallbackUnshieldingFees[Number(chainId)] = BigInt('25');
});

export const useRailgunProvider = () => {
  const [isProviderLoaded, setIsProviderLoaded] = useState(false);
  const [shieldingFees, setShieldingFees] = useState<ShieldFee>(fallbackShieldingFees);
  const [unshieldingFees, setunshieldingFees] = useState<ShieldFee>(fallbackUnshieldingFees);
  const { chain } = useNetwork();
  const [network, setNetwork] = useState<NetworkConfig>();
  const provider = usePublicClient();

  const chainId = useMemo(() => {
    return chain?.id || 1;
  }, [chain]);

  useEffect(() => {
    setIsProviderLoaded(false);
  }, [chainId]);

  useEffect(() => {
    if (network) {
      setFallbackProviderForNetwork(
        network.railgunNetworkName,
        createFallbackProviderFromJsonConfig(network.fallbackProviders)
      );
    }
  }, [provider, network]);

  useEffect(() => {
    if (isProviderLoaded) return;

    const fn = async () => {
      await stopRailgunEngine();

      startRailgunEngine(
        'hi',
        // @ts-ignore
        new BrowserLevel(''),
        true,
        new ArtifactStore(
          async (path: string) => {
            return localforage.getItem(path);
          },
          async (dir: string, path: string, item: string | Uint8Array) => {
            await localforage.setItem(path, item);
          },
          async (path: string) => (await localforage.getItem(path)) != null
        ),
        false,
        false,
        false // MAY NOT WORK
      );

      setLoggers(console.log, console.error);
      getProver().setSnarkJSGroth16((window as any).snarkjs.groth16 as Groth16);

      const network = getNetwork(chainId);
      setNetwork(network);

      const { feesSerialized } = await loadProvider(
        network.fallbackProviders,
        network.railgunNetworkName,
        undefined
      ).catch((err) => {
        throw new Error(`Failed to loadProvider(${chainId}): ${err}`);
      });

      // Set the shield/unshield fees for each network.
      const shieldingFeesFromNetwork = {
        [chainId]: BigInt(feesSerialized?.shield) || fallbackShieldingFees[chainId],
      };
      const unshieldingFeesFromNetwork = {
        [chainId]: BigInt(feesSerialized?.unshield) || fallbackUnshieldingFees[chainId],
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
