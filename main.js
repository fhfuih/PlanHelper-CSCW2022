// Randomly generated using http://medialab.github.io/iwanthue/. Other tools to check out: http://vrl.cs.brown.edu/color https://carto.com/carto-colors/ https://colorbrewer2.org/ https://stackoverflow.com/questions/470690/how-to-automatically-generate-n-distinct-colors
const COLORS = ["#c7ffdd", "#f5c8ff", "#86e4b8", "#f4ba9a", "#45e0e9", "#d9cc80", "#64d5ff", "#f3ffb6", "#abd7dd", "#ffe0c8"]

// note pane dnd
const sortableOptions = {
  group: 'note',
  animation: 150,
  fallbackOnBody: true,
  swapThreshold: 0.65,
  handle: '.drag-handle',
  onEnd: function(evt){
    // update concept pane data after drag and drop
    const draggedItem = evt.item
    if (draggedItem.classList.contains(`concept`)){}
    else if(draggedItem.classList.contains(`note`)){
      const propContent = draggedItem.querySelector(`.content`).textContent
      const currentConcept = evt.to.getAttribute('data-concept')
      updateConceptPaneData([propContent, currentConcept], 'drag-proposition')
    }

  }
}
// note pane popover button menu
let lastPopoverReference;

let answers; // 全局answers（应该不需要全局留着question吧）
let collapsedAnswers;
let notePaneData = []; // [{'content': ,'concept': ,'subconcept':}, {...}]
let operationHistory = []; // [{'name': 'add-proposition', 'data': prop}, {'name': 'drag-and-drop', 'data':[prop/concept, from, to]}, {'name': 'edit-note', 'data':prop/concept}]
function fetchPageData(question) {
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
    el[0].scrollIntoView({block: 'center'})
    el.forEach((e, i) => {
      if (e.classList.contains('blink')) return
      e.classList.add('blink')
      setTimeout(() => e.classList.remove('blink'), 2000)
    })
  } else {
    if (!el) return
    el.scrollIntoView({block: 'center'})
    if (el.classList.contains('blink')) return
    el.classList.add('blink')
    setTimeout(() => el.classList.remove('blink'), 2000)
  }
}

function setElData(el, data) {
  const {ansIdx, colAnsIdx, simAnsIdx, propIdx} = data
  el.setAttribute('data-proposition', propIdx)
  if (ansIdx != undefined) {
    el.setAttribute('data-answer', ansIdx)
  }
  if (simAnsIdx != undefined && colAnsIdx != undefined) {
    el.setAttribute('data-similar-answer', simAnsIdx)
    el.setAttribute('data-collapsed-answer', colAnsIdx)
  }
}

function getElData(el) {
  const propEl = el.closest('[data-proposition]')
  const ansEl = el.closest('[data-answer]')
  const simAnsEl = el.closest('[data-similar-answer]')
  if (!propEl) return null
  if (!ansEl && !simAnsEl) return null
  else if (simAnsEl) {
    return {
      propIdx: propEl.dataset.proposition,
      simAnsIdx: simAnsEl.dataset.similarAnswer,
      colAnsIdx: simAnsEl.dataset.collapsedAnswer,
    }
  } else {
    return {
      propIdx: propEl.dataset.proposition,
      ansIdx: ansEl.dataset.answer,
    }
  }
}

function getDataSelector(data) {
  const {ansIdx, colAnsIdx, simAnsIdx, propIdx} = data
  if (ansIdx != undefined) return `[data-answer="${ansIdx}"][data-proposition="${propIdx}"]`
  else if (colAnsIdx != undefined && simAnsIdx != undefined) return `[data-similar-answer="${simAnsIdx}"][data-collapsed-answer="${colAnsIdx}"][data-proposition="${propIdx}"]`
}

function getAnswer(data) {
  const {ansIdx, colAnsIdx} = data
  if (ansIdx != undefined) return answers[ansIdx]
  else if (colAnsIdx != undefined) return collapsedAnswers[colAnsIdx]
}

