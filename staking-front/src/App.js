import React, { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { ethers } from "ethers";
import { Divider, Grid, Paper, TextField } from "@mui/material";
import { Container } from "@mui/system";
import LoadingButton from "@mui/lab/LoadingButton";
import { toast } from "react-toastify";

import TransactionTable from "./TransactionTable";
import { formatEthToNum, RandomNum } from "./utils/usage";
import {
  useDefaultProvider,
  useERCTokenContract,
  useStakingContract,
} from "./hooks/useContractHelper";
import { stakingAddress } from "./config";

function App() {
  const provider = useDefaultProvider();
  const tokenContract = useERCTokenContract();
  const stakingContract = useStakingContract();

  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const [actioned, setActioned] = useState(0);

  const [stakingAmount, setStakingAmount] = useState("");
  const [unStakingAmount, setUnStakingAmount] = useState("");

  const initialConfig = async () => {
    setLoading(false);
    setStakingAmount("");
    setUnStakingAmount("");
  };

  const handleConnectWallet = async () => {
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);
  };

  const initERC = async () => {
    const accounts = await provider.send("eth_requestAccounts", []);
    const bigBalance = await tokenContract.balanceOf(accounts[0]);
    setBalance(formatEthToNum(bigBalance));
  };

  const initStaking = async () => {
    const signer = provider.getSigner();

    const stakingContractWithSigner = stakingContract.connect(signer);
    const bigStakedBalance = await stakingContractWithSigner.getStakedAmount();
    setStakedBalance(formatEthToNum(bigStakedBalance));

    const bigRewardBalance = await stakingContractWithSigner.getRewardBalance();
    setRewardBalance(
      (Number(formatEthToNum(bigRewardBalance)) / 10 ** 18).toFixed(2)
    );

    stakingContract.on("Staked", (owner, amount) => {
      setActioned(RandomNum());
    });
    stakingContract.on("UnStaked", (owner, amount) => {
      setActioned(RandomNum());
    });
    stakingContract.on("Claimed", (owner, amount) => {
      setActioned(RandomNum());
    });
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    const signer = provider.getSigner();
    const stakingContractWithSigner = stakingContract.connect(signer);
    try {
      const tx = await stakingContractWithSigner.claimRewards();
      await tx.wait();
    } catch (error) {}
    setLoading(false);
  };

  const handleStake = async () => {
    if (!stakingAmount) {
      toast("Please input valid staking amount");
      return;
    }
    setLoading(true);
    const signer = provider.getSigner();
    const tokenContractWithSigner = tokenContract.connect(signer);
    const allowance = await tokenContract.allowance(account, stakingAddress);

    const tokenUnits = await tokenContract.decimals();
    const tokenAmountInEther = ethers.utils.parseUnits(
      stakingAmount,
      tokenUnits
    );

    if (formatEthToNum(allowance) < Number(stakingAmount)) {
      try {
        const tx = await tokenContractWithSigner.approve(
          stakingAddress,
          tokenAmountInEther
        );
        await tx.wait();
        if (tx.hash) {
          stakeToken(tokenAmountInEther);
        }
      } catch (error) {
        initialConfig();
      }
    } else {
      stakeToken(tokenAmountInEther);
    }
  };

  const stakeToken = async (tokenAmountInEther) => {
    const signer = provider.getSigner();

    const stakingContractWithSigner = stakingContract.connect(signer);
    try {
      const tx = await stakingContractWithSigner.stake(tokenAmountInEther);
      await tx.wait();
      if (tx.hash) {
        toast(`You staked ${formatEthToNum(tokenAmountInEther)} successfully`);
      }
    } catch (error) {}
    initialConfig();
  };

  const handleUnStake = async () => {
    setLoading(true);
    if (!unStakingAmount) {
      toast("Please input valid staking amount");
      return;
    }
    const signer = provider.getSigner();
    const stakingContractWithSigner = stakingContract.connect(signer);

    const bigStakedBalance = await stakingContractWithSigner.getStakedAmount();
    if (formatEthToNum(bigStakedBalance) >= Number(unStakingAmount)) {
      const tokenUnits = await tokenContract.decimals();
      const tokenAmountInEther = ethers.utils.parseUnits(
        unStakingAmount,
        tokenUnits
      );

      const tx = await stakingContractWithSigner.unStake(tokenAmountInEther);
      await tx.wait();
      if (tx.hash) {
        toast(`You unstaked ${formatEthToNum(unStakingAmount)} successfully`);
      }
    } else {
      toast("Unstake amount is wrong");
    }
  };

  useEffect(() => {
    if (provider) {
      handleConnectWallet();
    }
  }, [provider]);

  useEffect(() => {
    initialConfig();
    if (tokenContract) {
      initERC();
    }
  }, [account]);

  useEffect(() => {
    if (stakingContract) {
      initStaking();
    }
  }, [stakingContract]);

  return (
    <div>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" mode="dark">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Staking Token
            </Typography>
            <Typography variant="h7" sx={{ marginRight: 1 }}>
              {`Balance: ${balance}`}
            </Typography>
            <Typography variant="h7">
              {`Staked Balance: ${stakedBalance}`}
            </Typography>
            <Button color="inherit" onClick={() => handleConnectWallet()}>
              {account ? `${account.slice(0, 8)}...` : "Connect Wallet"}
            </Button>
          </Toolbar>
        </AppBar>
        <Container>
          <Grid
            sx={{
              display: "flex",
              justifyContent: "space-around",
              m: "50px 0",
            }}
          >
            <Typography variant="h7" sx={{ marginRight: 1 }}>
              {`Reward Balance: ${rewardBalance} SET`}
            </Typography>
            <LoadingButton
              loading={loading}
              color="primary"
              variant="contained"
              onClick={() => handleClaimRewards()}
            >
              Claim Rewards
            </LoadingButton>
          </Grid>
          <Paper
            component="form"
            sx={{
              m: "50px 0",
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Grid>{`Available staking amount: ${balance}`}</Grid>
            <TextField
              value={stakingAmount}
              onChange={(e) => setStakingAmount(e.target.value)}
              id="outlined-basic"
              label={`Stake Token`}
              variant="outlined"
              sx={{ m: "8px" }}
              fullWidth
              disabled={loading}
            />
            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
            <LoadingButton
              loading={loading}
              color="primary"
              variant="outlined"
              onClick={() => handleStake()}
            >
              Stake
            </LoadingButton>
          </Paper>
          <Paper
            component="form"
            sx={{
              m: "50px 0",
              p: "2px 4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Grid>{`Available unstaking amount: ${stakedBalance}`}</Grid>
            <TextField
              value={unStakingAmount}
              onChange={(e) => setUnStakingAmount(e.target.value)}
              id="outlined-basic"
              label={`Unstake Token`}
              variant="outlined"
              sx={{ m: "8px" }}
              fullWidth
              disabled={loading}
            />
            <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
            <LoadingButton
              loading={loading}
              color="primary"
              variant="outlined"
              onClick={() => handleUnStake()}
            >
              Unstake
            </LoadingButton>
          </Paper>
          <TransactionTable actioned={actioned} />
        </Container>
      </Box>
    </div>
  );
}

export default App;
