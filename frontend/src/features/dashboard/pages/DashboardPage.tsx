import { Card, Col, Row, Statistic, Typography, Spin } from 'antd';
import {
  TeamOutlined,
  ApartmentOutlined,
  DollarOutlined,
  InboxOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';

const formatKRW = (v: number) => `${v.toLocaleString('ko-KR')}원`;

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.summary,
  });

  if (isLoading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Typography.Title level={3}>대시보드</Typography.Title>
      <Typography.Text type="secondary">{data.month} 기준</Typography.Text>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="전체 직원 수" value={data.employeeCount} suffix="명" prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="부서 수" value={data.departmentCount} suffix="개" prefix={<ApartmentOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="오늘 출근 인원"
              value={data.todayAttendanceCount}
              suffix="명"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="이번 달 수입"
              value={data.monthlyIncome}
              formatter={(v) => formatKRW(Number(v))}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="이번 달 지출"
              value={data.monthlyExpense}
              formatter={(v) => formatKRW(Number(v))}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="이번 달 수지 잔액"
              value={data.monthlyBalance}
              formatter={(v) => formatKRW(Number(v))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: data.monthlyBalance >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="이번 달 급여 지급 총액"
              value={data.monthlySalaryTotal}
              formatter={(v) => formatKRW(Number(v))}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="전체 품목 수" value={data.itemCount} suffix="종" prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="재고 부족 품목 (10개 미만)"
              value={data.lowStockCount}
              suffix="종"
              prefix={<WarningOutlined />}
              valueStyle={{ color: data.lowStockCount > 0 ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="대기 중인 휴가 신청" value={data.pendingLeaves} suffix="건" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