function getProposition(data) {
  const ans = getAnswer(data)
  return ans.propositions[data.propIdx]
}

/** 既然现在answer container 和note container都会标注data-*，不传入parent可能导致选择的元素并非是自己想要的 */ 
function getPropositionEl(data, parent, all=false) {
  parent = parent ?? document
  const {ansIdx, colAnsIdx, simAnsIdx, propIdx} = data
  const method = all ? 'querySelectorAll' : 'querySelector'
  if (ansIdx != undefined) return parent[method](`[data-answer="${ansIdx}"][data-proposition="${propIdx}"]`)
  else if (colAnsIdx != undefined) return parent[method](`[data-collapsed-answer="${colAnsIdx}"][data-proposition="${propIdx}"]`)
  else if (simAnsIdx != undefined) return parent[method](`[data-similar-answer="${simAnsIdx}"][data-proposition="${propIdx}"]`)
  return null
}

function getPropositionCheckboxEl(data) {
  const elList = getPropositionEl(data, document.getElementById('answer-container'), true)
  const lastEl = elList[elList.length - 1]
  return lastEl.nextElementSibling
}

function markPropositions(contextElement, propositionList, dataWithoutPropIdx) {
  const markContext = new Mark(contextElement)
  propositionList.forEach((prop, propIdx) => {
    // mark单个回答的单个proposition
    markContext.mark(prop.content, {
      className: `proposition proposition-${propIdx} concept-${prop.concept}`,
      separateWordSearch: false,
      acrossElements: true,
      each(el) {
        el.title = 'Click to add the proposition to the note pane.\nCtrl+click to locate the proposition in the note pane (if exists).'
        el.setAttribute('data-proposition', propIdx)
        setElData(el, {...dataWithoutPropIdx, propIdx})
      }
    })
  })
}

function addToNote(data) {
  const noteContainer = document.getElementById('note-container')
  // check whether the concept name already exists or not
  const conceptElements = noteContainer.querySelectorAll(".concept .content")
  const prop = getProposition(data)
  let conceptExist = false;
  const conceptName = prop.concept
  const propositionContent = prop.content
  const subconceptName = prop.subconcept
  conceptElements.forEach(concept_el => {
    if (concept_el.textContent == conceptName){
      conceptExist = true;
    }
  })
  

  
  // change the color of the concept badge in concept pane if the concept exists
  
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
    propositionContainer.id = `proposition-${data.propIdx}-container`
    propositionContainer.setAttribute('data-concept', conceptName)
    propositionContainer.setAttribute('data-subconcept', subconceptName)
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
  setElData(propositionElement, data)
  propositionContainer.append(propositionElement)

  updateConceptPaneData(data=prop, operation='add')
}

function removeFromNote(data) {
  const noteContainer = document.getElementById('note-container')
  // remove the proposition
  const propositionElement = getPropositionEl(data, noteContainer)
  const propositionContainer = propositionElement.parentElement
  const propData = {'content' : propositionElement.querySelector(`.content`).textContent}
  const conceptName = propositionContainer.getAttribute('data-concept')
  const conceptElement = noteContainer.querySelector(`[concept-name="${conceptName}"]`)
  propositionElement.remove()
  
  // after removal, if there is no proposition under a concept, delete it
  if (propositionContainer.childElementCount == 0){
    clearConceptColor(conceptName)
    // Destroy d'n'd
    Sortable.get(propositionContainer).destroy()
    propositionContainer.remove()
    conceptElement.remove()
  }
  if (!noteContainer.childElementCount) {noteContainer.nextElementSibling.classList.remove('d-none')}
  
  updateConceptPaneData(data=propData, operation='delete')
}

