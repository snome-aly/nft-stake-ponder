# 智能合约测试方法论

## 1. 测试金字塔

```mermaid
graph TB
    subgraph "测试金字塔"
    E2E["🔺 E2E 测试 (少量)<br/>完整流程<br/>多合约交互"]
    Integration["🔶 集成测试 (适量)<br/>多函数组合<br/>状态变化验证"]
    Unit["🟦 单元测试 (大量)<br/>单个函数<br/>边界条件"]
    end

    E2E --> Integration --> Unit

    style E2E fill:#ff6b6b
    style Integration fill:#ffd93d
    style Unit fill:#6bcf7f
```

## 2. 测试设计六维度

```mermaid
mindmap
  root((智能合约测试))
    1️⃣ 功能正确性
      Happy Path
      正常用例
      基本功能验证
    2️⃣ 边界条件
      最小值/最大值
      临界点
      极端情况
      空值处理
    3️⃣ 权限控制
      角色验证
      访问控制
      权限拒绝
    4️⃣ 状态转换
      状态机验证
      顺序检查
      重复操作保护
    5️⃣ 事件验证
      事件触发
      参数正确性
      事件顺序
    6️⃣ Gas 优化
      Gas 测量
      批量操作优化
      存储优化验证
```

## 3. AAA 测试模式流程

```mermaid
flowchart LR
    A[Arrange<br/>准备环境] --> B[Act<br/>执行操作]
    B --> C[Assert<br/>验证结果]

    A1[部署合约] --> A
    A2[设置初始状态] --> A
    A3[准备测试账户] --> A

    B --> B1[调用合约函数]
    B --> B2[发送交易]

    C --> C1[检查返回值]
    C --> C2[验证状态变化]
    C --> C3[确认事件触发]

    style A fill:#a8dadc
    style B fill:#457b9d
    style C fill:#1d3557
```

## 4. 完整测试流程

```mermaid
flowchart TD
    Start([开始]) --> Design[设计测试用例]

    Design --> Dimension{选择测试维度}

    Dimension -->|功能正确性| Happy[编写 Happy Path 测试]
    Dimension -->|边界条件| Boundary[编写边界测试]
    Dimension -->|权限控制| Access[编写权限测试]
    Dimension -->|状态转换| State[编写状态机测试]
    Dimension -->|事件验证| Event[编写事件测试]
    Dimension -->|Gas 优化| Gas[编写 Gas 测试]

    Happy --> Write[编写测试代码<br/>AAA 模式]
    Boundary --> Write
    Access --> Write
    State --> Write
    Event --> Write
    Gas --> Write

    Write --> Run[运行测试]

    Run --> Pass{测试通过?}

    Pass -->|否| Debug[调试代码]
    Debug --> Fix[修复 Bug]
    Fix --> Run

    Pass -->|是| Coverage[检查覆盖率]

    Coverage --> Target{达到目标?<br/>代码 >90%<br/>分支 >85%<br/>函数 100%}

    Target -->|否| Design
    Target -->|是| Deploy[准备部署]

    Deploy --> End([结束])

    style Start fill:#06d6a0
    style End fill:#06d6a0
    style Pass fill:#ffd60a
    style Target fill:#ffd60a
    style Debug fill:#ef476f
    style Fix fill:#ef476f
```

## 5. 状态机测试示例

