# CQA 奥里给

我暂时没有加jQuery，因为现在好多地方都不用jQuery了，纯原生API已经做的比较全（且比jQ快了）。
如果想加jQuery的话，我在index.html里面留了一个comment直接打开就有了

## TODO

> 20210707

前端

* [ ] Concept text 自定义
* [ ] Contept 颜色自定义
* [ ] note pane metadata (redundancy 等) (wait for data processing)
* [ ] note pane ordering (ranx by x) (Overlap with dnd ordering?)
* [x] note pane drag&drop ordering
* [x] note pane icon button clustering
* [ ] vote number (wait for data; need to re-crawl)
* [x] similar answer concept hashtag-style
* [ ] adjust proposition click behavior
* [x] dbclick note to jump to original answer (or overleaf synctax-style arrows)
* [ ] answer pane 根据concept来highlight（同2）

后端（数据处理）

* [ ] 计算good answer和折叠answer

数据爬取和标记

* [ ] 标sub concept
* [ ] 计算redundancy
* [ ] 再找一两个qustion
* [ ] （minor）重爬带votes的数据
