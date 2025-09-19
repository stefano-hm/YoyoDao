import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DAO governance - buyShares", function () {
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

  it("buy shares works and creates members", async function () {
    const numShares = 10;
    const cost = ethers.parseUnits(numShares.toString(), 18);

    const approveTx = await payToken
      .connect(alice)
      .approve(await dao.getAddress(), cost);
    await approveTx.wait();

    const buyTx = await dao.connect(alice).buyShares(numShares);
    await buyTx.wait();

    const shares = await dao.shares(await alice.getAddress());
    expect(shares).to.equal(numShares);

    const isMember = await dao.isMember(await alice.getAddress());
    expect(isMember).to.be.true;
  });
});
