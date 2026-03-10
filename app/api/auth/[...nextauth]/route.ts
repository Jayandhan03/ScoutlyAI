import NextAuth, { NextAuthOptions, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                try {
                    await connectToDatabase();

                    const existingUser = await User.findOne({ email: user.email });

                    if (existingUser) {
                        // Update last login time
                        await User.updateOne(
                            { email: user.email },
                            { $set: { lastLogin: new Date(), image: user.image } }
                        );
                        console.log("✅ Updated existing user:", user.email);
                    } else {
                        // Create new user
                        await User.create({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            googleId: account.providerAccountId,
                            provider: "google",
                            lastLogin: new Date(),
                        });
                        console.log("✅ Created new user:", user.email);
                    }
                } catch (error) {
                    console.error("⚠️ MongoDB error (sign-in still allowed):", error);
                    // Do NOT block sign-in on DB error — let the session form regardless
                    return true;
                }
            }
            return true;
        },
        async session({ session, token }): Promise<Session> {
            if (session.user && token.sub) {
                (session.user as { id?: string }).id = token.sub;
            }
            return session;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
    },
    pages: {
        // NOTE: Do NOT set signIn or error page overrides here.
        // Setting signIn: "/" causes all auth errors (including transient MongoDB
        // failures) to redirect to /?error=AccessDenied on the landing page.
        // NextAuth handles errors internally when no custom pages are set.
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
