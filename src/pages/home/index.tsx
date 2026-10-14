import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import BrandLogo from '@/components/BrandLogo';
import { getTaskGroups } from '@/services/api';
import type { TaskGroup, TaskItem } from '@/types';
import styles from './index.module.scss';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'done', label: '已复习' },
  { key: 'todo', label: '未复习' }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('all');
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [openWrong, setOpenWrong] = useState('');

  // 每次页面展示都拉取最新列表（提交复习返回后自动刷新为 done 卡）
  useDidShow(() => {
    getTaskGroups().then(setGroups).catch(() => setGroups([]));
  });

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      tasks: g.tasks.filter((t: TaskItem) => activeTab === 'all' || t.status === activeTab)
    }))
    .filter((g) => g.tasks.length > 0);

  const handleStartReview = (planId: string) => {
    Taro.navigateTo({ url: `/pages/review/index?planId=${planId}` });
  };

  const toggleWrong = (planId: string) => {
    setOpenWrong(openWrong === planId ? '' : planId);
  };

  const renderDoneCard = (task: TaskItem) => {
    const isOpen = openWrong === task.planId;
    return (
      <View>
        <View className={styles.ct}>
          {task.batchName}（第 {task.dueDays} 天）
        </View>
        <View className={styles.cd}>上课日期：{task.classDate} · 已复习 1 次</View>
        <View className={styles.statrow}>
          <View>
            <View className={styles.v}>{task.doneCount}</View>
            <View className={styles.l}>已复习单词</View>
          </View>
          <View>
            <View className={styles.v}>{task.accuracy}%</View>
            <View className={styles.l}>正确率</View>
          </View>
          <View>
            <View className={styles.vTime}>{task.finishTime}</View>
            <View className={styles.l}>完成时间</View>
          </View>
        </View>
        <View className={styles.wrongwrap}>
          {task.wrongWords && task.wrongWords.length > 0 ? (
            <View>
              <View
                className={classnames(styles.wrongtoggle, isOpen && styles.open)}
                onClick={() => toggleWrong(task.planId)}
              >
                错误单词（{task.wrongWords.length}）
                <Text className={styles.arr}>▾</Text>
              </View>
              {isOpen && (
                <View className={styles.wronglist}>
                  {task.wrongWords.map((w) => (
                    <View key={w.spelling} className={styles.wi}>
                      <Text className={styles.wiWord}>{w.spelling}</Text>
                      <Text>{w.meaning}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className={styles.allright}>
              <View className={styles.check} />
              <Text>本次全部正确</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTodoCard = (task: TaskItem) => {
    return (
      <View className={styles.chead}>
        <View>
          <View className={styles.ct}>
            {task.batchName}（第 {task.dueDays} 天）
          </View>
          <View className={styles.cd}>
            上课日期：{task.classDate} · 待复习 {task.wordCount} 词
          </View>
        </View>
        <Button
          className={styles.btnSm}
          onClick={() => handleStartReview(task.planId)}
        >
          开始复习
        </Button>
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

      <View className={styles.tabs}>
        {TABS.map((t) => (
          <View
            key={t.key}
            className={classnames(styles.t, activeTab === t.key && styles.on)}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </View>
        ))}
      </View>

      {visibleGroups.map((g: TaskGroup) => (
        <View key={g.date} className={styles.daygroup}>
          <View className={styles.daytitle}>
            {g.date}
            <Text className={styles.wd}>
              {g.weekday}
              {g.label ? ` · ${g.label}` : ''}
            </Text>
          </View>
          {g.tasks.map((task: TaskItem) => (
            <View key={task.planId} className={styles.card}>
              {task.status === 'done' ? renderDoneCard(task) : renderTodoCard(task)}
            </View>
          ))}
        </View>
      ))}

      <View className={styles.listend}>— 今天没有更多复习了 —</View>
    </View>
  );
}
