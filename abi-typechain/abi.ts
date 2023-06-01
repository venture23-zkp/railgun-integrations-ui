import ABI_ACM from './acm/ACM.json';
import ABI_ERC6551Registry from './ERC6551Registry/ERC6551Registry.json';
import ABI_Default_Account from './DefaultERC6551Account/DefaultERC6551Account.json';


export const abi = {
    ACM: ABI_ACM,
    ERC6551_Registry:ABI_ERC6551Registry,
    Default_Account:ABI_Default_Account
} as const;