import { app } from "@/app";
import { env } from "@/config/env";
import { migrate } from "@/db/migrate";

migrate()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Server listening on port ${env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Migration failed", err);
    process.exit(1);
  });
