// Randomly generated using http://medialab.github.io/iwanthue/. Other tools to check out: http://vrl.cs.brown.edu/color https://carto.com/carto-colors/ https://colorbrewer2.org/ https://stackoverflow.com/questions/470690/how-to-automatically-generate-n-distinct-colors
const COLORS = ["#c7ffdd", "#f5c8ff", "#86e4b8", "#f4ba9a", "#45e0e9", "#d9cc80", "#64d5ff", "#f3ffb6", "#abd7dd", "#ffe0c8"]

// note pane dnd
const sortableOptions = {
  group: 'note',
  animation: 150,
  fallbackOnBody: true,
  swapThreshold: 0.65,
  handle: '.drag-handle'
}
// note pane popover button menu
let lastPopoverReference;

let answers; // 全局answers（应该不需要全局留着question吧）
let collapsedAnswers;

function getAnswers(question) {
  return new Promise((resolve) => {
    setTimeout(() => {
      answers = mock.answers
      collapsedAnswers = mock.collapsedAnswers
      resolve(mock)
    }, 1000)
  })
}

function scrollIntoView(el) {
  if (typeof el === 'string' || el instanceof String) {
    el = document.querySelectorAll(el)
  }
  if (el instanceof NodeList || Array.isArray(el)) {
    if (!el.length) return
    el[0].scrollIntoView()
    el.forEach((e, i) => {
      if (e.classList.contains('blink')) return
      e.classList.add('blink')
      setTimeout(() => e.classList.remove('blink'), 2000)
    })
  } else {
    if (!el) return
    el.scrollIntoView()
    if (el.classList.contains('blink')) return
    el.classList.add('blink')
    setTimeout(() => el.classList.remove('blink'), 2000)
  }
}

function markPropositions(contextElement, propositionList) {
  const markContext = new Mark(contextElement)
  propositionList.forEach((prop, propIdx) => {
    // mark单个回答的单个proposition
    markContext.mark(prop.content, {
      className: `proposition proposition-${propIdx} concept-${prop.concept}`,
      separateWordSearch: false,
      acrossElements: true,
      each(el) {
        el.title = 'Click to add the proposition to the note pane.\nCtrl+click to locate the proposition in the note pane (if exists).'
      }
    })
  })
}

function addToNote(prop, propIdx, dataAnswer) {
  const noteContainer = document.getElementById('note-container')
  // check whether the concept name already exists or not
  const conceptElements = noteContainer.querySelectorAll(".concept .content")

  let conceptExist = false;
  const conceptName = prop.concept
  const propositionContent = prop.content
  conceptElements.forEach(concept_el => {
    if (concept_el.textContent == conceptName){
      conceptExist = true;
    }
  })
  
  let propositionContainer;
  // if not exists, just create a new <li> containing the concept, and a <ul> containing the corresponding <li>proposition under it.
  if (!conceptExist){
    const conceptElement = document.getElementById('template-single-concept').content.firstElementChild.cloneNode(true)
    conceptElement.querySelector('.content').textContent = conceptName
    conceptElement.setAttribute('concept-name', conceptName)
    noteContainer.append(conceptElement)
    noteContainer.nextElementSibling.classList.add('d-none')

    propositionContainer = document.createElement('ul')
    propositionContainer.classList.add('proposition-container')
    propositionContainer.id = `proposition-${propIdx}-container`
    propositionContainer.setAttribute('data-concept', conceptName)
    conceptElement.append(propositionContainer)

    // Initialize drag'n'drop
    new Sortable(propositionContainer, sortableOptions)
  }
  // if exists, just find the target concept and add the <li>proposition in the <ul> proposition container
  else{
    propositionContainer = noteContainer.querySelector(`[data-concept="${conceptName}"]`)
  }
  const propositionElement = document.getElementById('single-note-template').content.firstElementChild.cloneNode(true)
  propositionElement.querySelector('.content').textContent = propositionContent
  propositionElement.setAttribute(dataAnswer.key, dataAnswer.value)
  propositionElement.setAttribute('data-proposition', propIdx)
  propositionContainer.append(propositionElement)
}