```mermaid
stateDiagram-v2
    [*] --> Deployed: 部署合约

    Deployed --> RarityPoolSet: setRarityPool()
    Deployed --> Deployed: ❌ 不能 mint
    Deployed --> Deployed: ❌ 不能 reveal

    RarityPoolSet --> Minting: mint()
    RarityPoolSet --> RarityPoolSet: ❌ 不能重复设置

    Minting --> Minting: mint() 继续铸造
    Minting --> AllMinted: mint() 达到 MAX_SUPPLY
    Minting --> Minting: ❌ 不能 reveal

    AllMinted --> Revealed: reveal()
    AllMinted --> AllMinted: ❌ 不能继续 mint

    Revealed --> Revealed: ✅ getRarity()
    Revealed --> Revealed: ✅ tokenURI() 返回完整信息
    Revealed --> Revealed: ❌ 不能重复 reveal

    Revealed --> [*]: withdraw()

    note right of Deployed
        初始状态
        - rarityPoolSet = false
        - isRevealed = false
        - totalMinted = 0
    end note

    note right of Revealed
        最终状态
        - 所有 NFT 已铸造
        - 稀有度已揭示
        - 可查询稀有度
    end note
```

## 6. 测试用例组织结构

```mermaid
graph TD
    Root[StakableNFT 测试套件]

    Root --> Deploy[1. 部署和初始化]
    Root --> RarityPool[2. 稀有度池设置]
    Root --> Mint[3. 铸造功能]
    Root --> Reveal[4. 揭示功能]
    Root --> Query[5. 查询功能]
    Root --> Access[6. 权限管理]
    Root --> Funds[7. 资金管理]
    Root --> GasTest[8. Gas 优化]

    Deploy --> D1[初始化状态检查]
    Deploy --> D2[角色分配验证]
    Deploy --> D3[默认值验证]

    Mint --> M1[正常情况]
    Mint --> M2[边界条件]
    Mint --> M3[错误情况]

    M1 --> M11[单个铸造]
    M1 --> M12[批量铸造]
    M1 --> M13[状态更新验证]

    M2 --> M21[数量 = 0]
    M2 --> M22[达到 MAX_SUPPLY]
    M2 --> M23[超过 MAX_SUPPLY]
    M2 --> M24[达到 MAX_PER_ADDRESS]
    M2 --> M25[超过 MAX_PER_ADDRESS]

    M3 --> M31[支付金额不足]
    M3 --> M32[支付金额过多]
    M3 --> M33[稀有度池未设置]
    M3 --> M34[合约已暂停]

    Access --> A1[角色授予]
    Access --> A2[角色撤销]
    Access --> A3[权限验证]

    style Root fill:#0077b6
    style Mint fill:#00b4d8
    style M1 fill:#90e0ef
    style M2 fill:#caf0f8
    style M3 fill:#ade8f4
```

## 7. 测试检查清单

```mermaid
flowchart TD
    Start([开始测试检查])

    Start --> C1{功能正确性测试}
    C1 -->|✅| C2{边界条件测试}
    C1 -->|❌| Fix1[补充功能测试]
    Fix1 --> C1

    C2 -->|✅| C3{权限控制测试}
    C2 -->|❌| Fix2[补充边界测试]
    Fix2 --> C2

    C3 -->|✅| C4{状态转换测试}
    C3 -->|❌| Fix3[补充权限测试]
    Fix3 --> C3

    C4 -->|✅| C5{事件验证测试}
    C4 -->|❌| Fix4[补充状态测试]
    Fix4 --> C4

    C5 -->|✅| C6{Gas 优化测试}
    C5 -->|❌| Fix5[补充事件测试]
    Fix5 --> C5

    C6 -->|✅| Coverage[运行覆盖率报告]
    C6 -->|❌| Fix6[补充 Gas 测试]
    Fix6 --> C6

    Coverage --> R1{代码覆盖率 >90%?}
    R1 -->|✅| R2{分支覆盖率 >85%?}
    R1 -->|❌| AddTests1[增加测试用例]
    AddTests1 --> Coverage

    R2 -->|✅| R3{函数覆盖率 100%?}
    R2 -->|❌| AddTests2[增加分支测试]
    AddTests2 --> Coverage

    R3 -->|✅| Complete([✅ 测试完成])
    R3 -->|❌| AddTests3[覆盖遗漏函数]
    AddTests3 --> Coverage

    style Start fill:#06d6a0
    style Complete fill:#06d6a0
    style Fix1 fill:#ffd60a
    style Fix2 fill:#ffd60a
    style Fix3 fill:#ffd60a
    style Fix4 fill:#ffd60a
    style Fix5 fill:#ffd60a
    style Fix6 fill:#ffd60a
    style AddTests1 fill:#ef476f
    style AddTests2 fill:#ef476f
    style AddTests3 fill:#ef476f
```

