-- CreateTable
CREATE TABLE "salaries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payMonth" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "allowance" INTEGER NOT NULL DEFAULT 0,
    "deduction" INTEGER NOT NULL DEFAULT 0,
    "netPay" INTEGER NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "salaries_employeeId_payMonth_key" ON "salaries"("employeeId", "payMonth");

-- AddForeignKey
ALTER TABLE "salaries" ADD CONSTRAINT "salaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
