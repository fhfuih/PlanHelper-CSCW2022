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
    const markContext = new Mark(answerNode)
    ans.propositions.forEach(({content, concept}, propIdx) => {
      // mark单个回答的单个proposition
      markContext.mark(content, {
        className: `proposition proposition-${propIdx}`,
        separateWordSearch: false,
        acrossElements: true,
      })

      // 给这个proposition加checkbox
      const markedElements = document.querySelectorAll(`.answer-${ansIdx} .proposition-${propIdx}`)
      const markedLast = markedElements[markedElements.length - 1]
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.classList.add('form-check-input')
      markedLast.insertAdjacentElement('afterend', checkbox)

      
      // 点击proposition的时候自动check
      const noteContainer = document.getElementById('note-container')
      markedElements.forEach(el => {
        el.addEventListener('click', () => {
          if (!checkbox.checked) { // 如果没有check，check并加入note
            checkbox.checked = true
            // check whether the concept name already exists or not
            const conceptElements = noteContainer.querySelectorAll(".concept")

            let conceptExist = false;
            const conceptName = answers[ansIdx].propositions[propIdx].concept
            const propositionContent = answers[ansIdx].propositions[propIdx].content
            conceptElements.forEach(concept_el => {
              if (concept_el.textContent == conceptName){
                conceptExist = true;
              }
            })
            
            let propositionContainer;
            // if not exists, just create a new <li> containing the concept, and a <ul> containing the corresponding <li>proposition under it.
            if (!conceptExist){
              const conceptElement = document.createElement('li')
              conceptElement.textContent = conceptName
              conceptElement.classList.add('concept')
              conceptElement.setAttribute('concept-name', conceptName)
              noteContainer.append(conceptElement)
              noteContainer.nextElementSibling.classList.add('d-none')

              propositionContainer = document.createElement('ul')
              propositionContainer.classList.add('proposition-container')
              propositionContainer.id = `proposition-${propIdx}-container`
              propositionContainer.setAttribute('data-concept', conceptName)
              noteContainer.append(propositionContainer)
            }
            // if exists, just find the target concept and add the <li>proposition in the <ul> proposition container
            else{
              propositionContainer = noteContainer.querySelector(`[data-concept="${conceptName}"]`)
            }
            const propositionElement = document.getElementById('single-note-template').content.firstElementChild.cloneNode(true)
            propositionElement.firstElementChild.textContent = propositionContent
              propositionElement.setAttribute('data-answer', ansIdx)
              propositionElement.setAttribute('data-proposition', propIdx)
              propositionContainer.append(propositionElement)
          } else { // uncheck并移除
            checkbox.checked = false
            // remove the proposition
            const propositionElement = noteContainer.querySelector(`[data-answer="${ansIdx}"][data-proposition="${propIdx}"]`)
            const propositionContainer = propositionElement.parentElement
            const conceptName = propositionContainer.getAttribute('data-concept')
            const conceptElement = noteContainer.querySelector(`[concept-name="${conceptName}"]`)
            propositionElement.remove()
            // after removal, if there is no proposition under a concept, delete it

            if (propositionContainer.childElementCount == 0){
              propositionContainer.remove()
              conceptElement.remove()
            }
            

            if (!noteContainer.childElementCount) noteContainer.nextElementSibling.classList.remove('d-none')
          }
        })
        el.addEventListener('mouseenter', () => {
          checkbox.style.visibility = 'visible'
        })
        el.addEventListener('mouseleave', () => {
          checkbox.style.removeProperty('visibility')
        })
      })
    })

    // 增加单个回答的所有类似回答
    if (ans.similarAnswers?.length) {
      const allSimAnsContainer = answerNode.querySelector('.similar-answers')
      allSimAnsContainer.classList.remove('d-none')
      // 折叠accordion配置，参见bootstrap文档
      const accordionId = `similar-answer-accordion-${ansIdx}`
      const collapseId = `similar-answer-collapse-${ansIdx}`
      allSimAnsContainer.querySelector('.accordion').id = accordionId
      const accordionButton = allSimAnsContainer.querySelector('.accordion-button')
      const accordionCollapse = allSimAnsContainer.querySelector('.accordion-collapse.collapse')
      accordionCollapse.id = collapseId
      accordionCollapse.setAttribute('data-bs-parent', `#${accordionId}`)
      accordionButton.append(`(${ans.similarAnswers.length})`)
      accordionButton.setAttribute('data-bs-target', `#${collapseId}`)
      accordionButton.setAttribute('aria-controls', collapseId)
      const simAnsNodes = ans.similarAnswers.map(simAnsIdx => {
        const simAns = collapsedAnswers[simAnsIdx]
        const node = document.getElementById('template-similar-answer').content.firstElementChild.cloneNode(true)
        node.querySelector('.author-name').textContent = simAns.author?.name ?? 'Anonymous'
        node.querySelector('.content').innerHTML = simAns.html
        node.querySelector('.concept').textContent = simAns.propositions.map(p => p.concept).join(', ')
        return node
      })
      answerNode.querySelector('.similar-answers ul').append(...simAnsNodes)
    }
  })

})

function editProposition(e) {
  const newProp = prompt('Please enter your proposition')
  const {target} = e;
  target.closest('li').firstElementChild.textContent = newProp
}

function resetProposition(e) {
  const li = e.target.closest('li')
  const ansIdx = li.getAttribute('data-answer')
  const propIdx = li.getAttribute('data-proposition')
  li.firstElementChild.textContent = answers[ansIdx].propositions[propIdx].content
}

function removeNote(e) {
  const li = e.target.closest('li')
  const ansIdx = li.getAttribute('data-answer')
  const propIdx = li.getAttribute('data-proposition')
  document.querySelector(`.answer-${ansIdx} .proposition-${propIdx}`).click()
}
