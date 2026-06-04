import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(ent.name)) {
      let c = fs.readFileSync(p, "utf8");
      const n = c
        .replace(/@prisma\/client/g, "@/lib/types/database")
        .replace(/@\/lib\/auth\/sync-prisma-user/g, "@/lib/auth/sync-user")
        .replace(/upsertPrismaUserFromAuth/g, "upsertUserFromAuthUser")
        .replace(/findPrismaUserByEmail/g, "findUserByEmailAddress")
        .replace(/findPrismaUserByAuthUserId/g, "findUserByAuthUserId");
      if (n !== c) fs.writeFileSync(p, n);
    }
  }
}

walk(root);
console.log("import replacements done");
