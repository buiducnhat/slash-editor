import { tmpdir } from "node:os";
import { join } from "node:path";

/** Where `/api/upload` keeps files. Server-only; see the route for the production swap. */
export const UPLOAD_DIR = join(tmpdir(), "slash-editor-starter-uploads");
