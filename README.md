# Prisma での分散トランザクションの検証

## 概要

このプロジェクトは、Prismaを使用して複数のデータベーススキーマを利用している際に分散トランザクションできるか、検証のため作成したものです。

## 環境設定

### 必要なツール

- Node.js
- Docker
- Prisma CLI

### インストール

1. 依存関係のインストール:
    ```bash
    npm install
    ```

2. `.env`ファイルを作成し、以下の環境変数を設定

    ```
      DATABASE_URL_1=your_database_url_1
      DATABASE_URL_2=your_database_url_2
    ```

3. Dockerコンテナの起動:
    ```bash
    docker-compose up -d
    ```

4. PrismaのスキーマからPrisma Client生成、DBコンテナへ反映:
    ```bash
    npx prisma generate --schema=./prisma/db1.prisma
    npx prisma generate --schema=./prisma/db2.prisma
    npx prisma migrate dev --schema=./prisma/db1.prisma
    npx prisma migrate dev --schema=./prisma/db2.prisma
    ```

## 使用方法

### 学生とユーザーの作成

`/src/services/studentService.ts`ファイルには、学生とユーザーを作成するための2つのメソッドが含まれています。

#### `createStudentAndUser`

このメソッドは、トランザクションを使用して学生とユーザーを作成します。


#### `createStudentAndUserWithRawQuery`

このメソッドは、生のSQLクエリを使用して学生とユーザーを作成します。

## スクリプト

### テスト

`/src/services/student.test.ts`Jest で分散トランザクション検証用のテストを作成しています。
以下コマンドでテスト実行します

```bash
  npx jest
```

## 現状検証の結果

Prisma + MySQL の組み合わせで複数のDBスキーマを使用した分散トランザクションは困難。<br>
参考: https://zenn.dev/cohky/articles/prisma-rls-ops<br>
確認できる限りでは生クエリであれば、各DBはロールバックできそう。
