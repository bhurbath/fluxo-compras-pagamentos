import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { Prisma } from "@prisma/client";
import { getDb } from "@/lib/db";

// Single source of truth for the tenant: the issuer is derived from it
// (rather than the other way around) so nothing downstream — like the
// Microsoft Graph email sender, which needs a concrete tenant, never
// "common"/"organizations" — can end up depending on however the issuer
// happens to be phrased.
const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: tenantId && `https://login.microsoftonline.com/${tenantId}/v2.0`,
      // Without this, Entra silently reuses whatever Microsoft account
      // already has an active session in the browser instead of asking —
      // so a second person (or a "sign in as someone else" test) on a
      // browser already signed into Entra can't reach the account picker.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, profile }) {
      const idEntra = (profile?.oid as string | undefined) ?? profile?.sub;
      if (!user.email || !idEntra) return false;

      try {
        await getDb().usuario.upsert({
          where: { idEntra },
          update: {
            email: user.email,
            ...(user.name ? { nome: user.name } : {}),
          },
          create: {
            idEntra,
            email: user.email,
            nome: user.name ?? user.email,
          },
        });
      } catch (error) {
        const isEmailConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";
        if (!isEmailConflict) throw error;

        // idEntra didn't match any row (so we tried to create one), but the
        // email already belongs to a different row — most likely the same
        // person's Entra account was recreated (new oid) with the same
        // corporate email. Treat it as the same person and repoint that
        // row at the new idEntra instead of failing the login. flagFinanceiro
        // is deliberately reset, not carried over: we can't actually verify
        // this is the same person (Entra email reuse after offboarding would
        // hit this same path), so admin rights have to be re-granted
        // explicitly rather than silently following an email match.
        await getDb().usuario.update({
          where: { email: user.email },
          data: {
            idEntra,
            flagFinanceiro: false,
            ...(user.name ? { nome: user.name } : {}),
          },
        });
      }

      return true;
    },
    // Runs on initial sign-in (when `profile` is present) and caches the
    // Usuario id on the token, keyed on the stable idEntra — not on email,
    // which can change without the session being refreshed. `session()`
    // then just reads it back, with no DB call on every request.
    async jwt({ token, profile }) {
      const idEntra = (profile?.oid as string | undefined) ?? profile?.sub;
      if (idEntra) {
        const usuario = await getDb().usuario.findUnique({ where: { idEntra } });
        if (usuario) token.usuarioId = usuario.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.usuarioId === "string") {
        session.user.id = token.usuarioId;
      }
      return session;
    },
  },
});
