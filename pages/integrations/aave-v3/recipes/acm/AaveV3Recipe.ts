import { Recipe } from '@railgun-community/cookbook';
import { NetworkName } from '@railgun-community/shared-models';

export abstract class AaveV3Recipe extends Recipe {
  readonly config = {
    name: 'Aave v3 Recipe',
    description: 'Interact with Aave V3 using ACM',
  };

  protected supportsNetwork(networkName: NetworkName): boolean {
    switch (networkName) {
      case NetworkName.EthereumGoerli:
        return true;
      case NetworkName.Ethereum:
      case NetworkName.Polygon:
      case NetworkName.Arbitrum:
      case NetworkName.Railgun:
      case NetworkName.EthereumRopsten_DEPRECATED:
      case NetworkName.PolygonMumbai:
      case NetworkName.ArbitrumGoerli:
      case NetworkName.Hardhat:
      default:
        throw new Error('Chain not supported by Aave');
    }
  }
}
