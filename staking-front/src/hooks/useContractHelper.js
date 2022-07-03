import { ethers } from "ethers";

import { stakingAddress, tokenAddress } from "../config";
import ERC20_ABI from "../assets/abi/erc20.json";
import STAKING_ABI from "../assets/abi/staking.json";

export const useDefaultProvider = () => {
  return new ethers.providers.Web3Provider(window.ethereum);
};

const useContract = (address, abi) => {
  const provider = useDefaultProvider();
  return new ethers.Contract(address, abi, provider);
};

export const useERCTokenContract = () => {
  return useContract(tokenAddress, ERC20_ABI);
};

export const useStakingContract = () => {
  return useContract(stakingAddress, STAKING_ABI);
};
