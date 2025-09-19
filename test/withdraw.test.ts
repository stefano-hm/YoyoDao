import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DAO governance - withdraw", function () {
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

    await payToken.mint(await alice.getAddress(), ethers.parseUnits("100", 18));

    await payToken
      .connect(alice)
      .approve(await dao.getAddress(), ethers.parseUnits("100", 18));
    await dao.connect(alice).buyShares(10);

    await payToken.mint(await dao.getAddress(), 60_000_000_000_000_000_000n);
  });

  it("should allow owner to withdraw funds", async function () {
    const daoBalanceBefore = await payToken.balanceOf(await dao.getAddress());
    const ownerBalanceBefore = await payToken.balanceOf(
      await owner.getAddress()
    );

    const withdrawTx = await dao
      .connect(owner)
      .withdraw(await owner.getAddress(), daoBalanceBefore);
    await withdrawTx.wait();

    const daoBalanceAfter = await payToken.balanceOf(await dao.getAddress());
    const ownerBalanceAfter = await payToken.balanceOf(
      await owner.getAddress()
    );

    expect(daoBalanceAfter).to.equal(0n);
    expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + daoBalanceBefore);
  });

  it("should revert if non-owner tries to withdraw", async function () {
    const daoBalance = await payToken.balanceOf(await dao.getAddress());

    await expect(
      dao.connect(alice).withdraw(await alice.getAddress(), daoBalance)
    ).to.be.revertedWith("only owner");
  });
});
