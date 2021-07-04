function getAnswers(question) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(mock)
    }, 1000)
  })
}

// 等价于jQuery的 $.ready(...) 即 $(...)
document.addEventListener('DOMContentLoaded', async () => {
  const res = await getAnswers();
  console.log(res)
  const {question, description, answers} = res;

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
    answerNode.innerHTML = ans.html
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
            
            // if not exists, just create a new <li> containing the concept, and a <ul> containing the corresponding <li>proposition under it.

            if (!conceptExist){
              const conceptElement = document.createElement('li')
              conceptElement.textContent = conceptName
              conceptElement.classList.add('concept')
              conceptElement.setAttribute('concept-name', conceptName)
              noteContainer.append(conceptElement)
              noteContainer.nextElementSibling.classList.add('d-none')

              const propositionContainer = document.createElement('ul')
              propositionContainer.classList.add('proposition-container')
              propositionContainer.id = `proposition-${propIdx}-container`
              propositionContainer.setAttribute('data-concept', conceptName)

              const propositionElement = document.createElement('li')
              propositionElement.textContent = propositionContent
              propositionElement.setAttribute('data-answer', ansIdx)
              propositionElement.setAttribute('data-proposition', propIdx)

              propositionContainer.append(propositionElement)
              
              noteContainer.append(propositionContainer)
            }

            // if exists, just find the target concept and add the <li>proposition in the <ul> proposition container
            if (conceptExist){
              const propositionContainer = noteContainer.querySelector(`[data-concept="${conceptName}"]`)
              const propositionElement= document.createElement('li')
              propositionElement.textContent = propositionContent
              propositionElement.setAttribute('data-answer', ansIdx)
              propositionElement.setAttribute('data-proposition', propIdx)

              propositionContainer.append(propositionElement)
            }
            


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

  })

})
