-- Manual SQL for AI tables (PostgreSQL)
CREATE TABLE IF NOT EXISTS "MarketPriceCache" (
    "ProductKey" varchar(255) PRIMARY KEY,
    "MinPrice" numeric(15,2) NOT NULL,
    "AvgPrice" numeric(15,2) NOT NULL,
    "MaxPrice" numeric(15,2) NOT NULL,
    "SourcesJson" text NULL,
    "LastUpdated" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AIAnalysisLog" (
    "LogId" bigserial PRIMARY KEY,
    "Type" varchar(50) NULL,
    "RequestJson" text NULL,
    "ResponseJson" text NULL,
    "UserId" varchar(100) NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ManualReviewQueue" (
    "QueueId" bigserial PRIMARY KEY,
    "ListingId" bigint NULL,
    "Reason" varchar(255) NULL,
    "Status" varchar(50) NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
);
