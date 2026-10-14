import React, { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import BrandLogo from '@/components/BrandLogo';
import { login } from '@/services/api';
import styles from './index.module.scss';

export default function LoginPage() {
  const [account, setAccount] = useState('MB2026-0128');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2400);
  };

  const handleLogin = async () => {
    if (!account.trim() || !password) {
      showToast('请输入账号和密码');
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const student = await login(account, password);
      Taro.setStorageSync('student', student);
      showToast(`登录成功，欢迎回来，${student.name}`);
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/home/index' });
      }, 400);
    } catch (e: any) {
      showToast(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={styles.container}>
      <View className={styles.logoBox}>
        <BrandLogo size="lg" />
      </View>
      <View className={styles.title}>木芽英语</View>
      <View className={styles.sub}>21 天抗遗忘复习 · 学员端</View>

      <View className={styles.card}>
        <View className={styles.row}>
          <Text className={styles.label}>账号</Text>
          <Input
            className={styles.input}
            value={account}
            placeholder="请输入账号"
            placeholderClass={styles.ph}
            onInput={(e) => setAccount(e.detail.value)}
          />
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>密码</Text>
          <Input
            className={styles.input}
            value={password}
            password
            placeholder="请输入密码"
            placeholderClass={styles.ph}
            onInput={(e) => setPassword(e.detail.value)}
          />
        </View>
        <Button className={styles.btn} onClick={handleLogin} loading={loading}>
          登 录
        </Button>
        <View className={styles.tip}>
          演示默认账号：MB2026-0128 / 123456{'\n'}账号由老师后台创建，忘记密码请联系老师重置
        </View>
      </View>

      {toastVisible && <View className={styles.toast}>{toast}</View>}
    </View>
  );
}
