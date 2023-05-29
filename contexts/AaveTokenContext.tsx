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

export type AaveTokenListContextItem = AaveTokenListItem & {
    balance: BigNumber | null;
    aTokenBalance?: BigNumber | null;
    dStableTokenBalance?: BigNumber | null;
    dVariableTokenBalance?: BigNumber | null;
}

export enum EAaveToken {
    A_TOKEN = "aToken",
    D_VARIABLE_TOKEN = "dVariableToken",
    D_STABLE_TOKEN = "dStableToken"
}

export type AccountTokenListContextItem = {
    [id: string]: {
        [tokenType in EAaveToken]?: {
            [key: string]: AaveTokenListContextItem;
        }
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
    const { aTokenList, dVariableToken, dStableToken } = useAaveTokenList();
    const [acTokensWithBalances, setAddressTokensWithBalances] = useState<AccountTokenListContextItem>({});
    const { accounts } = useNFT();

    // Getting ac addresses and their balances
    useEffect(() => {
        const fn = async () => {
            const accountBalances: AccountTokenListContextItem = {};

            for (let account of accounts) {
                const acAddr = account.contract;
                accountBalances[account.id] = {};
                const accountSpecificBalances: any = {};

                // getting aToken Balance
                const aBalanceOfContract: BigNumber[] = (await readContracts({
                    contracts: aTokenList.map((token) => ({
                        abi: ERC20_ABI,
                        address: token.address,
                        functionName: 'balanceOf',
                        args: [acAddr],
                    })),
                })) as BigNumber[];

                const aTokenBalances: any = {};
                aBalanceOfContract.forEach((balance, index) => (
                    aTokenBalances[aTokenList[index].originalTokenAddress] =
                    { ...aTokenList[index], balance: balance }
                ))
                accountSpecificBalances[EAaveToken.A_TOKEN] = aTokenBalances;

                // getting dVariableToken Balance
                const dVariableBalanceOfContract: BigNumber[] = (await readContracts({
                    contracts: dVariableToken.map((token) => ({
                        abi: ERC20_ABI,
                        address: token.address,
                        functionName: 'balanceOf',
                        args: [acAddr],
                    })),
                })) as BigNumber[];

                const dVariableTokenBalances: any = {};
                dVariableBalanceOfContract.forEach((balance, index) => (
                    dVariableTokenBalances[dVariableToken[index].originalTokenAddress] =
                    { ...dVariableToken[index], balance: balance }
                ))
                accountSpecificBalances[EAaveToken.D_VARIABLE_TOKEN] = dVariableTokenBalances;

                // getting dStableToken Balance
                const dStableBalanceOfContract: BigNumber[] = (await readContracts({
                    contracts: dStableToken.map((token) => ({
                        abi: ERC20_ABI,
                        address: token.address,
                        functionName: 'balanceOf',
                        args: [acAddr],
                    })),
                })) as BigNumber[];

                const dStableTokenBalances: any = {};
                dStableBalanceOfContract.forEach((balance, index) => (
                    dStableTokenBalances[dStableToken[index].originalTokenAddress] =
                    { ...dStableToken[index], balance: balance }
                ))
                accountSpecificBalances[EAaveToken.D_STABLE_TOKEN] = dStableTokenBalances;

                accountBalances[account.id] = accountSpecificBalances;
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

export const useAaveToken = () => useContext(AaveTokenContext);
