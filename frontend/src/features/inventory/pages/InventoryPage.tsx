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
  App,
  Space,
  Tabs,
  Tag,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SwapOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { itemsApi, type Item, type CreateItemPayload, type UpdateItemPayload } from '../api/itemsApi';
import {
  inventoryApi,
  type InventoryTransaction,
  type CreateTransactionPayload,
} from '../api/inventoryApi';

function extractErrorMessage(error: any): string {
  const raw = error?.response?.data?.message;
  if (!raw) return '요청에 실패했습니다.';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join(', ');
  return '요청에 실패했습니다.';
}

function ItemsTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: items, isLoading } = useQuery<Item[]>({ queryKey: ['items'], queryFn: itemsApi.list });

  const createMutation = useMutation({
    mutationFn: (payload: CreateItemPayload) => itemsApi.create(payload),
    onSuccess: () => {
      message.success('품목이 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateItemPayload }) =>
      itemsApi.update(id, payload),
    onSuccess: () => {
      message.success('품목 정보가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setEditOpen(false);
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itemsApi.remove(id),
    onSuccess: () => {
      message.success('품목이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const openEdit = (item: Item) => {
    setSelected(item);
    editForm.setFieldsValue({ name: item.name, unit: item.unit, price: item.price });
    setEditOpen(true);
  };

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: '품목명', dataIndex: 'name', key: 'name' },
    { title: '단위', dataIndex: 'unit', key: 'unit' },
    {
      title: '현재 재고',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (v: number, record: Item) => (
        <Tag color={v > 0 ? 'green' : 'red'}>
          {v} {record.unit}
        </Tag>
      ),
    },
    {
      title: '단가',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => `${v.toLocaleString('ko-KR')}원`,
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: Item) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="품목을 삭제하시겠습니까?"
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          품목 등록
        </Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={items} loading={isLoading} />

      <Modal
        title="품목 등록"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.validateFields().then((v) => createMutation.mutate(v))}
        confirmLoading={createMutation.isPending}
        okText="등록"
        cancelText="취소"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'SKU를 입력해주세요.' }]}>
            <Input placeholder="예: ITM-001" />
          </Form.Item>
          <Form.Item name="name" label="품목명" rules={[{ required: true, message: '품목명을 입력해주세요.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="단위" rules={[{ required: true, message: '단위를 입력해주세요.' }]}>
            <Input placeholder="예: EA, box, kg" />
          </Form.Item>
          <Form.Item name="price" label="단가" initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="품목 수정"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => {
          if (!selected) return;
          editForm.validateFields().then((v) => updateMutation.mutate({ id: selected.id, payload: v }));
        }}
        confirmLoading={updateMutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="품목명" rules={[{ required: true, message: '품목명을 입력해주세요.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="단위" rules={[{ required: true, message: '단위를 입력해주세요.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="단가">
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function TransactionsTab() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: transactions, isLoading } = useQuery<InventoryTransaction[]>({
    queryKey: ['inventory-transactions'],
    queryFn: inventoryApi.list,
  });

  const { data: items } = useQuery<Item[]>({ queryKey: ['items'], queryFn: itemsApi.list });

  const createMutation = useMutation({
    mutationFn: (payload: CreateTransactionPayload) => inventoryApi.create(payload),
    onSuccess: () => {
      message.success('입출고가 처리되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setOpen(false);
      form.resetFields();
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const columns = [
    {
      title: '일시',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: 'SKU', dataIndex: ['item', 'sku'], key: 'sku' },
    { title: '품목명', dataIndex: ['item', 'name'], key: 'name' },
    {
      title: '구분',
      dataIndex: 'type',
      key: 'type',
      render: (v: 'IN' | 'OUT') => (
        <Tag color={v === 'IN' ? 'blue' : 'orange'}>{v === 'IN' ? '입고' : '출고'}</Tag>
      ),
    },
    { title: '수량', dataIndex: 'quantity', key: 'quantity' },
    { title: '메모', dataIndex: 'memo', key: 'memo' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<SwapOutlined />} onClick={() => setOpen(true)}>
          입출고 등록
        </Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={transactions} loading={isLoading} />

      <Modal
        title="입출고 등록"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then((v) => createMutation.mutate(v))}
        confirmLoading={createMutation.isPending}
        okText="등록"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="itemId" label="품목" rules={[{ required: true, message: '품목을 선택해주세요.' }]}>
            <Select
              placeholder="품목 선택"
              showSearch
              optionFilterProp="label"
              options={items?.map((i) => ({
                label: `${i.name} (현재: ${i.quantity}${i.unit})`,
                value: i.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="type" label="구분" rules={[{ required: true, message: '구분을 선택해주세요.' }]}>
            <Select
              options={[
                { label: '입고', value: 'IN' },
                { label: '출고', value: 'OUT' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="수량"
            rules={[{ required: true, message: '수량을 입력해주세요.' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="memo" label="메모">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export function InventoryPage() {
  return (
    <div>
      <Typography.Title level={3}>재고관리</Typography.Title>
      <Tabs
        items={[
          { key: 'items', label: '품목 관리', children: <ItemsTab /> },
          { key: 'transactions', label: '입출고 이력', children: <TransactionsTab /> },
        ]}
      />
    </div>
  );
}
