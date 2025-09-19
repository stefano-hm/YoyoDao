import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DAO governance - membership", function () {
  let payToken: any;
  let dao: any;
  let owner: any, alice: any, bob: any;

  const one = ethers.parseUnits("1", 18);

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

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
    await payToken.mint(await bob.getAddress(), ethers.parseUnits("100", 18));

    await payToken
      .connect(alice)
      .approve(await dao.getAddress(), ethers.parseUnits("100", 18));
    await dao.connect(alice).buyShares(10);

    await payToken
      .connect(bob)
      .approve(await dao.getAddress(), ethers.parseUnits("100", 18));
    await dao.connect(bob).buyShares(5);
  });

  it("should recognize members after buying shares", async function () {
    expect(await dao.isMember(await alice.getAddress())).to.be.true;
    expect(await dao.isMember(await bob.getAddress())).to.be.true;
  });
});
