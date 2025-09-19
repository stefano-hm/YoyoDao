// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MockERC20.sol";

contract DAO {
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    MockERC20 public paymentToken; 
    uint256 public pricePerShare; 
    bool public saleActive = true;
    uint256 public totalShares;

    mapping(address => uint256) public shares; 
    mapping(address => bool) public isMember;

    mapping(address => address) public delegatedTo; 

    enum VoteChoice { None, For, Against, Abstain }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        address recipient; 
        uint256 amount;    
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 votesAbstain;
        uint256 startTime;
        uint256 endTime;
        bool executed;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => VoteChoice)) public votes; 

    event SharesBought(address indexed buyer, uint256 sharesBought, uint256 paid);
    event SaleClosed(address indexed by);
    event Delegated(address indexed from, address indexed to);
    event ProposalCreated(uint256 indexed id, address indexed proposer, string title);
    event Voted(uint256 indexed proposalId, address indexed voter, VoteChoice choice, uint256 weight);
    event ProposalExecuted(uint256 indexed id, bool success);

    uint256 public votingDuration = 3 days;

    constructor(address _paymentToken, uint256 _pricePerShare) {
        owner = msg.sender;
        paymentToken = MockERC20(_paymentToken);
        pricePerShare = _pricePerShare;
    }

    function buyShares(uint256 numShares) external {
        require(saleActive, "sale closed");
        require(numShares > 0, "zero shares");
        uint256 cost = numShares * pricePerShare;
        bool ok = paymentToken.transferFrom(msg.sender, address(this), cost);
        require(ok, "payment failed");
        shares[msg.sender] += numShares;
        totalShares += numShares;
        isMember[msg.sender] = true;
        emit SharesBought(msg.sender, numShares, cost);
    }

    function closeSale() external onlyOwner {
        saleActive = false;
        emit SaleClosed(msg.sender);
    }

    function delegate(address to) external {
        require(to != msg.sender, "cannot delegate to self");
        address cur = to;
        while (cur != address(0)) {
            require(cur != msg.sender, "delegation cycle");
            cur = delegatedTo[cur];
        }
        delegatedTo[msg.sender] = to;
        emit Delegated(msg.sender, to);
    }

    function getVotingPower(address voter) public view returns (uint256) {
        return shares[voter];
    }

    function propose(
        string calldata title,
        string calldata description,
        address recipient,
        uint256 amount
    ) external returns (uint256) {
        require(isMember[msg.sender] && shares[msg.sender] > 0, "must be member to propose");
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.title = title;
        p.description = description;
        p.recipient = recipient;
        p.amount = amount;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingDuration;
        p.executed = false;
        emit ProposalCreated(proposalCount, msg.sender, title);
        return proposalCount;
    }

    function vote(uint256 proposalId, VoteChoice choice) external {
        require(choice == VoteChoice.For || choice == VoteChoice.Against || choice == VoteChoice.Abstain, "invalid choice");
        Proposal storage p = proposals[proposalId];
        require(p.id == proposalId, "no proposal");
        require(block.timestamp >= p.startTime, "voting not started");
        require(block.timestamp <= p.endTime, "voting ended");
        require(shares[msg.sender] > 0, "must hold shares to vote");
        require(delegatedTo[msg.sender] == address(0), "delegated: cannot vote (delegate should vote)");
        require(votes[proposalId][msg.sender] == VoteChoice.None, "already voted");

        uint256 weight = shares[msg.sender];
        votes[proposalId][msg.sender] = choice;
        if (choice == VoteChoice.For) p.votesFor += weight;
        else if (choice == VoteChoice.Against) p.votesAgainst += weight;
        else p.votesAbstain += weight;

        emit Voted(proposalId, msg.sender, choice, weight);
    }

    function castVoteAsDelegate(uint256 proposalId, address[] calldata delegators, VoteChoice choice) external {
        require(choice == VoteChoice.For || choice == VoteChoice.Against || choice == VoteChoice.Abstain, "invalid choice");
        Proposal storage p = proposals[proposalId];
        require(p.id == proposalId, "no proposal");
        require(block.timestamp >= p.startTime && block.timestamp <= p.endTime, "voting window closed");
        require(shares[msg.sender] > 0, "delegate must hold shares");
        uint256 totalWeight = 0;

        if (votes[proposalId][msg.sender] == VoteChoice.None) {
            totalWeight += shares[msg.sender];
            votes[proposalId][msg.sender] = choice;
        }

        for (uint i = 0; i < delegators.length; i++) {
            address d = delegators[i];
            require(delegatedTo[d] == msg.sender, "not delegated to caller");
            require(votes[proposalId][d] == VoteChoice.None, "delegator already voted");
            if (shares[d] > 0) {
                totalWeight += shares[d];
                votes[proposalId][d] = choice;
            }
        }

        if (choice == VoteChoice.For) p.votesFor += totalWeight;
        else if (choice == VoteChoice.Against) p.votesAgainst += totalWeight;
        else p.votesAbstain += totalWeight;

        emit Voted(proposalId, msg.sender, choice, totalWeight);
    }

    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.id == proposalId, "no proposal");
        require(block.timestamp > p.endTime, "voting not ended");
        require(!p.executed, "already executed");

        bool approved = p.votesFor > p.votesAgainst;
        if (approved && p.recipient != address(0) && p.amount > 0) {
            bool ok = paymentToken.transfer(p.recipient, p.amount);
            emit ProposalExecuted(proposalId, ok);
        } else {
            emit ProposalExecuted(proposalId, false);
        }
        p.executed = true;
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        require(paymentToken.transfer(to, amount), "transfer failed");
    }

    function setVotingDuration(uint256 seconds_) external onlyOwner {
        votingDuration = seconds_;
    }

    function setPricePerShare(uint256 newPrice) external onlyOwner {
        pricePerShare = newPrice;
    }
}
