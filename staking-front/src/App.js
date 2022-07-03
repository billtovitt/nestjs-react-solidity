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

import ERC20_ABI from "./assets/abi/erc20.json";
import STAKING_ABI from "./assets/abi/staking.json";

import TransactionTable from "./TransactionTable";

function App() {
  const tokenAddress = "0x4f6cc260820a444136F930DcbF6490d8BD878bCC";
  const stakingAddress = "0xE84962d70d997Ca9014a5b890f7176E1936D3a35";

  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const [actioned, setActioned] = useState(0);

  const [stakingAmount, setStakingAmount] = useState("");
  const [unStakingAmount, setUnStakingAmount] = useState("");

  const [tokenContract, setTokenContract] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);

  const initialConfig = async () => {
    setLoading(false);
    setStakingAmount("");
    setUnStakingAmount("");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    setProvider(provider);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAccount(accounts[0]);

    const tContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    setTokenContract(tContract);
    const sContract = new ethers.Contract(
      stakingAddress,
      STAKING_ABI,
      provider
    );
    setStakingContract(sContract);

    const bigBalance = await tContract.balanceOf(accounts[0]);
    setBalance(ethers.utils.formatEther(bigBalance));

    const stakingContractWithSigner = sContract.connect(signer);
    const bigStakedBalance = await stakingContractWithSigner.getStakedAmount();
    setStakedBalance(ethers.utils.formatEther(bigStakedBalance));

    const bigRewardBalance = await stakingContractWithSigner.getRewardBalance();
    setRewardBalance(ethers.utils.formatEther(bigRewardBalance));

    sContract.on("Staked", (owner, amount) => {
      setActioned(new Date().getTime());
    });
    sContract.on("UnStaked", (owner, amount) => {
      setActioned(new Date().getTime());
    });
    sContract.on("Claimed", (owner, amount) => {
      setActioned(new Date().getTime());
    });
  };

  const handleConnectWallet = async () => {
    initialConfig();
  };

  const handleClaimRewards = async () => {
    const signer = provider.getSigner();
    const stakingContractWithSigner = stakingContract.connect(signer);
    await stakingContractWithSigner.claimRewards();
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

    if (Number(ethers.utils.formatEther(allowance)) < Number(stakingAmount)) {
      const tx = await tokenContractWithSigner.approve(
        stakingAddress,
        tokenAmountInEther
      );
      await tx.wait();
      if (tx.hash) {
        stakeToken(tokenAmountInEther);
      }
    } else {
      stakeToken(tokenAmountInEther);
    }
  };

  const stakeToken = async (tokenAmountInEther) => {
    const signer = provider.getSigner();

    const stakingContractWithSigner = stakingContract.connect(signer);
    const tx = await stakingContractWithSigner.stake(tokenAmountInEther);
    await tx.wait();
    if (tx.hash) {
      toast(
        `You staked ${ethers.utils.formatEther(
          tokenAmountInEther
        )} successfully`
      );
      initialConfig();
    }
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
    if (
      Number(ethers.utils.formatEther(bigStakedBalance)) >=
      Number(unStakingAmount)
    ) {
      const tokenUnits = await tokenContract.decimals();
      const tokenAmountInEther = ethers.utils.parseUnits(
        unStakingAmount,
        tokenUnits
      );

      stakingContractWithSigner.unStake(tokenAmountInEther).then(
        (result) => {},
        (error) => {
          setLoading(false);
        }
      );

      var filter = stakingContractWithSigner.filters.UnStaked(account, null);
      stakingContractWithSigner.on(filter, (owner, amount) => {
        toast(`You unstaked ${ethers.utils.formatEther(amount)} successfully`);
        initialConfig();
      });
    } else {
      toast("Unstake amount is wrong");
    }
  };

  useEffect(() => {
    initialConfig();
  }, []);

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
              {`Reward Balance: ${
                rewardBalance < 0.01 ? "less than 0.01" : rewardBalance
              }`}
            </Typography>
            <Button variant="contained" onClick={() => handleClaimRewards()}>
              Claim Rewards
            </Button>
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