function removeFromNote(propIdx, dataAnswer) {
  const noteContainer = document.getElementById('note-container')
  // remove the proposition
  const propositionElement = noteContainer.querySelector(`[${dataAnswer.key}="${dataAnswer.value}"][data-proposition="${propIdx}"]`)
  const propositionContainer = propositionElement.parentElement
  const conceptName = propositionContainer.getAttribute('data-concept')
  const conceptElement = noteContainer.querySelector(`[concept-name="${conceptName}"]`)
  // Destroy d'n'd
  Sortable.get(propositionContainer).destroy()
  propositionElement.remove()
  // after removal, if there is no proposition under a concept, delete it

  if (propositionContainer.childElementCount == 0){
    propositionContainer.remove()
    conceptElement.remove()
  }
  if (!noteContainer.childElementCount) noteContainer.nextElementSibling.classList.remove('d-none')
}

function linkPropositionAndNote(contextElement, propositionList, dataAnswer) {
  propositionList.forEach((prop, propIdx) => {
    // 给这个proposition（的最后一个<mark>之后）加checkbox
    const markedElements = contextElement.querySelectorAll(`.proposition-${propIdx}`)
    const markedLast = markedElements[markedElements.length - 1]
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.classList.add('form-check-input')
    markedLast.insertAdjacentElement('afterend', checkbox)
    
    // 点击proposition的时候自动check
    markedElements.forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.ctrlKey) { // 跳转到note
          const answer = e.target.closest('.answer')
          let ansIdx, propIdx;
          answer.classList.forEach(c => c.slice(0, -1) == 'answer-' && (ansIdx = c.charAt(c.length - 1)))
          e.target.classList.forEach(c => c.slice(0, -1) == 'proposition-' && (propIdx = c.charAt(c.length - 1)))
          scrollIntoView(`.note[data-answer="${ansIdx}"][data-proposition="${propIdx}"]`)
          return
        } // 添加note
        if (!checkbox.checked) { // 如果没有check，check并加入note
          checkbox.checked = true
          addToNote(prop, propIdx, dataAnswer)
        } else { // uncheck并移除
          checkbox.checked = false
          removeFromNote(propIdx, dataAnswer)
        }
      })
      // 给proposition mark添加鼠标进入监听
      el.addEventListener('mouseenter', () => {
        checkbox.style.visibility = 'visible'
      })
      el.addEventListener('mouseleave', () => {
        checkbox.style.removeProperty('visibility')
      })
    })    
  })
}

function changeConceptColor(concept, color, isDark) {
  document.querySelectorAll(`mark.proposition.concept-${concept}`).forEach((el) => {
    el.style.backgroundColor = color
    el.style.color = isDark ? 'white' : 'black'
  })
  const el = lastPopoverReference.closest('li').querySelector('.content')
  el.style.backgroundColor = color
  el.style.color = isDark ? 'white' : 'black'
}

function clearConceptColor(concept) {
  document.querySelectorAll(`mark.proposition.concept-${concept}`).forEach((el) => {
    el.removeAttribute('style')
  })
  lastPopoverReference.closest('li').querySelector('.content').removeAttribute('style')
}

function initNotePaneDoubleClickNote() {
  document.getElementById('note-container').addEventListener('click', (e) => {
    if (e.target && e.target.matches('.note > .content') && e.ctrlKey) {
      e.preventDefault()
      const li = e.target.closest('li')
      const ansIdx = li.getAttribute('data-answer')
      const propIdx = li.getAttribute('data-proposition')
      scrollIntoView(`.answer-${ansIdx} .proposition-${propIdx}`)
    }
  })
}

