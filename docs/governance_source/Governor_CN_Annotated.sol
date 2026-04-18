// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/Governor.sol)

pragma solidity ^0.8.20;

import {IERC165} from "../utils/introspection/IERC165.sol";
import {IERC6372} from "../interfaces/IERC6372.sol";
import {IGovernor} from "./IGovernor.sol";
import {SafeCast} from "../utils/math/SafeCast.sol";
import {Context} from "../utils/Context.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {Address} from "../utils/Address.sol";
import {Nonces} from "../utils/Nonces.sol";

/**
 * @dev Governor 核心合约。
 * 这是一个抽象合约，它提供了治理系统的核心逻辑，包括：
 * 1. 提案生成 (Proposal Creation)
 * 2. 投票机制 (Voting)
 * 3. 状态管理 (State Management: Pending -> Active -> Defeated/Succeeded -> Executed)
 * 
 * 使用时，需要继承此合约并结合其他扩展模块（如 GovernorTimelockControl, GovernorVotes）。
 */
abstract contract Governor is Context, ERC165, EIP712, Nonces, IGovernor, IERC6372 {
    using SafeCast for uint256;

    // 提案的核心数据结构
    struct ProposalCore {
        // 提案被创建的时间点 (通常是 Block Number，也可以是 Timestamp)
        // 只有在这个时间点之前的持仓才有投票权 (防闪电贷投票)
        uint48 voteStart;
        
        // 提案人的地址
        address proposer;
        
        // 提案预计执行的时间点 (如果不需要 Timelock，则没有意义)
        uint48 etaSeconds;
        
        // 提案是否已被执行
        bool executed;
        
        // 提案是否已被取消
        bool canceled;
        
        // 其他扩展数据 (预留)
        uint48 __gap_unused;
    }

    // 提案 ID -> 提案详情 的映射
    mapping(uint256 proposalId => ProposalCore) private _proposals;

    // EIP712 相关的 TypeHash，用于链下签名投票 (castVoteBySig)
    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support,address voter,uint256 nonce)");
    bytes32 public constant EXTENDED_BALLOT_TYPEHASH =
        keccak256("ExtendedBallot(uint256 proposalId,uint8 support,address voter,uint256 nonce,string reason,bytes params)");

    /**
     * @dev 构造函数，初始化 EIP712
     */
    constructor(string memory name) EIP712(name, version()) {}

    /**
     * @dev 支持接口检测 (ERC165)
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
        return interfaceId == type(IGovernor).interfaceId || interfaceId == type(IERC6372).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev 返回当前版本号，用于 EIP712
     */
    function version() public view virtual returns (string memory) {
        return "1";
    }

    /**
     * @dev 生成提案 ID。
     * 核心算法：Hash(Targets + Values + Calldatas + DescriptionHash)。
     * 这意味着：如果你提交一模一样的提案内容，ID 会重复冲突。
     * 技巧：如果想提交重复提案，必须修改 description (加盐)。
     */
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public pure virtual returns (uint256) {
        return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    /**
     * @dev 获取提案当前状态。这是整个治理系统最复杂的逻辑。
     * 状态机流转：
     * 1. 不存在 -> Revert
     * 2. 当前时间 < voteStart -> **Pending** (等待期)
     * 3. 当前时间 <= voteEnd -> **Active** (投票进行中)
     * 4. 投票未通过 (未到法定人数 Quorum 或 反对票更多) -> **Defeated**
     * 5. 投票通过 -> **Succeeded**
     * 6. 已执行 -> **Executed**
     * 7. 已取消 -> **Canceled**
     * 8. 已过期 (Queued 但太久没执行) -> **Expired**
     */
    function state(uint256 proposalId) public view virtual returns (ProposalState) {
        ProposalCore storage proposal = _proposals[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        uint256 snapshot = proposalSnapshot(proposalId);

        if (snapshot == 0) {
            revert GovernorNonexistentProposal(proposalId);
        }

        uint256 timepoint = clock();

        // Pending 状态：还在冷静期，还没开始投票
        if (timepoint <= snapshot) {
            return ProposalState.Pending;
        }

        uint256 deadline = proposalDeadline(proposalId);

        // Active 状态：正在投票中
        if (timepoint <= deadline) {
            return ProposalState.Active;
        }

        // 投票结束，计算结果
        // _quorumReached 和 _voteSucceeded 由子类 (GovernorCountingSimple) 实现
        // 1. Quorum 够了吗？ (参与度)
        // 2. Succeeded 此时赞成票多吗？ (通过率)
        if (_quorumReached(proposalId) && _voteSucceeded(proposalId)) {
            return ProposalState.Succeeded;
        } else {
            return ProposalState.Defeated;
        }
    }

    /**
     * @dev 提交提案 (Public 入口)
     * @return proposalId 返回生成的提案 ID
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual returns (uint256) {
        address proposer = _msgSender();

        // 1. 检查提案人门槛 (Proposal Threshold)
        // 只有持仓超过一定数量的人才能提议 (防 Spam)
        if (!_isValidDescriptionForProposer(proposer, description)) {
             revert GovernorRestrictedProposer(proposer);
        }
        if (getVotes(proposer, clock() - 1) < proposalThreshold()) {
            revert GovernorInsufficientProposerVotes(proposer, getVotes(proposer, clock() - 1), proposalThreshold());
        }

        // 2. 生成 ID
        uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

        // 3. 检查 ID 是否冲突
        if (proposalSnapshot(proposalId) != 0) {
            revert GovernorUnexpectedProposalState(proposalId, state(proposalId), bytes32(0));
        }
        
        // 4. 计算快照点和截止点
        // snapshot = 当前区块 + votingDelay (延迟多久开始)
        // deadline = snapshot + votingPeriod (持续多久)
        uint256 snapshot = clock() + votingDelay();
        uint256 duration = votingPeriod();

        ProposalCore storage proposal = _proposals[proposalId];
        proposal.proposer = proposer;
        proposal.voteStart = SafeCast.toUint48(snapshot);
        proposal.etaSeconds = 0; // Timelock 扩展会用到

        emit ProposalCreated(
            proposalId,
            proposer,
            targets,
            values,
            new string[](targets.length), // signatures (不再使用，由 calldatas 替代)
            calldatas,
            snapshot,
            snapshot + duration,
            description
        );

        return proposalId;
    }

    /**
     * @dev 执行提案。
     * 只有当提案状态为 Succeeded (或 Queued) 时才能调用。
     * 本质上是调用 _execute 内部函数。
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable virtual returns (uint256) {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        // 验证状态：必须是 Succeeded 或 Queued
        _validateStateBitmap(
            proposalId,
            _encodeStateBitmap(ProposalState.Succeeded) | _encodeStateBitmap(ProposalState.Queued)
        );

        // 标记为已执行 (防止重入执行)
        _proposals[proposalId].executed = true;

        emit ProposalExecuted(proposalId);
        
        // 调用内部执行函数 (如果有 Timelock，则会由子类重写这个函数去调用 Timelock.execute)
        _execute(proposalId, targets, values, calldatas, descriptionHash);

        return proposalId;
    }

    /**
     * @dev 底层执行逻辑。
     * 默认实现：直接通过 call 调用目标合约。
     * Timelock 扩展会重写此函数，改为调用 Timelock 合约。
     */
    function _execute(
        uint256 /* proposalId */,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 /* descriptionHash */
    ) internal virtual {
        for (uint256 i = 0; i < targets.length; ++i) {
            (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
            Address.verifyCallResult(success, returndata);
        }
    }

    /**
     * @dev 投票函数。
     * support: 0(反对), 1(赞成), 2(弃权)
     * 该函数调用内部 _castVote
     */
    function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support, "");
    }

    /**
     * @dev 内部投票逻辑。
     */
    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual returns (uint256) {
        // 1. 验证状态：必须是 Active 才能投票
        _validateStateBitmap(proposalId, _encodeStateBitmap(ProposalState.Active));

        // 2. 获取该用户在 Snapshot 时的票数
        // 注意：一定是 getVotes(account, snapshot)，不能取当前票数！
        uint256 weight = _getVotes(account, proposalSnapshot(proposalId), params);

        // 3. 计票 (调用子类 CountingSimple)
        _countVote(proposalId, account, support, weight, params);

        emit VoteCast(account, proposalId, support, weight, reason);

        return weight;
    }
    
    // ... (省略部分辅助函数) ...
}
