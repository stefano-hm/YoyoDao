import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("DAO governance - delegation", function () {
  let payToken: any;
  let dao: any;
  let owner: any, alice: any, bob: any, charlie: any;

  const one = ethers.parseUnits("1", 18);

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();

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
    await payToken.mint(
      await charlie.getAddress(),
      ethers.parseUnits("100", 18)
    );

    await payToken
      .connect(alice)
      .approve(await dao.getAddress(), ethers.parseUnits("100", 18));
    await dao.connect(alice).buyShares(10);

    await payToken
      .connect(bob)
      .approve(await dao.getAddress(), ethers.parseUnits("100", 18));
    await dao.connect(bob).buyShares(5);

    await payToken
      .connect(charlie)
      .approve(await dao.getAddress(), ethers.parseUnits("100", 18));
    await dao.connect(charlie).buyShares(3);

    const tx = await dao
      .connect(alice)
      .propose(
        "Delegation Proposal",
        "Proposal to test delegation",
        ethers.ZeroAddress,
        0
      );
    await tx.wait();
  });

  it("should allow a member to delegate their vote", async function () {
    const delegateTx = await dao
      .connect(bob)
      .delegate(await alice.getAddress());
    await delegateTx.wait();

    const delegatedTo = await dao.delegatedTo(await bob.getAddress());
    expect(delegatedTo).to.equal(await alice.getAddress());
  });

  it("should allow the delegate to cast votes for delegators", async function () {
    await dao.connect(bob).delegate(await alice.getAddress());
    await dao.connect(charlie).delegate(await alice.getAddress());

    const castTx = await dao
      .connect(alice)
      .castVoteAsDelegate(
        1,
        [await bob.getAddress(), await charlie.getAddress()],
        1
      ); // 1 = For
    await castTx.wait();

    const proposal = await dao.proposals(1);
    expect(proposal.votesFor).to.equal(18n);
  });

  it("should prevent double voting by delegators", async function () {
    await dao.connect(bob).delegate(await alice.getAddress());
    await dao.connect(alice).castVoteAsDelegate(1, [await bob.getAddress()], 1);

    await expect(dao.connect(bob).vote(1, 1)).to.be.revertedWith(
      "delegated: cannot vote (delegate should vote)"
    );
  });

  it("should prevent delegation cycles", async function () {
    await dao.connect(bob).delegate(await alice.getAddress());
    await expect(
      dao.connect(alice).delegate(await bob.getAddress())
    ).to.be.revertedWith("delegation cycle");
  });
});
