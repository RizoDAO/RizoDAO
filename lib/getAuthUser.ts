import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Returns the user of the current NextAuth session, or null if there is none.
 * Always use this instead of trusting an email or id sent by the client.
 */
export async function getAuthUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}
