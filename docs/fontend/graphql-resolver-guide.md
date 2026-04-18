# GraphQL Resolver 完全指南

## 什么是 Resolver？

Resolver 是一个**函数**，告诉 GraphQL **如何获取某个字段的数据**。

### 简单类比

```
GraphQL Schema = 菜单（定义有哪些菜）
Resolver = 厨师（定义如何做这道菜）

客户点菜 → 查看菜单 → 厨师做菜 → 上菜
客户查询 → 查看 Schema → Resolver 获取数据 → 返回结果
```

---

## Resolver 的四个参数

```javascript
function resolver(parent, args, context, info) {
  return 数据;
}
```

### 1. parent（父对象）

**作用：** 上一级 resolver 返回的数据

```javascript
// Schema
type Query {
  user(id: ID!): User
}

type User {
  id: ID!
  name: String!
  email: String!
}

// Resolvers
const resolvers = {
  Query: {
    user: () => {
      // parent = undefined（根查询没有父级）
      return { id: "1", name: "Alice", email: "alice@example.com" };
    }
  },

  User: {
    name: (parent) => {
      // parent = { id: "1", name: "Alice", email: "alice@example.com" }
      return parent.name; // 返回 "Alice"
    },

    email: (parent) => {
      // parent 同上
      return parent.email; // 返回 "alice@example.com"
    }
  }
};
```

### 2. args（参数）

**作用：** 客户端传入的查询参数

```javascript
// 查询
query {
  user(id: "123") {
    name
  }
}

// Resolver
const resolvers = {
  Query: {
    user: (parent, args) => {
      // args = { id: "123" }
      return db.users.findById(args.id);
    }
  }
};
```

### 3. context（上下文）

**作用：** 所有 resolver 共享的数据（数据库、用户信息等）

```javascript
// 创建 context
const server = new ApolloServer({
  schema,
  context: ({ req }) => ({
    db: prisma,              // 数据库
    user: req.user,          // 当前用户
    loaders: {               // DataLoader
      userLoader: new DataLoader(...)
    }
  })
});

// 在 resolver 中使用
const resolvers = {
  Query: {
    me: (parent, args, context) => {
      // 访问当前用户
      return context.user;
    },

    posts: (parent, args, context) => {
      // 访问数据库
      return context.db.post.findMany();
    }
  }
};
```

### 4. info（查询信息）

**作用：** 查询的元数据（很少使用）

```javascript
user: (parent, args, context, info) => {
  console.log(info.fieldName);      // "user"
  console.log(info.returnType);     // "User"
  console.log(info.parentType);     // "Query"
  // 一般不需要用
}
```

---

## 默认 Resolver 机制

**核心规则：** 如果不写 resolver，GraphQL 会自动从 parent 对象读取同名字段。

### 示例

```javascript
// Schema
type User {
  id: ID!
  name: String!
  email: String!
}

// ❌ 你以为需要这样写：
const resolvers = {
  User: {
    id: (parent) => parent.id,
    name: (parent) => parent.name,
    email: (parent) => parent.email,
  }
};

// ✅ 实际上可以省略（自动使用默认 resolver）：
const resolvers = {
  User: {
    // 空着就行，自动从 parent 读取
  }
};

// ✅ 甚至可以完全不定义 User resolver
const resolvers = {
  Query: {
    user: () => ({ id: "1", name: "Alice", email: "alice@example.com" })
  }
  // User 的字段会自动解析
};
```

---

## 何时需要手写 Resolver？

### 判断标准：三个问题

1. **数据在 parent 对象里吗？**
   - ✅ 在 → 不需要写
   - ❌ 不在 → 需要写

2. **需要额外的数据获取吗？**
   - ✅ 需要（查数据库、调 API）→ 需要写
   - ❌ 不需要 → 不需要写

3. **需要数据转换或计算吗？**
   - ✅ 需要 → 需要写
   - ❌ 不需要 → 不需要写

### 场景对照表

