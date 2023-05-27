import { NetworkName } from '@railgun-community/shared-models';
import { CookbookDebugger } from '@railgun-community/cookbook/dist/models/export-models';
import { RailgunConfig } from '@railgun-community/cookbook/dist/models/railgun-config';
import { CookbookDebug } from '@railgun-community/cookbook/dist/utils/cookbook-debug';

export const setRailgunFees = (
  networkName: NetworkName,
  shieldFeeBasisPoints: string,
  unshieldFeeBasisPoints: string,
) => {
  RailgunConfig.SHIELD_FEE_BASIS_POINTS_FOR_NETWORK[networkName] =
    shieldFeeBasisPoints;
  RailgunConfig.UNSHIELD_FEE_BASIS_POINTS_FOR_NETWORK[networkName] =
    unshieldFeeBasisPoints;
};

export const setCookbookDebugger = (cookbookDebugger: CookbookDebugger) => {
  CookbookDebug.setDebugger(cookbookDebugger);
};