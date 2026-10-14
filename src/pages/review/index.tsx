import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { getQuiz, getRetryQuiz, submitSession } from '@/services/api';
import { isWeapp } from '@/services/cloud';
import type { QuizQuestion } from '@/types';
import styles from './index.module.scss';

interface AnswerRecord {
  wordId: string
  isCorrect: boolean
  isRetried: boolean
}

export default function ReviewPage() {
  const [planId] = useState<string>(
    () => (Taro.getCurrentInstance().router?.params?.planId as string) || 'plan-4'
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  // 首次作答结果（PRD 10.2：正确率 = 首次答对数 ÷ 总题数；重做不影响首次口径）
  const [firstOk, setFirstOk] = useState<(boolean | null)[]>([]);
  const [locked, setLocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFb, setShowFb] = useState(false); // 答错反馈卡
  const [retryUsed, setRetryUsed] = useState(false); // 本题已重做过
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState('');
  const [ttsFallback, setTtsFallback] = useState(false);
  const t0Ref = useRef(0);
  const answersRef = useRef<AnswerRecord[]>([]);
  const submittedRef = useRef(false); // 每场（原题）只提交一次；重做错题不再重复提交

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  const loadQuiz = (list: QuizQuestion[]) => {
    setQuestions(list);
    setResults(Array(list.length).fill(null));
    setFirstOk(Array(list.length).fill(null));
    setQIdx(0);
    setLocked(false);
    setSelectedId(null);
    setShowFb(false);
    setRetryUsed(false);
    setShowModal(false);
    setTtsFallback(false);
    answersRef.current = [];
    submittedRef.current = false;
    t0Ref.current = Date.now();
  };

  useEffect(() => {
    getQuiz(planId).then(loadQuiz).catch(() => showToast('题组加载失败'));
  }, [planId]);

  const q = questions[qIdx];
  // 完成弹窗口径：成功数/错误数/正确率均按「首次作答」（PRD 10.2）
  const firstOkCount = firstOk.filter((r) => r === true).length;
  const successCount = firstOkCount;
  const wrongCount = results.length - firstOkCount;
  const accRate = Math.round((firstOkCount / (results.length || 1)) * 100);

  /* ---------- 语音 ---------- */
  // manual=true 表示用户主动点击播放：仅在手动场景才提示失败
  // （自动播放可能被浏览器策略拦截，此时静默降级为显示音标，不打扰用户）
  const failTTS = (manual = false) => {
    setTtsFallback(true);
    if (manual) showToast('发音播放失败，已显示音标');
  };

  const speak = (manual = false) => {
    if (!q) return;
    // 联调预留：后端 TTS 生成的 audioUrl 优先播放
    const audioUrl = (q.word as any).audioUrl;
    if (audioUrl) {
      try {
        const audio = Taro.createInnerAudioContext();
        audio.src = audioUrl;
        audio.play();
        return;
      } catch (e) {
        /* 降级 */
      }
    }
    if (!isWeapp) {
      const synth = (window as any).speechSynthesis;
      if (!synth) {
        failTTS(manual);
        return;
      }
      try {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(q.word.spelling);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        let started = false;
        utterance.onstart = () => {
          started = true;
        };
        utterance.onerror = () => {
          if (!started) failTTS(manual);
        };
        // 兜底：1.5s 内既未开始播放、也不在播放/等待队列中，才判定为失败
        // （播放本身成功时不再误报：已播完的 speaking=false 不算失败）
        const timer = setTimeout(() => {
          if (!started && !synth.speaking && !synth.pending) failTTS(manual);
        }, 1500);
        utterance.onend = () => clearTimeout(timer);
        synth.speak(utterance);
        return;
      } catch (e) {
        failTTS(manual);
      }
    }
    failTTS(manual);
  };

  const speakRef = useRef<(manual?: boolean) => void>(() => {});
  useEffect(() => {
    speakRef.current = speak;
  });

  // 进入「听音选词」题时自动播放发音，无需手动点击
  useEffect(() => {
    if (!q || q.type !== 'typeA') return;
    const timer = setTimeout(() => speakRef.current(), 350);
    return () => clearTimeout(timer);
  }, [q]);

  /* ---------- 作答 ---------- */
  const pick = (option: any) => {
    if (locked || !q) return;
    setLocked(true);
    setSelectedId(option.id);
    const isCorrect = option.isCorrect;
    const newResults = [...results];
    newResults[qIdx] = isCorrect;
    setResults(newResults);
    // 记录首次作答结果（重做时保持不变）
    if (!retryUsed) {
      const nextFirst = [...firstOk];
      nextFirst[qIdx] = isCorrect;
      setFirstOk(nextFirst);
    }
    answersRef.current.push({
      wordId: q.word.id,
      isCorrect,
      isRetried: retryUsed
    });
    if (isCorrect) {
      setTimeout(nextQ, 650);
    } else {
      setShowFb(true);
    }
  };

  const redoQ = () => {
    if (!q) return;
    // 选项重新随机排列
    const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
    setQuestions((prev) =>
      prev.map((item, i) => (i === qIdx ? { ...item, options: shuffledOptions } : item))
    );
    const newResults = [...results];
    newResults[qIdx] = null;
    setResults(newResults);
    setRetryUsed(true);
    setLocked(false);
    setSelectedId(null);
    setShowFb(false);
    setTtsFallback(false);
  };

  const nextQ = () => {
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
      setLocked(false);
      setSelectedId(null);
      setShowFb(false);
      setRetryUsed(false);
      setTtsFallback(false);
    } else {
      finish();
    }
  };

  /* ---------- 完成 ---------- */
  const finish = () => {
    const sec = Math.round((Date.now() - t0Ref.current) / 1000);
    // 原题完成才提交；「重做错题」为加练，不重复提交同一 plan（后台防重复提交）
    if (!submittedRef.current) {
      submittedRef.current = true;
      submitSession({
        planId,
        studentId: (Taro.getStorageSync('student') as any)?.id || 'stu-001',
        totalSeconds: sec,
        answers: answersRef.current
      }).catch(() => showToast('成绩提交失败，请稍后重试'));
    }
    setShowModal(true);
  };

  const retryWrong = async () => {
    const wrongIds = questions.filter((_, i) => results[i] === false).map((x) => x.id);
    const list = await getRetryQuiz(wrongIds);
    loadQuiz(list);
  };

  const viewWrong = () => {
    const wrongList = questions.filter((_, i) => results[i] === false);
    Taro.setStorageSync('wrongQuiz', wrongList);
    Taro.navigateTo({ url: '/pages/result/index' });
  };

  const backToList = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  /* ---------- 渲染 ---------- */
  const renderOptionClass = (opt: any) => {
    if (!locked) return '';
    if (opt.isCorrect) return styles.right;
    if (opt.id === selectedId) return styles.wrongpick;
    return styles.dim;
  };

  return (
    <View className={styles.container}>
      <View className={styles.quiztop}>
        <View className={styles.back} onClick={backToList}>
          ‹
        </View>
        <View className={styles.prog}>
          第 <Text className={styles.progB}>{qIdx + 1}</Text> / {questions.length} 题
        </View>
      </View>

      <View className={styles.dots}>
        {questions.map((_, i) => (
          <View
            key={i}
            className={classnames(
              styles.dot,
              results[i] === true && styles.ok,
              results[i] === false && styles.bad,
              results[i] === null && i === qIdx && styles.cur
            )}
          />
        ))}
      </View>

      {q && q.type === 'typeB' && (
        <View className={styles.stageword}>
          <View className={styles.word}>{q.word.spelling}</View>
          <View className={styles.phonetic}>{q.word.phonetic}</View>
        </View>
      )}

      {q && q.type === 'typeA' && (
        <View>
          <View className={styles.speakbtn} onClick={() => speak(true)}>
            <View className={styles.speakIcon} />
            <View className={styles.speakLbl}>点击播放</View>
          </View>
          <View className={styles.hintcn}>
            {q.word.meaning}；
            {ttsFallback && (
              <Text className={styles.phoneticInline}>（{q.word.phonetic}）</Text>
            )}
          </View>
          <View className={styles.hinttip}>听发音，选出对应的单词</View>
        </View>
      )}

      {q && (
        <View className={styles.opts}>
          {q.options.map((opt, idx) => (
            <Button
              key={idx}
              className={classnames(styles.opt, renderOptionClass(opt))}
              onClick={() => pick(opt)}
            >
              {q.type === 'typeA' ? opt.spelling : opt.meaning}
            </Button>
          ))}
        </View>
      )}

      {q && showFb && locked && (
        <View className={styles.fb}>
          <View className={styles.fbTitle}>答错了</View>
          <View className={styles.fbRow}>
            <Text className={styles.fbWord}>{q.word.spelling}</Text>
            <Text className={styles.fbInfo}>
              {q.word.phonetic}　{q.word.meaning}
            </Text>
          </View>
          <View className={styles.fbBtns}>
            {!retryUsed ? (
              <>
                <Button className={styles.redo} onClick={redoQ}>
                  重做本题
                </Button>
                <Button className={styles.next} onClick={nextQ}>
                  下一题
                </Button>
              </>
            ) : (
              <Button className={styles.nextOnly} onClick={nextQ}>
                下一题
              </Button>
            )}
          </View>
        </View>
      )}

      {/* 完成弹窗 */}
      {showModal && (
        <View className={styles.mask}>
          <View className={styles.modal}>
            <View className={styles.cele}>
              <View className={styles.celeIcon} />
            </View>
            <View className={styles.modalTitle}>已完成</View>
            <View className={styles.modalSub}>小芽又长高了一点，明天记得回来</View>
            <View className={styles.mstats}>
              <View>
                <View className={classnames(styles.mv, styles.good)}>{successCount}</View>
                <View className={styles.ml}>成功数</View>
              </View>
              <View>
                <View className={classnames(styles.mv, styles.bad)}>{wrongCount}</View>
                <View className={styles.ml}>错误数</View>
              </View>
              <View>
                <View className={styles.mv}>{accRate}%</View>
                <View className={styles.ml}>正确率</View>
              </View>
              <View>
                <View className={styles.mv}>
                  {Math.round((Date.now() - t0Ref.current) / 1000)}s
                </View>
                <View className={styles.ml}>总用时</View>
              </View>
            </View>
            {wrongCount > 0 && (
              <View className={styles.mbtns}>
                <Button className={styles.b2} onClick={retryWrong}>
                  重做错题
                </Button>
                <Button className={styles.b2} onClick={viewWrong}>
                  查看错题
                </Button>
              </View>
            )}
            <Button className={styles.mdone} onClick={backToList}>
              确定
            </Button>
          </View>
        </View>
      )}

      {toast && <View className={styles.toast}>{toast}</View>}
    </View>
  );
}
