// Randomly generated using http://medialab.github.io/iwanthue/. Other tools to check out: http://vrl.cs.brown.edu/color https://carto.com/carto-colors/ https://colorbrewer2.org/ https://stackoverflow.com/questions/470690/how-to-automatically-generate-n-distinct-colors
const COLORS = ["#ae3652", "#46a338", "#7547cb", "#909537", "#d24ac2", "#43966d", "#d64a2e", "#6176c0", "#b06f32", "#a15191", "#5a6426", "#d77075"]

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

function markPropositions(contextElement, propositionList) {
  const markContext = new Mark(contextElement)
  propositionList.forEach((prop, propIdx) => {
    // mark单个回答的单个proposition
    markContext.mark(prop.content, {
      className: `proposition proposition-${propIdx}`,
      separateWordSearch: false,
      acrossElements: true,
    })
  })
}

function addToNote(prop, propIdx, dataAnswer) {
  const noteContainer = document.getElementById('note-container')
  // check whether the concept name already exists or not
  const conceptElements = noteContainer.querySelectorAll(".concept")

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
      el.addEventListener('click', () => {
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

  // 计算Concept集合以及颜色对应
  const conceptList = _.uniq(answers.reduce((acc, cur) => [
    ...acc,
    ...cur.propositions.map(prop => prop.concept)
  ], [])).sort()
  const conceptColorMap = _.zipObject(conceptList, COLORS)

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
})

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
