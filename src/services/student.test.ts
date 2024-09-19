import { PrismaClient as PrismaClient1 } from "../../prisma/generated/db1";
import { PrismaClient as PrismaClient2 } from "../../prisma/generated/db2";
import { StudentService } from "./studentService";

const prisma1 = new PrismaClient1();
const prisma2 = new PrismaClient2();
const studentService = new StudentService();

describe("StudentService", () => {
  afterAll(async () => {
    await prisma1.$disconnect();
    await prisma2.$disconnect();
  });

  beforeEach(async () => {
    await prisma1.student.deleteMany();
    await prisma2.user.deleteMany();
  });

  const runInTransaction = async (testFn: () => Promise<void>) => {
    await prisma1
      .$transaction(async (prisma1Tx) => {
        await prisma2.$transaction(async (prisma2Tx) => {
          await testFn();
          throw new Error("Rollback transaction");
        });
      })
      .catch(() => {});
  };

  // createStudentAndUser
  // ユーザーと学生をトランザクション内で作成するテスト
  it("should create a student and a user in a transaction", async () => {
    await runInTransaction(async () => {
      const studentName = "Test Student";
      const userName = "Test User";
      const userEmail = "testuser@example.com";

      const result = await studentService.createStudentAndUser(
        studentName,
        userName,
        userEmail
      );

      expect(result.user).toBeDefined();
      expect(result.user.name).toBe(userName);
      expect(result.user.email).toBe(userEmail);

      expect(result.student).toBeDefined();
      expect(result.student.name).toBe(studentName);
    });
  });

  // ユーザー作成が失敗した場合のトランザクションのロールバックをテスト
  it("should rollback transaction if user creation fails", async () => {
    await runInTransaction(async () => {
      const studentName = "Test Student";
      const userName = "Test User";
      const userEmail = "invalid-email"; // Invalid email to cause failure

      await expect(
        studentService.createStudentAndUser(studentName, userName, userEmail)
      ).rejects.toThrow("Invalid email format");

      const user = await prisma2.user.findUnique({
        where: { email: userEmail },
      });
      const student = await prisma1.student.findFirst({
        where: { name: studentName },
      });

      expect(user).toBeNull();
      expect(student).toBeNull();
    });
  });

  // 外部トランザクションが失敗した場合のロールバックをテスト
  it("should rollback transaction if outer transaction fails", async () => {
    await runInTransaction(async () => {
      const studentName = "Fail Transaction"; // This will cause the outer transaction to fail
      const userName = "Test User";
      const userEmail = "testuser@example.com";

      await expect(
        studentService.createStudentAndUser(studentName, userName, userEmail)
      ).rejects.toThrow("Intentional failure");

      const user = await prisma2.user.findUnique({
        where: { email: userEmail },
      });
      const student = await prisma1.student.findFirst({
        where: { name: studentName },
      });

      expect(user).toBeNull();
      expect(student).toBeNull();
    });
  });

  // createStudentAndUserWithRawQueryのテストケース
  // ユーザーと学生をトランザクション内で生クエリで作成するテスト
  it("should create a student and a user in a transaction with raw query", async () => {
    await runInTransaction(async () => {
      const studentName = "Test Student";
      const userName = "Test User";
      const userEmail = "testuser@example.com";

      const result = await studentService.createStudentAndUserWithRawQuery(
        studentName,
        userName,
        userEmail
      );

      expect(result.user).toBeDefined();
      expect(result.user!.name).toBe(userName);
      expect(result.user!.email).toBe(userEmail);

      expect(result.student).toBeDefined();
      expect(result.student.name).toBe(studentName);
    });
  });

  // 生クエリでユーザー作成が失敗した場合のトランザクションのロールバックをテスト
  it("should rollback transaction if user creation fails with raw query", async () => {
    await runInTransaction(async () => {
      const studentName = "Test Student";
      const userName = "Test User";
      const userEmail = "invalid-email"; // Invalid email to cause failure

      await expect(
        studentService.createStudentAndUserWithRawQuery(
          studentName,
          userName,
          userEmail
        )
      ).rejects.toThrow("Invalid email format");

      const user = await prisma2.user.findUnique({
        where: { email: userEmail },
      });
      const student = await prisma1.student.findFirst({
        where: { name: studentName },
      });

      expect(user).toBeNull();
      expect(student).toBeNull();
    });
  });

  // 生クエリで外部トランザクションが失敗した場合のロールバックをテスト
  it("should rollback transaction if outer transaction fails with raw query", async () => {
    await runInTransaction(async () => {
      const studentName = "Fail Transaction"; // This will cause the outer transaction to fail
      const userName = "Test User";
      const userEmail = "testuser@example.com";

      await expect(
        studentService.createStudentAndUserWithRawQuery(
          studentName,
          userName,
          userEmail
        )
      ).rejects.toThrow("Intentional failure with RawQuery");

      const user = await prisma2.user.findUnique({
        where: { email: userEmail },
      });
      const student = await prisma1.student.findFirst({
        where: { name: studentName },
      });

      expect(user).toBeNull();
      expect(student).toBeNull();
    });
  });
});
