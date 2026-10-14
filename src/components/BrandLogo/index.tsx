import { View } from '@tarojs/components';
import styles from './index.module.scss';

// 木芽英语品牌 Logo（纯 CSS 绘制的芽叶，对齐高保真原型）
// size: 'sm' 品牌栏 36px / 'lg' 登录页 64px
export default function BrandLogo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <View className={`${styles.logo} ${size === 'lg' ? styles.lg : ''}`}>
      <View className={styles.leafLeft} />
      <View className={styles.leafRight} />
      <View className={styles.stem} />
    </View>
  );
}
