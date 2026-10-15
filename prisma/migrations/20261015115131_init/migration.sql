-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "solarStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "solarError" TEXT,
    "formattedAddress" TEXT,
    "lat" REAL,
    "lng" REAL,
    "imageryQuality" TEXT,
    "sunshineHoursPerYear" REAL,
    "roofAreaM2" REAL,
    "maxPanelCount" INTEGER,
    "co2KgPerMwh" REAL,
    "selectedPanelCount" INTEGER,
    "selectedEnergyKwh" REAL,
    "rawInsights" TEXT,
    "solarFetchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
