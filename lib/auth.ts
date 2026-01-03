import GoogleProvider from "next-auth/providers/google";

export const authOptions: any = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/my", // Custom sign-in page (we'll handle it in /my)
  },
  callbacks: {
    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());
        if (session.user.email && adminEmails.includes(session.user.email)) {
          session.user.isAdmin = true;
        }
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt"
  }
};
