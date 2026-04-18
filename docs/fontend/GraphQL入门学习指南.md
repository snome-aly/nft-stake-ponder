# GraphQL 入门学习指南

## 目录
- [什么是 GraphQL](#什么是-graphql)
- [核心概念](#核心概念)
- [Schema 与类型系统](#schema-与类型系统)
- [查询 (Queries)](#查询-queries)
- [变更 (Mutations)](#变更-mutations)
- [订阅 (Subscriptions)](#订阅-subscriptions)
- [GraphQL vs REST](#graphql-vs-rest)
- [实战：在 Ponder 中使用 GraphQL](#实战在-ponder-中使用-graphql)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 什么是 GraphQL

GraphQL 是一种 **API 查询语言** 和 **运行时**，由 Facebook 于 2012 年开发，2015 年开源。

### 核心特点

1. **精确获取数据** - 客户端明确指定需要哪些字段
2. **单一端点** - 所有请求通过一个 URL
3. **强类型系统** - Schema 定义数据结构
4. **层级结构** - 查询结构与返回数据结构一致
5. **内省能力** - API 可以自我描述

### 一个简单的例子

```graphql
# 查询
query {
  user(id: "1") {
    name
    email
    posts {
      title
    }
  }
}

# 返回
{
  "data": {
    "user": {
      "name": "Alice",
      "email": "alice@example.com",
      "posts": [
        { "title": "GraphQL 入门" },
        { "title": "学习 React" }
      ]
    }
  }
}
```

---

## 核心概念

### 1. Schema（模式）

Schema 是 GraphQL API 的核心，定义了：
- 可查询的数据类型
- 字段及其类型
- 可执行的操作（Query、Mutation、Subscription）

```graphql
type User {
  id: ID!
  name: String!
  email: String
  age: Int
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  createdAt: String!
}
```

### 2. 查询（Query）

从服务器读取数据的操作。

```graphql
type Query {
  user(id: ID!): User
  users: [User!]!
  post(id: ID!): Post
}
```

### 3. 变更（Mutation）

修改服务器数据的操作（创建、更新、删除）。

```graphql
type Mutation {
  createUser(name: String!, email: String!): User!
  updateUser(id: ID!, name: String): User
  deleteUser(id: ID!): Boolean!
}
```

### 4. 订阅（Subscription）

实时数据推送，基于 WebSocket。

```graphql
type Subscription {
  userCreated: User!
  postUpdated(postId: ID!): Post!
}
```

---

## Schema 与类型系统

### 标量类型（Scalar Types）

GraphQL 内置 5 种标量类型：

| 类型 | 说明 | 示例 |
|------|------|------|
| `Int` | 32 位整数 | `42` |
| `Float` | 浮点数 | `3.14` |
| `String` | UTF-8 字符串 | `"Hello"` |
| `Boolean` | 布尔值 | `true` |
| `ID` | 唯一标识符 | `"abc123"` |

### 对象类型（Object Types）

自定义的复杂类型：

```graphql
type Book {
  id: ID!
  title: String!
  author: Author!
  publishedYear: Int
  isbn: String
}

type Author {
  id: ID!
  name: String!
  books: [Book!]!
}
```

### 类型修饰符

- `!` - **非空**，字段必须有值
- `[]` - **列表**，包含多个值
- `[Type!]` - 列表中的元素不能为 null
- `[Type]!` - 列表本身不能为 null（但可以为空数组）
- `[Type!]!` - 列表和元素都不能为 null

```graphql
type Example {
  # 可选字符串
  optionalString: String

  # 必需字符串
  requiredString: String!

  # 可选数组，元素可为 null
  optionalArray: [String]

  # 必需数组，但可以是空数组
  requiredArray: [String]!

  # 数组元素不能为 null
  arrayOfNonNull: [String!]

  # 数组和元素都不能为 null
  strictArray: [String!]!
}
```

### 枚举类型（Enum）

```graphql
enum Role {
  ADMIN
  USER
  GUEST
}

type User {
  id: ID!
  name: String!
  role: Role!
}
```

### 接口（Interface）

```graphql
interface Node {
  id: ID!
  createdAt: String!
}

type User implements Node {
  id: ID!
  createdAt: String!
  name: String!
}

type Post implements Node {
  id: ID!
  createdAt: String!
  title: String!
}
```

### 联合类型（Union）

```graphql
union SearchResult = User | Post | Comment

type Query {
  search(text: String!): [SearchResult!]!
}
```

### 输入类型（Input Types）

用于 Mutation 参数：

```graphql
input CreateUserInput {
  name: String!
  email: String!
  age: Int
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}
```

---

## 查询 (Queries)

### 基础查询

```graphql
# 简单查询
query {
  users {
    id
    name
  }
}

# 带参数的查询
query {
  user(id: "123") {
    name
    email
  }
}

# 多个查询
query {
  user(id: "123") {
    name
  }
  posts {
    title
  }
}
```

### 嵌套查询

```graphql
query {
  user(id: "123") {
    name
    posts {
      title
      comments {
        content
        author {
          name
        }
      }
    }
  }
}
```

### 别名（Aliases）

当需要多次查询同一字段时：

```graphql
query {
  user1: user(id: "1") {
    name
  }
  user2: user(id: "2") {
    name
  }
}
```

### 片段（Fragments）

复用查询片段：

```graphql
fragment UserFields on User {
  id
  name
  email
}

query {
  user1: user(id: "1") {
    ...UserFields
  }
  user2: user(id: "2") {
    ...UserFields
  }
}
```

### 变量（Variables）

```graphql
# 查询定义
query GetUser($userId: ID!, $includeEmail: Boolean = false) {
  user(id: $userId) {
    name
    email @include(if: $includeEmail)
  }
}

# 变量 JSON
{
  "userId": "123",
  "includeEmail": true
}
```

### 指令（Directives）

- `@include(if: Boolean)` - 条件包含字段
- `@skip(if: Boolean)` - 条件跳过字段

```graphql
query GetUser($includeEmail: Boolean!) {
  user(id: "123") {
    name
    email @include(if: $includeEmail)
    phone @skip(if: $includeEmail)
  }
}
```

### 分页查询

#### 偏移分页（Offset-based）

```graphql
query {
  posts(limit: 10, offset: 20) {
    id
    title
  }
}
```

#### 游标分页（Cursor-based）

```graphql
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

type PostConnection {
  edges: [PostEdge!]!
  pageInfo: PageInfo!
}

type PostEdge {
  node: Post!
  cursor: String!
}

query {
  posts(first: 10, after: "cursor123") {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

---

## 变更 (Mutations)

### 基础 Mutation

```graphql
mutation {
  createUser(name: "Alice", email: "alice@example.com") {
    id
    name
    email
  }
}
```

### 使用变量

```graphql
mutation CreateUser($name: String!, $email: String!) {
  createUser(name: $name, email: $email) {
    id
    name
    email
  }
}

# 变量
{
  "name": "Bob",
  "email": "bob@example.com"
}
```

### 使用 Input 类型

```graphql
mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    id
    title
    content
    author {
      name
    }
  }
}

# 变量
{
  "input": {
    "title": "GraphQL 学习",
    "content": "GraphQL 很强大",
    "authorId": "123"
  }
}
```

### 多个 Mutation

```graphql
mutation {
  user1: createUser(name: "Alice", email: "alice@example.com") {
    id
  }
  user2: createUser(name: "Bob", email: "bob@example.com") {
    id
  }
}
```

注意：多个 Mutation 会按顺序执行（串行），而多个 Query 是并行执行的。

---

## 订阅 (Subscriptions)

实时数据推送，基于 WebSocket。

### Schema 定义

```graphql
type Subscription {
  messageAdded(channelId: ID!): Message!
  userStatusChanged(userId: ID!): UserStatus!
}
```

### 客户端使用

```graphql
subscription OnMessageAdded($channelId: ID!) {
  messageAdded(channelId: $channelId) {
    id
    content
    author {
      name
    }
    createdAt
  }
}
```

### JavaScript 实现（使用 graphql-ws）

```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:4000/graphql',
});

client.subscribe(
  {
    query: `
      subscription {
        messageAdded(channelId: "1") {
          id
          content
        }
      }
    `,
  },
  {
    next: (data) => console.log('收到数据:', data),
    error: (error) => console.error('错误:', error),
    complete: () => console.log('完成'),
  }
);
```

---

## GraphQL vs REST

| 特性 | GraphQL | REST |
|------|---------|------|
| **端点** | 单一端点 | 多个端点 |
| **数据获取** | 精确获取所需字段 | 固定数据结构，可能过度获取或不足 |
| **版本管理** | 无需版本，通过 Schema 演进 | 通常需要版本（v1, v2） |
| **类型系统** | 强类型，自描述 | 需要额外文档 |
| **嵌套资源** | 一次查询获取关联数据 | 多次请求或复杂端点 |
| **实时数据** | 内置 Subscription | 需要 WebSocket 或轮询 |
| **缓存** | 复杂，需要专门工具 | HTTP 缓存，简单直观 |
| **学习曲线** | 较陡 | 较平缓 |

### 过度获取（Over-fetching）

**REST:**
```http
GET /api/users/123
{
  "id": "123",
  "name": "Alice",
  "email": "alice@example.com",
  "phone": "123456789",      // 不需要
  "address": "...",          // 不需要
  "avatar": "...",           // 不需要
  "createdAt": "..."         // 不需要
}
```

**GraphQL:**
```graphql
query {
  user(id: "123") {
    name
    email
  }
}
```

### 不足获取（Under-fetching）

**REST:** 需要多次请求
```http
GET /api/users/123
GET /api/users/123/posts
GET /api/posts/1/comments
```

**GraphQL:** 一次请求
```graphql
query {
  user(id: "123") {
    name
    posts {
      title
      comments {
        content
      }
    }
  }
}
```

---

## 实战：在 Ponder 中使用 GraphQL

### Ponder Schema 定义

在 `packages/ponder/ponder.schema.ts` 中：

```typescript
import { onchainTable } from "@ponder/core";

export const user = onchainTable("user", (t) => ({
  address: t.hex().primaryKey(),
  stakedAmount: t.bigint().notNull(),
  rewardDebt: t.bigint().notNull(),
  lastStakeTime: t.bigint().notNull(),
}));

export const nft = onchainTable("nft", (t) => ({
  tokenId: t.bigint().primaryKey(),
  owner: t.hex().notNull(),
  isStaked: t.boolean().notNull(),
  stakedAt: t.bigint(),
  uri: t.text(),
}));
```

### 自动生成的 GraphQL Schema

Ponder 会自动将 onchainTable 转换为 GraphQL Schema：

```graphql
type User {
  address: String!
  stakedAmount: BigInt!
  rewardDebt: BigInt!
  lastStakeTime: BigInt!
}

type Nft {
  tokenId: BigInt!
  owner: String!
  isStaked: Boolean!
  stakedAt: BigInt
  uri: String
}

type Query {
  user(address: String!): User
  users(
    where: UserFilter
    orderBy: String
    limit: Int
    offset: Int
  ): [User!]!

  nft(tokenId: BigInt!): Nft
  nfts(
    where: NftFilter
    orderBy: String
    limit: Int
    offset: Int
  ): [Nft!]!
}
```

### 在前端查询 Ponder GraphQL

```typescript
import { useQuery } from '@tanstack/react-query';
import { request, gql } from 'graphql-request';

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || 'http://localhost:42069';

// 查询单个用户
const GET_USER = gql`
  query GetUser($address: String!) {
    user(address: $address) {
      address
      stakedAmount
      rewardDebt
      lastStakeTime
    }
  }
`;

export function useUserData(address: string) {
  return useQuery({
    queryKey: ['user', address],
    queryFn: () => request(PONDER_URL, GET_USER, { address }),
  });
}

// 查询所有质押的 NFT
const GET_STAKED_NFTS = gql`
  query GetStakedNfts {
    nfts(where: { isStaked: true }, orderBy: "stakedAt", limit: 100) {
      tokenId
      owner
      stakedAt
      uri
    }
  }
`;

export function useStakedNfts() {
  return useQuery({
    queryKey: ['stakedNfts'],
    queryFn: () => request(PONDER_URL, GET_STAKED_NFTS),
  });
}

// 复杂查询：特定用户的质押 NFT
const GET_USER_STAKED_NFTS = gql`
  query GetUserStakedNfts($owner: String!) {
    nfts(where: { owner: $owner, isStaked: true }) {
      tokenId
      stakedAt
      uri
    }
  }
`;

export function useUserStakedNfts(owner: string) {
  return useQuery({
    queryKey: ['userStakedNfts', owner],
    queryFn: () => request(PONDER_URL, GET_USER_STAKED_NFTS, { owner }),
  });
}
```

### GraphQL Playground

访问 http://localhost:42069 查看 Ponder 的 GraphQL Playground，可以：

1. 查看完整 Schema
2. 测试查询
3. 查看文档
4. 自动补全

示例查询：

```graphql
# 查询所有用户
query {
  users {
    address
    stakedAmount
    rewardDebt
  }
}

# 查询特定地址的用户
query {
  user(address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e") {
    stakedAmount
    lastStakeTime
  }
}

# 过滤查询
query {
  nfts(
    where: { isStaked: true }
    orderBy: "stakedAt"
    limit: 10
  ) {
    tokenId
    owner
    stakedAt
  }
}
```

---

## 最佳实践

### 1. 命名规范

- **类型名称**：大驼峰 PascalCase（`User`, `Post`）
- **字段名称**：小驼峰 camelCase（`firstName`, `createdAt`）
- **枚举值**：全大写 UPPER_CASE（`ADMIN`, `PUBLISHED`）

### 2. Schema 设计

#### 使用 ID 类型标识符

```graphql
type User {
  id: ID!  # 而不是 userId: String
  name: String!
}
```

#### 合理使用非空修饰符

```graphql
type User {
  id: ID!           # 必需
  name: String!     # 必需
  email: String     # 可选
  posts: [Post!]!   # 必需数组，元素不为 null
}
```

#### 避免过深嵌套

```graphql
# ❌ 不好：嵌套太深
query {
  user {
    posts {
      comments {
        replies {
          author {
            friends {
              posts {
                ...
              }
            }
          }
        }
      }
    }
  }
}

# ✅ 好：限制嵌套深度，使用多个查询
query {
  user {
    posts {
      comments {
        content
      }
    }
  }
}
```

### 3. 查询优化

#### 使用 Fragment 复用字段

```graphql
fragment UserInfo on User {
  id
  name
  email
  avatar
}

query {
  currentUser {
    ...UserInfo
  }
  users {
    ...UserInfo
  }
}
```

#### 合理使用分页

```graphql
# 使用游标分页处理大数据集
query {
  posts(first: 20, after: $cursor) {
    edges {
      node {
        id
        title
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### 字段级别的懒加载

```graphql
type User {
  id: ID!
  name: String!

  # 昂贵的计算字段
  statistics: UserStatistics
}

# 客户端按需请求
query {
  user(id: "123") {
    name
    # 只在需要时才请求 statistics
  }
}
```

### 4. 错误处理

GraphQL 响应结构：

```json
{
  "data": { ... },      // 成功返回的数据
  "errors": [ ... ]     // 错误信息
}
```

部分成功示例：

```json
{
  "data": {
    "user": {
      "name": "Alice",
      "posts": null    // 这个字段失败了
    }
  },
  "errors": [
    {
      "message": "Failed to fetch posts",
      "path": ["user", "posts"],
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR"
      }
    }
  ]
}
```

### 5. 安全性

#### 查询深度限制

防止恶意深层嵌套查询：

```javascript
// 服务端配置
const depthLimit = require('graphql-depth-limit');

const server = new ApolloServer({
  schema,
  validationRules: [depthLimit(5)], // 最大深度 5
});
```

#### 查询复杂度限制

```javascript
const { createComplexityLimitRule } = require('graphql-validation-complexity');

const server = new ApolloServer({
  schema,
  validationRules: [createComplexityLimitRule(1000)],
});
```

#### 限流（Rate Limiting）

```javascript
const { RateLimitDirective } = require('graphql-rate-limit-directive');

const typeDefs = gql`
  directive @rateLimit(
    max: Int
    window: String
  ) on FIELD_DEFINITION

  type Query {
    user(id: ID!): User @rateLimit(max: 100, window: "1m")
  }
`;
```

### 6. 版本演进

#### 添加新字段（无破坏性）

```graphql
type User {
  id: ID!
  name: String!
  email: String      # 已存在
  phone: String      # ✅ 新增字段，不影响旧客户端
}
```

#### 废弃字段（而非删除）

```graphql
type User {
  id: ID!
  name: String! @deprecated(reason: "Use 'fullName' instead")
  fullName: String!
}
```

#### 使用接口实现版本化

```graphql
interface UserV1 {
  id: ID!
  name: String!
}

interface UserV2 {
  id: ID!
  firstName: String!
  lastName: String!
}

type User implements UserV1 & UserV2 {
  id: ID!
  name: String!
  firstName: String!
  lastName: String!
}
```

---

## 常见问题

### 1. GraphQL 适合所有场景吗？

**不适合的场景：**
- 简单的 CRUD API
- 文件上传/下载为主
- 需要强 HTTP 缓存
- 团队不熟悉 GraphQL

**适合的场景：**
- 复杂的数据关系
- 多端应用（Web、Mobile、IoT）
- 快速迭代的产品
- 需要精确控制数据获取

### 2. 如何处理文件上传？

使用 `multipart/form-data` 和特殊的 scalar 类型：

```graphql
scalar Upload

type Mutation {
  uploadFile(file: Upload!): File!
}
```

客户端：

```javascript
const mutation = gql`
  mutation UploadFile($file: Upload!) {
    uploadFile(file: $file) {
      url
    }
  }
`;

// 使用 Apollo Client
const [uploadFile] = useMutation(mutation);

const handleUpload = (file) => {
  uploadFile({ variables: { file } });
};
```

### 3. 如何实现身份验证？

通过 HTTP Headers：

```javascript
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('http://localhost:4000/graphql', {
  headers: {
    authorization: `Bearer ${token}`,
  },
});
```

服务端从 context 获取：

```javascript
const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    const token = req.headers.authorization || '';
    const user = verifyToken(token);
    return { user };
  },
});
```

### 4. N+1 查询问题如何解决？

使用 DataLoader：

```javascript
const DataLoader = require('dataloader');

// 批量加载函数
const batchUsers = async (ids) => {
  const users = await db.users.findMany({
    where: { id: { in: ids } }
  });
  return ids.map(id => users.find(u => u.id === id));
};

// 在 context 中创建 DataLoader
const context = {
  userLoader: new DataLoader(batchUsers),
};

// 在 resolver 中使用
const resolvers = {
  Post: {
    author: (post, args, context) => {
      return context.userLoader.load(post.authorId);
    },
  },
};
```

### 5. 如何调试 GraphQL 查询？

工具：

1. **GraphQL Playground** - http://localhost:4000/graphql
2. **Apollo Studio** - 云端调试工具
3. **GraphiQL** - 轻量级 IDE
4. **Altair** - 桌面应用

浏览器开发者工具：

```javascript
// 启用 Apollo Client DevTools
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
  devtools: {
    enabled: true,
  },
});
```

### 6. GraphQL 性能优化建议

1. **使用持久化查询** - 预编译查询，减少网络传输
2. **实现查询复杂度分析** - 防止昂贵查询
3. **字段级缓存** - 缓存 resolver 结果
4. **使用 DataLoader** - 批量加载，避免 N+1
5. **查询白名单** - 只允许预定义的查询
6. **压缩响应** - 启用 gzip/brotli
7. **CDN 缓存** - 对于公开数据使用 CDN

---

## 进阶学习资源

### 官方资源
- [GraphQL 官网](https://graphql.org/)
- [GraphQL Spec](https://spec.graphql.org/)
- [Apollo Docs](https://www.apollographql.com/docs/)

### 工具生态
- **Apollo Client** - 最流行的 GraphQL 客户端（React）
- **Relay** - Facebook 的 GraphQL 客户端
- **URQL** - 轻量级 GraphQL 客户端
- **Prisma** - 结合 GraphQL 的 ORM
- **Hasura** - 自动生成 GraphQL API
- **Ponder** - 区块链数据索引器（本项目使用）

### Schema 工具
- **GraphQL Code Generator** - 从 Schema 生成 TypeScript 类型
- **GraphQL Inspector** - Schema 检查和对比
- **GraphQL Voyager** - 可视化 Schema 关系图

### 练习项目
1. 实现一个博客 API（用户、文章、评论）
2. 构建一个电商系统（商品、购物车、订单）
3. 创建一个社交网络（关注、点赞、消息）

---

## 总结

GraphQL 的核心优势：
1. **精确数据获取** - 客户端决定需要什么
2. **单一请求** - 减少网络往返
3. **强类型系统** - 自文档化，工具支持好
4. **演进友好** - 无需版本管理

关键概念回顾：
- **Schema** - 定义数据结构
- **Query** - 读取数据
- **Mutation** - 修改数据
- **Subscription** - 实时数据
- **Resolver** - 解析字段值
- **Types** - 标量、对象、枚举、接口、联合

在本项目中：
- Ponder 自动生成 GraphQL API
- 使用 `@tanstack/react-query` + `graphql-request` 查询数据
- Schema 定义在 `ponder.schema.ts`
- GraphQL Playground 在 http://localhost:42069

下一步：
1. 实践在 Ponder 中查询区块链数据
2. 学习 `@tanstack/react-query` 的缓存策略
3. 探索 GraphQL Code Generator 生成类型
4. 了解 Subscription 的实时数据推送

Happy GraphQL learning!
