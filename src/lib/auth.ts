import { AuthOptions, getServerSession } from "next-auth";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";

import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as GoogleProfile;
        const googleId = googleProfile.sub;

        const databaseUser = await prisma.user.findUnique({
          where: {
            email: googleProfile.email,
          },
        });

        if (!databaseUser) {
          return "/unregistered";
        }

        await prisma.user.update({
          where: {
            id: databaseUser.id,
          },
          data: {
            googleId,
          },
        });

        return true;
      }

      return false;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          googleId: token.googleId,
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        const databaseUser = await prisma.user.findUnique({
          where: {
            googleId: user.id,
          },
        });

        if (!databaseUser) {
          return token;
        }

        token = {
          ...token,
          id: databaseUser.id,
          name: databaseUser.name,
          googleId: user.id,
        };
      }
      return token;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies AuthOptions;

export default authOptions;

export async function withAuth(allowUnregistered = false) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`${process.env.BASE_URL}/login`);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user && !allowUnregistered) {
    redirect(`${process.env.BASE_URL}/unregistered`);
  }

  return user;
}
