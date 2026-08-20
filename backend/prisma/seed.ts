import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. 관리자 계정
  await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: { email: 'admin@erp.com', passwordHash, name: '관리자', role: 'ADMIN' },
  });

  // 2. 부서
  const departmentNames = ['인사팀', '개발팀', '영업팀', '재무팀', '마케팅팀'];
  const departments: Record<string, string> = {};
  for (const name of departmentNames) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    departments[name] = dept.id;
  }

  // 3. 직원 (User + Employee)
  const employeeSeeds = [
    { name: '김민준', email: 'minjun.kim@erp.com', dept: '개발팀', position: '과장', hireDaysAgo: 800 },
    { name: '이서연', email: 'seoyeon.lee@erp.com', dept: '개발팀', position: '대리', hireDaysAgo: 500 },
    { name: '박도윤', email: 'doyoon.park@erp.com', dept: '개발팀', position: '사원', hireDaysAgo: 120 },
    { name: '최지우', email: 'jiwoo.choi@erp.com', dept: '영업팀', position: '차장', hireDaysAgo: 1200 },
    { name: '정하윤', email: 'hayoon.jung@erp.com', dept: '영업팀', position: '대리', hireDaysAgo: 400 },
    { name: '강주원', email: 'juwon.kang@erp.com', dept: '영업팀', position: '사원', hireDaysAgo: 60 },
    { name: '조서준', email: 'seojun.jo@erp.com', dept: '인사팀', position: '과장', hireDaysAgo: 900 },
    { name: '윤지호', email: 'jiho.yoon@erp.com', dept: '인사팀', position: '사원', hireDaysAgo: 200 },
    { name: '임채원', email: 'chaewon.lim@erp.com', dept: '재무팀', position: '차장', hireDaysAgo: 1500 },
    { name: '한동현', email: 'donghyun.han@erp.com', dept: '재무팀', position: '대리', hireDaysAgo: 350 },
    { name: '송지아', email: 'jia.song@erp.com', dept: '마케팅팀', position: '과장', hireDaysAgo: 700 },
    { name: '오태양', email: 'taeyang.oh@erp.com', dept: '마케팅팀', position: '사원', hireDaysAgo: 90 },
  ];

  const employeeIds: { id: string; name: string; dept: string }[] = [];

  for (const e of employeeSeeds) {
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: { email: e.email, passwordHash, name: e.name, role: 'EMPLOYEE' },
    });

    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        departmentId: departments[e.dept],
        position: e.position,
        hireDate: daysAgo(e.hireDaysAgo),
      },
    });

    employeeIds.push({ id: employee.id, name: e.name, dept: e.dept });
  }

  // 4. 급여 (최근 3개월치)
  const baseSalaryByPosition: Record<string, number> = {
    사원: 2800000,
    대리: 3400000,
    과장: 4200000,
    차장: 5000000,
  };

  for (const e of employeeSeeds) {
    const employee = employeeIds.find((x) => x.name === e.name)!;
    for (let m = 0; m < 3; m++) {
      const payMonth = monthsAgo(m);
      const base = baseSalaryByPosition[e.position] ?? 3000000;
      const allowance = 200000 + Math.floor(Math.random() * 3) * 50000;
      const deduction = Math.floor(base * 0.09);
      await prisma.salary.upsert({
        where: { employeeId_payMonth: { employeeId: employee.id, payMonth } },
        update: {},
        create: {
          employeeId: employee.id,
          payMonth,
          baseSalary: base,
          allowance,
          deduction,
          netPay: base + allowance - deduction,
        },
      });
    }
  }

  // 5. 재고 품목 + 입출고
  const itemSeeds = [
    { sku: 'ITM-001', name: '노트북', unit: 'EA', price: 1500000 },
    { sku: 'ITM-002', name: '모니터', unit: 'EA', price: 300000 },
    { sku: 'ITM-003', name: 'A4 용지', unit: 'box', price: 25000 },
    { sku: 'ITM-004', name: '사무용 의자', unit: 'EA', price: 180000 },
    { sku: 'ITM-005', name: '키보드', unit: 'EA', price: 45000 },
    { sku: 'ITM-006', name: '마우스', unit: 'EA', price: 25000 },
    { sku: 'ITM-007', name: '프린터 토너', unit: 'EA', price: 80000 },
    { sku: 'ITM-008', name: '화이트보드 마카', unit: 'box', price: 15000 },
  ];

  const items: Record<string, string> = {};
  for (const i of itemSeeds) {
    const item = await prisma.item.upsert({
      where: { sku: i.sku },
      update: {},
      create: { sku: i.sku, name: i.name, unit: i.unit, price: i.price, quantity: 0 },
    });
    items[i.sku] = item.id;
  }

  const transactionSeeds: { sku: string; type: 'IN' | 'OUT'; qty: number; memo: string; daysAgo: number }[] = [
    { sku: 'ITM-001', type: 'IN', qty: 30, memo: '분기 초 대량 입고', daysAgo: 60 },
    { sku: 'ITM-001', type: 'OUT', qty: 12, memo: '신규 입사자 지급', daysAgo: 20 },
    { sku: 'ITM-002', type: 'IN', qty: 40, memo: '분기 초 대량 입고', daysAgo: 60 },
    { sku: 'ITM-002', type: 'OUT', qty: 15, memo: '부서 배치', daysAgo: 15 },
    { sku: 'ITM-003', type: 'IN', qty: 100, memo: '정기 발주', daysAgo: 30 },
    { sku: 'ITM-003', type: 'OUT', qty: 85, memo: '각 부서 배포', daysAgo: 5 },
    { sku: 'ITM-004', type: 'IN', qty: 20, memo: '사무실 확장', daysAgo: 90 },
    { sku: 'ITM-004', type: 'OUT', qty: 12, memo: '신규 좌석 배치', daysAgo: 40 },
    { sku: 'ITM-005', type: 'IN', qty: 50, memo: '정기 발주', daysAgo: 45 },
    { sku: 'ITM-005', type: 'OUT', qty: 44, memo: '개인 지급', daysAgo: 10 },
    { sku: 'ITM-006', type: 'IN', qty: 50, memo: '정기 발주', daysAgo: 45 },
    { sku: 'ITM-006', type: 'OUT', qty: 43, memo: '개인 지급', daysAgo: 10 },
    { sku: 'ITM-007', type: 'IN', qty: 15, memo: '정기 발주', daysAgo: 25 },
    { sku: 'ITM-007', type: 'OUT', qty: 9, memo: '프린터 유지보수', daysAgo: 3 },
    { sku: 'ITM-008', type: 'IN', qty: 30, memo: '정기 발주', daysAgo: 25 },
    { sku: 'ITM-008', type: 'OUT', qty: 22, memo: '회의실 비치', daysAgo: 7 },
  ];

  for (const t of transactionSeeds) {
    const itemId = items[t.sku];
    const createdAt = daysAgo(t.daysAgo);
    await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: { itemId, type: t.type, quantity: t.qty, memo: t.memo, createdAt },
      }),
      prisma.item.update({
        where: { id: itemId },
        data: { quantity: { [t.type === 'IN' ? 'increment' : 'decrement']: t.qty } },
      }),
    ]);
  }

  // 6. 회계 전표 (최근 3개월)
  const accountingSeeds: { type: 'INCOME' | 'EXPENSE'; category: string; amount: number; daysAgo: number; memo: string }[] = [
    { type: 'INCOME', category: '매출', amount: 85000000, daysAgo: 5, memo: '3월 정기 매출' },
    { type: 'INCOME', category: '매출', amount: 62000000, daysAgo: 35, memo: '2월 정기 매출' },
    { type: 'INCOME', category: '매출', amount: 71000000, daysAgo: 65, memo: '1월 정기 매출' },
    { type: 'INCOME', category: '이자수익', amount: 450000, daysAgo: 20, memo: '예금 이자' },
    { type: 'EXPENSE', category: '인건비', amount: 38000000, daysAgo: 5, memo: '3월 급여 지급' },
    { type: 'EXPENSE', category: '인건비', amount: 37500000, daysAgo: 35, memo: '2월 급여 지급' },
    { type: 'EXPENSE', category: '임대료', amount: 5500000, daysAgo: 2, memo: '3월 사무실 임대료' },
    { type: 'EXPENSE', category: '임대료', amount: 5500000, daysAgo: 32, memo: '2월 사무실 임대료' },
    { type: 'EXPENSE', category: '재료비', amount: 4200000, daysAgo: 15, memo: '사무용품 구매' },
    { type: 'EXPENSE', category: '마케팅비', amount: 6800000, daysAgo: 10, memo: '온라인 광고비' },
    { type: 'EXPENSE', category: '마케팅비', amount: 3200000, daysAgo: 40, memo: 'SNS 프로모션' },
    { type: 'EXPENSE', category: '기타지출', amount: 1200000, daysAgo: 8, memo: '경조사비' },
  ];

  for (const a of accountingSeeds) {
    await prisma.accountingEntry.create({
      data: {
        type: a.type,
        category: a.category,
        amount: a.amount,
        entryDate: daysAgo(a.daysAgo),
        memo: a.memo,
      },
    });
  }

  // 7. 출퇴근 기록 (최근 14일, 평일 위주, 가끔 결근/지각 느낌)
  for (const emp of employeeIds) {
    for (let d = 1; d <= 14; d++) {
      const workDate = daysAgo(d);
      const dayOfWeek = workDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // 주말 제외

      // 10% 확률로 결근(기록 없음)
      if (Math.random() < 0.1) continue;

      const checkInHour = 8 + Math.floor(Math.random() * 2); // 8~9시
      const checkInMinute = Math.floor(Math.random() * 60);
      const checkIn = new Date(workDate);
      checkIn.setHours(checkInHour, checkInMinute, 0, 0);

      const checkOutHour = 18 + Math.floor(Math.random() * 2); // 18~19시
      const checkOut = new Date(workDate);
      checkOut.setHours(checkOutHour, Math.floor(Math.random() * 60), 0, 0);

      await prisma.attendance.upsert({
        where: { employeeId_workDate: { employeeId: emp.id, workDate } },
        update: {},
        create: { employeeId: emp.id, workDate, checkIn, checkOut },
      });
    }
  }

  // 8. 휴가 신청 (다양한 상태)
  const leaveSeeds = [
    { empIndex: 0, type: 'ANNUAL', startDaysAgo: -10, endDaysAgo: -8, status: 'APPROVED', reason: '가족 여행' },
    { empIndex: 1, type: 'SICK', startDaysAgo: -3, endDaysAgo: -3, status: 'APPROVED', reason: '병원 진료' },
    { empIndex: 3, type: 'HALF_DAY', startDaysAgo: -5, endDaysAgo: -5, status: 'PENDING', reason: '개인 사정' },
    { empIndex: 5, type: 'ANNUAL', startDaysAgo: -15, endDaysAgo: -12, status: 'REJECTED', reason: '연차 소진 예정' },
    { empIndex: 7, type: 'ANNUAL', startDaysAgo: -20, endDaysAgo: -18, status: 'PENDING', reason: '휴식' },
    { empIndex: 9, type: 'OTHER', startDaysAgo: -7, endDaysAgo: -7, status: 'APPROVED', reason: '경조사' },
  ] as const;

  function futureOrPastDays(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
  }

  for (const l of leaveSeeds) {
    const emp = employeeIds[l.empIndex];
    const existing = await prisma.leave.findFirst({ where: { employeeId: emp.id, reason: l.reason } });
    if (existing) continue;

    await prisma.leave.create({
      data: {
        employeeId: emp.id,
        type: l.type,
        startDate: futureOrPastDays(l.startDaysAgo),
        endDate: futureOrPastDays(l.endDaysAgo),
        status: l.status,
        reason: l.reason,
      },
    });
  }

  console.log('✅ 더미데이터 시드 완료');
  console.log(`- 부서: ${departmentNames.length}개`);
  console.log(`- 직원: ${employeeIds.length}명`);
  console.log(`- 품목: ${itemSeeds.length}종`);
  console.log(`- 회계 전표: ${accountingSeeds.length}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
