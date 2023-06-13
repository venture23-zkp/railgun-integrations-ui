import { BigNumber } from '@ethersproject/bignumber';

export const MAX_UINT256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;
export const MAX_UINT256_HEX = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
export const SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export const babylonianSqrt = (y: BigNumber): BigNumber => {
  let z = BigNumber.from(0);
  if (y.gt(3)) {
    z = y;
    let x = y.div(2).add(1);
    while (x.lt(z)) {
      z = x;
      x = y.div(x).add(x).div(2);
    }
  } else if (y.gt(0)) {
    z = BigNumber.from(1);
  }
  return z;
};

export const maxBigNumber = (b1: BigNumber, b2: BigNumber) => {
  return b1.gt(b2) ? b1 : b2;
};

export const minBigNumber = (b1: BigNumber, b2: BigNumber) => {
  return b1.lt(b2) ? b1 : b2;
};

export const maxBigNumberForTransaction = (): BigNumber => {
  // = 2^256 - 1
  return BigNumber.from(2).pow(BigNumber.from(256)).sub(BigNumber.from(1));
};
