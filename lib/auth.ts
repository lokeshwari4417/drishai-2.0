import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Extend the default session/JWT types so `role` and `id` are typed
// everywhere we call getServerSession() or useSession().
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "PATIENT" | "DOCTOR" | "NGO" | "ADMIN";
    };
  }
  interface User {
    role: "PATIENT" | "DOCTOR" | "NGO" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "PATIENT" | "DOCTOR" | "NGO" | "ADMIN";
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.otp) {
          throw new Error("Email, password, and OTP are required");
        }

        const email = credentials.email.toLowerCase().trim();

        // 1. Fetch user and their role
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user) {
          throw new Error("Incorrect email or password. Please try again.");
        }

        // 2. Verify password
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Incorrect email or password. Please try again.");
        }

        // 3. Verify user block status
        if (user.isBlocked) {
          throw new Error("Your account has been suspended. Please contact administration.");
        }

        // 4. Verify OTP from database
        const activeOtp = await prisma.otp.findFirst({
          where: {
            userId: user.id,
            code: credentials.otp,
          },
        });

        if (!activeOtp || activeOtp.expiresAt < new Date()) {
          // Log failed login due to OTP
          await prisma.loginHistory.create({
            data: {
              userId: user.id,
              status: "FAILED_OTP",
              ipAddress: "127.0.0.1",
              userAgent: "Credentials Flow",
            },
          });
          throw new Error("Invalid or expired OTP. Please try again.");
        }

        // 5. Success! Clear OTP, record history and activity
        await prisma.$transaction([
          prisma.otp.deleteMany({ where: { userId: user.id } }),
          prisma.loginHistory.create({
            data: {
              userId: user.id,
              status: "SUCCESS",
              ipAddress: "127.0.0.1",
              userAgent: "Credentials Flow",
            },
          }),
          prisma.activityLog.create({
            data: {
              userId: user.id,
              action: "LOGIN",
              details: "User successfully logged in with password and OTP.",
            },
          }),
        ]);

        // Send login security email notification asynchronously
        import("@/lib/mail")
          .then(({ sendLoginNotification }) => {
            sendLoginNotification(user.email, "127.0.0.1", "Web Client");
          })
          .catch(console.error);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name as any,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // 1. Google OAuth specific logic
      if (account?.provider === "google") {
        if (!user.email) return false;

        const normalizedEmail = user.email.toLowerCase().trim();
        let dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { role: true },
        });

        // Block check
        if (dbUser && dbUser.isBlocked) {
          return false;
        }

        if (dbUser) {
          // Save login history & logs
          await prisma.$transaction([
            prisma.loginHistory.create({
              data: {
                userId: dbUser.id,
                status: "SUCCESS",
                ipAddress: "127.0.0.1",
                userAgent: "Google OAuth",
              },
            }),
            prisma.activityLog.create({
              data: {
                userId: dbUser.id,
                action: "LOGIN_GOOGLE",
                details: "User logged in using Google OAuth.",
              },
            }),
          ]);

          user.id = dbUser.id;
          (user as any).role = dbUser.role.name;
          return true;
        }

        // First login with Google: Auto-register account
        let patientRole = await prisma.role.findUnique({ where: { name: "PATIENT" } });
        if (!patientRole) {
          patientRole = await prisma.role.create({ data: { name: "PATIENT" } });
        }

        const newUser = await prisma.user.create({
          data: {
            name: user.name || "Google User",
            email: normalizedEmail,
            passwordHash: "", // OAuth users do not have a password hash
            roleId: patientRole.id,
          },
          include: { role: true },
        });

        // Patients get a linked Patient record automatically
        await prisma.patient.create({
          data: {
            name: newUser.name,
            age: 0,
            gender: "Unspecified",
            userId: newUser.id,
            createdById: newUser.id,
          },
        });

        // Send welcome email asynchronously
        import("@/lib/mail")
          .then(({ sendWelcomeEmail }) => {
            sendWelcomeEmail(newUser.email, newUser.name);
          })
          .catch(console.error);

        // Record history & log
        await prisma.$transaction([
          prisma.loginHistory.create({
            data: {
              userId: newUser.id,
              status: "SUCCESS",
              ipAddress: "127.0.0.1",
              userAgent: "Google OAuth (Registered)",
            },
          }),
          prisma.activityLog.create({
            data: {
              userId: newUser.id,
              action: "REGISTER_GOOGLE",
              details: "User account created automatically via Google OAuth Sign-in.",
            },
          }),
        ]);

        user.id = newUser.id;
        (user as any).role = newUser.role.name;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};

/** Maps each role to the dashboard it should land on after login. */
export const ROLE_HOME: Record<string, string> = {
  PATIENT: "/patient",
  DOCTOR: "/doctor",
  NGO: "/ngo",
  ADMIN: "/admin",
};