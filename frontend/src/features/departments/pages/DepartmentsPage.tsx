import { useState } from 'react';
import { Table, Typography, Button, Modal, Form, Input, App, Space, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, type Department, type DepartmentPayload } from '../api/departmentsApi';

function extractErrorMessage(error: any): string {
  const raw = error?.response?.data?.message;
  if (!raw) return '요청에 실패했습니다.';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join(', ');
  return '요청에 실패했습니다.';
}

export function DepartmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (payload: DepartmentPayload) => departmentsApi.create(payload),
    onSuccess: () => {
      message.success('부서가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DepartmentPayload }) =>
      departmentsApi.update(id, payload),
    onSuccess: () => {
      message.success('부서 정보가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditOpen(false);
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentsApi.remove(id),
    onSuccess: () => {
      message.success('부서가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const openEdit = (dept: Department) => {
    setSelected(dept);
    editForm.setFieldsValue({ name: dept.name });
    setEditOpen(true);
  };

  const handleCreateSubmit = () => {
    createForm.validateFields().then((values) => createMutation.mutate(values));
  };

  const handleEditSubmit = () => {
    if (!selected) return;
    editForm.validateFields().then((values) => {
      updateMutation.mutate({ id: selected.id, payload: values });
    });
  };

  const columns = [
    { title: '부서명', dataIndex: 'name', key: 'name' },
    {
      title: '소속 직원 수',
      key: 'employeeCount',
      render: (_: unknown, record: Department) => (
        <Tag color={record._count?.employees ? 'blue' : 'default'}>
          {record._count?.employees ?? 0}명
        </Tag>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: Department) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="부서를 삭제하시겠습니까?"
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
          부서관리
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          부서 등록
        </Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={departments} loading={isLoading} />

      <Modal
        title="부서 등록"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreateSubmit}
        confirmLoading={createMutation.isPending}
        okText="등록"
        cancelText="취소"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="부서명" rules={[{ required: true, message: '부서명을 입력해주세요.' }]}>
            <Input placeholder="예: 개발팀" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="부서 수정"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleEditSubmit}
        confirmLoading={updateMutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="부서명" rules={[{ required: true, message: '부서명을 입력해주세요.' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
