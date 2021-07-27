// Randomly generated using http://medialab.github.io/iwanthue/. Other tools to check out: http://vrl.cs.brown.edu/color https://carto.com/carto-colors/ https://colorbrewer2.org/ https://stackoverflow.com/questions/470690/how-to-automatically-generate-n-distinct-colors
const COLORS = ["#c7ffdd", "#f5c8ff", "#86e4b8", "#f4ba9a", "#45e0e9", "#d9cc80", "#64d5ff", "#f3ffb6", "#abd7dd", "#ffe0c8"]
let calledByUndoRedo = false;
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
    redoList = []
  },
  // only update operation history data when the dragged item's position is changed
  onUpdate: function(evt){
    const draggedItem = evt.item
    const operationData = {'name': 'drag-and-drop-update', 'data':[draggedItem, evt.from, evt.to, evt.oldIndex, evt.newIndex]}
    updateOperationHistory(operationData)
  },
  onRemove: function(evt){
    const draggedItem = evt.item
    const operationData = {'name': 'drag-and-drop-remove', 'data':[draggedItem, evt.from, evt.to, evt.oldIndex, evt.newIndex]}
    updateOperationHistory(operationData)
  }
}
// note pane popover button menu
let lastPopoverReference;
let lastClickedBadgeConcept;

let answers; // 全局answers（应该不需要全局留着question吧）
let collapsedAnswers;
let notePaneData = []; // [{'content': ,'concept': ,'subconcept':}, {...}]
let operationHistory = []; // [{'name': 'add-proposition', 'data': prop}, {'name': 'drag-and-drop', 'data':[prop/concept, from, to]}, {'name': 'edit-note', 'data':prop/concept}]
let redoList = [];
let subConceptModal;

