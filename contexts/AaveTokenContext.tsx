import React, {
    ReactNode,
    createContext,
    useEffect,
    useContext,
    useState
} from 'react';
import { BigNumber } from 'ethers';
import { useNetwork, readContracts } from 'wagmi';
import { AaveTokenListItem, useAaveTokenList } from '@/hooks/useAaveTokenList';
import { useNFT } from './NFTContext';

const ERC20_ABI = [
    {
        constant: true,
        inputs: [
            {
                name: '_owner',
                type: 'address',
            },
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: 'balance',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
];

type AaveTokenListContextItem = AaveTokenListItem & {
    balance: BigNumber | null;
}

export enum EAaveToken {
    ATOKEN = "atoken",
    DTOKEN = "dtoken"
}

export type AccountTokenListContextItem = {
    [id: string]: {
        [tokenType in EAaveToken]?: AaveTokenListContextItem[];
    }
}

export type AaveTokenContextType = {
    acTokensWithBalances: AccountTokenListContextItem;
};
const initialContext = {
    acTokensWithBalances: {}
};

const AaveTokenContext = createContext<AaveTokenContextType>(initialContext);

export const AaveTokenListProvider = ({
    children,
}: {
    children: ReactNode;
    shieldingFees: { [key: number]: BigNumber };
    unshieldingFees: { [key: number]: BigNumber };
}) => {
    const { tokenList: aaveTokenList } = useAaveTokenList();
    const [acTokensWithBalances, setAddressTokensWithBalances] = useState<AccountTokenListContextItem>({});
    const { accounts } = useNFT();

    // Getting ac addresses and their balances
    useEffect(() => {
        const fn = async () => {
            const accountBalances: AccountTokenListContextItem = {};

            // getting aTokenBalance
            for (let account of accounts) {
                const acAddr = account.contract;
                const balanceOfContract: BigNumber[] = (await readContracts({
                    contracts: aaveTokenList.map((token) => ({
                        abi: ERC20_ABI,
                        address: token.address,
                        functionName: 'balanceOf',
                        args: [acAddr],
                    })),
                })) as BigNumber[];

                accountBalances[account.id] = {
                    [EAaveToken.ATOKEN]: balanceOfContract.map((balance, index) => (
                        { ...aaveTokenList[index], balance: balance }
                    ))
                }
            }

            setAddressTokensWithBalances(accountBalances);
        };
        fn();
    }, [accounts]);

    return (
        <AaveTokenContext.Provider
            value={{
                acTokensWithBalances: acTokensWithBalances || [],
            }}
        >
            {children}
        </AaveTokenContext.Provider>
    );
};

export const useToken = () => useContext(AaveTokenContext);
