import { Button, Card, Form, Input, Typography, App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, type LoginPayload } from '../api/authApi';
import { useAuthStore } from '../../../store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { message } = App.useApp();

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      navigate('/');
    },
    onError: () => {
      message.error('로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.');
    },
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 360 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          ERP System
        </Typography.Title>
        <Form layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item
            name="email"
            label="이메일"
            rules={[{ required: true, message: '이메일을 입력해주세요.' }]}
          >
            <Input placeholder="you@company.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="비밀번호"
            rules={[{ required: true, message: '비밀번호를 입력해주세요.' }]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={mutation.isPending}>
            로그인
          </Button>
        </Form>
      </Card>
    </div>
  );
}
