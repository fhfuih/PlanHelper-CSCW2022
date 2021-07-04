function getAnswers(question) {
  const mock = {
    question: 'What is Lorem Ipsum?',
    description: 'From its medieval origins to the digital era, learn everything there is to know about the ubiquitous lorem ipsum passage.',
    answers: [
      {
        content: `<p>Diam quam <strong>nulla</strong> porttitor massa id neque aliquam. Diam maecenas sed enim ut sem viverra aliquet. Nulla facilisi etiam dignissim diam quis.</p>
<p>Parturient montes <em>nascetur</em> ridiculus mus mauris vitae ultricies. Facilisi cras fermentum odio eu. Gravida arcu ac tortor dignissim convallis aenean. Suspendisse potenti nullam ac tortor vitae purus faucibus ornare.</p>
<p>Et molestie ac feugiat sed lectus vestibulum mattis <em>ullamcorper</em>. Amet risus nullam eget felis eget nunc. Porta lorem mollis aliquam ut porttitor leo a diam sollicitudin. Ac orci phasellus egestas tellus rutrum.</p>`,
        propositions: [
          {
            content: 'Diam quam nulla porttitor massa id neque aliquam',
            category: 'lorem',
          },
          {
            content: 'Parturient montes nascetur ridiculus mus mauris vitae ultricies',
            category: 'foo',
          },
          {
            content: 'Et molestie ac feugiat sed lectus vestibulum mattis ullamcorper',
            category: 'bar',
          }
        ]
      },
      {
        content: `<p>Leo vel fringilla est ullamcorper eget nulla.</p>
<p>Mauris cursus mattis molestie a iaculis at erat pellentesque adipiscing.</p>`,
        propositions: [
          {
            content: 'Leo vel fringilla est ullamcorper eget nulla',
            category: 'foo',
          },
          {
            content: 'Mauris cursus mattis molestie a iaculis at erat pellentesque adipiscing',
            category: 'bar',
          }
        ]
      }
    ]
  }
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
    answerNode.innerHTML = ans.content
    answerContainer.append(answerNode)

    // mark单个回答的所有proposition
    const markContext = new Mark(answerNode)
    ans.propositions.forEach(({content, category}, propIdx) => {
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
            const conceptName = answers[ansIdx].propositions[propIdx].category
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
            

            if (noteContainer.childElementCount == 1) noteContainer.nextElementSibling.classList.remove('d-none')
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