## 8. 测试优先级矩阵

```mermaid
quadrantChart
    title 测试用例优先级矩阵
    x-axis 低复杂度 --> 高复杂度
    y-axis 低风险 --> 高风险
    quadrant-1 高优先级
    quadrant-2 最高优先级
    quadrant-3 低优先级
    quadrant-4 中优先级

    权限控制测试: [0.3, 0.9]
    支付验证测试: [0.4, 0.95]
    状态转换测试: [0.7, 0.85]
    重入攻击防护: [0.5, 0.92]

    边界条件测试: [0.6, 0.65]
    事件验证测试: [0.25, 0.35]
    Gas优化测试: [0.8, 0.4]

    正常铸造测试: [0.2, 0.6]
    查询函数测试: [0.15, 0.25]
```

## 9. 实际测试执行流程

```mermaid
sequenceDiagram
    participant Dev as 开发者
    participant Test as 测试文件
    participant Hardhat as Hardhat
    participant Chain as 本地链
    participant Contract as 合约

    Dev->>Test: 编写测试用例
    Dev->>Hardhat: yarn hardhat:test

    activate Hardhat
    Hardhat->>Chain: 启动临时链 (内存中)
    activate Chain

    Hardhat->>Contract: 部署合约
    activate Contract

    Test->>Contract: 调用函数 (Arrange)
    Test->>Contract: 执行操作 (Act)
    Contract-->>Test: 返回结果

    Test->>Test: 验证结果 (Assert)

    alt 测试通过
        Test-->>Hardhat: ✅ Pass
        Hardhat-->>Dev: 显示通过
    else 测试失败
        Test-->>Hardhat: ❌ Fail
        Hardhat-->>Dev: 显示错误信息
        Dev->>Contract: 修复代码
        Dev->>Hardhat: 重新测试
    end

    deactivate Contract
    Hardhat->>Chain: 销毁临时链
    deactivate Chain
    deactivate Hardhat

    Hardhat-->>Dev: 测试报告
```

## 10. 测试覆盖率追踪

```mermaid
graph LR
    subgraph "测试覆盖率目标"
    A[代码覆盖率<br/>>90%]
    B[分支覆盖率<br/>>85%]
    C[函数覆盖率<br/>100%]
    end

    A --> Report[生成报告]
    B --> Report
    C --> Report

    Report --> Analyze[分析未覆盖代码]
    Analyze --> Add[添加缺失测试]
    Add --> Rerun[重新运行]
    Rerun --> Check{达到目标?}

    Check -->|是| Deploy[准备部署]
    Check -->|否| Analyze

    Deploy --> Success([✅ 完成])

    style A fill:#4ecdc4
    style B fill:#44a5c2
    style C fill:#3d5a80
    style Success fill:#06d6a0
```

---

## 使用说明

1. **测试金字塔**: 指导测试类型的分布比例
2. **六维度**: 全面覆盖测试场景
3. **AAA 模式**: 标准化测试结构
4. **完整流程**: 从设计到部署的完整路径
5. **状态机**: 验证合约状态转换的正确性
6. **组织结构**: 清晰的测试文件组织
7. **检查清单**: 确保测试完整性
8. **优先级矩阵**: 合理安排测试顺序
9. **执行流程**: 理解测试运行机制
10. **覆盖率追踪**: 保证测试质量

保存此文件后,可以在任何支持 Mermaid 的工具中查看图表(如 VS Code + Mermaid 插件、GitHub、Notion 等)。
