import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DAO governance - buyShares effects", function () {
  let payToken: any;
  let dao: any;
  let owner: any, alice: any;

  const one = ethers.parseUnits("1", 18);

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20", owner);
    payToken = await MockERC20.deploy(
      "PayToken",
      "PAY",
      ethers.parseUnits("1000000", 18)
    );
    await payToken.waitForDeployment();

    const DAO = await ethers.getContractFactory("DAO", owner);
    dao = await DAO.deploy(await payToken.getAddress(), one);
    await dao.waitForDeployment();

    const mintTx = await payToken.mint(
      await alice.getAddress(),
      ethers.parseUnits("100", 18)
    );
    await mintTx.wait();
  });

  it("should update token balances and DAO funds after buyShares", async function () {
    const numShares = 10;
    const cost = ethers.parseUnits(numShares.toString(), 18);

    const aliceBalanceBefore = await payToken.balanceOf(
      await alice.getAddress()
    );
    const daoBalanceBefore = await payToken.balanceOf(await dao.getAddress());

    const approveTx = await payToken
      .connect(alice)
      .approve(await dao.getAddress(), cost);
    await approveTx.wait();
    const buyTx = await dao.connect(alice).buyShares(numShares);
    await buyTx.wait();

    const aliceBalanceAfter = await payToken.balanceOf(
      await alice.getAddress()
    );
    const daoBalanceAfter = await payToken.balanceOf(await dao.getAddress());

    expect(aliceBalanceAfter).to.equal(aliceBalanceBefore - cost);
    expect(daoBalanceAfter).to.equal(daoBalanceBefore + cost);

    const shares = await dao.shares(await alice.getAddress());
    expect(shares).to.equal(numShares);
  });
});
