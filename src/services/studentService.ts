import { PrismaClient as PrismaClient1 } from "../../prisma/generated/db1";
import { PrismaClient as PrismaClient2 } from "../../prisma/generated/db2";

const prisma1 = new PrismaClient1();
const prisma2 = new PrismaClient2();

export class StudentService {
  async createStudentAndUser(
    studentName: string,
    userName: string,
    userEmail: string
  ) {
    // メールアドレスの簡単なバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error("Invalid email format");
    }

    return prisma1.$transaction(async (prisma1Tx) => {
      const user = await prisma2.user.create({
        data: {
          name: userName,
          email: userEmail,
        },
      });

      const student = await prisma1Tx.student.create({
        data: {
          name: studentName,
        },
      });

      // 外側のトランザクションで意図的にエラーをスロー
      if (studentName === "Fail Transaction") {
        throw new Error("Intentional failure");
      }

      return {
        student: { name: studentName },
        user: { name: userName, email: userEmail },
      };
    });
  }
  async createStudentAndUserWithRawQuery(
    studentName: string,
    userName: string,
    userEmail: string
  ) {
    // メールアドレスの簡単なバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      throw new Error("Invalid email format");
    }

    return prisma1
      .$transaction(async (prisma1Tx) => {
        await prisma2.$executeRaw`
        INSERT INTO User (name, email, createdAt, updatedAt) VALUES (${userName}, ${userEmail}, NOW(), NOW());
      `;

        const user = await prisma2.$queryRaw<{ name: string; email: string }[]>`
        SELECT * FROM User WHERE email = ${userEmail};
      `;

        await prisma1Tx.$executeRaw`
        INSERT INTO Student (name, createdAt, updatedAt) VALUES (${studentName}, NOW(), NOW());
      `;

        const student = await prisma1Tx.$queryRaw<{ name: string }[]>`
        SELECT * FROM Student WHERE name = ${studentName};
      `;

        // 外側のトランザクションで意図的にエラーをスロー
        if (studentName === "Fail Transaction") {
          throw new Error("Intentional failure");
        }

        return {
          student: student[0] as { name: string },
          user: user[0] as { name: string; email: string },
        };
      })
      .catch((error) => {
        // トランザクションがロールバックされることを確認
        console.error("Transaction failed: ", error);
        throw error;
      });
  }
}
