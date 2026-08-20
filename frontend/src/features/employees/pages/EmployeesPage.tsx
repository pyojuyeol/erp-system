import { useState } from 'react';
import {
  Table,
  Typography,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  App,
  Space,
  Descriptions,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  employeesApi,
  type Employee,
  type CreateEmployeePayload,
  type UpdateEmployeePayload,
} from '../api/employeesApi';
import { departmentsApi } from '../../departments/api/departmentsApi';

function extractErrorMessage(error: any): string {
  const raw = error?.response?.data?.message;
  if (!raw) return '요청에 실패했습니다.';
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'object') {
    if (typeof raw.message === 'string') return raw.message;
    if (Array.isArray(raw.message)) return raw.message.join(', ');
  }
  return '요청에 실패했습니다.';
}

export function EmployeesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: employeesApi.list,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeesApi.create(payload),
    onSuccess: () => {
      message.success('직원이 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) =>
      employeesApi.update(id, payload),
    onSuccess: () => {
      message.success('직원 정보가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditOpen(false);
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onSuccess: () => {
      message.success('직원이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => message.error(extractErrorMessage(error)),
  });

  const openDetail = (employee: Employee) => {
    setSelected(employee);
    setDetailOpen(true);
  };

  const openEdit = (employee: Employee) => {
    setSelected(employee);
    editForm.setFieldsValue({
      name: employee.user.name,
      departmentId: employee.department.id,
      position: employee.position,
      hireDate: dayjs(employee.hireDate),
    });
    setEditOpen(true);
  };

  const handleCreateSubmit = () => {
    createForm.validateFields().then((values) => {
      createMutation.mutate({ ...values, hireDate: values.hireDate.format('YYYY-MM-DD') });
    });
  };

  const handleEditSubmit = () => {
    if (!selected) return;
    editForm.validateFields().then((values) => {
      updateMutation.mutate({
        id: selected.id,
        payload: { ...values, hireDate: values.hireDate.format('YYYY-MM-DD') },
      });
    });
  };

  const columns = [
    { title: '이름', dataIndex: ['user', 'name'], key: 'name' },
    { title: '이메일', dataIndex: ['user', 'email'], key: 'email' },
    { title: '부서', dataIndex: ['department', 'name'], key: 'department' },
    { title: '직급', dataIndex: 'position', key: 'position' },
    {
      title: '입사일',
      dataIndex: 'hireDate',
      key: 'hireDate',
      render: (date: string) => <Tag color="blue">{dayjs(date).format('YYYY-MM-DD')}</Tag>,
    },
    {
      title: '작업',
      key: 'actions',
      render: (_: unknown, record: Employee) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="직원을 삭제하시겠습니까?"
            description="계정과 함께 완전히 삭제되며 되돌릴 수 없습니다."
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
          인사관리
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          직원 등록
        </Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={employees} loading={isLoading} />

      {/* 등록 모달 */}
      <Modal
        title="직원 등록"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreateSubmit}
        confirmLoading={createMutation.isPending}
        okText="등록"
        cancelText="취소"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="이름" rules={[{ required: true, message: '이름을 입력해주세요.' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="이메일"
            rules={[{ required: true, type: 'email', message: '유효한 이메일을 입력해주세요.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="초기 비밀번호"
            rules={[{ required: true, min: 8, message: '8자 이상 입력해주세요.' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="departmentId"
            label="부서"
            rules={[{ required: true, message: '부서를 선택해주세요.' }]}
          >
            <Select placeholder="부서 선택" options={departments?.map((d) => ({ label: d.name, value: d.id }))} />
          </Form.Item>
          <Form.Item name="position" label="직급" rules={[{ required: true, message: '직급을 입력해주세요.' }]}>
            <Input placeholder="예: 사원, 대리, 과장" />
          </Form.Item>
          <Form.Item name="hireDate" label="입사일" rules={[{ required: true, message: '입사일을 선택해주세요.' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 수정 모달 */}
      <Modal
        title="직원 정보 수정"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleEditSubmit}
        confirmLoading={updateMutation.isPending}
        okText="저장"
        cancelText="취소"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="이름" rules={[{ required: true, message: '이름을 입력해주세요.' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="departmentId"
            label="부서"
            rules={[{ required: true, message: '부서를 선택해주세요.' }]}
          >
            <Select placeholder="부서 선택" options={departments?.map((d) => ({ label: d.name, value: d.id }))} />
          </Form.Item>
          <Form.Item name="position" label="직급" rules={[{ required: true, message: '직급을 입력해주세요.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="hireDate" label="입사일" rules={[{ required: true, message: '입사일을 선택해주세요.' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 상세보기 모달 */}
      <Modal title="직원 상세정보" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null}>
        {selected && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="이름">{selected.user.name}</Descriptions.Item>
            <Descriptions.Item label="이메일">{selected.user.email}</Descriptions.Item>
            <Descriptions.Item label="부서">{selected.department.name}</Descriptions.Item>
            <Descriptions.Item label="직급">{selected.position}</Descriptions.Item>
            <Descriptions.Item label="입사일">
              {dayjs(selected.hireDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
