import { useState } from 'react';
import {
  Table,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  App,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Card,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  accountingApi,
  type AccountingEntry,
  type CreateEntryPayload,
  type UpdateEntryPayload,
} from '../api/accountingApi';

function extractErrorMessage(error: any): string {
  const raw = error?.response?.data?.message;
  if (!raw) return '요청에 실패했습니다.';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join(', ');
  return '요청에 실패했습니다.';
}

function toSingleString(value: unknown): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

const formatKRW = (v: number) => `${v.toLocaleString('ko-KR')}원`;

const CATEGORY_OPTIONS: Record<'INCOME' | 'EXPENSE', string[]> = {
  INCOME: ['매출', '이자수익', '기타수입'],
  EXPENSE: ['인건비', '임대료', '재료비', '마케팅비', '기타지출'],
};

function buildCategoryOptions(type: 'INCOME' | 'EXPENSE', currentValue?: string) {
  const base = CATEGORY_OPTIONS[type] ?? [];
  const list = currentValue && !base.includes(currentValue) ? [currentValue, ...base] : base;
  return list.map((c) => ({ label: c, value: c }));
}

export function AccountingPage() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<AccountingEntry | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const month = selectedMonth.format('YYYY-MM');

  const { data: entries, isLoading } = useQuery<AccountingEntry[]>({
    queryKey: ['accounting-entries', month],
    queryFn: () => accountingApi.list(month),
  });

  const { data: summary } = useQuery({
    queryKey: ['accounting-summary', month],
    queryFn: () => accountingApi.summary(month),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateEntryPayload) => accountingApi.create(payload),
    onSuccess: () => {
      message.success('전표가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEntryPayload }) =>
      accountingApi.update(id, payload),
    onSuccess: () => {
      message.success('전표가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
      setEditOpen(false);
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountingApi.remove(id),
    onSuccess: () => {
      message.success('전표가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['accounting-entries'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const openEdit = (entry: AccountingEntry) => {
    setSelected(entry);
    editForm.setFieldsValue({
      category: entry.category,
      amount: entry.amount,
      memo: entry.memo,
    });
    setEditOpen(true);
  };

  const entryType = Form.useWatch('type', createForm);

  const columns = [
    {
      title: '일자',
      dataIndex: 'entryDate',
      key: 'entryDate',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '구분',
      dataIndex: 'type',
      key: 'type',
      render: (v: 'INCOME' | 'EXPENSE') => (
        <Tag color={v === 'INCOME' ? 'blue' : 'volcano'}>{v === 'INCOME' ? '수입' : '지출'}</Tag>
      ),
    },
    { title: '카테고리', dataIndex: 'category', key: 'category' },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number, record: AccountingEntry) => (
        <b style={{ color: record.type === 'INCOME' ? '#1677ff' : '#fa541c' }}>
          {record.type === 'INCOME' ? '+' : '-'}
          {formatKRW(v)}
        </b>
      ),
    },
    { title: '메모', dataIndex: 'memo', key: 'memo' },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: AccountingEntry) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="전표를 삭제하시겠습니까?"
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
          회계관리
        </Typography.Title>
        <Space>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(v) => v && setSelectedMonth(v)}
            allowClear={false}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            전표 등록
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="이번 달 수입" value={summary?.income ?? 0} suffix="원" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="이번 달 지출" value={summary?.expense ?? 0} suffix="원" valueStyle={{ color: '#fa541c' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="수지 잔액"
              value={summary?.balance ?? 0}
              suffix="원"
              valueStyle={{ color: (summary?.balance ?? 0) >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Table rowKey="id" columns={columns} dataSource={entries} loading={isLoading} />

      <Modal
        title={`전표 등록 (${month})`}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() =>
          createForm.validateFields().then((v) =>
            createMutation.mutate({
              ...v,
              category: toSingleString(v.category),
              entryDate: v.entryDate.format('YYYY-MM-DD'),
            }),
          )
        }
        confirmLoading={createMutation.isPending}
        okText="등록"
        cancelText="취소"
      >
        <Form form={createForm} layout="vertical" initialValues={{ type: 'EXPENSE' }}>
          <Form.Item name="type" label="구분" rules={[{ required: true }]}>
            <Select
              options={[
                { label: '수입', value: 'INCOME' },
                { label: '지출', value: 'EXPENSE' },
              ]}
              onChange={() => createForm.setFieldValue('category', undefined)}
            />
          </Form.Item>
          <Form.Item
            name="category"
            label="카테고리"
            rules={[
              {
                validator: (_, value) =>
                  toSingleString(value).trim().length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('카테고리를 선택하거나 입력해주세요.')),
              },
            ]}
          >
            <Select
              placeholder="카테고리 선택 (목록에 없으면 직접 입력 후 Enter)"
              mode="tags"
              maxCount={1}
              options={buildCategoryOptions((entryType as 'INCOME' | 'EXPENSE') ?? 'EXPENSE')}
            />
          </Form.Item>
          <Form.Item name="amount" label="금액" rules={[{ required: true, message: '금액을 입력해주세요.' }]}>
            <InputNumber style={{ width: '100%' }} min={1} step={1000} />
          </Form.Item>
          <Form.Item name="entryDate" label="일자" rules={[{ required: true, message: '일자를 선택해주세요.' }]} initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="memo" label="메모">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="전표 수정"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => {
          if (!selected) return;
          editForm.validateFields().then((v) =>
            updateMutation.mutate({
              id: selected.id,
              payload: { ...v, category: toSingleString(v.category) },
            }),
          );
        }}
        confirmLoading={updateMutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="category"
            label="카테고리"
            rules={[
              {
                validator: (_, value) =>
                  toSingleString(value).trim().length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('카테고리를 선택하거나 입력해주세요.')),
              },
            ]}
          >
            <Select
              placeholder="카테고리 선택 (목록에 없으면 직접 입력 후 Enter)"
              mode="tags"
              maxCount={1}
              options={buildCategoryOptions(selected?.type ?? 'EXPENSE', selected?.category)}
            />
          </Form.Item>
          <Form.Item name="amount" label="금액" rules={[{ required: true, message: '금액을 입력해주세요.' }]}>
            <InputNumber style={{ width: '100%' }} min={1} step={1000} />
          </Form.Item>
          <Form.Item name="memo" label="메모">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
