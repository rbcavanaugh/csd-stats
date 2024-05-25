
# Statistics and R and stuff for the CSD researcher

## Getting started

This is a repository for resources related to statistics and data analysis and open science and other important things collected for (but certainly not limited to) new and seasoned researchers in the field of Communication Sciences and Disorders. Before you get bogged down in this overwhelming list of resources, I suggest you entertain yourself with this highly enjoyable scientific article (or at least listen to it during your commute this week, there is an audio version narrated by the authors) and remember that your goal is to do science, and these are just tools you might find useful along the way. 

https://www.experimental-history.com/p/things-could-be-better

## About this page

My recommendation is that you use this list of resources in a very ad-hoc fashion. Some of the sections I have ordered so that the resource I find myself recommending most often for the total notice is at the top (indicated with an asterisk). Others are just lists of resources or people that I have learned a great deal from and that I think you might find useful. But if they're on this list, then minimally I have found them helpful at some point or another. 

These resources focus on R and statistics in R, but this is mostly because its what I was trained in, what I know the most about, and probably the scripted language used most often in CSD research. Python is cool too sometimes. I wish I knew Julia. (But if you asked me which additional language I thought researchers might find useful on top of R...its probably SQL...unless you're thinking about an alt-ac career, in which case its definitely python...and SQL...but really once you know one of these fairly well its easy enough to pick up the others. Also you should probably learn some very basic git.). 

Anyways, point is that this list is for R but its not an exclusive endorsement of R. Perhaps someone will go put together the equivalent for Python. If you really don't want to learn a scripted/statistical language like R (or python, Julia, SQL...), then I suggest you go check out [JASP](https://jasp-stats.org), which is a free and open-source GUI build on top of R. If none of these options work for you, then I'm not really sure what you're doing here.

**Contributing**

If you have a resource to contribute, please do! Here's how: Go open an issue at the top of this github repository (the "issues" tab) and include 3 things: (1) a link or reference, (2) which section it belongs in, (3) and why you found it so helpful. Or if you want to be really fancy you can create a pull request for the README (but also include these 3 things in the comment box). Also if any links are broken or out of date, the github issues are a good place to let me know that so I can fix it or delete the resource. 

*Contributors:*

- Your name could be here!

**A word of advice**

Learning R or any of the stats below, especially for anyone who has never written any code before, can be a daunting task. But it is a skill that is worth learning. The best way to learn R is to use it. The best way to use it is to have a project that you need to use it for. The resources below are fantastic - but I highly suggest you use them in tandem with a project you are highly motivated to do in R. For example, you do a few chapters or sections of one of these resources, then you go try to apply that knowledge in your own project and with your own data. 

*Disclosure: github pilot wrote most of this section for me, but I don't disagree with it and based on how I understand LLM's to work, then probably this is the most common advice for learning R, or programming langauges, or whatever the internet is saying about learning these days.*

Also, its *really* helpful to have a mentor who knows a little bit more R or stats than you, even if only to check in with occasionally or give yourself some external accountability. If you don't have that person, then its worth spending the time and effort to go find them (small plug for ASHA's [MARC](https://www.asha.org/students/mentoring/marc/) program, which I have benefited greatly from, and the many mentors who have and continue to help me learn).

**A word of caution**

I have not proofread this page closely and you have probably realized by now that it's full of run-on sentences and inconsistent punctuation and grammar and the like.

<br>

*I hope you find this useful* \~ [Rob](http://rbcavanaugh.github.io)

<br>

## Learning R 

- https://psyteachr.github.io* This is a set of resources and they are fantastic

- https://r4ds.had.co.nz (R for Data Science by Hadley Wickham and Garrett Grolemund - the standard)

- https://www.tidyverse.org/blog/2017/12/workflow-vs-script/, https://here.r-lib.org. These are not really R resources but these are things everyone should do when using R, so I'm just going to plug them here. 

- https://reprex.tidyverse.org. When you're stuck on something and want to ask for help from someone, if you do it this way, you will get the most helpful response but also probably you will figure out why you're stuck halfway through doing this. 

- https://happygitwithr.com In case you want/need to also incorporate git into your workflow.

## General Stats tutorials & resources

- https://learningstatisticswithr.com* (Danielle Navarro) This also has some great resources on learning to use R. I think Danielle is a fantastic writer and this is my go to recommendation for new R users who want to focus on stats. 

- Winter, B. (2019). Statistics for linguists: An introduction using R. Routledge. (https://appliedstatisticsforlinguists.org/bwinter_stats_proofs.pdf)

- https://avehtari.github.io/ROS-Examples/

- James, G., Witten, D., Hastie, T., & Tibshirani, R. (2013). An introduction to statistical learning (Vol. 112, p. 18). New York: springer.

- https://quantpsych.net/stats_modeling/

- https://debruine.github.io/faux/articles/contrasts.html (At some point you will have questions about contrast coding for categorical variables, and the answer is inevitably going to be here)

## Some papers about common statistical errors I've come across in CSD research

**Questionable interpretations of p-values**
- https://pubmed.ncbi.nlm.nih.gov/31829657/

**And questionable reporting of p-values**
- https://mchankins.wordpress.com/2013/04/21/still-not-significant-2/

**The Difference Between “Significant” and “Not Significant” is not Itself Statistically Significant. Often known as, 'yes you do need that interaction in your model'.**
- http://www.stat.columbia.edu/~gelman/research/published/signif4.pdf

 **But do your best to interpret interactions correctly**
- https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0271668

**Failing to report contrast coding or incorrect interpretation of contrasts**
- https://www.sciencedirect.com/science/article/abs/pii/S0749596X22000213 

## Mixed-effects models

For better or worse, the bread and butter of psycholinguistic and other CSD research. Conceptually fantastic, but often tricky to implement *well*. My suggestion is to start with the first link below, and then pick an introductory paper to read and go through examples (e.g., Brown 2021). Then, if you're feeling good about things, I highly suggest working through the examples in Debruine & Barr (2021). Then go apply what you've learned to your own data. Then, when you're feeling really accomplished, write it up for publication, incorporating recommendations from Meteyard & Davies (2020) as you write. Or take a class at your institution. Or take one of the workshops linked below. 

- http://mfviz.com/hierarchical-models/* (Fantastic visual demonstration)

- Brown VA. An Introduction to Linear Mixed-Effects Modeling in R. Advances in Methods and Practices in Psychological Science. 2021;4(1). doi:10.1177/2515245920960351

- DeBruine, L. M., & Barr, D. J. (2021). Understanding mixed-effects models through data simulation. Advances in Methods and Practices in Psychological Science, 4(1), 2515245920965119.

- Meteyard, L., & Davies, R. A. (2020). Best practice guidance for linear mixed-effects models in psychological science. Journal of Memory and Language, 112, 104092.

- Winter, B. (2013). Linear models and linear mixed effects models in R with linguistic applications. arXiv preprint arXiv:1308.5499.

- Mirman, D. (2017). Growth curve analysis and visualization using R. Chapman and Hall/CRC.

## Bayesian statistics

You should learn how to do Bayesian stats. If you've never tried to use bayes, I promise it's more intuitive than you think. And because of modern computing and R packages like {brms}, its arguably just as easy to implement as frequentist mixed models. If you know how to use lme4, then you're already 75% of the way to using {brms}.

- https://easystats.github.io/bayestestR/articles/bayestestR.html*

- https://m-clark.github.io/bayesian-basics/example.html

- https://vasishth.github.io/bayescogsci/book/

- Nalborczyk, L., Batailler, C., Lœvenbruck, H., Vilain, A., & Bürkner, P. C. (2019). An introduction to Bayesian multilevel models using brms: A case study of gender effects on vowel variability in standard Indonesian. Journal of Speech, Language, and Hearing Research, 62(5), 1225-1242

- Vasishth, S., Nicenboim, B., Beckman, M. E., Li, F., & Kong, E. J. (2018). Bayesian data analysis in the phonetic sciences: A tutorial introduction. Journal of phonetics, 71, 147-161.

- Schad, D. J., Betancourt, M., & Vasishth, S. (2021). Toward a principled Bayesian workflow in cognitive science. Psychological methods, 26(1), 103.

- https://xcelab.net/rm/statistical-rethinking/ (Statistical Rethinking by Richard McElreath) 

## Other modeling approaches

- Winter, B., & Wieling, M. (2016). How to analyze linguistic change using mixed models, Growth Curve Analysis and Generalized Additive Modeling. Journal of Language Evolution, 1(1), 7-18.

- Winter, B., & Bürkner, P. C. (2021). Poisson regression for linguists: A tutorial introduction to modelling count data with brms. Language and Linguistics Compass, 15(11), e12439

- Bürkner, P. C. (2019). Bayesian item response modeling in R with brms and Stan. arXiv preprint arXiv:1905.09501.

## Data Viz (please add more to this section!)

- Nordmann, E., McAleer, P., Toivo, W., Paterson, H., & DeBruine, L. M. (2022). Data visualization using R for researchers who do not use R. Advances in Methods and Practices in Psychological Science, 5(2), 25152459221074654.

- ggplot2 workshop (Thomas Lin Pedersen) https://www.youtube.com/watch?v=h29g21z0a68

## Open Science & Reproducibility

Make your data as sharable as possible. And then put your analytical scripts in your supplemental materials. Or better yet, put them all together on osf.io in an R project using {renv}. 

- Strand, J. F. (2023). Error tight: Exercises for lab groups to prevent research mistakes. Psychological Methods.

- Brown, V. A., & Strand, J. F. (2023). Preregistration: Practical Considerations for Speech, Language, and Hearing Research. Journal of Speech, Language, and Hearing Research, 66(6), 1889-1898.

- https://www.open-csd.com/resources

- https://www.csdisseminate.com

## Blogs & People to follow on Twitter/Bluesky/Mastodon (please add more!)

For me, a good blog post is the necessary on ramp to actually understanding a statistics paper and implementing an approach with my own data. Many of these writers/researchers are fantastic at distilling complex ideas into short(ish) blog posts that almsot anyone can understand. 

- Solomon Kurz: https://solomonkurz.netlify.app/blog/

- Andrew Heiss: https://www.andrewheiss.com/blog/

- Danielle Navarro: https://djnavarro.net

- Allison Horst: https://allisonhorst.com

- Jamie Reilly: https://www.reilly-coglab.com/reilly

- Shravan Vasishth: https://vasishth.github.io

- Julia Silge: https://juliasilge.com/blog/

- Lisa Debruine: https://debruine.github.io

- TJ Mahr: https://www.tjmahr.com/year-archive/

- Michael Clark: https://m-clark.github.io/code.html

- Daniel Lakens: http://daniellakens.blogspot.com

- Gavin Simpson: https://fromthebottomoftheheap.net

- Andrew Gelman: https://statmodeling.stat.columbia.edu

- Kieran Healy: https://kieranhealy.org

- Kristoffer Magnusson: https://rpsychologist.com/posts

## Workshops (please add more!)

- https://debruine.github.io/data-sim-workshops/

- https://smart-workshops.com

- https://centerstat.org

- https://causalab.sph.harvard.edu/courses/

- Annual statistics summer school: https://vasishth.github.io

## R packages

These are R packages that I use frequently. 

- https://tidyverse.tidyverse.org

- https://easystats.github.io/easystats/

- https://github.com/sfirke/janitor

- https://rstudio.github.io/renv/articles/renv.html

- https://here.r-lib.org

- https://www.tidytextmining.com

- https://cran.r-project.org/package=lme4

- https://paul-buerkner.github.io/brms/

- https://debruine.github.io/faux/

- https://mjskay.github.io/ggdist/

- https://glue.tidyverse.org

- https://www.tidymodels.org

- https://strengejacke.github.io/sjPlot/

- https://usethis.r-lib.org

- https://books.ropensci.org/targets/