| 场景 | 是否需要写 Resolver | 示例 |
|------|-------------------|------|
| **直接字段映射** | ❌ 不需要 | `User.name` 直接从 parent 读取 |
| **计算字段** | ✅ 需要 | `User.fullName = firstName + lastName` |
| **关联查询** | ✅ 需要 | `User.posts` 查询该用户的文章 |
| **外部 API** | ✅ 需要 | `User.avatar` 从 CDN 获取 |
| **权限控制** | ✅ 需要 | `User.email` 只有本人能看 |
| **数据转换** | ✅ 需要 | `User.createdAt` 格式化时间 |
| **聚合数据** | ✅ 需要 | `User.postCount` 统计文章数 |
| **缓存优化** | ✅ 需要 | 使用 DataLoader 批量加载 |

---

## 实战示例

### 示例 1：简单用户查询

```javascript
// Schema
type Query {
  user(id: ID!): User
}

type User {
  id: ID!
  name: String!
  email: String!
  age: Int
}

// Resolvers
const resolvers = {
  Query: {
    // ✅ 需要写（数据来自数据库）
    user: async (parent, { id }, { db }) => {
      return await db.users.findById(id);
      // 返回: { id: "1", name: "Alice", email: "...", age: 25 }
    }
  },

  User: {
    // ❌ 不需要写 id、name、email、age
    // 因为已经在 parent 对象里了
  }
};
```

### 示例 2：计算字段

```javascript
// Schema
type User {
  id: ID!
  firstName: String!
  lastName: String!
  fullName: String!    // 计算字段
}

// Resolvers
const resolvers = {
  User: {
    // ❌ 不需要写 id、firstName、lastName（parent 里有）

    // ✅ 需要写 fullName（需要计算）
    fullName: (parent) => {
      return `${parent.firstName} ${parent.lastName}`;
    }
  }
};
```

### 示例 3：关联查询

```javascript
// Schema
type User {
  id: ID!
  name: String!
  posts: [Post!]!      // 关联数据
}

type Post {
  id: ID!
  title: String!
  author: User!        // 关联数据
}

// Resolvers
const resolvers = {
  User: {
    // ❌ 不需要写 id、name（parent 里有）

    // ✅ 需要写 posts（需要查询数据库）
    posts: async (user, args, { db }) => {
      return await db.posts.findMany({
        where: { authorId: user.id }
      });
    }
  },

  Post: {
    // ❌ 不需要写 id、title（parent 里有）

    // ✅ 需要写 author（需要查询数据库）
    author: async (post, args, { loaders }) => {
      // 使用 DataLoader 优化
      return await loaders.userLoader.load(post.authorId);
    }
  }
};
```

### 示例 4：权限控制

```javascript
// Schema
type User {
  id: ID!
  name: String!        // 公开
  email: String!       // 需要权限
}

// Resolvers
const resolvers = {
  User: {
    // ❌ 不需要写 id、name（公开字段，直接读取）

    // ✅ 需要写 email（需要权限检查）
    email: (parent, args, { user }) => {
      // 只有本人或管理员能看
      if (user?.id === parent.id || user?.role === 'ADMIN') {
        return parent.email;
      }
      return null; // 或抛出错误
    }
  }
};
```

### 示例 5：聚合数据

```javascript
// Schema
type User {
  id: ID!
  name: String!
  postCount: Int!      // 聚合字段
  totalLikes: Int!     // 聚合字段
}

// Resolvers
const resolvers = {
  User: {
    // ❌ 不需要写 id、name

    // ✅ 需要写 postCount（需要统计）
    postCount: async (user, args, { db }) => {
      return await db.posts.count({
        where: { authorId: user.id }
      });
    },

    // ✅ 需要写 totalLikes（需要聚合）
    totalLikes: async (user, args, { db }) => {
      const result = await db.posts.aggregate({
        where: { authorId: user.id },
        _sum: { likes: true }
      });
      return result._sum.likes || 0;
    }
  }
};
```

---

## 完整决策树

```
开始：需要获取某个字段的数据
  ↓
数据已经在 parent 对象里？
  ├─ ✅ 是 → 不需要写 Resolver（使用默认）
  └─ ❌ 否 → 继续
      ↓
  需要查询数据库/调用 API？
    ├─ ✅ 是 → 需要写 Resolver
    └─ ❌ 否 → 继续
        ↓
    需要计算/转换数据？
      ├─ ✅ 是 → 需要写 Resolver
      └─ ❌ 否 → 继续
          ↓
      需要权限控制？
        ├─ ✅ 是 → 需要写 Resolver
        └─ ❌ 否 → 不需要写 Resolver
```

