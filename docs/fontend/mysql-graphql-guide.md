# MySQL + GraphQL 集成指南

## 目录
1. [概述](#概述)
2. [技术选型](#技术选型)
3. [快速开始](#快速开始)
4. [方案一：Apollo Server + TypeORM](#方案一apollo-server--typeorm)
5. [方案二：Prisma + GraphQL](#方案二prisma--graphql)
6. [方案三：Hasura (零代码方案)](#方案三hasura-零代码方案)
7. [性能优化](#性能优化)
8. [安全与最佳实践](#安全与最佳实践)
9. [完整示例项目](#完整示例项目)

---

## 概述

MySQL 是最流行的关系型数据库之一，完全可以与 GraphQL 无缝集成。本指南将介绍三种主流方案，从手动配置到零代码自动生成。

### 为什么选择 MySQL + GraphQL？

✅ **关系型数据的强大能力** - JOIN、事务、ACID 保证
✅ **灵活的查询** - GraphQL 精确获取数据，避免 N+1 问题
✅ **类型安全** - TypeScript + GraphQL + ORM 全链路类型检查
✅ **成熟生态** - 丰富的工具和库支持

---

## 技术选型

| 方案 | 复杂度 | 灵活性 | 适用场景 |
|------|--------|--------|----------|
| **Apollo Server + TypeORM** | 中 | 高 | 需要完全控制的项目 |
| **Prisma + GraphQL** | 低 | 高 | 现代全栈项目 |
| **Hasura** | 极低 | 中 | 快速原型、后台管理 |

---

## 快速开始

### 前置要求

```bash
# 确保已安装 MySQL
mysql --version

# 创建数据库
mysql -u root -p
```

```sql
CREATE DATABASE myapp_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'myapp_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON myapp_dev.* TO 'myapp_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 方案一：Apollo Server + TypeORM

### 特点
- 完全手动控制，灵活度最高
- 适合复杂业务逻辑
- 需要编写较多代码

### 1. 安装依赖

```bash
npm install apollo-server graphql typeorm mysql2 reflect-metadata
npm install --save-dev @types/node typescript ts-node
```

### 2. TypeORM 配置

创建 `ormconfig.json`：

```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "myapp_user",
  "password": "your_password",
  "database": "myapp_dev",
  "synchronize": true,
  "logging": false,
  "entities": ["src/entities/**/*.ts"],
  "migrations": ["src/migrations/**/*.ts"],
  "subscribers": ["src/subscribers/**/*.ts"]
}
```

### 3. 定义 Entity

`src/entities/User.ts`：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Post } from "./Post";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "int", nullable: true })
  age?: number;

  @OneToMany(() => Post, post => post.author)
  posts!: Post[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

`src/entities/Post.ts`：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @ManyToOne(() => User, user => user.posts)
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
```

### 4. 定义 GraphQL Schema

`src/schema/typeDefs.ts`：

```typescript
import { gql } from "apollo-server";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    age: Int
    posts: [Post!]!
    createdAt: String!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    createdAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(name: String!, email: String!, age: Int): User!
    updateUser(id: ID!, name: String, email: String, age: Int): User!
    deleteUser(id: ID!): Boolean!
    createPost(title: String!, content: String!, authorId: ID!): Post!
  }
`;
```

### 5. 实现 Resolvers

`src/schema/resolvers.ts`：

```typescript
import { User } from "../entities/User";
import { Post } from "../entities/Post";
import DataLoader from "dataloader";

// DataLoader 用于批量加载，解决 N+1 问题
const createUserLoader = () => {
  return new DataLoader(async (userIds: readonly number[]) => {
    const users = await User.findByIds(userIds as number[]);
    const userMap = new Map(users.map(user => [user.id, user]));
    return userIds.map(id => userMap.get(id) || null);
  });
};

export const resolvers = {
  Query: {
    users: async () => {
      return await User.find();
    },

    user: async (_: any, { id }: { id: number }) => {
      return await User.findOne({ where: { id } });
    },

    posts: async () => {
      return await Post.find({ relations: ["author"] });
    },

    post: async (_: any, { id }: { id: number }) => {
      return await Post.findOne({ where: { id }, relations: ["author"] });
    },
  },

  Mutation: {
    createUser: async (_: any, { name, email, age }: { name: string; email: string; age?: number }) => {
      const user = User.create({ name, email, age });
      await user.save();
      return user;
    },

    updateUser: async (_: any, { id, name, email, age }: { id: number; name?: string; email?: string; age?: number }) => {
      const user = await User.findOne({ where: { id } });
      if (!user) throw new Error("User not found");

      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (age !== undefined) user.age = age;

      await user.save();
      return user;
    },

    deleteUser: async (_: any, { id }: { id: number }) => {
      const result = await User.delete(id);
      return result.affected! > 0;
    },

    createPost: async (_: any, { title, content, authorId }: { title: string; content: string; authorId: number }) => {
      const author = await User.findOne({ where: { id: authorId } });
      if (!author) throw new Error("Author not found");

      const post = Post.create({ title, content, author });
      await post.save();
      return post;
    },
  },

  User: {
    posts: async (user: User, _: any, { loaders }: any) => {
      return await Post.find({ where: { author: { id: user.id } } });
    },
  },

  Post: {
    author: async (post: Post, _: any, { loaders }: any) => {
      return loaders.userLoader.load(post.author.id);
    },
  },
};
```

### 6. 启动服务器

`src/index.ts`：

```typescript
import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { createConnection } from "typeorm";
import { typeDefs } from "./schema/typeDefs";
import { resolvers } from "./schema/resolvers";
import DataLoader from "dataloader";
import { User } from "./entities/User";

const createUserLoader = () => {
  return new DataLoader(async (userIds: readonly number[]) => {
    const users = await User.findByIds(userIds as number[]);
    const userMap = new Map(users.map(user => [user.id, user]));
    return userIds.map(id => userMap.get(id) || null);
  });
};

async function startServer() {
  // 连接数据库
  await createConnection();

  // 创建 Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({
      loaders: {
        userLoader: createUserLoader(),
      },
    }),
  });

  // 启动服务器
  const { url } = await server.listen(4000);
  console.log(`🚀 Server ready at ${url}`);
}

startServer().catch(console.error);
```

### 7. 运行项目

```bash
# 编译
npx tsc

# 运行
node dist/index.js

# 或使用 ts-node
ts-node src/index.ts
```

访问 `http://localhost:4000` 查看 GraphQL Playground。

---

## 方案二：Prisma + GraphQL

### 特点
- 现代化 ORM，类型安全
- 自动生成数据库客户端
- 可视化数据库管理（Prisma Studio）
- 支持代码优先或 Schema 优先

### 1. 安装依赖

```bash
npm install @prisma/client graphql-yoga
npm install --save-dev prisma typescript ts-node @types/node
```

### 2. 初始化 Prisma

```bash
npx prisma init
```

修改 `.env`：

```env
DATABASE_URL="mysql://myapp_user:your_password@localhost:3306/myapp_dev"
```

### 3. 定义 Prisma Schema

`prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  email     String   @unique @db.VarChar(255)
  age       Int?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(255)
  content   String   @db.Text
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([authorId])
}
```

### 4. 生成数据库和客户端

```bash
# 创建数据库表
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate

# 打开可视化管理界面
npx prisma studio
```

### 5. 创建 GraphQL Schema

`src/schema.ts`：

```typescript
import { createSchema } from "graphql-yoga";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type User {
      id: ID!
      name: String!
      email: String!
      age: Int
      posts: [Post!]!
      createdAt: String!
    }

    type Post {
      id: ID!
      title: String!
      content: String!
      author: User!
      createdAt: String!
    }

    type Query {
      users: [User!]!
      user(id: ID!): User
      posts: [Post!]!
      post(id: ID!): Post
    }

    type Mutation {
      createUser(name: String!, email: String!, age: Int): User!
      updateUser(id: ID!, name: String, email: String, age: Int): User!
      deleteUser(id: ID!): Boolean!
      createPost(title: String!, content: String!, authorId: ID!): Post!
    }
  `,
  resolvers: {
    Query: {
      users: async () => {
        return await prisma.user.findMany();
      },

      user: async (_, { id }) => {
        return await prisma.user.findUnique({
          where: { id: Number(id) },
        });
      },

      posts: async () => {
        return await prisma.post.findMany({
          include: { author: true },
        });
      },

      post: async (_, { id }) => {
        return await prisma.post.findUnique({
          where: { id: Number(id) },
          include: { author: true },
        });
      },
    },

    Mutation: {
      createUser: async (_, { name, email, age }) => {
        return await prisma.user.create({
          data: { name, email, age },
        });
      },

      updateUser: async (_, { id, name, email, age }) => {
        return await prisma.user.update({
          where: { id: Number(id) },
          data: {
            ...(name && { name }),
            ...(email && { email }),
            ...(age !== undefined && { age }),
          },
        });
      },

      deleteUser: async (_, { id }) => {
        await prisma.user.delete({
          where: { id: Number(id) },
        });
        return true;
      },

      createPost: async (_, { title, content, authorId }) => {
        return await prisma.post.create({
          data: {
            title,
            content,
            authorId: Number(authorId),
          },
          include: { author: true },
        });
      },
    },

    User: {
      posts: async (parent) => {
        return await prisma.post.findMany({
          where: { authorId: parent.id },
        });
      },
    },

    Post: {
      author: async (parent) => {
        return await prisma.user.findUnique({
          where: { id: parent.authorId },
        })!;
      },
    },
  },
});
```

### 6. 启动服务器

`src/index.ts`：

```typescript
import { createYoga } from "graphql-yoga";
import { createServer } from "http";
import { schema } from "./schema";

const yoga = createYoga({ schema });
const server = createServer(yoga);

server.listen(4000, () => {
  console.log("🚀 Server ready at http://localhost:4000/graphql");
});
```

### 7. 运行

```bash
ts-node src/index.ts
```

---

## 方案三：Hasura (零代码方案)

### 特点
- **零代码** - 自动生成 GraphQL API
- 实时订阅（WebSocket）
- 权限管理（基于角色）
- 自动关系推断
- 开箱即用的管理面板

### 1. 使用 Docker 安装

创建 `docker-compose.yml`：

```yaml
version: '3.6'
services:
  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_DATABASE: myapp_dev
      MYSQL_USER: myapp_user
      MYSQL_PASSWORD: your_password
      MYSQL_ROOT_PASSWORD: root_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  hasura:
    image: hasura/graphql-engine:latest
    ports:
      - "8080:8080"
    depends_on:
      - mysql
    restart: always
    environment:
      HASURA_GRAPHQL_DATABASE_URL: mysql://myapp_user:your_password@mysql:3306/myapp_dev
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      HASURA_GRAPHQL_DEV_MODE: "true"
      HASURA_GRAPHQL_ENABLED_LOG_TYPES: startup, http-log, webhook-log, websocket-log, query-log
      HASURA_GRAPHQL_ADMIN_SECRET: myadminsecretkey

volumes:
  mysql_data:
```

### 2. 启动服务

```bash
docker-compose up -d
```

### 3. 访问管理面板

打开 `http://localhost:8080` 并输入管理密钥 `myadminsecretkey`。

### 4. 创建表

在 Hasura Console 的 **Data** 标签页，点击 **Create Table**：

**User 表：**
- `id` - Integer (auto-increment), Primary Key
- `name` - Text
- `email` - Text, Unique
- `age` - Integer, Nullable
- `created_at` - Timestamp, Default: now()
- `updated_at` - Timestamp, Default: now()

**Post 表：**
- `id` - Integer (auto-increment), Primary Key
- `title` - Text
- `content` - Text
- `author_id` - Integer, Foreign Key → users.id
- `created_at` - Timestamp, Default: now()

### 5. 配置关系

在 **Relationships** 标签页：

**User 表：**
- 添加 **Array Relationship**: `posts` → `post.author_id -> user.id`

**Post 表：**
- 添加 **Object Relationship**: `author` → `post.author_id -> user.id`

### 6. 自动生成的 GraphQL API

Hashura 自动生成完整的 CRUD API：

```graphql
# 查询
query {
  users {
    id
    name
    email
    posts {
      id
      title
    }
  }
}

# 插入
mutation {
  insert_users_one(object: {
    name: "Alice"
    email: "alice@example.com"
    age: 25
  }) {
    id
    name
  }
}

# 更新
mutation {
  update_users_by_pk(
    pk_columns: { id: 1 }
    _set: { name: "Alice Updated" }
  ) {
    id
    name
  }
}

# 删除
mutation {
  delete_users_by_pk(id: 1) {
    id
  }
}

# 实时订阅
subscription {
  users {
    id
    name
    email
  }
}
```

### 7. 客户端集成

```typescript
import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:8080/v1/graphql',
  headers: {
    'x-hasura-admin-secret': 'myadminsecretkey',
  },
  cache: new InMemoryCache(),
});

const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
      posts {
        title
      }
    }
  }
`;

function Users() {
  const { loading, error, data } = useQuery(GET_USERS);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.users.map((user: any) => (
        <li key={user.id}>
          {user.name} - {user.posts.length} posts
        </li>
      ))}
    </ul>
  );
}
```

---

## 性能优化

### 1. 数据库索引

```sql
-- 为常查询字段添加索引
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_post_author_id ON posts(author_id);
CREATE INDEX idx_post_created_at ON posts(created_at);