function initNotePaneButtonMenu() {
  const options = {
    trigger: 'focus',
    container: 'body',
    placement: 'bottom',
    html: true, // the content is three HTML buttons. Inject them as-is
    sanitize: false, // By default, button elements are sanitized and not allowed (https://getbootstrap.com/docs/5.0/getting-started/javascript/#sanitizer). Turn this off
    popperConfig: { // remember which three-dot button is clicked. This cannot be traced on-the-fly because the popover element is appended to body, not the note element's child
      onFirstUpdate: (state) => {
        const {elements: {reference}} = state
        lastPopoverReference = reference
      }
    }
  }
  const noteContainer = document.getElementById('note-container')
  // Note menu
  new bootstrap.Popover(noteContainer, {
    ...options,
    selector: '.popover-note-menu',
    content: document.getElementById('template-note-popover').innerHTML.trim(),
  })
  // Concept menu
  new bootstrap.Popover(noteContainer, {
    ...options,
    selector: '.popover-concept-menu',
    content: document.getElementById('template-concept-popover').innerHTML.trim(),
    popperConfig: {
      onFirstUpdate: (state) => {
        // console.log(state)
        const {elements: {reference}} = state
        lastPopoverReference = reference
        const pickr = new Pickr({
          el: '.color-picker',
          theme: 'nano',
          useAsButton: true,
          swatches: COLORS,
          default: '#000000',
          lockOpacity: true,
          components: {
            preview: true,
            hue: true,
            interaction: {
                hex: true,
                rgba: true,
                input: true,
                clear: true,
                save: true
            }
          }
        })
        pickr.on('save', (color, instance) => {
          const li = lastPopoverReference.closest('li')
          const concept = li.getAttribute('concept-name')
          if (!color) return clearConceptColor(concept)
          const isDark = color.toHSLA()[2] < 50
          color = color.toHEXA().toString()
          console.log('Saving color', color, 'to concept', concept);
          changeConceptColor(concept, color, isDark)
          instance.hide()
        })
        // 妈的这里不想处理了
        // 总之就是，popover消失的时候是直接从DOM树删除了的，Pickr必须在构造的时候挂靠在当时popover（中的button）上。
        // popover再点一遍的时候就是新的popover元素了，也要创建新的Pickr实例。
        // 久而久之，老的Pickr实例也没有销毁，就有内存泄漏。
        // naive的解决方法是在Pickr hide时自我销毁，因为打开Pickr的瞬间focus发生变化、popover已经没了，所以等这次Pickr隐藏时理论上可以销毁
        // 但是这样做蜜汁在save时可以，在clear时报错。所以加了个1秒的延迟
        pickr.on('hide', instance => {
          if (!document.body.contains(instance.el)) setTimeout(() => instance.destroyAndRemove(), 1000)
        })
      }
    }
  })
}

function onSimilarAnswerExpand(ansIdx, simAnsIdx) {
  function handler(e) {
    const button = e.target
    const content = document.querySelector(`.answer-${ansIdx} .similar-answer-${simAnsIdx} .content`)
    const isCollapsed = content.classList.contains('truncate')
    if (isCollapsed) { // 没有expand，要展开
      button.textContent = '(Collapse)'
      content.classList.remove('truncate')
    } else {
      button.textContent = '(Expand)'
      content.classList.add('truncate')
    }
  }
  return handler
}

function addSimilarAnswer(ansIdx) {
  const ans = answers[ansIdx]
  if (!ans.similarAnswers.length) return;
  const allSimAnsContainer = document.querySelector(`.answer-${ansIdx} .similar-answers`)
  const accordionButton = allSimAnsContainer.querySelector('.accordion-button')
  const accordionCollapse = allSimAnsContainer.querySelector('.accordion-collapse.collapse')
  allSimAnsContainer.classList.remove('d-none')
  // 折叠容器配置，参见bootstrap文档
  const accordionId = `similar-answer-accordion-${ansIdx}`
  const collapseId = `similar-answer-collapse-${ansIdx}`
  allSimAnsContainer.querySelector('.accordion').id = accordionId
  accordionCollapse.id = collapseId
  accordionCollapse.setAttribute('data-bs-parent', `#${accordionId}`)
  accordionButton.append(`(${ans.similarAnswers.length})`)
  accordionButton.setAttribute('data-bs-target', `#${collapseId}`)
  accordionButton.setAttribute('aria-controls', collapseId)
  // 创建每一个similar answer的组件
  const simAnsNodes = ans.similarAnswers.map((simAnsNumber, simAnsIdx) => {
    const simAns = collapsedAnswers[simAnsNumber]
    const node = document.getElementById('template-similar-answer').content.firstElementChild.cloneNode(true)
    const contentNode = node.querySelector('.content')
    const expandButton = node.querySelector('button')
    node.classList.add(`similar-answer-${simAnsIdx}`)
    node.querySelector('.author-name').textContent = simAns.author?.name ?? 'Anonymous'
    node.querySelector('.concept').append(...simAns.propositions.map(p => {
      const el = document.createElement('span')
      el.textContent = p.concept
      el.classList.add('badge', 'bg-secondary', 'me-1')
      return el
    }))
    contentNode.innerHTML = simAns.html
    expandButton.addEventListener('click', onSimilarAnswerExpand(ansIdx, simAnsIdx))
    markPropositions(contentNode, simAns.propositions)
    return node
  })
  allSimAnsContainer.querySelector('ul').append(...simAnsNodes)
}