function handlePropositionClicked(el, ctrlKey, isClickingCheckbox) {
  const data = getElData(el)
  // const propIdx = el.dataset.proposition
  const checkbox = getPropositionCheckboxEl(data)
  console.debug(data, 'clicked')
  // 跳转到note
  if (ctrlKey) {
    scrollIntoView(`.note${getDataSelector(data)}`)
    return
  }
  // toggle Checkbox (因为如果点击的是checkbox本身而不是文本，就不用程序toggle了)
  if (!isClickingCheckbox) {
    checkbox.checked = !checkbox.checked
  }
  // 添加note
  if (checkbox.checked) {
    addToNote(data)
  } else { // uncheck并移除
    removeFromNote(data)
  }
}

function linkPropositionAndNote(contextElement, propositionList) {
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
      // 给proposition mark添加鼠标进入监听
      el.addEventListener('mouseenter', () => {
        if (el.closest('.content').classList.contains('truncate')) return
        checkbox.style.visibility = 'visible'
      })
      el.addEventListener('mouseleave', () => {
        if (el.closest('.content').classList.contains('truncate')) return
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
  document.querySelector(`li[concept-name="${concept}"] .content`).removeAttribute('style')
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
  const simAnsNodes = ans.similarAnswers.map((colAnsIdx, simAnsIdx) => {
    const simAns = collapsedAnswers[colAnsIdx]
    const node = document.getElementById('template-similar-answer').content.firstElementChild.cloneNode(true)
    const contentNode = node.querySelector('.content')
    node.classList.add(`similar-answer-${simAnsIdx}`)
    node.querySelector('.author-name').textContent = simAns.author?.name ?? 'Anonymous'
    
    const conceptList = Array.from(new Set(simAns['propositions'].map((item) => {
      return item['concept']
    })))

    node.querySelector('.concept').append(...conceptList.map((item) => {
      const el = document.createElement('span')
      el.textContent = item
      el.classList.add('badge', 'bg-secondary', 'me-1')
      
      return el
    }))
    
    contentNode.innerHTML = simAns.html
    markPropositions(contentNode, simAns.propositions, {colAnsIdx, simAnsIdx})
    linkPropositionAndNote(contentNode, simAns.propositions)
    return node
  })
  allSimAnsContainer.querySelector('ul').append(...simAnsNodes)
}

function initConceptPane(answers) {
  // add concept badges to the concept-list-container
  const conceptListContainer = document.getElementById('concept-list-container')
  
  const conceptSet = new Set(answers.map(p => {
    const propositions = p['propositions']
    let concepts = []
    concepts.push(...propositions.map(el => {
      return el['concept']
    }))
    return concepts
  }).flat())

  conceptSet.forEach(el =>{
    const badge = document.createElement('span')
    badge.textContent = el
    badge.classList.add('badge', 'bg-secondary', 'me-1', 'concept-badge')
    badge.setAttribute('concept-name', `${el}`)
    conceptListContainer.append(badge)
  })

  const conceptElements = conceptListContainer.querySelectorAll(`.concept-badge`)
  conceptElements.forEach(el =>{
    el.addEventListener('mouseenter', () => {
      el.style.cursor = 'pointer'
    })
    el.title = 'Add some marked propositions to generate the mind map.'
    el.setAttribute('previous-color', 'bg-secondary')
    
  })



}

// 等价于jQuery的 $.ready(...) 即 $(...)
document.addEventListener('DOMContentLoaded', async () => {

  const res = await fetchPageData();
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
    answerNode.querySelector('.content').innerHTML = ans.html
    answerNode.querySelector('.date').textContent = dayjs(ans.date).format('MMM D, YYYY')
    answerNode.querySelector('.author-name').textContent = ans.author?.name ?? 'Anonymous'
    answerNode.querySelector('.author-description').textContent = ans.author?.description
    const conceptList = Array.from(new Set(ans['propositions'].map((item) => {
      return item['concept']
    })))

    answerNode.querySelector('.concept').append(...conceptList.map((item) => {
      const el = document.createElement('span')
      el.textContent = item
      el.classList.add('badge', 'bg-secondary', 'me-1')
      
      return el
    }))


    // const conceptEls = Array.from(new Set(ans['propositions'].map((item) => {
    //   const el = document.createElement('span')
    //   el.textContent = item.concept
    //   el.classList.add('badge', 'bg-secondary', 'me-1')
    //   return el
    // })))

    // answerNode.querySelector('.avatar').src = ans.author.avatar
    answerContainer.append(answerNode)

    // mark单个回答的所有proposition
    markPropositions(answerNode, ans.propositions, {ansIdx})
    linkPropositionAndNote(answerNode, ans.propositions)

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

  // 初始化concept pane
  initConceptPane(answers)
})

// 监听所有(Expand)按钮的事件
document.addEventListener('click', (e) => {
  if (e.target && e.target.matches('.content-collapse-button')) {
    const buttonEl = e.target
    const contentEl = buttonEl.parentElement.querySelector('.content')
    if (contentEl.classList.toggle('truncate')) { // returns true if now present
      buttonEl.textContent = '(Expand)'
    } else {
      buttonEl.textContent = '(Collapse)'
    }
  } else if (e.target && e.target.matches('.content:not(.truncate) .proposition')) {
    handlePropositionClicked(e.target, e.ctrlKey, false)
  } else if (e.target && e.target.matches('.content:not(.truncate) .proposition~input[type="checkbox"]')) {
    handlePropositionClicked(e.target.previousSibling, e.ctrlKey, true)
  }
  else if (e.target && e.target.matches('.concept-badge')){
    onConceptBadgeClick(e.target)
  }
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
  const data = getElData(li)
  li.querySelector('.content').textContent = getProposition(data).content
}

function onRemoveNoteClick() {
  const li = lastPopoverReference.closest('li')
  const data = getElData(li)
  getPropositionEl(data, document.getElementById('answer-container')).click()
}

function onEditConceptClick() {
  const newConcept = prompt('Please enter your concept')
  if (!newConcept) return
  const originalConcept = lastPopoverReference.closest('li').querySelector('.content').textContent
  lastPopoverReference.closest('li').querySelector('.content').textContent = newConcept

  updateConceptPaneData([originalConcept, newConcept], 'edit-concept')
  
}

function onResetConceptClick() {
  const li = lastPopoverReference.closest('li')
  const originalConcept = li.querySelector('.content').textContent
  li.querySelector('.content').textContent = li.getAttribute('concept-name')
  const newConcept = li.getAttribute('concept-name')
  updateConceptPaneData([originalConcept, newConcept], 'reset-concept')
}


function onConceptBadgeClick(el) {
  // construct or delete the mind map when the concept badges are clicked

  if (el.classList.contains('bg-primary')){
    el.classList.remove('bg-primary')
    el.classList.add(el.getAttribute('previous-color'))
    mindmapConfiguration(el.textContent, false)
    return
  }

  else if (el.classList.contains('bg-secondary')){
    el.setAttribute('previous-color', 'bg-secondary')
    // hide other mind maps and generate and show the mind map
  }
  else if (el.classList.contains('bg-success')){
    el.setAttribute('previous-color', 'bg-success')
  }
  const conceptListContainer = document.getElementById('concept-list-container')
  const conceptBadgeEls = conceptListContainer.querySelectorAll(`.concept-badge`)
  conceptBadgeEls.forEach(p => {
    if (p.classList.contains('bg-primary')){
      p.classList.remove('bg-primary')
      p.classList.add(p.getAttribute('previous-color'))
    }
  })

  el.classList.remove(el.getAttribute('previous-color'))
  el.classList.add('bg-primary')
  optionsAndMind = mindmapConfiguration(el.textContent, true)
  const jm = new jsMind(optionsAndMind[0])
  jm.show(optionsAndMind[1])

  // change the color of the "subconcept" nodes if the corresponding proposition is checked by user
  const checkedChildrenNodes = optionsAndMind[3]
  checkedChildrenNodes.forEach(item => {
    jm.set_node_color(item['id'], '#FF0000', '0000FF')
  })
  
}


function mindmapConfiguration(conceptName, construct){

  // configuration about the mind map based on the note pane data
  if (document.querySelector('.jsmind-inner')){ 
    const mindMapEl = document.querySelector('.jsmind-inner')
    mindMapEl.remove()
  }
  if (construct){
    const id = 'mindmap-container'
    document.getElementById(id).style.setProperty('height', '500px')

    let childrenNodes = []
    let checkedChildrenNodes = []

    const subconceptSet = new Set(answers.map(p => {
      const propositions = p['propositions']
      let subconcepts = []

      propositions.forEach(el => {
        if (el['concept'] === conceptName){
          subconcepts.push(el['subconcept'])
        }
      })

      return subconcepts
    }).flat())
    const subconceptList = Array.from(subconceptSet)
    subconceptList.forEach((el, idx) =>{
      childrenNodes.push({"id": `subconcept${idx}`, "topic": el})
      for (let i = 0; i < notePaneData.length; ++i){
        if(el === notePaneData[i]['subconcept']){
          checkedChildrenNodes.push({"id": `subconcept${idx}`, "topic": el})
          break
        }
      }
    })

    let data = {"id":"root", "topic":conceptName,"children":childrenNodes}


    const mind = {
      "meta":{
        "name": "CQA", // 这个参数居然是必须的？？
        "author": "HCI Lab, HKUST",
        "version": "1"
      },
      "format":"node_tree",
      "data" : data
    };

    const options = {
      container: id,
      editable: true,
      theme: 'orange',
      view: {
        hmargin: 0,        // 思维导图距容器外框的最小水平距离
        vmargin: 0,         // 思维导图距容器外框的最小垂直距离
      },
    };
    return [options, mind, childrenNodes, checkedChildrenNodes]

  }
}

function updateConceptPaneData(data, operation){
  // update info in concept everytime when note pane has some changes
  // The global variable is called note pane data because it keeps synchronized with the note pane.
  // But actually it is for the concept pane's outlook and mind map generation, that's why this function is called "updateConceptData"
  if (operation == 'add'){
    notePaneData.push(data)
  }
  else if(operation == 'delete'){
    notePaneData = notePaneData.filter((el) => {
      return el['content'] !== data['content']
    })
  }
  else if(operation === 'edit-concept' || operation === 'reset-concept'){
    const originalConcept = data[0]
    const newConcept = data[1]
    const conceptListContainer = document.getElementById('concept-list-container')
    const originalConceptBadge = conceptListContainer.querySelector(`[concept-name = "${originalConcept}"]`)
    originalConceptBadge.textContent = newConcept
    originalConceptBadge.setAttribute('concept-name', newConcept)
    notePaneData.forEach(el => {
      if (el['concept'] === originalConcept){
        el['concept'] = newConcept
      }
    })
  }
  else if(operation === 'drag-proposition'){
    const propContent = data[0]
    const targetConcept = data[1]
    for (let i = 0; i < notePaneData.length; ++i){
      if(notePaneData[i]['content'] === propContent){
        notePaneData[i]['concept'] = targetConcept
        break;
      }
    }
  }

  // change the badges' color after updating the record note pane data 

  const conceptListContainer = document.getElementById('concept-list-container')
  const conceptBadgeEls = conceptListContainer.querySelectorAll(`.concept-badge`)

  let checkedConcepts= []
  conceptBadgeEls.forEach(el => {
    for (let i =0; i < notePaneData.length; ++i){
      if (el.textContent === notePaneData[i]['concept']){
        checkedConcepts.push(el)
        break
      }
    }
  })

  conceptBadgeEls.forEach(el => {
    if (checkedConcepts.indexOf(el) != -1){
      if(el.classList.contains('bg-secondary')){
        el.classList.remove('bg-secondary');
        el.classList.add('bg-success');
      }
    }
    else {
      if(el.classList.contains('bg-success')){
        el.classList.remove('bg-success');
        el.classList.add('bg-secondary');
      }
    }
  })
}