-- 复合索引
CREATE INDEX idx_post_author_created ON posts(author_id, created_at);
```

### 2. DataLoader 批量查询

```typescript
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (ids: readonly number[]) => {
  const users = await prisma.user.findMany({
    where: { id: { in: [...ids] } },
  });

  const userMap = new Map(users.map(u => [u.id, u]));
  return ids.map(id => userMap.get(id)!);
});

// 在 context 中使用
const server = new ApolloServer({
  schema,
  context: () => ({
    prisma,
    loaders: {
      userLoader: userLoader,
    },
  }),
});
```

### 3. 查询优化

```typescript
// ❌ 不好 - N+1 问题
const posts = await prisma.post.findMany();
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
}

// ✅ 好 - 使用 include
const posts = await prisma.post.findMany({
  include: { author: true },
});

// ✅ 更好 - 使用 DataLoader
const posts = await prisma.post.findMany();
for (const post of posts) {
  post.author = await userLoader.load(post.authorId);
}
```

### 4. 分页

```typescript
// Offset 分页
const posts = await prisma.post.findMany({
  skip: 0,
  take: 10,
  orderBy: { createdAt: 'desc' },
});

// Cursor 分页（更高效）
const posts = await prisma.post.findMany({
  take: 10,
  cursor: { id: lastPostId },
  orderBy: { id: 'asc' },
});
```

### 5. 查询复杂度限制

```typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const server = new ApolloServer({
  schema,
  validationRules: [
    createComplexityLimitRule(1000, {
      onCost: (cost) => console.log('Query cost:', cost),
    }),
  ],
});
```

---

## 安全与最佳实践

### 1. 输入验证

```typescript
import * as yup from 'yup';

