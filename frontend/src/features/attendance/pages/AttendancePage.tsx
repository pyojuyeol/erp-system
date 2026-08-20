import { useState } from 'react';
import {
  Table,
  Typography,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  App,
  Space,
  Tabs,
  Tag,
  Card,
  Row,
  Col,
  Popconfirm,
} from 'antd';
import { PlusOutlined, LoginOutlined, LogoutOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { attendanceApi, type Attendance } from '../api/attendanceApi';
import { leavesApi, type Leave, type CreateLeavePayload } from '../api/leavesApi';
import { useAuthStore } from '../../../store/authStore';

function extractErrorMessage(error: any): string {
  const raw = error?.response?.data?.message;
  if (!raw) return '요청에 실패했습니다.';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join(', ');
  return '요청에 실패했습니다.';
}

const LEAVE_TYPE_LABEL: Record<string, string> = {
  ANNUAL: '연차',
  HALF_DAY: '반차',
  SICK: '병가',
  OTHER: '기타',
};

const LEAVE_STATUS_TAG: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: '대기중' },
  APPROVED: { color: 'green', label: '승인됨' },
  REJECTED: { color: 'red', label: '반려됨' },
};

function MyAttendanceTab() {
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: records } = useQuery<Attendance[]>({
    queryKey: ['attendance-me'],
    queryFn: () => attendanceApi.me(),
  });

  const { data: myLeaves, isLoading: leavesLoading } = useQuery<Leave[]>({
    queryKey: ['leaves-me'],
    queryFn: leavesApi.mine,
  });

  const today = dayjs().format('YYYY-MM-DD');
  const todayRecord = records?.find((r) => dayjs(r.workDate).format('YYYY-MM-DD') === today);

  const checkInMutation = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: () => {
      message.success('출근 체크되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['attendance-me'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => {
      message.success('퇴근 체크되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['attendance-me'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const createLeaveMutation = useMutation({
    mutationFn: (payload: CreateLeavePayload) => leavesApi.create(payload),
    onSuccess: () => {
      message.success('휴가가 신청되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['leaves-me'] });
      setLeaveOpen(false);
      form.resetFields();
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const cancelLeaveMutation = useMutation({
    mutationFn: (id: string) => leavesApi.remove(id),
    onSuccess: () => {
      message.success('휴가 신청이 취소되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['leaves-me'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const attendanceColumns = [
    {
      title: '날짜',
      dataIndex: 'workDate',
      key: 'workDate',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD (ddd)'),
    },
    {
      title: '출근',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm:ss') : '-'),
    },
    {
      title: '퇴근',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm:ss') : '-'),
    },
  ];

  const leaveColumns = [
    { title: '종류', dataIndex: 'type', key: 'type', render: (v: string) => LEAVE_TYPE_LABEL[v] },
    {
      title: '기간',
      key: 'period',
      render: (_: unknown, record: Leave) =>
        `${dayjs(record.startDate).format('YYYY-MM-DD')} ~ ${dayjs(record.endDate).format('YYYY-MM-DD')}`,
    },
    { title: '사유', dataIndex: 'reason', key: 'reason' },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={LEAVE_STATUS_TAG[v].color}>{LEAVE_STATUS_TAG[v].label}</Tag>,
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: Leave) =>
        record.status === 'PENDING' ? (
          <Popconfirm
            title="휴가 신청을 취소하시겠습니까?"
            okText="취소"
            cancelText="닫기"
            onConfirm={() => cancelLeaveMutation.mutate(record.id)}
          >
            <Button size="small" danger>
              신청 취소
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text type="secondary">오늘 ({today})</Typography.Text>
              <Space>
                <Button
                  type="primary"
                  icon={<LoginOutlined />}
                  disabled={!!todayRecord?.checkIn}
                  loading={checkInMutation.isPending}
                  onClick={() => checkInMutation.mutate()}
                >
                  출근 체크
                </Button>
                <Button
                  icon={<LogoutOutlined />}
                  disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut}
                  loading={checkOutMutation.isPending}
                  onClick={() => checkOutMutation.mutate()}
                >
                  퇴근 체크
                </Button>
              </Space>
              {todayRecord && (
                <Typography.Text type="secondary">
                  출근: {todayRecord.checkIn ? dayjs(todayRecord.checkIn).format('HH:mm:ss') : '-'} / 퇴근:{' '}
                  {todayRecord.checkOut ? dayjs(todayRecord.checkOut).format('HH:mm:ss') : '-'}
                </Typography.Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Typography.Title level={5}>최근 출퇴근 기록</Typography.Title>
      <Table rowKey="id" columns={attendanceColumns} dataSource={records} size="small" pagination={{ pageSize: 5 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 16px' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          내 휴가 신청 내역
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setLeaveOpen(true)}>
          휴가 신청
        </Button>
      </div>
      <Table rowKey="id" columns={leaveColumns} dataSource={myLeaves} loading={leavesLoading} size="small" />

      <Modal
        title="휴가 신청"
        open={leaveOpen}
        onCancel={() => setLeaveOpen(false)}
        onOk={() =>
          form.validateFields().then((v) =>
            createLeaveMutation.mutate({
              ...v,
              startDate: v.range[0].format('YYYY-MM-DD'),
              endDate: v.range[1].format('YYYY-MM-DD'),
              range: undefined,
            }),
          )
        }
        confirmLoading={createLeaveMutation.isPending}
        okText="신청"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="종류" rules={[{ required: true, message: '휴가 종류를 선택해주세요.' }]}>
            <Select
              options={Object.entries(LEAVE_TYPE_LABEL).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="range" label="기간" rules={[{ required: true, message: '기간을 선택해주세요.' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="사유">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function AdminAttendanceTab() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: allAttendance, isLoading: attLoading } = useQuery<Attendance[]>({
    queryKey: ['attendance-all'],
    queryFn: () => attendanceApi.all(),
  });

  const { data: allLeaves, isLoading: leavesLoading } = useQuery<Leave[]>({
    queryKey: ['leaves-all'],
    queryFn: () => leavesApi.all(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => leavesApi.approve(id),
    onSuccess: () => {
      message.success('휴가가 승인되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['leaves-all'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => leavesApi.reject(id),
    onSuccess: () => {
      message.success('휴가가 반려되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['leaves-all'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const attendanceColumns = [
    { title: '이름', dataIndex: ['employee', 'user', 'name'], key: 'name' },
    { title: '부서', dataIndex: ['employee', 'department', 'name'], key: 'department' },
    {
      title: '날짜',
      dataIndex: 'workDate',
      key: 'workDate',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '출근',
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm:ss') : '-'),
    },
    {
      title: '퇴근',
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (v: string | null) => (v ? dayjs(v).format('HH:mm:ss') : '-'),
    },
  ];

  const leaveColumns = [
    { title: '이름', dataIndex: ['employee', 'user', 'name'], key: 'name' },
    { title: '부서', dataIndex: ['employee', 'department', 'name'], key: 'department' },
    { title: '종류', dataIndex: 'type', key: 'type', render: (v: string) => LEAVE_TYPE_LABEL[v] },
    {
      title: '기간',
      key: 'period',
      render: (_: unknown, record: Leave) =>
        `${dayjs(record.startDate).format('YYYY-MM-DD')} ~ ${dayjs(record.endDate).format('YYYY-MM-DD')}`,
    },
    { title: '사유', dataIndex: 'reason', key: 'reason' },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={LEAVE_STATUS_TAG[v].color}>{LEAVE_STATUS_TAG[v].label}</Tag>,
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: Leave) =>
        record.status === 'PENDING' ? (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => approveMutation.mutate(record.id)}
            >
              승인
            </Button>
            <Button size="small" danger icon={<CloseOutlined />} onClick={() => rejectMutation.mutate(record.id)}>
              반려
            </Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <Typography.Title level={5}>휴가 신청 현황</Typography.Title>
      <Table rowKey="id" columns={leaveColumns} dataSource={allLeaves} loading={leavesLoading} style={{ marginBottom: 32 }} />

      <Typography.Title level={5}>전체 출퇴근 기록</Typography.Title>
      <Table rowKey="id" columns={attendanceColumns} dataSource={allAttendance} loading={attLoading} />
    </div>
  );
}

export function AttendancePage() {
  const role = useAuthStore((s) => s.user?.role);
  const isManager = role === 'ADMIN' || role === 'MANAGER';

  return (
    <div>
      <Typography.Title level={3}>근태관리</Typography.Title>
      <Tabs
        items={[
          { key: 'mine', label: '내 근태', children: <MyAttendanceTab /> },
          ...(isManager
            ? [{ key: 'admin', label: '근태 현황 (관리자)', children: <AdminAttendanceTab /> }]
            : []),
        ]}
      />
    </div>
  );
}
