import { createApp, nextTick, ref, watch } from 'vue'
import './overrides.css'
import { softwareWarnings } from './data/softwareWarnings.js'
import { campusNews } from './data/campusNews.js'
import { nationalPolicies } from './data/nationalPolicies.js'
import { aiAgents } from './data/aiAgents.js'
import { researchExchange } from './data/researchExchange.js'

const sectionIds = ['top', 'news', 'policy', 'security', 'fraud', 'ai', 'contact', 'downloads']

createApp({
  setup() {
    const activeSection = ref('top')
    const menuOpen = ref(false)
    const newsDirectory = ref('all')
    const panel = ref({ policy: 'policyNatl', contact: 'contactInfo' })
    const aiKey = ref('prompt')
    const openPolicyArticle = ref(null)
    let quizStep = 0
    let quizScore = 0
    let securityQuizStep = 0
    let securityQuizScore = 0
    let activeSafetyType = 'network'
    let activeCaseType = 'student'
    const aiLessons = {
      prompt: ['提示词与任务设计', '目标对象与背景语境', '具体任务与可用材料', '输出格式和限制条件', '来源、核验与不确定性要求'],
      verify: ['生成内容核验', '找到可追溯的原始来源', '检查作者、日期与适用范围', '交叉验证关键数字', '标记无法确认的内容'],
      ethics: ['科研伦理与披露', '遵循课程或期刊规则', '说明AI参与环节', '不虚构引用和数据', '由提交者承担最终责任']
    }
    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))
    const showToast = (message) => {
      const toast = document.querySelector('#toast')
      if (!toast) return
      toast.textContent = message
      toast.classList.add('show')
      window.setTimeout(() => toast.classList.remove('show'), 1800)
    }
    const quizQuestions = [
      {
        question: '收到“账号异常”的陌生链接时，最合适的做法是？',
        answers: ['立即点击并按提示登录', '通过学校官方入口或原有联系方式核实', '转发给同学一起确认'],
        correct: 1
      },
      {
        question: '使用 AI 生成学习材料后，下一步应当？',
        answers: ['直接提交或发布', '核验关键信息与引用来源', '只修改文字排版'],
        correct: 1
      },
      {
        question: '保存含有个人信息的资料时，优先选择？',
        answers: ['公开分享链接', '加密保存并设置恰当访问权限', '发到多个群里备份'],
        correct: 1
      }
    ]
    const securityFiles = {
      network: [
        ['网络安全基础防护清单', '账号、设备与校园网络的日常安全要点'],
        ['钓鱼邮件与诈骗链接识别指南', '收到异常通知时的核验步骤'],
        ['网络安全宣传周学习材料', '主题活动与知识学习参考']
      ],
      data: [
        ['数据分类分级使用指引', '教学、科研与管理数据的处理原则'],
        ['个人信息保护提示', '收集、存储、共享个人信息前请先核验'],
        ['数据备份与共享规范', '选择合规平台并控制访问权限']
      ],
      intelligent: [
        ['生成式 AI 使用提示', '明确边界、核验来源、保护敏感信息'],
        ['智能工具数据安全清单', '上传材料前的必要检查'],
        ['AI 生成内容核验指引', '对关键事实、图像和引用进行复核']
      ]
    }
    const caseFiles = {
      student: [
        ['学生科研数据整理案例', '从采集、命名到备份的完整流程'],
        ['课程作业中的 AI 协作案例', '任务拆解、引用标注与结果核验'],
        ['校园账号安全处置案例', '异常登录后的快速自查与申诉']
      ],
      teacher: [
        ['课程资源安全共享案例', '面向学生发布资料时的权限设计'],
        ['教学数据合规使用案例', '课堂数据采集与告知的实践方式'],
        ['AI 辅助教学设计案例', '可信使用、过程记录与教学反馈']
      ]
    }
    const downloadFiles = [
      { name: '2025年度视听系统典型案例名单', type: 'PDF', size: '185 KB', href: 'resources/policy-attachments/2025-audiovisual-system-cases.pdf' },
      { name: '2025年度智能制造系统解决方案项目名单', type: 'PDF', size: '260 KB', href: 'resources/policy-attachments/2025-smart-manufacturing-projects.pdf' },
      { name: '汽车行业数字化转型实施方案', type: 'PDF', size: '284 KB', href: 'resources/policy-attachments/automotive-digital-transformation-plan.pdf' },
      { name: '软件与网络安全预警资料包', type: 'ZIP', size: '60 KB', href: 'resources/software-warnings-archive.zip' }
    ]
    const securityQuizQuestions = [
      { question: '收到涉及转账或账号验证的信息时，应优先？', answers: ['立即按提示操作', '通过官方渠道或原有联系人核实', '转发给更多人确认'], correct: 1 },
      { question: '将文件上传到智能工具前，首先要检查？', answers: ['文件大小', '是否包含敏感或个人信息', '文件名称是否简短'], correct: 1 },
      { question: '发现账号异常登录后，正确做法是？', answers: ['继续观察', '修改密码并联系学校服务人员', '把密码告诉同学检查'], correct: 1 }
    ]
    const fileListRows = (files) => files.map(([name, description], index) => `<article class="topic-file-row"><span>${String(index + 1).padStart(2, '0')}</span><div><h4>${name}</h4><p>${description}</p></div><em>文件</em></article>`).join('')
    const renderSafetyFiles = () => {
      const list = document.querySelector('.safety-file-list')
      if (list) list.innerHTML = fileListRows(securityFiles[activeSafetyType])
      document.querySelectorAll('[data-safety-tab]').forEach((button) => button.classList.toggle('active', button.dataset.safetyTab === activeSafetyType))
    }
    const renderCaseFiles = () => {
      const list = document.querySelector('.case-file-list')
      if (list) list.innerHTML = fileListRows(caseFiles[activeCaseType])
      document.querySelectorAll('[data-case-tab]').forEach((button) => button.classList.toggle('active', button.dataset.caseTab === activeCaseType))
    }
    const renderSecurityQuiz = () => {
      const quiz = document.querySelector('.security-quiz')
      if (!quiz) return
      if (securityQuizStep >= securityQuizQuestions.length) {
        quiz.innerHTML = `<div><small>SECURITY CHECK COMPLETE</small><h3>你答对了 ${securityQuizScore} / ${securityQuizQuestions.length} 题</h3><p>把安全意识落实到每次登录、分享和使用智能工具之前。</p></div><button type="button" data-security-quiz-reset>再测一次</button>`
        return
      }
      const item = securityQuizQuestions[securityQuizStep]
      quiz.innerHTML = `<div><small>安全小测验 · ${securityQuizStep + 1} / ${securityQuizQuestions.length}</small><h3>${item.question}</h3><div class="security-quiz-options">${item.answers.map((answer, index) => `<button type="button" data-security-quiz-answer="${index}">${String.fromCharCode(65 + index)}. ${answer}</button>`).join('')}</div></div>`
    }
    const renderDownloads = (query = '') => {
      const list = document.querySelector('.download-file-list')
      if (!list) return
      const keyword = query.trim().toLowerCase()
      const visibleFiles = downloadFiles.filter((file) => file.name.toLowerCase().includes(keyword))
      list.innerHTML = visibleFiles.length ? visibleFiles.map((file) => `<a class="download-file-row" href="${file.href}" download><span>${file.type}</span><div><h3>${file.name}</h3><p>资料下载 · ${file.size}</p></div><b>下载 ↓</b></a>`).join('') : '<p class="download-empty">没有找到匹配的文件。</p>'
    }
    const renderHomeQuiz = () => {
      const quiz = document.querySelector('.home-literacy-quiz')
      if (!quiz) return
      if (quizStep >= quizQuestions.length) {
        quiz.innerHTML = `<div class="home-quiz-copy"><small>SELF CHECK COMPLETE</small><strong>你答对了 ${quizScore} / ${quizQuestions.length} 题</strong><p>数字素养来自每一次谨慎核验与规范操作。</p></div><button class="home-quiz-button" type="button" data-home-quiz-reset>再测一次</button>`
        return
      }
      const item = quizQuestions[quizStep]
      quiz.innerHTML = `<div class="home-quiz-copy"><small>数字素养微自测 · ${quizStep + 1} / ${quizQuestions.length}</small><strong>${item.question}</strong><div class="home-quiz-options">${item.answers.map((answer, index) => `<button type="button" data-home-quiz-answer="${index}">${String.fromCharCode(65 + index)}. ${answer}</button>`).join('')}</div></div>`
    }
    const startHomeQuiz = () => {
      quizStep = 0
      quizScore = 0
      renderHomeQuiz()
    }
    const policyAttachments = {
      '附件：2025年度视听系统典型案例名单.pdf': 'resources/policy-attachments/2025-audiovisual-system-cases.pdf',
      '附件：2025年度智能制造系统解决方案“揭榜挂帅”项目名单.pdf': 'resources/policy-attachments/2025-smart-manufacturing-projects.pdf',
      '附件：《汽车行业数字化转型实施方案》.pdf': 'resources/policy-attachments/automotive-digital-transformation-plan.pdf'
    }
    const formatPolicyBody = (paragraphs) => paragraphs.map((paragraph) => {
      const safeText = escapeHtml(paragraph)
      const isHeading = /^(第[一二三四五六七八九十]+章|[一二三四五六七八九十]+、|（[一二三四五六七八九十]+）)/.test(paragraph)
      const attachmentUrl = policyAttachments[paragraph]
      if (attachmentUrl) return `<p class="policy-attachment"><a href="${attachmentUrl}" download>${safeText}<span aria-hidden="true"> ↓</span></a></p>`
      return isHeading ? `<h4>${safeText}</h4>` : `<p>${safeText}</p>`
    }).join('')

    const syncSections = () => {
      document.querySelectorAll('main > section').forEach((section) => {
        const id = section.classList.contains('hero') ? 'top' : section.id
        section.classList.toggle('hidden', id !== activeSection.value)
      })
      document.querySelectorAll('#nav a[href^="#"]').forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${activeSection.value}`)
      })
      document.querySelector('#nav')?.classList.toggle('open', menuOpen.value)
    }

    const selectSection = (id, newsType) => {
      if (!sectionIds.includes(id)) return
      activeSection.value = id
      menuOpen.value = false
      if (id === 'news' && newsType) selectNewsDirectory(newsType)
      window.history.replaceState(null, '', id === 'top' ? '#top' : `#${id}`)
      nextTick(() => window.scrollTo({ top: 0, behavior: 'auto' }))
    }

    const selectPanel = (group, target) => {
      panel.value = { ...panel.value, [group]: target }
      document.querySelectorAll(`[data-tab="${group}"]`).forEach((button) => {
        const selected = button.dataset.show === target
        button.classList.toggle('active', selected)
        const ids = JSON.parse(button.dataset.panels || '[]')
        ids.forEach((id) => document.getElementById(id)?.classList.toggle('hidden', id !== target))
      })
    }

    const selectNewsDirectory = (type) => {
      newsDirectory.value = type
      openPolicyArticle.value = null
      document.querySelectorAll('[data-news-directory]').forEach((button) => {
        button.classList.toggle('active', button.dataset.newsDirectory === type)
      })
      const newsList = document.querySelector('#news .news-list')
      if (!newsList) return
      if (type === 'campus') {
        newsList.innerHTML = campusNews.map((item) => `<article class="news-list-row campus-news-row"><time>${item.date}</time><a href="${item.source}" target="_blank" rel="noopener">${item.title}<span class="campus-news-source">官网原文 ↗</span></a></article>`).join('')
      } else {
        newsList.innerHTML = nationalPolicies.map((item) => `<article class="news-list-row national-policy-row"><time>${escapeHtml(item.date)}</time><button type="button" data-policy-article="${escapeHtml(item.id)}">${escapeHtml(item.title)}<span class="national-policy-open">阅读详情 →</span></button></article>`).join('')
      }
    }

    const showPolicyArticle = (id) => {
      const article = nationalPolicies.find((item) => item.id === id)
      const newsList = document.querySelector('#news .news-list')
      if (!article || !newsList) return
      openPolicyArticle.value = id
      newsList.innerHTML = `<article class="national-policy-detail"><button type="button" class="national-policy-back" data-policy-back="true">← 返回国家政策</button><nav class="policy-breadcrumb" aria-label="当前位置">首页 <span>›</span> 新闻速递 <span>›</span> 国家政策</nav><h3>${escapeHtml(article.title)}</h3><div class="policy-detail-meta"><span>信息来源：${escapeHtml(article.source)}</span><span>发布日期：${escapeHtml(article.date)}</span></div><div class="policy-detail-body">${formatPolicyBody(article.body)}</div></article>`
      nextTick(() => document.querySelector('#news .news-directory')?.scrollIntoView({ block: 'start', behavior: 'auto' }))
    }

    const showCybersecurityLawInterpretation = () => {
      const policyCard = document.querySelector('#policy .news-card')
      if (!policyCard) return
      policyCard.innerHTML = `<article class="policy-interpretation-detail"><button type="button" class="policy-interpretation-back" data-policy-interpretation-back>← 返回政策解读</button><h3>《中华人民共和国网络安全法》修改后有哪些变化？</h3><div class="policy-interpretation-meta">来源：“网信中国”微信公众号　发布日期：2025年12月29日</div><div class="policy-interpretation-images">${[1, 2, 3, 4, 5].map((index) => `<img src="resources/cybersecurity-law/change-${index}.webp" alt="《中华人民共和国网络安全法》修改要点图解第${index}部分" loading="lazy">`).join('')}</div></article>`
      nextTick(() => document.querySelector('#policy .page-hero')?.scrollIntoView({ block: 'start', behavior: 'auto' }))
    }

    const restorePolicyInterpretationList = () => {
      const policyCard = document.querySelector('#policy .news-card')
      if (!policyCard) return
      policyCard.innerHTML = `<div id="policyNatl"><div class="news-item"><div class="news-icon">法</div><div class="news-meta"><h3>《中华人民共和国网络安全法》修改后有哪些变化？</h3><p>网络安全法修改要点图解 · 站内阅读</p></div><button type="button" class="news-link policy-read-button" data-policy-interpretation>阅读 →</button></div><div class="news-item"><div class="news-icon">行</div><div class="news-meta"><h3>数字化赋能教师发展行动导读</h3><p>培训、资源、实践与治理</p></div><a href="#" class="news-link">阅读 →</a></div></div>`
    }

    const renderAiAgentList = () => {
      const content = document.querySelector('#aiContent')
      if (!content) return
      content.innerHTML = `<h3>智能体专区</h3><p>收录智能体搭建平台、AI工具实践与使用教程，可直接在本站查看。</p><div class="ai-agent-list">${aiAgents.map((item, index) => `<article class="ai-agent-row"><time>${escapeHtml(item.date)}</time><button type="button" data-ai-agent="${index}"><span>${escapeHtml(item.title)}</span><em>站内阅读 →</em></button></article>`).join('')}</div>`
    }

    const showAiAgentArticle = (index) => {
      const article = aiAgents[Number(index)]
      const content = document.querySelector('#aiContent')
      if (!article || !content) return
      content.innerHTML = `<article class="ai-agent-detail"><button type="button" class="ai-agent-back" data-ai-agent-back>← 返回智能体专区</button><h3>${escapeHtml(article.title)}</h3><div class="ai-agent-meta">发布日期：${escapeHtml(article.date)}　来源：佳木斯大学数字素养与技能提升平台</div><div class="ai-agent-body">${article.content}</div></article>`
      nextTick(() => document.querySelector('#ai .page-hero')?.scrollIntoView({ block: 'start', behavior: 'auto' }))
    }

    const renderResearchExchangeList = () => {
      const content = document.querySelector('#aiContent')
      if (!content) return
      content.innerHTML = `<h3>科研伦理与披露</h3><p>收录中国国际科技交流中心“对外交流”栏目最新内容，可直接在本站阅读。</p><div class="ai-agent-list">${researchExchange.map((item, index) => `<article class="ai-agent-row"><time>${escapeHtml(item.date)}</time><button type="button" data-research-exchange="${index}"><span>${escapeHtml(item.title)}</span><em>站内阅读 →</em></button></article>`).join('')}</div>`
    }

    const showResearchExchangeArticle = (index) => {
      const article = researchExchange[Number(index)]
      const content = document.querySelector('#aiContent')
      if (!article || !content) return
      content.innerHTML = `<article class="ai-agent-detail"><button type="button" class="ai-agent-back" data-research-exchange-back>← 返回科研伦理与披露</button><h3>${escapeHtml(article.title)}</h3><div class="ai-agent-meta">发布日期：${escapeHtml(article.date)}　来源：中国国际科技交流中心</div><div class="ai-agent-body">${article.content}</div></article>`
      nextTick(() => document.querySelector('#ai .page-hero')?.scrollIntoView({ block: 'start', behavior: 'auto' }))
    }

    const selectAi = (key) => {
      aiKey.value = key
      document.querySelectorAll('[data-ai]').forEach((button) => button.classList.toggle('active', button.dataset.ai === key))
      if (key === 'prompt') {
        const content = document.querySelector('#aiContent')
        if (content) content.innerHTML = `<h3>软件预警</h3><p>已收录学校数据管理处（信息化办公室）公开发布的 ${softwareWarnings.length} 条软件与网络安全预警，可在线查看或下载本地存档。</p><a class="warning-download-all" href="resources/software-warnings-archive.zip" download>下载全部存档（ZIP）</a><div class="software-warning-list">${softwareWarnings.map((item) => `<article class="software-warning-item"><time>${item.date}</time><div><h4>${item.title}</h4><div class="software-warning-actions"><a href="resources/software-warnings/${item.file}" download>下载存档</a><a href="${item.source}" target="_blank" rel="noopener">官网原文 ↗</a></div></div></article>`).join('')}</div>`
        return
      }
      if (key === 'verify') {
        renderAiAgentList()
        return
      }
      if (key === 'ethics') {
        renderResearchExchangeList()
        return
      }
      const lesson = aiLessons[key]
      const content = document.querySelector('#aiContent')
      if (lesson && content) content.innerHTML = `<h3>${lesson[0]}</h3><p>本模块建议依次完成：</p><ol>${lesson.slice(1).map((item) => `<li>${item}</li>`).join('')}</ol>`
    }

    watch([activeSection, menuOpen], syncSections, { flush: 'post' })

    const interceptInteractions = (event) => {
      const sectionLink = event.target.closest('a[href^="#"]')
      const navLink = event.target.closest('#nav a[href^="#"]')
      const tab = event.target.closest('[data-tab]')
      const directory = event.target.closest('[data-news-directory]')
      const aiButton = event.target.closest('[data-ai]')
      const policyArticle = event.target.closest('[data-policy-article]')
      const policyBack = event.target.closest('[data-policy-back]')
      const policyInterpretation = event.target.closest('[data-policy-interpretation]')
      const policyInterpretationBack = event.target.closest('[data-policy-interpretation-back]')
      const aiAgentArticle = event.target.closest('[data-ai-agent]')
      const aiAgentBack = event.target.closest('[data-ai-agent-back]')
      const researchExchangeArticle = event.target.closest('[data-research-exchange]')
      const researchExchangeBack = event.target.closest('[data-research-exchange-back]')
      const menu = event.target.closest('#menu')
      const homeNews = event.target.closest('.side .metric:nth-child(2)')
      const homeQuizStart = event.target.closest('[data-home-quiz-start]')
      const homeQuizAnswer = event.target.closest('[data-home-quiz-answer]')
      const homeQuizReset = event.target.closest('[data-home-quiz-reset]')
      const safetyTab = event.target.closest('[data-safety-tab]')
      const caseTab = event.target.closest('[data-case-tab]')
      const securityQuizStart = event.target.closest('[data-security-quiz-start]')
      const securityQuizAnswer = event.target.closest('[data-security-quiz-answer]')
      const securityQuizReset = event.target.closest('[data-security-quiz-reset]')

      if (menu) {
        event.preventDefault()
        event.stopImmediatePropagation()
        menuOpen.value = !menuOpen.value
      } else if (homeQuizStart) {
        event.preventDefault()
        event.stopImmediatePropagation()
        startHomeQuiz()
      } else if (homeQuizAnswer) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (Number(homeQuizAnswer.dataset.homeQuizAnswer) === quizQuestions[quizStep]?.correct) quizScore += 1
        quizStep += 1
        renderHomeQuiz()
      } else if (homeQuizReset) {
        event.preventDefault()
        event.stopImmediatePropagation()
        startHomeQuiz()
      } else if (safetyTab) {
        event.preventDefault()
        event.stopImmediatePropagation()
        activeSafetyType = safetyTab.dataset.safetyTab
        renderSafetyFiles()
      } else if (caseTab) {
        event.preventDefault()
        event.stopImmediatePropagation()
        activeCaseType = caseTab.dataset.caseTab
        renderCaseFiles()
      } else if (securityQuizStart) {
        event.preventDefault()
        event.stopImmediatePropagation()
        securityQuizStep = 0
        securityQuizScore = 0
        renderSecurityQuiz()
      } else if (securityQuizAnswer) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (Number(securityQuizAnswer.dataset.securityQuizAnswer) === securityQuizQuestions[securityQuizStep]?.correct) securityQuizScore += 1
        securityQuizStep += 1
        renderSecurityQuiz()
      } else if (securityQuizReset) {
        event.preventDefault()
        event.stopImmediatePropagation()
        securityQuizStep = 0
        securityQuizScore = 0
        renderSecurityQuiz()
      } else if (homeNews) {
        event.preventDefault()
        event.stopImmediatePropagation()
        selectSection('news', 'campus')
      } else if (navLink || sectionLink) {
        const id = (navLink || sectionLink).getAttribute('href').slice(1)
        if (sectionIds.includes(id)) {
          event.preventDefault()
          event.stopImmediatePropagation()
          selectSection(id)
        } else if (navLink?.dataset.comingSoon) {
          event.preventDefault()
          event.stopImmediatePropagation()
          showToast(`${navLink.textContent}正在建设中`)
        }
      } else if (tab) {
        event.preventDefault()
        event.stopImmediatePropagation()
        selectPanel(tab.dataset.tab, tab.dataset.show)
      } else if (directory) {
        event.preventDefault()
        event.stopImmediatePropagation()
        selectNewsDirectory(directory.dataset.newsDirectory)
      } else if (policyArticle) {
        event.preventDefault()
        event.stopImmediatePropagation()
        showPolicyArticle(policyArticle.dataset.policyArticle)
      } else if (policyBack) {
        event.preventDefault()
        event.stopImmediatePropagation()
        selectNewsDirectory('policy')
      } else if (policyInterpretation) {
        event.preventDefault()
        event.stopImmediatePropagation()
        showCybersecurityLawInterpretation()
      } else if (policyInterpretationBack) {
        event.preventDefault()
        event.stopImmediatePropagation()
        restorePolicyInterpretationList()
      } else if (aiAgentArticle) {
        event.preventDefault()
        event.stopImmediatePropagation()
        showAiAgentArticle(aiAgentArticle.dataset.aiAgent)
      } else if (aiAgentBack) {
        event.preventDefault()
        event.stopImmediatePropagation()
        renderAiAgentList()
      } else if (researchExchangeArticle) {
        event.preventDefault()
        event.stopImmediatePropagation()
        showResearchExchangeArticle(researchExchangeArticle.dataset.researchExchange)
      } else if (researchExchangeBack) {
        event.preventDefault()
        event.stopImmediatePropagation()
        renderResearchExchangeList()
      } else if (aiButton) {
        event.preventDefault()
        event.stopImmediatePropagation()
        selectAi(aiButton.dataset.ai)
      }
    }

    return { interceptInteractions, renderCaseFiles, renderDownloads, renderSafetyFiles, selectAi, selectNewsDirectory, selectSection, syncSections }
  },
  mounted() {
    const fromHash = window.location.hash.slice(1)
    if (sectionIds.includes(fromHash)) this.selectSection?.(fromHash)
    this.syncSections()
    const headerLink = document.querySelector('.header-btn')
    if (headerLink) headerLink.setAttribute('href', 'https://i.ahau.edu.cn/')
    const navigation = document.querySelector('#nav')
    if (navigation) {
      navigation.innerHTML = `
        <a href="#top">首页</a>
        <a href="#news">数据新闻</a>
        <a href="#policy">政策解读</a>
        <a href="#security">安全专区</a>
        <a href="#ai">AI专区</a>
        <a href="#fraud">案例专区</a>
        <a href="#contact">数据要素</a>
        <a href="#downloads">下载中心</a>
        <a href="#ecosystem" data-coming-soon="true">应用生态</a>`
      this.syncSections()
    }
    let downloadSection = document.querySelector('#downloads')
    if (!downloadSection) {
      downloadSection = document.createElement('section')
      downloadSection.id = 'downloads'
      downloadSection.className = 'section hidden download-center'
      downloadSection.innerHTML = `<div class="page-hero download-hero"><div class="shell"><span class="micro">08 / DOWNLOADS</span><h2 class="page-title">下载中心</h2></div></div><div class="shell download-directory"><label class="download-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="搜索文件名称" aria-label="搜索可下载文件"></label><div class="download-file-list"></div></div>`
      document.querySelector('main')?.append(downloadSection)
    }
    this.renderDownloads()
    downloadSection.querySelector('.download-search input')?.addEventListener('input', (event) => this.renderDownloads(event.target.value))
    this.syncSections()
    const appName = document.querySelector('.app-name')
    if (appName) appName.innerHTML = '<img src="assets/ahau-emblem-white.png" alt="安徽农业大学校徽"><span>数智素养服务台</span>'

    const quickLinks = document.querySelectorAll('.quick a')
    const schoolWebsite = quickLinks[4]
    const digitalLearning = quickLinks[5]
    if (schoolWebsite) {
      schoolWebsite.setAttribute('href', 'https://www.ahau.edu.cn/')
      schoolWebsite.setAttribute('aria-label', '学校官网')
      schoolWebsite.innerHTML = '<span>官</span>学校官网'
    }
    if (digitalLearning) {
      digitalLearning.setAttribute('href', '#contact')
      digitalLearning.setAttribute('aria-label', '数字学习')
      digitalLearning.innerHTML = '<span>学</span>数字学习'
    }

    const policyNav = document.querySelector('#nav a[href="#policy"]')
    if (policyNav) policyNav.textContent = '政策解读'
    const policySection = document.querySelector('#policy')
    if (policySection) {
      const policyMicro = policySection.querySelector('.page-hero .micro')
      const policyTitle = policySection.querySelector('.page-hero .page-title')
      const policyLink = policySection.querySelector('.page-hero a')
      const policyTabs = [...policySection.querySelectorAll('[data-tab="policy"]')]
      if (policyMicro) policyMicro.textContent = '02 / POLICY INTERPRETATION'
      if (policyTitle) policyTitle.textContent = '政策解读'
      policyLink?.remove()
      if (policyTabs[0]) {
        policyTabs[0].textContent = '政策解读'
        policyTabs[0].classList.add('active')
      }
      policyTabs.slice(1).forEach((tab) => tab.remove())
      policySection.querySelector('#policySchool')?.remove()
      const policyCard = policySection.querySelector('.news-card')
      if (policyCard) policyCard.innerHTML = `<div id="policyNatl"><div class="news-item"><div class="news-icon">法</div><div class="news-meta"><h3>《中华人民共和国网络安全法》修改后有哪些变化？</h3><p>网络安全法修改要点图解 · 站内阅读</p></div><button type="button" class="news-link policy-read-button" data-policy-interpretation>阅读 →</button></div><div class="news-item"><div class="news-icon">行</div><div class="news-meta"><h3>数字化赋能教师发展行动导读</h3><p>培训、资源、实践与治理</p></div><a href="#" class="news-link">阅读 →</a></div></div>`
    }

    const footerBrand = document.querySelector('.footer-brand')
    if (footerBrand) footerBrand.innerHTML = '<img src="assets/ahau-logo-white.png" alt="安徽农业大学 ANHUI AGRICULTURAL UNIVERSITY">'

    const securitySection = document.querySelector('#security')
    const securityFormat = securitySection?.querySelector('.security-format')
    if (securitySection && securityFormat) {
      securitySection.querySelector('.page-hero .micro').textContent = '03 / SECURITY'
      securitySection.querySelector('.page-hero .page-title').textContent = '安全专区'
      securityFormat.innerHTML = `<section class="safety-slogan"><p>安全不是口号，而是每一次登录、每一次共享、每一次智能工具使用前的认真核验。</p></section><section class="safety-directory"><div class="safety-category-grid" role="tablist" aria-label="安全文件分类"><button class="active" type="button" data-safety-tab="network"><span>01</span><strong>网络安全</strong><small>守护账号、设备与连接</small></button><button type="button" data-safety-tab="data"><span>02</span><strong>数据安全</strong><small>规范处理、存储与共享</small></button><button type="button" data-safety-tab="intelligent"><span>03</span><strong>智能安全</strong><small>可信使用 AI 与智能工具</small></button></div><div class="safety-file-list" aria-live="polite"></div></section><section class="security-quiz"><div><small>SECURITY CHECK</small><h3>安全小测验</h3><p>用 3 道题快速检查你的安全习惯。</p></div><button type="button" data-security-quiz-start>开始测验 →</button></section>`
      this.renderSafetyFiles()
    }

    const caseSection = document.querySelector('#fraud')
    const caseContent = caseSection?.querySelector(':scope > .shell')
    if (caseSection && caseContent) {
      caseSection.querySelector('.page-hero .micro').textContent = '06 / CASES'
      caseSection.querySelector('.page-hero .page-title').textContent = '案例专区'
      caseContent.className = 'shell case-directory'
      caseContent.innerHTML = `<div class="case-selector" role="tablist" aria-label="案例对象"><button class="active" type="button" data-case-tab="student"><span>学生侧</span><small>学习、科研与校园生活中的数字实践</small></button><button type="button" data-case-tab="teacher"><span>教师侧</span><small>教学、管理与资源服务中的数字实践</small></button></div><div class="case-file-list" aria-live="polite"></div>`
      this.renderCaseFiles()
    }

    const directoryButtons = [...document.querySelectorAll('#news [data-news-directory]')]
    const categorySetup = [
      { type: 'policy', label: '国家政策' },
      { type: 'campus', label: '校内新闻' }
    ]
    directoryButtons.slice(0, 2).forEach((button, index) => {
      button.dataset.newsDirectory = categorySetup[index].type
      button.textContent = categorySetup[index].label
    })
    directoryButtons.slice(2).forEach((button) => button.remove())
    document.querySelectorAll('#news .news-list-row').forEach((row, index) => {
      row.dataset.newsList = index < 3 ? 'campus' : 'policy'
    })
    this.selectNewsDirectory('campus')

    const firstAiTab = document.querySelector('[data-ai="prompt"]')
    if (firstAiTab) firstAiTab.textContent = '软件预警'
    const agentAiTab = document.querySelector('[data-ai="verify"]')
    if (agentAiTab) agentAiTab.textContent = '智能体专区'
    document.querySelector('[data-ai="agri"]')?.remove()
    this.selectAi('prompt')
    document.addEventListener('click', this.interceptInteractions, true)
    const homeNews = document.querySelector('.side .metric:nth-child(2)')
    const homeCalendar = document.querySelector('.side .metric:first-child')
    const homeQuiz = document.querySelector('.side .metric.wide')
    if (homeCalendar) {
      homeCalendar.classList.add('home-calendar')
      homeCalendar.innerHTML = `<small>校园活动日历</small><strong>网络安全宣传周</strong><div class="home-event-list"><span><b>09</b>月第三周</span><span>主题宣传、知识竞答与安全讲堂</span><span><b>12.04</b>国家宪法日</span><span>网络法治与个人信息保护提醒</span></div>`
    }
    if (homeQuiz) {
      homeQuiz.classList.remove('alert')
      homeQuiz.classList.add('home-literacy-quiz')
      homeQuiz.innerHTML = `<div class="home-quiz-copy"><small>LEARNING CHECK</small><strong>数字素养微自测</strong><p>3 分钟，了解你在信息检索、数据安全和 AI 使用方面的准备度。</p></div><button class="home-quiz-button" type="button" data-home-quiz-start>开始自测 <span aria-hidden="true">→</span></button>`
    }
    if (homeNews) {
      homeNews.classList.add('home-campus-news')
      homeNews.innerHTML = `<small>校内新闻</small><div class="home-news-list">${campusNews.slice(0, 3).map((item) => `<a href="${item.source}" target="_blank" rel="noopener">${item.title}</a>`).join('')}</div>`
      homeNews.setAttribute('role', 'button')
      homeNews.setAttribute('tabindex', '0')
      homeNews.setAttribute('aria-label', '打开新闻速递')
      homeNews.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          this.selectSection('news')
        }
      })
    }
  },
  beforeUnmount() {
    document.removeEventListener('click', this.interceptInteractions, true)
  },
  template: '<span aria-hidden="true" style="display:none"></span>'
}).mount('#vue-runtime')