const createUserSchema = yup.object({
  name: yup.string().required().min(2).max(100),
  email: yup.string().required().email(),
  age: yup.number().min(0).max(150),
});

const resolvers = {
  Mutation: {
    createUser: async (_, args) => {
      // 验证输入
      await createUserSchema.validate(args);

      return await prisma.user.create({
        data: args,
      });
    },
  },
};
```

### 2. 认证与授权

```typescript
import jwt from 'jsonwebtoken';

const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) return { user: null };

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET!);
      return { user, prisma };
    } catch (err) {
      return { user: null };
    }
  },
});

// 受保护的 resolver
const resolvers = {
  Mutation: {
    deleteUser: async (_, { id }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      if (user.role !== 'ADMIN') throw new Error('Not authorized');

      await prisma.user.delete({ where: { id: Number(id) } });
      return true;
    },
  },
};
```

### 3. SQL 注入防护

Prisma 和 TypeORM 自动防止 SQL 注入，但如果使用原生查询：

```typescript
// ❌ 危险 - SQL 注入风险
const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// ✅ 安全 - 使用参数化查询
const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
// Prisma 会自动转义参数
```

### 4. 速率限制

```typescript
import rateLimit from 'express-rate-limit';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 请求
});

app.use('/graphql', limiter);

const server = new ApolloServer({ schema });
await server.start();
server.applyMiddleware({ app });

