ALTER TABLE "Tool" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Tool_projectId_enabled_idx" ON "Tool"("projectId", "enabled");
