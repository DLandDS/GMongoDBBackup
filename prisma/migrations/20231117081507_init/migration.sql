-- CreateTable
CREATE TABLE "Server" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 30,
    "lastBackup" DATETIME NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "gdriveDirId" TEXT
);
