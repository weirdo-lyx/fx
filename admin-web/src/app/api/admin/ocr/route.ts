import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 真实场景下，前端传过来的 FormData 在这里接收
    // const formData = await request.formData();
    // const file = formData.get('file') as File;
    
    // 目前处于演示阶段，使用 Mock 数据模拟识别结果
    const mockSet1 = [
      { spelling: 'ashamed', phonetic: '/əˈʃeɪmd/', meaning: 'adj. 羞愧的；惭愧的', confidence: 98 },
      { spelling: 'act', phonetic: '/ækt/', meaning: 'v. 行动；表现；演戏 n. 行动；装模作样；(戏) 幕；法令', confidence: 96 },
      { spelling: 'another', phonetic: '/əˈnʌðə(r)/', meaning: 'adj. 又一个的；另一个的 pron. 又一；另一；不同的(一个)', confidence: 99 },
      { spelling: 'fair', phonetic: '/feə(r)/', meaning: 'adj. 公平的；合理的；相当大的 n. 交易会；展销会；集市', confidence: 95 },
      { spelling: 'block', phonetic: '/blɒk/', meaning: 'n. 块；街区；大楼；大厦；障碍物 v. 阻塞；阻碍', confidence: 97 },
      { spelling: 'artificial', phonetic: '/ˌɑːtɪˈfɪʃl/', meaning: 'adj. 人造的；人工的；假的', confidence: 92 },
      { spelling: 'hook', phonetic: '/hʊk/', meaning: 'n. 钩；挂钩 v. 钩住', confidence: 94 },
      { spelling: 'condition', phonetic: '/kənˈdɪʃn/', meaning: 'n. 状态；条件；环境 v. 使适应；影响；保养', confidence: 91 },
      { spelling: 'blow sb away', phonetic: '/bləʊ sʌmbədi əˈweɪ/', meaning: '使某人非常惊讶或高兴', confidence: 88 },
      { spelling: 'lend', phonetic: '/lend/', meaning: 'v. 借给；借出；贷(款)', confidence: 96 },
      // 故意放入几个低置信度的错词，演示校对功能
      { spelling: 'appale', phonetic: '/ˈæpl/', meaning: 'n. 苹果', confidence: 72 },
      { spelling: 'brav', phonetic: '/breɪv/', meaning: 'adj. 勇敢的', confidence: 81 },
    ];

    const mockSet2 = [
      { spelling: 'printer', phonetic: '/ˈprɪntə(r)/', meaning: 'n. 印刷工人；印刷厂；打印机', confidence: 95 },
      { spelling: 'invent', phonetic: '/ɪnˈvent/', meaning: 'v. 发明；创造', confidence: 97 },
      { spelling: 'signal', phonetic: '/ˈsɪɡnəl/', meaning: 'n. 信号；标志 v. 用信号通知', confidence: 93 },
      { spelling: 'weigh', phonetic: '/weɪ/', meaning: 'v. 称量；权衡', confidence: 96 },
      { spelling: 'one after another', phonetic: '/wʌn ˈɑːftər əˈnʌðə(r)/', meaning: 'phrase. 陆续地；一个接一个地', confidence: 85 },
      { spelling: 'download', phonetic: '/ˌdaʊnˈləʊd/', meaning: 'n. 下载 v. 下载', confidence: 98 },
      { spelling: 'allow', phonetic: '/əˈlaʊ/', meaning: 'v. 允许；准许；给予；留出；同意；承认', confidence: 94 },
      { spelling: 'blind', phonetic: '/blaɪnd/', meaning: 'adj. 瞎的；失明的 v. 使失明 n. 百叶窗', confidence: 95 },
      { spelling: 'machine', phonetic: '/məˈʃiːn/', meaning: 'n. 机器；机械', confidence: 97 },
      { spelling: 'warn', phonetic: '/wɔːn/', meaning: 'v. 警告；告诫；提醒注意', confidence: 96 },
      { spelling: 'object', phonetic: '/ˈɒbdʒɪkt/', meaning: 'n. 物体；目的；对象；宾语 v. 反对；有意见；讨厌', confidence: 92 },
      { spelling: 'sense', phonetic: '/sens/', meaning: 'n. 知觉；感知；理解力；意义 v. 意识到；感觉到；觉察出', confidence: 94 },
      { spelling: 'congratulation', phonetic: '/kənˌɡrætʃuˈleɪʃn/', meaning: 'n. 祝贺；恭喜', confidence: 98 },
      { spelling: 'trouble', phonetic: '/ˈtrʌbl/', meaning: 'n. 麻烦；问题；困难 v. 使烦恼；苦恼；费神', confidence: 95 },
      // 低置信度词条
      { spelling: 'compter', phonetic: '/kəmˈpjuːtə(r)/', meaning: 'n. 电脑', confidence: 75 },
    ];

    // 随机返回一套数据，模拟每次上传文件识别出不同的结果
    const isFirstSet = Math.random() > 0.5;

    // 模拟一下网络延迟，让体验更真实
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      data: isFirstSet ? mockSet1 : mockSet2
    });
  } catch (error) {
    return NextResponse.json({ error: 'Mock 识别失败' }, { status: 500 });
  }
}