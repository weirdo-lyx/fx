import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { QuizQuestion } from '@/types';
import styles from './index.module.scss';

export default function ResultPage() {
  const [wrongList] = useState<QuizQuestion[]>(
    () => (Taro.getStorageSync('wrongQuiz') as QuizQuestion[]) || []
  );

  const backToList = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  return (
    <View className={styles.container}>
      <View className={styles.quiztop}>
        <View className={styles.back} onClick={backToList}>
          ‹
        </View>
        <View className={styles.prog}>
          <Text className={styles.progB}>本场错题</Text>
        </View>
      </View>

      <View className={styles.wpage}>
        {wrongList.length > 0 ? (
          wrongList.map((item) => (
            <View key={item.id} className={styles.wcard}>
              <View className={styles.wrow}>
                <Text className={styles.w}>{item.word.spelling}</Text>
                <Text className={styles.ph}>{item.word.phonetic}</Text>
                <Text className={styles.tag}>答错</Text>
              </View>
              <View className={styles.mm}>{item.word.meaning}</View>
            </View>
          ))
        ) : (
          <View className={styles.empty}>
            <View className={styles.emptyTitle}>本场没有错题</View>
            <View className={styles.emptySub}>全部答对，继续保持</View>
          </View>
        )}
      </View>
    </View>
  );
}