function fetchPageData() {
  const queryParams = new URLSearchParams(window.location.search)
  const isBaseline = window.location.port == '8001'
  const question = queryParams.get('question')
  if (!question) {
    return new Promise((resolve) => {
      setTimeout(() => {
        answers = mock.answers
        collapsedAnswers = mock.collapsedAnswers
        resolve(mock)
      }, 1000)
    })
  }
  const url = `http://106.55.11.129:8000/${isBaseline ? 'bs' : 'exp'}/${question}.json`
  return fetch(url)
    .then(res => {
      if (res.ok) return res.json()
      else if (res.status == 404) throw new Error('Unknown question')
      throw new Error(`Unknown error: ${res.status} (${res.statusText}) while fetching page data`)
    })
    .then(j => {
      answers = j.answers
      collapsedAnswers = j.collapsedAnswers
      return j
    })
    .catch(e => {
      alert(e.message)
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
  else {
    el.setAttribute('data-similar-answer', simAnsIdx)
    el.setAttribute('data-collapsed-answer', colAnsIdx)
  }
}

function getElData(el) {
  const propEl = el.closest('[data-proposition]')
  const ansEl = el.closest('[data-answer]')
  const colAnsEl = el.closest('[data-collapsed-answer]')
  if (!propEl) return null
  if (!ansEl && !colAnsEl) return null
  else if (colAnsEl) {
    return {
      propIdx: propEl.dataset.proposition,
      simAnsIdx: colAnsEl.dataset.similarAnswer,
      colAnsIdx: colAnsEl.dataset.collapsedAnswer,
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
  // 没有加similar answer index因为这样能兼容modal框的调用（modal框里面的proposition是“指定subconcept的所有proposition”，故只有ansIdx或colAnsIdx）
  else if (colAnsIdx != undefined) return `[data-collapsed-answer="${colAnsIdx}"][data-proposition="${propIdx}"]`
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
    const conceptConcentElement = conceptElement.querySelector('.content')
    conceptConcentElement.textContent = conceptName
    conceptElement.setAttribute('concept-name', conceptName)
    noteContainer.append(conceptElement)

    propositionContainer = document.createElement('ul')
    propositionContainer.classList.add('proposition-container')
    propositionContainer.id = `proposition-${data.propIdx}-container`
    propositionContainer.setAttribute('data-concept', conceptName)
    propositionContainer.setAttribute('data-subconcept', subconceptName)
    conceptElement.append(propositionContainer)

    // 初始化新concept下的 drag'n'drop
    new Sortable(propositionContainer, sortableOptions)

    // 初始化新concept下的 collapse
    const collapseHandle = conceptElement.querySelector('.collapse-handle')
    collapseHandle.setAttribute('data-bs-target', '#'+propositionContainer.id)
    collapseHandle.setAttribute('aria-controls', propositionContainer.id)
    propositionContainer.classList.add('collapse', 'show')

    // 同步之前设置的concept颜色（如有）
    const badge = document.querySelector(`#answer-container .badge[concept-name="${conceptName}"]`)
    conceptConcentElement.setAttribute('style', badge.getAttribute('style'))
  }
  // if exists, just find the target concept and add the <li>proposition in the <ul> proposition container
  else{
    propositionContainer = noteContainer.querySelector(`[data-concept="${conceptName}"]`)
  }
  const propositionElement = document.getElementById('single-note-template').content.firstElementChild.cloneNode(true)
  propositionElement.querySelector('.content').textContent = propositionContent
  setElData(propositionElement, data)
  propositionContainer.append(propositionElement)
  
  updateConceptPaneData(prop, operation='add')
  prop['propIdx'] = data['propIdx']
  if(data.hasOwnProperty('ansIdx')){
    prop['ansIdx'] = data['ansIdx']
  }
  else {
    prop['simAnsIdx'] = data['simAnsIdx']
    prop['colAnsIdx'] = data['colAnsIdx']
  }
  if(!calledByUndoRedo){
    const operationData = {'name': 'add-note', 'data': prop}
    updateOperationHistory(operationData)
  }
}

function removeFromNote(data) {
  const noteContainer = document.getElementById('note-container')
  // remove the proposition
  const propositionElement = getPropositionEl(data, noteContainer)
  const propositionContainer = propositionElement.parentElement
  let propData = {'content' : propositionElement.querySelector(`.content`).textContent}
  const conceptName = propositionContainer.getAttribute('data-concept')
  const conceptElement = noteContainer.querySelector(`[concept-name="${conceptName}"]`)

  propData['propIdx'] = propositionElement.getAttribute('data-proposition')
  propData['ansIdx'] = propositionElement.getAttribute('data-answer')

  propositionElement.remove()
  
  // after removal, if there is no proposition under a concept, delete it
  if (propositionContainer.childElementCount == 0){
    // clearConceptColor(conceptName)
    // Destroy d'n'd
    Sortable.get(propositionContainer).destroy()
    propositionContainer.remove()
    conceptElement.remove()
  }
  
  updateConceptPaneData(data=propData, operation='delete')

  if(!calledByUndoRedo){
    const operationData = {'name': 'remove-note', 'data': propData}
    updateOperationHistory(operationData)
  }
}

function handlePropositionClicked(el, ctrlKey, isClickingCheckbox) {
  const data = getElData(el)
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
  if(!calledByUndoRedo){
    redoList = []
  }
}

function handleSubConceptPropositionClicked(el, checkboxEl, isClickingCheckbox) {
  const data = getElData(el)
  const checkboxInAnswerPane = getPropositionCheckboxEl(data)
  if (!isClickingCheckbox) {
    checkboxEl.checked = !checkboxEl.checked
  }
  if (checkboxEl.checked) {
    addToNote(data)
  } else {
    removeFromNote(data)
  }
  checkboxInAnswerPane.checked = checkboxEl.checked
  if(!calledByUndoRedo){
    redoList = []
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
  const els = [
    ...document.querySelectorAll(`#note-container > li[concept-name="${concept}"] > .content`), // note pane concept 应该只有一个，但是如果没有，querySelector就会返回一个null。使用querySelectorAll出一个空list
    ...document.querySelectorAll(`mark.proposition.concept-${concept}`), // answer pane propositions
    ...document.querySelectorAll(`.badge[concept-name="${concept}"]`) // answer+concept pane badges
  ]
  const fromColor = els[0].style.backgroundColor;
  const fromIsDark = (els[0].style.color == 'white' || els[0].style.color == "") ? true : false
  els.forEach((el) => {
    // 因为有 !important，必须setAttribute修改，不能.style.setProperty或者.style.backgroundColor = 修改
    el.setAttribute('style', `background-color: ${color} !important; color: ${isDark ? 'white' : 'black'} !important;`)
  })
  if(!calledByUndoRedo){
    const operationHistory = {'name': 'change-concept-color', 'data': {'from-color': fromColor, 'to-color':color ,'concept-name': concept, 'from-is-dark': fromIsDark, 'to-is-dark': isDark}}
    updateOperationHistory(operationHistory)
    redoList = []
  }
}

function clearConceptColor(concept) {
  const els = [
    ...document.querySelectorAll(`#note-container > li[concept-name="${concept}"] > .content`), // note pane concept
    ...document.querySelectorAll(`mark.proposition.concept-${concept}`), // answer pane propositions
    ...document.querySelectorAll(`.badge[concept-name="${concept}"]`) // answer+concept pane badges
  ]
  let fromColor = els[0].style.backgroundColor
  const isDark = els[0].style.color == 'white' ? true : false;
  els.forEach((el) => {
    el.removeAttribute('style')
  })
  if(!calledByUndoRedo){
    const operationHistory = {'name': 'change-concept-color', 'data': {'from-color': fromColor, 'to-color': '','concept-name': concept, 'from-is-dark': isDark, 'to-is-dark': ""}}
    updateOperationHistory(operationHistory)
    redoList = []
  }
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

function initNoteConceptPaneSplit() {
  window.Split(['#note-pane-card', '#concept-pane-card'], {
    sizes: [40, 60],
    gutterSize: 24,
    direction: 'vertical',
    cursor: 'row-resize',
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
          console.log('Saving color', color, 'to aspect', concept);
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
  if (!ans.similarAnswers || !ans.similarAnswers.length) return;
  const allSimAnsContainer = document.querySelector(`.answer-${ansIdx} .similar-answers`)
  const accordionButton = allSimAnsContainer.querySelector('.accordion-button')
  const accordionCollapse = allSimAnsContainer.querySelector('.accordion-collapse.collapse')
  allSimAnsContainer.classList.remove('invisible')
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
    node.querySelector('.date').textContent = dayjs(simAns.date).format('MMM D, YYYY')
    node.querySelector('.author-name').textContent = simAns.author?.name ?? 'Anonymous'
    node.querySelector('.author-description').textContent = simAns.author?.description
    const conceptList = Array.from(new Set(simAns['propositions'].map((item) => {
      return item['concept']
    })))

    node.querySelector('.concept').append(...conceptList.map((item) => {
      const el = document.createElement('span')
      el.textContent = item
      el.classList.add('badge', 'bg-secondary', 'me-1')
      el.setAttribute('concept-name', item)
      el.title = 'Click to set the visual color of this aspect'
      return el
    }))

    node.querySelector('.views').textContent = simAns.statisticsData?.views
    node.querySelector('.upvotes').textContent = simAns.statisticsData?.upvotes
    
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
    badge.title = 'Add some marked propositions to generate the mind map.'
    badge.setAttribute('previous-color', 'bg-secondary')
    badge.setAttribute('concept-name', el)
    conceptListContainer.append(badge)
  })
}

function initToTopButton() {
  const mybutton = document.getElementById("back-to-top");
  window.onscroll = function () {
    if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
      mybutton.style.setProperty('display', 'block')
    } else {
      mybutton.style.setProperty('display', 'none')
    }
  }
}

function initSubConceptModal() {
  const subConceptModalEl = document.getElementById('subConceptModal')
  subConceptModal = new bootstrap.Modal(subConceptModalEl)
  const modalTitleEl = subConceptModalEl.querySelector('#subConceptModalLabel > span')
  // 当打开时（加载modal内容）
  subConceptModalEl.addEventListener('show.bs.modal', e => {
    const jmnode = e.relatedTarget
    const subconcept = jmnode.textContent
    modalTitleEl.textContent = subconcept
    const propElList = answers
      .reduce((acc, cur, ansIdx) => [
        ...acc,
        ...cur.propositions.map((p, propIdx) => {
          if (p.subconcept !== subconcept) return null
          const el = document.createElement('li')
          el.innerHTML = `<span class="proposition" data-proposition="${propIdx}" data-answer="${ansIdx}">${p.content}</span><input type="checkbox" class="form-check-input">`
          return el
        }).filter(el => !!el)
      ], [])
      .concat(collapsedAnswers.reduce((acc, cur, colAnsIdx) => [
        ...acc,
        ...cur.propositions.map((p, propIdx) => {
          if (p.subconcept !== subconcept) return null
          const el = document.createElement('li')
          el.innerHTML = `<span class="proposition" data-proposition="${propIdx}" data-collapsed-answer="${colAnsIdx}">${p.content}</span><input type="checkbox" class="form-check-input">`
          return el
        }).filter(el => !!el)
      ], []))
    subConceptModalEl.querySelector('.modal-body > ul').replaceChildren(...propElList)
    // 将answer pane已经勾选的状态同步上来（还好搞了个全局的notepanedata呜呜呜）
    notePaneData.forEach(d => {
      subConceptModalEl.querySelector(`.modal-body > ul ${getDataSelector(d)}~input[type="checkbox"]`)?.setAttribute('checked', 'true')
    })
  })
}

function initColorjoe() {
  colorjoe.registerExtra('swatch', (parent, joe, option) => {
    const cont = document.createElement('div')
    cont.classList.add('swatch')
    cont.append(...option.map(c => {
      const block = document.createElement('button')
      block.onclick = () => joe.set(c)
      block.style.setProperty('--pcr-color', c)
      return block
    }))
    parent.append(cont)
  })
  colorjoe.registerExtra('save', (parent, joe) => {
    const b = document.getElementById('template-colorjoe-buttons').content.firstElementChild.cloneNode(true)
    parent.querySelector('.hex').append(b)
  })
  colorjoe.registerExtra('clear', (parent, joe) => {
    const b = document.getElementById('template-colorjoe-buttons').content.lastElementChild.cloneNode(true)
    parent.querySelector('.hex').append(b)
  })
  const joe = colorjoe.rgb('colorjoe-container', 'black', [
    'currentColor',
    ['swatch', COLORS],
    // ['fields', {space: 'RGB', limit: 255, fix: 0}],
    'hex',
    'save',
    'clear',
  ]);
  console.log(joe)

  const firstAnswerConceptBadge = document.querySelector('#answer-container .badge')
  const colorjoePopover = document.getElementById('colorjoe-popover')
  const popperInstance = Popper.createPopper(firstAnswerConceptBadge, colorjoePopover, {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
      { name: 'eventListeners', enabled: false }
    ],
  })
  console.log(popperInstance)

  document.addEventListener('click', (e) => {
    if (!e.target) return
    if (e.target.matches('#answer-container .badge')) {
      const reference = e.target
      lastClickedBadgeConcept = reference.textContent
      const currentColor = reference.style.getPropertyValue('background-color')
      if (currentColor) joe.set(currentColor)
      popperInstance.state.elements.reference = reference
      popperInstance.update()
      colorjoePopover.setAttribute('data-show', '')
    } else if (e.target.matches('#colorjoe-popover input.save')) {
      const c = joe.get()
      // console.log(c.hex(), c.lightness())
      changeConceptColor(lastClickedBadgeConcept, c.hex(), c.lightness() < 0.5)
      colorjoePopover.removeAttribute('data-show')
    } else if (e.target.matches('#colorjoe-popover input.clear')) {
      clearConceptColor(lastClickedBadgeConcept)
      colorjoePopover.removeAttribute('data-show')
      joe.set('#000')
    }
    else if (!e.target.closest('#colorjoe-popover')) {
      colorjoePopover.removeAttribute('data-show')
    }
  })
}

// 等价于jQuery的 $.ready(...) 即 $(...)
document.addEventListener('DOMContentLoaded', async () => {
  // 把和数据无关的UI init放到fetchPageData之前，防止用户看到尚未初始化的丑逼UI
  initNoteConceptPaneSplit()
  initToTopButton()
  initSubConceptModal()

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
    // answerNode.querySelector('.avatar').src = ans.author.avatar
    answerNode.querySelector('.date').textContent = dayjs(ans.date).format('MMM D, YYYY')
    answerNode.querySelector('.author-name').textContent = ans.author?.name ?? 'Anonymous'
    answerNode.querySelector('.author-description').textContent = ans.author?.description
    const conceptList = Array.from(new Set(ans['propositions'].map((item) => {
      return item['concept']
    })))
    //加载单个回答的数据
    answerNode.querySelector('.views').textContent = ans.statisticsData?.views
    answerNode.querySelector('.upvotes').textContent = ans.statisticsData?.upvotes
    // 加载单个回答的badge
    answerNode.querySelector('.concept').append(...conceptList.map((item) => {
      const el = document.createElement('span')
      el.textContent = item
      el.classList.add('badge', 'bg-secondary', 'me-1')
      el.setAttribute('concept-name', item)
      el.title = 'Click to set the visual color of this aspect'
      return el
    }))

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
  // 初始化answer pane 的调色板
  initColorjoe()
})

// 监听所有点击事件
document.addEventListener('click', (e) => {
  if (!e.target) return
  if (e.target.matches('.content-collapse-button')) {
    const buttonEl = e.target
    const contentEl = buttonEl.parentElement.querySelector('.content')
    if (contentEl.classList.toggle('truncate')) { // returns true if now present
      buttonEl.innerHTML = '<i class="bi bi-caret-down-fill"></i> Expand'
    } else {
      buttonEl.innerHTML = '<i class="bi bi-caret-up-fill"></i> Collapse'
    }
  } else if (e.target.matches('.content .proposition')) {
    handlePropositionClicked(e.target, e.ctrlKey, false)
  } else if (e.target.matches('.content .proposition~input[type="checkbox"]')) {
    handlePropositionClicked(e.target.previousSibling, e.ctrlKey, true)
  } else if (e.target.matches('.concept-badge')){
    onConceptBadgeClick(e.target)
  } else if (e.target.matches('jmnode:not(.root)')) {
    subConceptModal.show(e.target)
  } else if (e.target.matches('#subConceptModal .proposition')) {
    handleSubConceptPropositionClicked(e.target, e.target.nextElementSibling, false)
  } else if (e.target.matches('#subConceptModal .proposition~input[type="checkbox"]')) {
    handleSubConceptPropositionClicked(e.target.previousSibling, e.target, true)
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
  const changedEl = lastPopoverReference.closest('li').querySelector('.content')

  const operationData = {'name': 'edit-note', 'data':[changedEl, changedEl.textContent]}
  changedEl.textContent = newProp
  if(!calledByUndoRedo){
    updateOperationHistory(operationData)
    redoList = []
  }
}

function onResetNoteClick() {
  const li = lastPopoverReference.closest('li')
  const data = getElData(li)
  const changedEl = li.querySelector('.content')
  const operationData = {'name': 'reset-note', 'data':[changedEl, changedEl.textContent]}
  changedEl.textContent = getProposition(data).content
  if(!calledByUndoRedo){
    redoList = []
    updateOperationHistory(operationData)
  }
}

function onRemoveNoteClick() {
  const li = lastPopoverReference.closest('li')
  const data = getElData(li)
  getPropositionEl(data, document.getElementById('answer-container')).click()
}

function onEditConceptClick() {
  const newConcept = prompt('Please enter your concept')
  if (!newConcept) return
  const changedEl = lastPopoverReference.closest('li').querySelector('.content')
  const originalConcept = changedEl.textContent
  changedEl.textContent = newConcept

  const operationData = {'name': 'edit-concept', 'data': [changedEl, originalConcept]}
  if(!calledByUndoRedo){
    redoList = []
    updateOperationHistory(operationData)
    updateConceptPaneData([originalConcept, newConcept], 'edit-concept')
  }
  
  
}

function onResetConceptClick() {
  const li = lastPopoverReference.closest('li')
  const changedEl = li.querySelector('.content')
  const originalConcept = changedEl.textContent
  changedEl.textContent = li.getAttribute('concept-name')
  const newConcept = li.getAttribute('concept-name')
  const operationData = {'name': 'reset-concept', 'data': [changedEl, originalConcept]}

  if(!calledByUndoRedo){
    redoList = []
    updateOperationHistory(operationData)
    updateConceptPaneData([originalConcept, newConcept], 'reset-concept')
  }
  
}

function onRemoveConceptClick() {
  const noteContainer = document.getElementById('note-container')
  const li = lastPopoverReference.closest('li')
  const conceptName = li.getAttribute('concept-name')
  const lis = li.querySelectorAll('li.note')
  const liIdx = Array.prototype.indexOf.call(noteContainer.childNodes, lastPopoverReference.closest('li'))
  lis.forEach(el => {
    const data = getElData(el)
    getPropositionEl(data, document.getElementById('answer-container')).click()
    operationHistory.pop()
  })
  const operationData = {'name': 'remove-concept', 'data': [lis, liIdx, conceptName]}
  if(!calledByUndoRedo){
    redoList = []
    updateOperationHistory(operationData)
  }
  
}


function onConceptBadgeClick(el) {
  // construct or delete the mind map when the concept badges are clicked
  const isCurrentlySelected = el.hasAttribute('selected')

  const conceptBadgeEls = document.querySelectorAll(`#concept-list-container .concept-badge`)
  conceptBadgeEls.forEach(p => {
    p.removeAttribute('selected')
  })
  if (!isCurrentlySelected) el.setAttribute('selected', '')

  if (isCurrentlySelected) mindmapConfiguration(el.textContent, false)
  else {
    const optionsAndMind = mindmapConfiguration(el.textContent, true)
    const jm = new jsMind(optionsAndMind[0])
    jm.show(optionsAndMind[1])
  
    // change the color of the "subconcept" nodes if the corresponding proposition is checked by user
    const checkedChildrenNodes = optionsAndMind[3]
    jm.set_node_color('root', '#0d6efd', '#fff')
    checkedChildrenNodes.forEach(item => {
      jm.set_node_color(item['id'], '#198754', '#fff')
    })
  }
}

function mindmapConfiguration(conceptName, construct){

  // configuration about the mind map based on the note pane data
  if (document.querySelector('.jsmind-inner')){ 
    const mindMapEl = document.querySelector('.jsmind-inner')
    mindMapEl.remove()
  }
  if (construct){
    const id = 'mindmap-container'
    // document.getElementById(id).style.setProperty('height', '700px')
    // document.getElementById(id).style.setProperty()

    let childrenNodes = []
    let checkedChildrenNodes = []
    let allAns = []
    allAns.push(...answers)
    allAns.push(...collapsedAnswers)
    const subconceptSet = new Set(allAns.map(p => {
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
      let direction = idx % 2 === 0 ? 'right' : 'left'
      childrenNodes.push({"id": `subconcept${idx}`, 'direction': direction, "topic": el})
      for (let i = 0; i < notePaneData.length; ++i){
        if(el === notePaneData[i]['subconcept']){
          checkedChildrenNodes.push({"id": `subconcept${idx}`,'direction': direction, "topic": el})
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
      "mode": "full",
      "data" : data
    };

    const options = {
      container: id,
      editable: true,
      theme: 'asbestos',
      view: {
        hmargin: 0,        // 思维导图距容器外框的最小水平距离
        vmargin: 10,         // 思维导图距容器外框的最小垂直距离
      },
      layout: {
        vspace: 10,
        hspace: 10,
      }
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
    if(!originalConceptBadge) return
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
      el.setAttribute('active', '')
    }
    else {
      el.removeAttribute('active')
    }
  })
}

function updateOperationHistory(operationData){
  operationHistory.push(operationData)
}

function onUndoClicked(){
  calledByUndoRedo = true;
  if(operationHistory.length === 0) return
  const previousOperation = operationHistory.pop()
  if(previousOperation['name'] === 'add-note'){
    let idxData;
    if(previousOperation['data'].hasOwnProperty('ansIdx') || previousOperation['name'] === 'remove-note'){
      idxData = {'propIdx': previousOperation['data']['propIdx'], 'ansIdx': previousOperation['data']['ansIdx']}
    }
    else{
      idxData = {'propIdx': previousOperation['data']['propIdx'], 'simAnsIdx': previousOperation['data']['simAnsIdx'], 'colAnsIdx': previousOperation['data']['colAnsIdx']}
    }

    getPropositionEl(idxData, document.getElementById('answer-container')).click()
  }
  else if(previousOperation['name'] === 'clear'){
    const operationHistoryCopy = [...operationHistory]
    const redoListCopy = [...redoList]
    redoList = [...operationHistory].reverse()
    while(redoList.length !== 0){
      onRedoClicked()
    }
    operationHistory = [...operationHistoryCopy]
    redoList = [...redoListCopy]

  }
  else if(previousOperation['name'] === 'drag-and-drop-remove'){
    const operationData = previousOperation['data']
    
    //operationData = [item, from, to, old index, new index]
    const fromContainer = operationData[1]
    const toContainer = operationData[2]
    const oldIndex = operationData[3]
    const newIndex = operationData[4]
    const draggedNode = toContainer.childNodes[newIndex]
    if(oldIndex === fromContainer.childNodes.length && fromContainer.childNodes.length !== 0){
      const toEl = fromContainer.childNodes[oldIndex - 1]
      fromContainer.insertBefore(draggedNode, toEl.nextSibling)
    }
    else{
      const toEl = fromContainer.childNodes[oldIndex]
      fromContainer.insertBefore(draggedNode ,toEl)
    }
    previousOperation['data'][1] = toContainer
    previousOperation['data'][2] = fromContainer
    previousOperation['data'][3] = newIndex
    previousOperation['data'][4] = oldIndex

    const propContent = draggedNode.querySelector('.content').textContent
    const currentConcept = fromContainer.getAttribute('data-concept')
    updateConceptPaneData([propContent, currentConcept], 'drag-proposition')
  }
  else if(previousOperation['name'] === 'drag-and-drop-update'){
    const operationData = previousOperation['data']
    const fromContainer = operationData[1]
    const toContainer = operationData[2]
    const oldIndex = operationData[3]
    const newIndex = operationData[4]
    const draggedNode = toContainer.childNodes[newIndex]
    if(oldIndex > newIndex){
      // move forward
      const toEl = toContainer.childNodes[oldIndex]
      toContainer.insertBefore(draggedNode, toEl.nextSibling)
    }
    else if(oldIndex < newIndex) {
      const toEl = toContainer.childNodes[oldIndex]
      toContainer.insertBefore(draggedNode, toEl)
    }
    previousOperation['data'][1] = toContainer
    previousOperation['data'][2] = fromContainer
    previousOperation['data'][3] = newIndex
    previousOperation['data'][4] = oldIndex
  }
  else if(previousOperation['name'] === 'edit-note' || previousOperation['name'] === 'edit-concept' || previousOperation['name'] === 'reset-note' || previousOperation['name'] === 'reset-concept'){
    const changedEl = previousOperation['data'][0]
    const originalText = changedEl.textContent
    const newText = previousOperation['data'][1]
    changedEl.textContent = newText
    previousOperation['data'][1] = originalText
    updateConceptPaneData([originalText, newText], 'edit-concept')
  }

  else if(previousOperation['name'] === 'remove-concept'){
    const operationHistoryCopy = [...operationHistory]
    const redoListCopy = [...redoList]

    const lis = previousOperation['data'][0]
    const liIdx = previousOperation['data'][1]
    const conceptName = previousOperation['data'][2]
    lis.forEach(el => {
      const data = getElData(el)
      getPropositionEl(data, document.getElementById('answer-container')).click()
    })
    const noteContainer = document.getElementById('note-container')
    const li = noteContainer.querySelector(`li[concept-name=${conceptName}]`)
    if(noteContainer.childNodes && liIdx !== noteContainer.childNodes.length - 1){
      const toNode = noteContainer.childNodes[liIdx]
      noteContainer.insertBefore(li, toNode)
    }
    operationHistory = [...operationHistoryCopy]
    redoList = [...redoListCopy]
  }
  else if(previousOperation['name'] === 'change-concept-color'){
    const fromColor = previousOperation['data']['from-color']
    const toColor = previousOperation['data']['to-color']
    const fromIsDark = previousOperation['data']['from-is-dark']
    const toIsDark = previousOperation['data']['to-is-dark']
    if(fromColor == ""){
      clearConceptColor(previousOperation['data']['concept-name'])
    }
    else{
      changeConceptColor(previousOperation['data']['concept-name'], fromColor, previousOperation['data']['from-is-dark'])
    }
    previousOperation['data']['from-color'] = toColor
    previousOperation['data']['to-color'] = fromColor
    previousOperation['data']['from-is-dark'] = toIsDark
    previousOperation['data']['to-is-dark'] = fromIsDark
  }

  updateRedoList(previousOperation)
  calledByUndoRedo = false
}


function onSaveClicked(){
  if(notePaneData.length === 0) return
  let dataDownload = []
  const noteContainer = document.getElementById('note-container')
  const conceptEls = noteContainer.querySelectorAll('.concept')

  conceptEls.forEach(el => {
    let propData = []
    const propEls = el.querySelectorAll('.note')
    propEls.forEach(p => {
      propData.push(p.querySelector('.content').textContent)
    })
    dataDownload.push({'concept-name': el.getAttribute('concept-name'), 'propositions': propData})
  })
  const filename = window.location.href.split('/').slice(-1)[0].trim() + '.json';
  const jsonStr = JSON.stringify(dataDownload, null, 2);
  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function onClearClicked(){
  const operationHistoryCopy = [...operationHistory]
  while(operationHistory.length !== 0){
    onUndoClicked()
  }
  operationHistory = operationHistoryCopy
  updateOperationHistory({'name': 'clear'})
  redoList = []
}

function updateRedoList(data){
  redoList.push(data)
}
function onRedoClicked(){
  calledByUndoRedo = true
  if(redoList.length === 0) return
  const previousOperation = redoList.pop()
  if(previousOperation['name'] === 'add-note' || previousOperation['name'] === 'remove-note'){
    let idxData;
    if(previousOperation['data'].hasOwnProperty('ansIdx')){
      idxData = {'propIdx': previousOperation['data']['propIdx'], 'ansIdx': previousOperation['data']['ansIdx']}
    }
    else{
      idxData = {'propIdx': previousOperation['data']['propIdx'], 'simAnsIdx': previousOperation['data']['simAnsIdx'], 'colAnsIdx': previousOperation['data']['colAnsIdx']}
    }

    getPropositionEl(idxData, document.getElementById('answer-container')).click()
    updateOperationHistory(previousOperation)
  }
  else if(previousOperation['name'] === 'clear'){
    onClearClicked()
  }
  else if(previousOperation['name'] === 'drag-and-drop-remove'){
    const operationData = previousOperation['data']
    
    //operationData = [item, from, to, old index, new index]
    const fromContainer = operationData[1]
    const toContainer = operationData[2]
    const oldIndex = operationData[3]
    const newIndex = operationData[4]
    const draggedNode = toContainer.childNodes[newIndex]
    if(oldIndex === fromContainer.childNodes.length && fromContainer.childNodes.length !== 0){
      const toEl = fromContainer.childNodes[oldIndex - 1]
      fromContainer.insertBefore(draggedNode, toEl.nextSibling)
    }
    else{
      const toEl = fromContainer.childNodes[oldIndex]
      fromContainer.insertBefore(draggedNode ,toEl)
    }
    previousOperation['data'][1] = toContainer
    previousOperation['data'][2] = fromContainer
    previousOperation['data'][3] = newIndex
    previousOperation['data'][4] = oldIndex

    updateOperationHistory(previousOperation)
    const propContent = draggedNode.querySelector('.content').textContent
    const currentConcept = fromContainer.getAttribute('data-concept')
    updateConceptPaneData([propContent, currentConcept], 'drag-proposition')
  }
  else if(previousOperation['name'] === 'drag-and-drop-update'){
    const operationData = previousOperation['data']
    const fromContainer = operationData[1]
    const toContainer = operationData[2]
    const oldIndex = operationData[3]
    const newIndex = operationData[4]
    const draggedNode = toContainer.childNodes[newIndex]
    if(oldIndex > newIndex){
      // move forward
      const toEl = toContainer.childNodes[oldIndex]
      toContainer.insertBefore(draggedNode, toEl.nextSibling)
    }
    else if(oldIndex < newIndex) {
      const toEl = toContainer.childNodes[oldIndex]
      toContainer.insertBefore(draggedNode, toEl)
    }
    previousOperation['data'][1] = toContainer
    previousOperation['data'][2] = fromContainer
    previousOperation['data'][3] = newIndex
    previousOperation['data'][4] = oldIndex
    updateOperationHistory(previousOperation)
  }
  else if(previousOperation['name'] === 'edit-note' || previousOperation['name'] === 'edit-concept' || previousOperation['name'] === 'reset-note' || previousOperation['name'] === 'reset-concept'){
    const changedEl = previousOperation['data'][0]
    const originalText = changedEl.textContent
    const newText = previousOperation['data'][1]
    changedEl.textContent = newText
    previousOperation['data'][1] = originalText
    updateOperationHistory(previousOperation)
    updateConceptPaneData([originalText, newText], 'edit-concept')
  }
  else if(previousOperation['name'] === 'remove-concept'){
    const redoListCopy = [...redoList]
    const operationHistoryCopy = [...operationHistory]
    const lis = previousOperation['data'][0]
    lis.forEach(el => {
      const data = getElData(el)
      getPropositionEl(data, document.getElementById('answer-container')).click()
    })
    operationHistory = operationHistoryCopy
    redoList = redoListCopy
    operationHistory.push(previousOperation) 
  }
  else if(previousOperation['name'] === 'change-concept-color'){
    const fromColor = previousOperation['data']['from-color']
    const toColor = previousOperation['data']['to-color']
    const fromIsDark = previousOperation['data']['from-is-dark']
    const toIsDark = previousOperation['data']['to-is-dark']
    if(fromColor == ""){
      clearConceptColor(previousOperation['data']['concept-name'])
    }
    else{
      changeConceptColor(previousOperation['data']['concept-name'], fromColor, previousOperation['data']['from-is-dark'])
    }
    previousOperation['data']['from-color'] = toColor
    previousOperation['data']['to-color'] = fromColor
    previousOperation['data']['from-is-dark'] = toIsDark
    previousOperation['data']['to-is-dark'] = fromIsDark

    updateOperationHistory(previousOperation)
  }
  calledByUndoRedo = false
}