---

## 常见错误

### 错误 1：过度编写 Resolver

```javascript
// ❌ 不好：写了很多不必要的 resolver
const resolvers = {
  User: {
    id: (parent) => parent.id,        // 多余
    name: (parent) => parent.name,    // 多余
    email: (parent) => parent.email,  // 多余
  }
};

// ✅ 好：利用默认 resolver
const resolvers = {
  User: {
    // 空着或不写，自动解析
  }
};
```

### 错误 2：忘记处理关联数据

```javascript
// ❌ 错误：没有为 posts 写 resolver
const resolvers = {
  Query: {
    user: (_, { id }, { db }) => db.users.findById(id)
  },
  User: {
    // posts 字段没有 resolver！
    // 客户端查询 user.posts 会返回 undefined
  }
};

// ✅ 正确：为关联数据写 resolver
const resolvers = {
  Query: {
    user: (_, { id }, { db }) => db.users.findById(id)
  },
  User: {
    posts: (user, _, { db }) => {
      return db.posts.findMany({ where: { authorId: user.id } });
    }
  }
};
```

### 错误 3：N+1 查询问题

```javascript
// ❌ 低效：每个 post 都查询一次 author
const resolvers = {
  Post: {
    author: async (post, _, { db }) => {
      // 如果有 100 个 posts，会执行 100 次查询！
      return await db.users.findById(post.authorId);
    }
  }
};

// ✅ 高效：使用 DataLoader 批量查询
const resolvers = {
  Post: {
    author: (post, _, { loaders }) => {
      // DataLoader 会自动批量处理
      return loaders.userLoader.load(post.authorId);
    }
  }
};
```

---

## Ponder 的特殊性

在 Ponder 项目中，你**完全不需要写 Resolver**，因为：

### Ponder 做了什么

```typescript
// 1. 你定义 Schema
export const nft = onchainTable("nft", (t) => ({
  tokenId: t.bigint().primaryKey(),
  owner: t.hex().notNull(),
  isStaked: t.boolean().notNull(),
}));

// 2. Ponder 自动生成 Resolvers
// 相当于自动写了：
const resolvers = {
  Query: {
    nft: (_, { tokenId }, { db }) => db.nft.findUnique({ where: { tokenId } }),
    nfts: (_, { where, limit, orderBy }, { db }) => db.nft.findMany({ where, limit, orderBy }),
  },
  Nft: {
    tokenId: (parent) => parent.tokenId,  // 自动
    owner: (parent) => parent.owner,      // 自动
    isStaked: (parent) => parent.isStaked, // 自动
  }
};

// 3. 你只需要写事件处理器（数据写入）
ponder.on("StakableNFT:Transfer", async ({ event, context }) => {
  await context.db.nft.upsert({
    id: event.args.tokenId,
    create: { /* ... */ },
    update: { /* ... */ },
  });
});
```

### 为什么 Ponder 不需要手写 Resolver

1. **固定的数据源** - 只从 Ponder 的数据库读取
2. **标准的 CRUD** - 没有复杂的业务逻辑
3. **自动优化** - Ponder 内置了查询优化
4. **专注索引** - 你只需要关心如何索引区块链数据

---

## 总结

### 核心原则

1. **默认 Resolver 很强大** - 能不写就不写
2. **parent 里有的数据** - 不需要写 Resolver
3. **需要额外获取的数据** - 必须写 Resolver
4. **需要计算的字段** - 必须写 Resolver
5. **需要权限控制** - 必须写 Resolver

### 快速判断法

**问自己一个问题：**
> "这个字段的值，能直接从上一级 resolver 的返回值里读取吗？"

- ✅ 能 → 不需要写
- ❌ 不能 → 需要写

### 学习路径

1. 先理解默认 Resolver 机制
2. 学会识别哪些字段需要手写
3. 掌握常见场景的写法（关联、计算、权限）
4. 了解性能优化（DataLoader）

### 在你的项目中

**Ponder 项目：** 0% 手写 Resolver ✅

**传统 GraphQL 项目：** 估计 30-50% 需要手写

现在你应该能清楚地判断何时需要写 Resolver 了！
