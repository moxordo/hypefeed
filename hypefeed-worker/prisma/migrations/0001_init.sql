-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "youtube_url" TEXT NOT NULL,
    "rss_feed_url" TEXT NOT NULL,
    "subscribers" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "posting_frequency" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_EVALUATION',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_fetched_at" DATETIME,
    "last_success_at" DATETIME,
    "monthly_views" INTEGER,
    "avg_engagement" REAL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fetch_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel_id" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "item_count" INTEGER,
    "error" TEXT,
    "fetched_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_handle_key" ON "channels"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "channels_channel_id_key" ON "channels"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE INDEX "fetch_logs_channel_id_idx" ON "fetch_logs"("channel_id");
