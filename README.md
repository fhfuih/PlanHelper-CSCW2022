# PlanHelper: Supporting Activity Plan Construction with Answer Posts in Community-based QA Platforms

This is the source code for the prototype system PlanHelper, an information digest tool for Community-based QA (CQA) Platforms.
The system is part of a research paperwork in the above name,
which is accepted by CSCW 2022.

You are welcomed to [cite](#cite) the paper if you find it insightful.

## Abstract

Community-based Question Answering (CQA) platforms can provide rich experience and suggestions for people who seek to construct Activity Plans (AP), such as bodybuilding or sightseeing. However, answer posts in CQA platforms could be too unstructured and overwhelming to be easily applied to AP construction, as validated by our formative study for understanding relevant user challenges. We therefore proposed an answer-post processing pipeline, based on which we built PlanHelper, a tool assisting users in processing the CQA information and constructing AP interactively. We conducted a within-subject study (N=24) with a Quora-like interface as the baseline. Results suggested that when creating AP with PlanHelper, users were significantly more satisfied with the informational support and more engaged during the interaction. Moreover, we performed an in-depth analysis on the user behaviors with PlanHelper and summarized the design considerations for such supporting tools.

## Run

The website is self-contained.
Simply open the index.html to run it.

It contains the augmented information for two threads.
To switch between the two threads, provide the URL param `question=body` or `question=paris`.
The system defaults to `body` if not provided.

It also contains the baseline version, which is no more than a port of plain Quora website,
with UI elements aligned.
To switch to the baseline version, `git switch baseline` and then
provide the URL param `control=bs`.
The default value is `control=exp` for the experiment group (the PlanHelper system),
which you can also explicitly specify.

## Cite

```bibtex
@article{10.1145/3555555,
  author = {Liu, Chengzhong and Huang, Zeyu and Liu, Dingdong and Zhou, Shixu and Peng, Zhenhui and Ma, Xiaojuan},
  title = {PlanHelper: Supporting Activity Plan Construction with Answer Posts in Community-Based QA Platforms},
  year = {2022},
  issue_date = {November 2022},
  publisher = {Association for Computing Machinery},
  address = {New York, NY, USA},
  volume = {6},
  number = {CSCW2},
  url = {https://doi.org/10.1145/3555555},
  doi = {10.1145/3555555},
  abstract = {Community-based Question Answering (CQA) platforms can provide rich experience and suggestions for people who seek to construct Activity Plans (AP), such as bodybuilding or sightseeing. However, answer posts in CQA platforms could be too unstructured and overwhelming to be easily applied to AP construction, as validated by our formative study for understanding relevant user challenges. We therefore proposed an answer-post processing pipeline, based on which we built PlanHelper, a tool assisting users in processing the CQA information and constructing AP interactively. We conducted a within-subject study (N=24) with a Quora-like interface as the baseline. Results suggested that when creating AP with PlanHelper, users were significantly more satisfied with the informational support and more engaged during the interaction. Moreover, we performed an in-depth analysis on the user behaviors with PlanHelper and summarized the design considerations for such supporting tools.},
  journal = {Proc. ACM Hum.-Comput. Interact.},
  month = {nov},
  articleno = {454},
  numpages = {26},
  keywords = {activity plan construction, information digest support, cqa platforms}
}
```

