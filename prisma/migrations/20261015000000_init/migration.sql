-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "solarStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "solarError" TEXT,
    "formattedAddress" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "imageryQuality" TEXT,
    "sunshineHoursPerYear" DOUBLE PRECISION,
    "roofAreaM2" DOUBLE PRECISION,
    "maxPanelCount" INTEGER,
    "co2KgPerMwh" DOUBLE PRECISION,
    "selectedPanelCount" INTEGER,
    "selectedEnergyKwh" DOUBLE PRECISION,
    "rawInsights" TEXT,
    "solarFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

