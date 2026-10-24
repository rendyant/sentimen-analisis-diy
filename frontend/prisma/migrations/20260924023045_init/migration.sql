-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nip" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "opdId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Opd" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF'
);

-- CreateTable
CREATE TABLE "Ulasan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tanggal" DATETIME NOT NULL,
    "sumber" TEXT NOT NULL,
    "pengadu" TEXT,
    "isi" TEXT NOT NULL,
    "bintang" INTEGER NOT NULL,
    "sentimen" TEXT NOT NULL,
    "aspek" TEXT,
    "akurasi" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "opdId" TEXT NOT NULL,
    CONSTRAINT "Ulasan_opdId_fkey" FOREIGN KEY ("opdId") REFERENCES "Opd" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Opd_code_key" ON "Opd"("code");
