import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/src/lib/prisma"

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // On initial sign in, persist provider tokens and role (if any)
      if (account) {
        // account fields may be snake_case (access_token) or camelCase (accessToken)
        token.accessToken = account.accessToken;
        token.refreshToken = account.refreshToken;
        token.provider = account.provider;
      }
      if (user && user.role) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose token fields to the client session when available.
      // When using database sessions (Prisma adapter) `token` may be undefined,
      // so guard access to avoid runtime errors.
      session.user = session.user || {};
      if (token) {
        if (token.accessToken) session.user.accessToken = token.accessToken;
        if (token.refreshToken) session.user.refreshToken = token.refreshToken;
        if (token.provider) session.user.provider = token.provider;
        if (token.role) session.user.role = token.role;
      }
      return session;
    },
  },
}
