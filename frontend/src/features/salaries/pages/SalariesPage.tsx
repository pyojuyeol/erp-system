import { useMemo, useState } from 'react';
import {
  Table,
  Typography,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Input,
  App,
  Space,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  salariesApi,
  type Salary,
  type CreateSalaryPayload,
  type UpdateSalaryPayload,
} from '../api/salariesApi';
import { employeesApi } from '../../employees/api/employeesApi';

function extractErrorMessage(error: any): string {
  const raw = error?.response?.data?.message;
  if (!raw) return '요청에 실패했습니다.';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join(', ');
  return '요청에 실패했습니다.';
}

const formatKRW = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export function SalariesPage() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Salary | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const payMonth = selectedMonth.format('YYYY-MM');

  const { data: salaries, isLoading } = useQuery<Salary[]>({
    queryKey: ['salaries', payMonth],
    queryFn: () => salariesApi.list(payMonth),
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesApi.list,
  });

  const totalNetPay = useMemo(
    () => (salaries ?? []).reduce((sum, s) => sum + s.netPay, 0),
    [salaries],
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateSalaryPayload) => salariesApi.create(payload),
    onSuccess: () => {
      message.success('급여가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSalaryPayload }) =>
      salariesApi.update(id, payload),
    onSuccess: () => {
      message.success('급여 정보가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      setEditOpen(false);
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => salariesApi.remove(id),
    onSuccess: () => {
      message.success('급여 내역이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const openEdit = (salary: Salary) => {
    setSelected(salary);
    editForm.setFieldsValue({
      baseSalary: salary.baseSalary,
      allowance: salary.allowance,
      deduction: salary.deduction,
      memo: salary.memo,
    });
    setEditOpen(true);
  };

  const handleCreateSubmit = () => {
    createForm.validateFields().then((values) => {
      createMutation.mutate({ ...values, payMonth });
    });
  };

  const handleEditSubmit = () => {
    if (!selected) return;
    editForm.validateFields().then((values) => {
      updateMutation.mutate({ id: selected.id, payload: values });
    });
  };

  // 등록/수정 모달에서 실시간 순지급액 미리보기
  const CreateNetPayPreview = () => {
    const base = Form.useWatch('baseSalary', createForm) ?? 0;
    const allowance = Form.useWatch('allowance', createForm) ?? 0;
    const deduction = Form.useWatch('deduction', createForm) ?? 0;
    return <Statistic title="예상 순지급액" value={base + allowance - deduction} suffix="원" />;
  };

  const EditNetPayPreview = () => {
    const base = Form.useWatch('baseSalary', editForm) ?? 0;
    const allowance = Form.useWatch('allowance', editForm) ?? 0;
    const deduction = Form.useWatch('deduction', editForm) ?? 0;
    return <Statistic title="예상 순지급액" value={base + allowance - deduction} suffix="원" />;
  };

  const columns = [
    { title: '이름', dataIndex: ['employee', 'user', 'name'], key: 'name' },
    { title: '부서', dataIndex: ['employee', 'department', 'name'], key: 'department' },
    { title: '직급', dataIndex: ['employee', 'position'], key: 'position' },
    {
      title: '기본급',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: formatKRW,
    },
    { title: '수당', dataIndex: 'allowance', key: 'allowance', render: formatKRW },
    { title: '공제', dataIndex: 'deduction', key: 'deduction', render: formatKRW },
    {
      title: '실지급액',
      dataIndex: 'netPay',
      key: 'netPay',
      render: (v: number) => <b>{formatKRW(v)}</b>,
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: Salary) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="급여 내역을 삭제하시겠습니까?"
            okText="삭제"
            cancelText="취소"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          급여관리
        </Typography.Title>
        <Space>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(v) => v && setSelectedMonth(v)}
            allowClear={false}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            급여 등록
          </Button>
        </Space>
      </div>

      <Row style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Statistic title={`${payMonth} 총 지급액`} value={totalNetPay} suffix="원" />
        </Col>
      </Row>

      <Table rowKey="id" columns={columns} dataSource={salaries} loading={isLoading} />

      <Modal
        title={`급여 등록 (${payMonth})`}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreateSubmit}
        confirmLoading={createMutation.isPending}
        okText="등록"
        cancelText="취소"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="employeeId"
            label="직원"
            rules={[{ required: true, message: '직원을 선택해주세요.' }]}
          >
            <Select
              placeholder="직원 선택"
              showSearch
              optionFilterProp="label"
              options={employees?.map((e) => ({
                label: `${e.user.name} (${e.department.name})`,
                value: e.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="baseSalary"
            label="기본급"
            rules={[{ required: true, message: '기본급을 입력해주세요.' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={10000} />
          </Form.Item>
          <Form.Item name="allowance" label="수당" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} step={10000} />
          </Form.Item>
          <Form.Item name="deduction" label="공제액" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} step={10000} />
          </Form.Item>
          <Form.Item name="memo" label="메모">
            <Input.TextArea rows={2} />
          </Form.Item>
          <CreateNetPayPreview />
        </Form>
      </Modal>

      <Modal
        title="급여 수정"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleEditSubmit}
        confirmLoading={updateMutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="baseSalary"
            label="기본급"
            rules={[{ required: true, message: '기본급을 입력해주세요.' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={10000} />
          </Form.Item>
          <Form.Item name="allowance" label="수당">
            <InputNumber style={{ width: '100%' }} min={0} step={10000} />
          </Form.Item>
          <Form.Item name="deduction" label="공제액">
            <InputNumber style={{ width: '100%' }} min={0} step={10000} />
          </Form.Item>
          <Form.Item name="memo" label="메모">
            <Input.TextArea rows={2} />
          </Form.Item>
          <EditNetPayPreview />
        </Form>
      </Modal>
    </div>
  );
}
