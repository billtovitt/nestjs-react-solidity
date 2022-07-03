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
import { from } from "rxjs";

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

  const initialConfig = () => {
    setLoading(false);
    setStakingAmount("");
    setUnStakingAmount("");
    setActioned(RandomNum());
    initStaking();
    initERC();
  };

  const handleConnectWallet = () => {
    var accountsObservable = from(provider.send("eth_requestAccounts", []));
    accountsObservable.subscribe((accounts) => {
      setAccount(accounts[0]);
    });
  };

  const initERC = () => {
    var tokenBalanceObservable = from(tokenContract.balanceOf(account));
    tokenBalanceObservable.subscribe((bigBalance) => {
      setBalance(formatEthToNum(bigBalance));
    });
  };

  const initStaking = () => {
    const signer = provider.getSigner();

    const stakingContractWithSigner = stakingContract.connect(signer);

    var stakedObservable = from(stakingContractWithSigner.getStakedAmount());
    stakedObservable.subscribe((value) => {
      setStakedBalance(formatEthToNum(value));
    });

    var rewardObservable = from(stakingContractWithSigner.getRewardBalance());
    rewardObservable.subscribe((value) => {
      setRewardBalance(formatEthToNum(value.toString()));
    });

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

  const handleStake = () => {
    if (!stakingAmount) {
      toast("Please input valid staking amount");
      return;
    }
    setLoading(true);
    const signer = provider.getSigner();
    const tokenContractWithSigner = tokenContract.connect(signer);
    var alloowOb = from(tokenContract.allowance(account, stakingAddress));
    alloowOb.subscribe((allowance) => {
      var unitsOb = from(tokenContract.decimals());
      unitsOb.subscribe((tokenUnits) => {
        const tokenAmountInEther = ethers.utils.parseUnits(
          stakingAmount,
          tokenUnits
        );

        if (formatEthToNum(allowance) < Number(stakingAmount)) {
          try {
            var txOb = from(
              tokenContractWithSigner.approve(
                stakingAddress,
                tokenAmountInEther
              )
            );
            txOb.subscribe((tx) => {
              var txWaitOb = from(tx.wait());
              txWaitOb.subscribe(() => {
                stakeToken(tokenAmountInEther);
              });
            });
          } catch (error) {
            initialConfig();
          }
        } else {
          stakeToken(tokenAmountInEther);
        }
      });
    });
  };

  const stakeToken = (tokenAmountInEther) => {
    const signer = provider.getSigner();

    const stakingContractWithSigner = stakingContract.connect(signer);
    try {
      var txOb = from(stakingContractWithSigner.stake(tokenAmountInEther));
      txOb.subscribe((tx) => {
        var txWaitOb = from(tx.wait());
        txWaitOb.subscribe(() => {
          toast(
            `You staked ${formatEthToNum(tokenAmountInEther)} successfully`
          );
          initialConfig();
        });
      });
    } catch (error) {
      initialConfig();
    }
  };

  const handleUnStake = () => {
    setLoading(true);
    if (!unStakingAmount) {
      toast("Please input valid staking amount");
      return;
    }
    const signer = provider.getSigner();
    const stakingContractWithSigner = stakingContract.connect(signer);

    var stakedObservable = from(stakingContractWithSigner.getStakedAmount());
    stakedObservable.subscribe((bigStakedBalance) => {
      if (formatEthToNum(bigStakedBalance) >= Number(unStakingAmount)) {
        var unitsOb = from(tokenContract.decimals());
        unitsOb.subscribe((tokenUnits) => {
          const tokenAmountInEther = ethers.utils.parseUnits(
            unStakingAmount,
            tokenUnits
          );

          var txOb = from(
            stakingContractWithSigner.unStake(tokenAmountInEther)
          );
          txOb.subscribe((tx) => {
            var txWaitOb = from(tx.wait());
            txWaitOb.subscribe(() => {
              toast(`You unstaked ${unStakingAmount} successfully`);
              initialConfig();
            });
          });
        });
      } else {
        toast("Unstake amount is wrong");
        initialConfig();
      }
    });
  };

  const handleClaimRewards = async () => {
    setLoading(true);
    const signer = provider.getSigner();
    const stakingContractWithSigner = stakingContract.connect(signer);
    try {
      var txOb = from(stakingContractWithSigner.claimRewards());
      txOb.subscribe((tx) => {
        var txWaitOb = from(tx.wait());
        txWaitOb.subscribe(() => {
          toast("You claimed successfully!");
        });
      });
    } catch (error) {}
    setLoading(false);
  };

  useEffect(() => {
    if (provider) {
      handleConnectWallet();
    }
    // eslint-disable-next-line
  }, [provider]);

  useEffect(() => {
    if (account) {
      initialConfig();
    }
    // eslint-disable-next-line
  }, [account]);

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
