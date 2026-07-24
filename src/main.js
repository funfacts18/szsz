import { createApp, nextTick, ref, watch } from 'vue'
import './overrides.css'
import { softwareWarnings } from './data/softwareWarnings.js'
import { campusNews } from './data/campusNews.js'
import { nationalPolicies } from './data/nationalPolicies.js'
import { fraudEducation } from './data/fraudEducation.js'
import { aiAgents } from './data/aiAgents.js'
import { researchExchange } from './data/researchExchange.js'

const sectionIds = ['top', 'news', 'policy', 'security', 'fraud', 'ai', 'contact']

createApp({
  setup() {
    const activeSection = ref('top')
    const menuOpen = ref(false)
    const newsDirectory = ref('all')
    const panel = ref({ policy: 'policyNatl', fraud: 'fraudType', contact: 'contactInfo' })
    const aiKey = ref('prompt')
    const openPolicyArticle = ref(null)
    const aiLessons = {
      prompt: ['提示词与任务设计', '目标对象与背景语境', '具体任务与可用材料', '输出格式和限制条件', '来源、核验与不确定性要求'],
      verify: ['生成内容核验', '找到可追溯的原始来源', '检查作者、日期与适用范围', '交叉验证关键数字', '标记无法确认的内容'],
      ethics: ['科研伦理与披露', '遵循课程或期刊规则', '说明AI参与环节', '不虚构引用和数据', '由提交者承担最终责任']
    }
    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]))
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

    const renderFraudEducationList = () => {
      const fraudCard = document.querySelector('#fraud .news-card')
      if (!fraudCard) return
      fraudCard.innerHTML = `<div id="fraudType" class="fraud-education-list">${fraudEducation.map((item, index) => `<article class="fraud-education-row"><time>${escapeHtml(item.date)}</time><button type="button" data-fraud-education="${index}"><span>${escapeHtml(item.title)}</span><em>站内阅读 →</em></button></article>`).join('')}</div>`
    }

    const showFraudEducationArticle = (index) => {
      const article = fraudEducation[Number(index)]
      const fraudCard = document.querySelector('#fraud .news-card')
      if (!article || !fraudCard) return
      fraudCard.innerHTML = `<article class="fraud-education-detail"><button type="button" class="fraud-education-back" data-fraud-education-back>← 返回防诈教育</button><h3>${escapeHtml(article.title)}</h3><div class="fraud-education-meta">发布日期：${escapeHtml(article.date)}　来源：安徽农业大学党委学工部（处）、武装部</div><div class="fraud-education-body">${article.content}</div></article>`
      nextTick(() => document.querySelector('#fraud .page-hero')?.scrollIntoView({ block: 'start', behavior: 'auto' }))
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
      const fraudEducationArticle = event.target.closest('[data-fraud-education]')
      const fraudEducationBack = event.target.closest('[data-fraud-education-back]')
      const aiAgentArticle = event.target.closest('[data-ai-agent]')
      const aiAgentBack = event.target.closest('[data-ai-agent-back]')
      const researchExchangeArticle = event.target.closest('[data-research-exchange]')
      const researchExchangeBack = event.target.closest('[data-research-exchange-back]')
      const menu = event.target.closest('#menu')
      const homeNews = event.target.closest('.side .metric:nth-child(2)')

      if (menu) {
        event.preventDefault()
        event.stopImmediatePropagation()
        menuOpen.value = !menuOpen.value
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
      } else if (fraudEducationArticle) {
        event.preventDefault()
        event.stopImmediatePropagation()
        showFraudEducationArticle(fraudEducationArticle.dataset.fraudEducation)
      } else if (fraudEducationBack) {
        event.preventDefault()
        event.stopImmediatePropagation()
        renderFraudEducationList()
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

    return { interceptInteractions, renderFraudEducationList, selectAi, selectNewsDirectory, selectSection, syncSections }
  },
  mounted() {
    const fromHash = window.location.hash.slice(1)
    if (sectionIds.includes(fromHash)) this.selectSection?.(fromHash)
    this.syncSections()
    const headerLink = document.querySelector('.header-btn')
    if (headerLink) headerLink.setAttribute('href', 'https://i.ahau.edu.cn/')
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

    const securityFormat = document.querySelector('#security .security-format')
    if (securityFormat) securityFormat.innerHTML = `<h3 class="security-format-title">安全科普</h3><div class="security-feature-grid"><article class="security-feature security-video-card"><video controls preload="metadata" playsinline poster="resources/security/summer-safety-poster.png"><source src="https://szsz-funfacts18.netlify.app/resources/security/summer-safety-tips.mp4" type="video/mp4">您的浏览器暂不支持视频播放。</video><div class="security-feature-copy"><div class="security-card-meta"><strong>15</strong><span>/ 2026-07</span><em>视频</em></div><h4>暑假安全须知</h4><p>增强暑期安全意识，平安、健康、充实地度过假期。</p></div></article><article class="security-feature security-placeholder-card"><div class="security-media"><span>视频待上传</span></div><div class="security-feature-copy"><div class="security-card-meta"><em>视频</em></div><h4>安全科普视频</h4></div></article><article class="security-feature security-placeholder-card"><div class="security-media"><span>视频待上传</span></div><div class="security-feature-copy"><div class="security-card-meta"><em>视频</em></div><h4>安全科普视频</h4></div></article></div><div class="security-compact-grid"><article class="security-compact"><div class="security-file-icon">PDF</div><div class="security-compact-copy"><em>文件</em><h4>安全科普文件</h4><p>待上传</p></div></article><article class="security-compact"><div class="security-file-icon">PDF</div><div class="security-compact-copy"><em>文件</em><h4>安全科普文件</h4><p>待上传</p></div></article><article class="security-compact"><div class="security-file-icon">PDF</div><div class="security-compact-copy"><em>文件</em><h4>安全科普文件</h4><p>待上传</p></div></article></div>`

    const fraudSection = document.querySelector('#fraud')
    if (fraudSection) {
      const fraudTabs = [...fraudSection.querySelectorAll('[data-tab="fraud"]')]
      if (fraudTabs[0]) {
        fraudTabs[0].textContent = '防诈教育'
        fraudTabs[0].dataset.panels = '["fraudType"]'
      }
      fraudTabs.slice(1).forEach((tab) => tab.remove())
      this.renderFraudEducationList()
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
    if (homeNews) {
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
