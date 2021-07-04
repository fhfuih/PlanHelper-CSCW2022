const mark = document.getElementById('mark')
const crawl = document.getElementById('crawl')

document.getElementById('mark').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      console.log('shit')
      const e = new CustomEvent('mark')
      document.dispatchEvent(e)
    },
  });

  if (mark.textContent.indexOf('Enable') != -1) {
    mark.textContent = 'Disable mark mode'
  } else {
    mark.textContent = 'Enable mark mode'
  }
})

crawl.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      console.log('shit')
      const e = new CustomEvent('crawl')
      document.dispatchEvent(e)
    },
  });
})
