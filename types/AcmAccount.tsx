import { BigNumber } from "ethers";

type AcmAccount = {
    id: string;
    contract: string;
    balances: {
        [address: string]: BigNumber
    }
};

export default AcmAccount