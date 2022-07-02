const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Contract", function () {
  it("Transfer Test", async function () {
    const TokenContract = await ethers.getContractFactory("SimpleToken");
    const tokenContract = await TokenContract.deploy();
    await tokenContract.deployed();

    // const setGreetingTx = await tokenContract.setGreeting("Hola, mundo!");

    // // wait until the transaction is mined
    // await setGreetingTx.wait();

  });
});
