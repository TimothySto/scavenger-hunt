/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,checkpointId,type]` on the table `CheckpointConversion` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CheckpointConversion_sessionId_checkpointId_type_key" ON "CheckpointConversion"("sessionId", "checkpointId", "type");
