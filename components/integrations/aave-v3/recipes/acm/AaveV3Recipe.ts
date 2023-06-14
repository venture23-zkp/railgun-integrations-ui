import { Recipe } from '@railgun-community/cookbook';
import { NetworkName } from '@railgun-community/shared-models';

export abstract class AaveV3Recipe extends Recipe {
  readonly config = {
    name: 'Aave v3 Recipe',
    description: 'Interact with Aave V3 using ACM',
  };

  protected supportsNetwork(networkName: NetworkName): boolean {
    console.log(networkName === NetworkName.PolygonMumbai)
    switch (networkName) {
      case NetworkName.EthereumGoerli:
        return true;
      case NetworkName.Ethereum:
        return true;
      case NetworkName.Polygon:
        return true;
      case NetworkName.Arbitrum:
        return true;
      case NetworkName.Railgun:
        return true;
      case NetworkName.EthereumRopsten_DEPRECATED:
        return true;
      case NetworkName.PolygonMumbai:
        return true;
      case NetworkName.ArbitrumGoerli:
        return true;
      case NetworkName.Hardhat:
        return true;
      default:
        throw new Error('Chain not supported by Aave');
    }
  }
}
