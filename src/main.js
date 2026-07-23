import { createApp, nextTick, ref, watch } from 'vue'

const sectionIds = ['top', 'news', 'policy', 'security', 'fraud', 'ai', 'contact']

createApp({
  setup() {
    const activeSection = ref('top')
    const menuOpen = ref(false)
    const newsDirectory = ref('all')
    const panel = ref({ policy: 'policyNatl', fraud: 'fraudType', contact: 'contactInfo' })
    const aiKey = ref('prompt')
    const aiLessons = {
      prompt: ['提示词与任务设计', '目标对象与背景语境', '具体任务与可用材料', '输出格式和限制条件', '来源、核验与不确定性要求'],
      verify: ['生成内容核验', '找到可追溯的原始来源', '检查作者、日期与适用范围', '交叉验证关键数字', '标记无法确认的内容'],
      ethics: ['科研伦理与披露', '遵循课程或期刊规则', '说明AI参与环节', '不虚构引用和数据', '由提交者承担最终责任'],
      agri: ['智慧农业案例', '检查数据采集质量', '区分模型预测与现场事实', '考虑作物、季节和区域差异', '保留农艺专家最终判断']
    }

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

    const selectSection = (id) => {
      if (!sectionIds.includes(id)) return
      activeSection.value = id
      menuOpen.value = false
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
      document.querySelectorAll('[data-news-directory]').forEach((button) => {
        button.classList.toggle('active', button.dataset.newsDirectory === type)
      })
      document.querySelectorAll('#news .news-list-row').forEach((row) => {
        row.classList.toggle('hidden', type !== 'all' && row.dataset.newsList !== type)
      })
    }

    const selectAi = (key) => {
      aiKey.value = key
      document.querySelectorAll('[data-ai]').forEach((button) => button.classList.toggle('active', button.dataset.ai === key))
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
      const menu = event.target.closest('#menu')

      if (menu) {
        event.preventDefault()
        event.stopImmediatePropagation()
        menuOpen.value = !menuOpen.value
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
      } else if (aiButton) {
        event.preventDefault()
        event.stopImmediatePropagation()
        selectAi(aiButton.dataset.ai)
      }
    }

    return { interceptInteractions, selectSection, syncSections }
  },
  mounted() {
    const fromHash = window.location.hash.slice(1)
    if (sectionIds.includes(fromHash)) this.selectSection?.(fromHash)
    this.syncSections()
    document.addEventListener('click', this.interceptInteractions, true)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.interceptInteractions, true)
  },
  template: '<span aria-hidden="true" style="display:none"></span>'
}).mount('#vue-runtime')