// 等价于jQuery的 $.ready(...) 即 $(...)
document.addEventListener('DOMContentLoaded', async () => {
  const res = await getAnswers();
  const {question, description} = res; // answers 和 collapsedAnswers在await之后已经写入全局

  // 加载问题
  document.getElementById('question').textContent = question
  document.getElementById('question-description').textContent = description

  // 加载所有回答
  const answerContainer = document.getElementById('answer-container')
  const answerTemplate = document.getElementById('template-answer').content.firstElementChild
  answers.forEach((ans, ansIdx) => {
    // 加载单个回答的内容
    const answerNode = answerTemplate.cloneNode(true)
    answerNode.classList.add(`answer-${ansIdx}`)
    answerNode.querySelector('.answer-content').innerHTML = ans.html
    answerNode.querySelector('.date').textContent = dayjs(ans.date).format('MMM D, YYYY')
    answerNode.querySelector('.author-name').textContent = ans.author?.name ?? 'Anonymous'
    answerNode.querySelector('.author-description').textContent = ans.author?.description
    // answerNode.querySelector('.avatar').src = ans.author.avatar
    answerContainer.append(answerNode)

    // mark单个回答的所有proposition
    markPropositions(answerNode, ans.propositions)
    linkPropositionAndNote(answerNode, ans.propositions, {key: 'data-answer', value: ansIdx})

    // 增加单个回答的所有类似回答
    addSimilarAnswer(ansIdx)
  })

  // 初始化note pane外层的dnd
  const noteContainer = document.getElementById('note-container')
  new Sortable(noteContainer, {
    ...sortableOptions,
    group: 'concept',
  })
  // 初始化note pane的button menu
  initNotePaneButtonMenu()
  // 初始化note pane双击跳转
  initNotePaneDoubleClickNote()
})

// 监听ctrl键有没有按下并调整style
function ctrlHandler(e) {
  document.body.className = e.ctrlKey ? 'ctrl-down' : ''
}
document.addEventListener('keydown', ctrlHandler)
document.addEventListener('keyup', ctrlHandler)

function onEditNoteClick() {
  const newProp = prompt('Please enter your proposition')
  if (!newProp) return
  lastPopoverReference.closest('li').querySelector('.content').textContent = newProp
}

function onResetNoteClick() {
  const li = lastPopoverReference.closest('li')
  const ansIdx = li.getAttribute('data-answer')
  const propIdx = li.getAttribute('data-proposition')
  li.querySelector('.content').textContent = answers[ansIdx].propositions[propIdx].content
}

function onRemoveNoteClick() {
  const li = lastPopoverReference.closest('li')
  const ansIdx = li.getAttribute('data-answer')
  const propIdx = li.getAttribute('data-proposition')
  document.querySelector(`.answer-${ansIdx} .proposition-${propIdx}`).click()
}

function onEditConceptClick() {
  onEditNoteClick()
}
function onResetConceptClick() {
  const li = lastPopoverReference.closest('li')
  li.querySelector('.content').textContent = li.getAttribute('concept-name')
}
function onColorConceptClick() {

}
