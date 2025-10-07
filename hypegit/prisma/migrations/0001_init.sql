-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT,
    "html_url" TEXT NOT NULL,
    "stars_count" INTEGER NOT NULL,
    "forks_count" INTEGER NOT NULL,
    "created_at" TEXT NOT NULL,
    "updated_at" TEXT NOT NULL,
    "last_commit_at" TEXT,
    "first_seen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT 1,
    "is_archived" BOOLEAN NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "StarSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repo_id" TEXT NOT NULL,
    "stars_count" INTEGER NOT NULL,
    "forks_count" INTEGER NOT NULL,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StarSnapshot_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrendingCapture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repo_id" TEXT NOT NULL,
    "time_range" TEXT NOT NULL,
    "language" TEXT,
    "rank" INTEGER NOT NULL,
    "stars_today" INTEGER,
    "captured_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshot_url" TEXT,
    CONSTRAINT "TrendingCapture_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT
);

-- CreateTable
CREATE TABLE "RepositoryTopic" (
    "repo_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,

    PRIMARY KEY ("repo_id", "topic_id"),
    CONSTRAINT "RepositoryTopic_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RepositoryTopic_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StarSnapshot_repo_id_captured_at_idx" ON "StarSnapshot"("repo_id", "captured_at");

-- CreateIndex
CREATE INDEX "TrendingCapture_repo_id_captured_at_idx" ON "TrendingCapture"("repo_id", "captured_at");

-- CreateIndex
CREATE INDEX "TrendingCapture_time_range_language_captured_at_idx" ON "TrendingCapture"("time_range", "language", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_name_key" ON "Topic"("name");
