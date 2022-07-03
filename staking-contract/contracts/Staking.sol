// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract TokenStaking {
    uint256 apy;
    IERC20 _token;

    struct StakedToken {
        uint256 startedDate;
        uint256 stakedAmount;
        uint256 rewardPerSec;
        uint256 currentReward;
    }

    mapping(address => StakedToken) stakedInfo;

    event Staked(address indexed owner, uint256 amount);
    event UnStaked(address indexed owner, uint256 amount);
    event Claimed(address indexed owner, uint256 amount);

    constructor(address _tokenAddress, uint256 _apy) {
        _token = IERC20(_tokenAddress);
        apy = _apy;
    }

    function stake(uint256 amount) public {
        StakedToken storage stakedToken = stakedInfo[msg.sender];

        require(amount > 0, "amount is higher than 0");

        _token.transferFrom(msg.sender, address(this), amount);

        stakedToken.startedDate = block.timestamp;
        stakedToken.stakedAmount += amount;
        stakedToken.rewardPerSec = apy / stakedToken.stakedAmount / 365 / 100;
        stakedToken.currentReward +=
            (block.timestamp - stakedToken.startedDate) *
            stakedToken.rewardPerSec;

        emit Staked(msg.sender, amount);
    }

    function unStake(uint256 amount) public {
        StakedToken storage stakedToken = stakedInfo[msg.sender];

        require(
            amount <= stakedToken.stakedAmount,
            "amount is higher than staked token amount"
        );

        stakedToken.startedDate = block.timestamp;
        stakedToken.stakedAmount -= amount;
        stakedToken.rewardPerSec = apy / stakedToken.stakedAmount / 365 / 100;
        stakedToken.currentReward +=
            (block.timestamp - stakedToken.startedDate) *
            stakedToken.rewardPerSec;

        _token.transfer(msg.sender, amount);

        emit UnStaked(msg.sender, amount);
    }

    function getStakedAmount() public view returns (uint256) {
        return stakedInfo[msg.sender].stakedAmount;
    }

    function getRewardBalance() public view returns (uint256) {
        StakedToken storage stakedToken = stakedInfo[msg.sender];
        uint256 rewardAmount = stakedToken.currentReward +
            (block.timestamp - stakedToken.startedDate) *
            stakedToken.rewardPerSec;
        return rewardAmount;
    }

    function claimRewards() public {
        StakedToken storage stakedToken = stakedInfo[msg.sender];
        uint256 rewardAmount = stakedToken.currentReward +
            (block.timestamp - stakedToken.startedDate) *
            stakedToken.rewardPerSec;
        require(rewardAmount > 0, "There is no tokens can claim");
        _token.transfer(msg.sender, rewardAmount);

        emit Claimed(msg.sender, rewardAmount);
    }
}
