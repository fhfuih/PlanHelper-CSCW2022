/* Copy to F12 to run.
 * Use mouse to highlight. Then click space to mark. Finally click C to copy json or D to download */

const DOWNLOAD_KEY = 'D'
const COPY_KEY = 'C'
/** @type Set<string> */
const MARK_KEY = new Set(['A', 'Z', 'X', 'S', 'V', 'B', 'N', 'M', ' '])

const _outerSelector = '#mainContent div.q-box.qu-pt--medium:not(span[data-nosnippet] > div > div > div >div):not(.qu-bg--gray_ultralight)';
const data = {
  question: '',
  answers: []
}

function getTitle() {
  /** @type HTMLSpanElement */
  const titleEl = document.querySelector('div.q-text.qu-bold.qu-color--gray_dark_dim div.puppeteer_test_question_title')
  const title = titleEl?.textContent.trim()
  if (!titleEl) {
    console.error('Title not found... Will not continue')
    alert('Title not found... Will not continue')
  } else {
    titleEl.style.backgroundColor = 'cadetblue'
    titleEl.scrollIntoView(top = 0)
    console.error(`Found title ${title}.\nThe title object is highlighted in green.\nCheck if correct.`)
    alert(`Found title ${title}.\nThe title object is highlighted in green.\nCheck if correct.`)
  }
  return title
}
function getAllAnswerElements() {
  return Array
    .from(document.querySelectorAll(_outerSelector))
    .filter(el => !el.querySelector('div').textContent.includes('Related Answer') && !el.firstChild.classList.contains('q-flex'))
}
function getSelectionText() {
  return window.getSelection().toString();
}
function getSelectionEl() {
  return window.getSelection().anchorNode.parentNode
}
function getWhichAnswer(el) {
  const entireAnswer = el.closest(_outerSelector)
  return getAllAnswerElements().indexOf(entireAnswer)
}
function getAnswer(el) {
  /** @type HTMLDivElement */
  const answer_element = el.querySelector('div.spacing_log_answer_content')
  if (!answer_element) { // 广告，上面应该去了
    return null
  }
  /** @type HTMLSpanElement */
  const answer_inner = answer_element.querySelector('span.q-box.qu-userSelect--text')
  const answer_html = answer_inner.innerHTML
  const answer_text = answer_inner.textContent.trim()
  const paragraphs = Array.from(answer_inner.children).map(e => e.textContent.trim()).filter(e => !!e)

  const authorLine = el.querySelector('span.q-text.qu-bold')
  const authorUrl = authorLine.querySelector('a')
  let author;
  if (!authorUrl) {
    author = null
  } else {
    const avatar = el.querySelector('img.q-image.qu-display--block.qu-size--36.qu-minWidth--36')
    author = {
      avatar: avatar.src,
      name: authorUrl.textContent.trim(),
      description: authorLine.nextElementSibling?.textContent.trim() ?? '',
      urlEncode: authorUrl.href.split('/').pop()
    }
  }

  const dateRaw = authorLine.parentElement.parentElement.parentElement.nextElementSibling.querySelector('a.q-box.qu-cursor--pointer').textContent.trim()
  let date = dateRaw.replace(/^(Answered|Updated) /, '')
  date = new Date(date).toJSON()

  return {
    html: answer_html,
    content: answer_text,
    paragraphs,
    author,
    date,
  }
}
function clickReadModeIfNeeded(answerEl) {
  if (answerEl) {
    const readMoreButton = answerEl.querySelector('span.qt_read_more')
    readMoreButton?.click()
    return
  }
  const answerElements = getAllAnswerElements()
  for (const el of answerElements) {
    const readMoreButton = el.querySelector('span.qt_read_more')
    readMoreButton?.click()
  }
}
function highlightSelection() {
  const selection = window.getSelection()
  if (!selection) return;
  const elBegin = selection.anchorNode.parentNode
  const elBeginOffset = selection.anchorOffset
  const elEnd = selection.focusNode.parentNode
  const elEndOffset = selection.focusOffset
  if (elBegin == elEnd) {
    const html = elBegin.innerHTML.slice(0, elBeginOffset) + '<mark>' + elBegin.innerHTML.slice(elBeginOffset, elEndOffset) + '</mark>' + elBegin.innerHTML.slice(elEndOffset)
    elBegin.innerHTML = html;
  } else {
    const beginHTML = elBegin.innerHTML.slice(0, elBeginOffset) + '<mark>' + elBegin.innerHTML.slice(elBeginOffset) + '</mark>'
    const endHTML = '<mark>' + elEnd.innerHTML.slice(0, elEndOffset) + '</mark>' + elEnd.innerHTML.slice(elEndOffset)
    elBegin.innerHTML = beginHTML
    elEnd.innerHTML = endHTML
  }
}
function copyData() {
  navigator.clipboard.writeText(JSON.stringify(data, null, 2))
}
function exportData(data) {
  const filename = window.location.href.split('/').slice(-1)[0].trim() + '.json';
  const jsonStr = JSON.stringify(data, null, 2);
  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
function handleKeyPress(e) {
  const k = e.key.toUpperCase()
  if (k == DOWNLOAD_KEY) {
    e.preventDefault()
    console.log('Downloading...')
    exportData(data)
    return
  } else if (k == COPY_KEY) {
    e.preventDefault()
    console.log('Copied data to clipboard')
    copyData()
    return
  }
  if (!MARK_KEY.has(k)) {
    // console.log('Unknown key', k)
    return
  }
  e.preventDefault()

  const selection = window.getSelection()
  if (!selection) return;
  const highlight = selection.toString()
  console.log(highlight)
  const elBegin = selection.anchorNode.parentNode
  const elEnd = selection.focusNode.parentNode
  console.debug(elBegin, elEnd)

  const index = getWhichAnswer(elBegin)
  if (index == -1) alert('Cannot locate answer')
  else console.debug(`Answer #${index}`)
  if (!data.answers[index]) {
    const allAnswers = getAllAnswerElements()
    const thisAnswer = getAnswer(allAnswers[index])
    if (!thisAnswer) {
      throw new Error('This answer seems to be an ad, and it has confused the plugin')
    }
    data.answers[index] = {
      ...thisAnswer,
      propositions: [{
        content: highlight,
        concept: '',
      }],
    }
  } else {
    data.answers[index].propositions.push({
      content: highlight,
      concept: '',
    });
  }

  highlightSelection();
  if (selection.empty) selection.empty(); else selection.removeAllRanges();
}

const handleMark = (() => {
  let isOn = false
  return function () {
    if (!isOn) {
      isOn = true
      document.addEventListener('keydown', handleKeyPress)
    } else {
      isOn = false
      document.removeEventListener('keydown', handleKeyPress)
    }
    console.log('Pressed mark button. Now markModeIsOn?=', isOn)
  }
})()

const handleCrawl = async () => {
  console.log('Pressed crawl button')
  const answerElements = Array.from(document.querySelectorAll(_outerSelector))
  for (const el of answerElements) {
    const readMoreButton = el.querySelector('span.qt_read_more')
    readMoreButton?.click()
  }
  await new Promise(r => setTimeout(r, 2000))
  const result = answerElements.map(el => {
    if (el.querySelector('div').textContent.includes('Related Answer')) { // related answer
      return null
    }
    return getAnswer(el)
  }).filter(x => !!x)
  console.log(result)
  exportData({
    ...data,
    answers: result
  })
  alert(`Downloaded ${result.length} answers`)
}

document.addEventListener('mark', async () => {
  handleMark()
})

document.addEventListener('crawl', async () => {
  handleCrawl()
})

console.log('Fuck prepared')