app.listen(4000);
```

---

## 完整示例项目

### 项目结构

```
mysql-graphql-app/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── schema/
│   │   ├── typeDefs.ts
│   │   └── resolvers.ts
│   ├── utils/
│   │   ├── auth.ts
│   │   └── validation.ts
│   └── index.ts
├── .env
├── package.json
└── tsconfig.json
```

### package.json

```json
{
  "name": "mysql-graphql-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "apollo-server": "^3.13.0",
    "graphql": "^16.8.0",
    "dataloader": "^2.2.2",
    "jsonwebtoken": "^9.0.2",
    "yup": "^1.3.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prisma": "^5.0.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.0.0"
  }
}
```

### 运行命令

```bash
# 安装依赖
npm install

# 配置数据库
npx prisma migrate dev --name init

# 生成 Prisma Client
npx prisma generate

# 启动开发服务器
npm run dev

# 打开数据库管理界面
npm run prisma:studio
```

---

## 总结

### 方案对比

| 特性 | TypeORM | Prisma | Hasura |
|------|---------|--------|--------|
| 学习曲线 | 中等 | 低 | 极低 |
| 类型安全 | ✅ | ✅✅ | ❌ |
| 自动生成 | ❌ | ✅ | ✅✅ |
| 灵活性 | ✅✅ | ✅ | ⚠️ |
| 实时订阅 | 需手动实现 | 需手动实现 | ✅ 内置 |
| 权限管理 | 需手动实现 | 需手动实现 | ✅ 内置 |
| 适用场景 | 复杂业务 | 现代全栈 | 快速原型 |

### 推荐选择

- **新项目，追求快速开发**：Prisma + GraphQL Yoga
- **需要完全控制**：Apollo Server + TypeORM
- **快速原型或后台管理**：Hasura
- **大型企业项目**：Apollo Federation + Prisma

### 下一步

1. 根据项目需求选择方案
2. 配置数据库连接
3. 定义 Schema 或 Entity
4. 实现 Resolvers
5. 添加认证授权
6. 优化性能（索引、DataLoader）
7. 部署到生产环境

祝你成功集成 MySQL + GraphQL！🚀
