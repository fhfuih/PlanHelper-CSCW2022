# CQA 奥里给

我暂时没有加jQuery，因为现在好多地方都不用jQuery了，纯原生API已经做的比较全（且比jQ快了）。
如果想加jQuery的话，我在index.html里面留了一个comment直接打开就有了

Concept Map暂时使用的是[这个库](https://github.com/hizzgdev/jsmind/blob/master/docs/zh/1.usage.md)

## TODO

> 20210707

前端

* [x] Concept text 自定义
* [x] Contept 颜色自定义
* [x] answer pane 根据concept来highlight（同2）
* [x] note pane drag&drop ordering
* [x] note pane icon button clustering
* [x] similar answer concept hashtag-style
* [x] ~~dbclick~~ctrl+click note to jump to original answer (or overleaf synctax-style arrows) (Also: ctrl+click a proposition in answer pane to jump to note pane. Not using double click because it will confuse "click to add prop. to note pane")
* [ ] ~~adjust proposition click behavior~~ (或许不需要了？因为有了note pane的拖拽排序减少用户的recover成本，同时增加了proposition的悬浮提示。如果只点击checkbox才添加到note的话，点击区域还是有点小了。不好操作。而且现有的coding实现比较麻烦)
* [ ] note pane metadata (redundancy 等) (wait for data processing)
* [ ] note pane ordering (ranx by x) (Overlap with dnd ordering?)
* [ ] vote number (wait for data; need to re-crawl)

后端（数据处理）

* [ ] 计算good answer和折叠answer

数据爬取和标记

* [ ] 标sub concept
* [ ] 计算redundancy
* [ ] 再找一两个qustion
* [ ] （minor）重爬带votes的数据
