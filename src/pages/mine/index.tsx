import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import BrandLogo from '@/components/BrandLogo';
import { getProfile } from '@/services/api';
import type { ProfileData, BatchProgress } from '@/types';
import styles from './index.module.scss';

export default function MinePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [slogan, setSlogan] = useState('');

  // 每次页面展示刷新（提交复习后统计/批次进度实时更新）
  useDidShow(() => {
    getProfile().then((data) => {
      setProfile(data);
      const s = data.slogans[Math.floor(Math.random() * data.slogans.length)];
      setSlogan(s);
    });
  });

  const renderDots = (batch: BatchProgress) => {
    const dots: any[] = [];
    for (let i = 0; i < batch.totalCount; i++) {
      let cls = styles.pdot;
      if (i < batch.doneCount) cls += ` ${styles.ok}`;
      else if (i === batch.doneCount) cls += ` ${styles.cur}`;
      dots.push(<View key={i} className={cls} />);
    }
    return dots;
  };

  if (!profile) {
    return <View className={styles.container} />;
  }

  const { student, periodStats, batches } = profile;

  const renderPeriod = (title: string, key: 'today' | 'week' | 'month') => {
    const stat = periodStats[key];
    return (
      <View className={styles.mperiod}>
        <View className={styles.ph}>
          <View className={styles.pd} />
          {title}
        </View>
        <View className={styles.mestats}>
          <View>
            <View className={styles.v}>{stat.wordCount}</View>
            <View className={styles.l}>复习单词数</View>
          </View>
          <View>
            <View className={styles.v}>{stat.dayCount}</View>
            <View className={styles.l}>复习天数</View>
          </View>
          <View>
            <View className={styles.vTime}>{stat.duration}</View>
            <View className={styles.l}>复习时间</View>
          </View>
          <View>
            <View className={styles.vGreen}>{stat.accuracy}%</View>
            <View className={styles.l}>平均正确率</View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.container}>
      <View className={styles.brandbar}>
        <BrandLogo />
        <View>
          <View className={styles.brandname}>木芽英语</View>
          <View className={styles.brandsub}>21 天抗遗忘复习</View>
        </View>
      </View>

      <View className={styles.mepage}>
        {/* 个人卡 */}
        <View className={styles.mecard}>
          <View className={styles.meavatar}>
            <View className={styles.avatarHead} />
            <View className={styles.avatarBody} />
          </View>
          <View>
            <View className={styles.mename}>{student.name}</View>
            <View className={styles.mecode}>账号 {student.studentCode}</View>
          </View>
        </View>

        {/* 随机复习文案 */}
        <View className={styles.meslogan}>
          <View className={styles.sloganIcon}>
            <View className={styles.sloganLeafL} />
            <View className={styles.sloganLeafR} />
            <View className={styles.sloganStem} />
          </View>
          <Text>{slogan}</Text>
        </View>

        {/* 时间维度统计 */}
        {renderPeriod('今日', 'today')}
        {renderPeriod('本周', 'week')}
        {renderPeriod('本月', 'month')}

        {/* 我的批次 */}
        <View className={styles.mesec}>
          <View className={styles.sh}>
            我的批次
            <Text className={styles.shNote}>复习点：第 1·2·3·5·7·9·12·14·17·21 天</Text>
          </View>
          {batches.map((b: BatchProgress) => (
            <View key={b.name} className={styles.mebatch}>
              <View className={styles.bt}>
                <Text>{b.name}</Text>
                <Text className={styles.bprog}>
                  {b.doneCount} / {b.totalCount} 次
                </Text>
              </View>
              <View className={styles.bd}>上课日期：{b.classDate}</View>
              <View className={styles.pdots}>{renderDots(b)}</View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
