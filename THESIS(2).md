**A STATISTICALLY VALIDATED MULTI-INSTANCE EVALUATION**   
**OF ENTROPY-TRIGGERED 2-OPT IN HYBRID**   
**ANT COLONY OPTIMIZATION**

A Thesis Presented to  
the Faculty of the Undergraduate Program  
School of Engineering and Computer Studies  
Divine Word College of Legazpi

In Partial Fulfillment   
of the Requirements for the Degree of  
BACHELOR OF SCIENCE IN COMPUTER SCIENCE

by  
**JOSHUA BERMAS**  
**VINCENT BRIAN SOMIDO**  
**JOHN EARL MIRABETE**

March 2026  
**RECOMMENDATION FOR THESIS FINAL DEFENSE**

	In partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science, this thesis entitled **“A STATISTICALLY VALIDATED MULTI-INSTANCE EVALUATION OF ENTROPY-TRIGGERED 2-OPT IN HYBRID ANT COLONY OPTIMIZATION,"** prepared by **Joshua Bermas, Vincent Brian Somido,** and **John Earl Mirabete,** is hereby submitted to the Thesis Committee for consideration and approval.

**CHRISTIAN M. LANA, MIT**  
Adviser

In partial fulfillment of the requirements for the degree of Bachelor of Science in Computer Science, this thesis entitled **“A STATISTICALLY VALIDATED MULTI-INSTANCE EVALUATION OF ENTROPY-TRIGGERED 2-OPT IN HYBRID ANT COLONY OPTIMIZATION,"** prepared and submitted by **Joshua Bermas, Vincent Brian Somido** and **John Earl Mirabete,** is hereby considered and endorsed for final defense.

**RHODORA FAYE A. BROSAS, MBA, MIT**  
Thesis Coordinator  
**RESULT OF THE FINAL DEFENSE**

**Project Title**                            :   A Statistically Validated Multi-Instance Evaluation of  
                                                      Entropy-Triggered 2-Opt in Hybrid Ant Colony   
                                                      Optimization  
**Researchers**                             :   Joshua Bermas  
				      Vincent Brian Somido  
				      John Earl Mirabete

**Place** : Room                                 **Date:** Oct, 2026                             **Time:** 00:00 \- 00:00

              FINAL DEFENSE COMMITTEE                                  ACTION TAKEN                              

              **EMMANUEL ISAIAH Z. DETERA, MIT               \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**  
                               Panel Member

              **JP REMAR A. SERRANO, MIS                                \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**  
                               Panel Member

|  CHRISTIAN M. LANA, MIT Adviser |
| ----- |

**RHODORA FAYE A. BROSAS, MBA, MIT**  
Thesis Coordinator  
**THESIS 2 COMPLETION**  
**Project Title		:** A      STATISTICALLY       VALIDATED     MULTI-INSTANCE  
 EVALUATION OF ENTROPY-TRIGGERED 2-OPT IN   
HYBRID ANT COLONY OPTIMIZATION  
**Researchers		:**	Joshua Bermas  
Vincent Brian Somido  
John Earl Mirabete

**Degree Program	:**	Bachelor of Science in Computer Science

**Final Defense Completed on	:** 

**THESIS COMMITTEE**  
               FINAL DEFENSE COMMITTEE                                    SIGNATURES                             

              **EMMANUEL ISAIAH Z. DETERA, MIT               \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**  
                               Panel Member  
              **JP REMAR A. SERRANO, MIS                                \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**  
                               Panel Member  
              **CHRISTIAN M. LANA, MIT                                     \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**  
                               Adviser

**RHODORA FAYE A. BROSAS, MBA, MIT**

Chairperson

**CERTIFICATE OF APPROVAL**

This is to certify that the thesis of:

**Joshua Bermas**  
**Vincent Brian Somido**  
             **John Earl Mirabete**		

has been appointed by the Thesis Committee in partial fulfillment of the requirements   
of the degree of Bachelor of Science in Computer Science School of   
Engineering and Computer Studies

**CHRISTIAN M. LANA, MIT**  
Adviser

**RHODORA FAYE A. BROSAS, MBA, MIT**  
Thesis Coordinator

**ENGR. MARBEN S. RAMOS, LPT, MAPhysEd**  
Dean

**EXECUTIVE SUMMARY**

| Project Title | : | A Statistically Validated Multi-Instance Evaluation of Entropy-Triggered 2-Opt in Hybrid Ant Colony Optimization  |
| :---- | :---- | :---- |
| **Researchers** | : | Joshua Bermas Vincent Brian Somido John Earl Mirabete |
| **Keywords:** | : | Ant Colony Optimization, Hybrid ACO, 2-Opt Local Search, Entropy-Triggered Scheduling, Pheromone Dominance Ratio, Traveling Salesman Problem  |

Ant Colony Optimization (ACO) is a widely applied metaheuristic for combinatorial routing problems such as the Traveling Salesman Problem (TSP), but its positive-feedback pheromone mechanism causes premature convergence: the colony concentrates on a small set of early high-quality edges and stops exploring before the search space is adequately covered. Hybrid ACO (HACO) addresses this by adding a 2-opt local search operator, yet the prevailing practice of invoking 2-opt at every iteration imposes a cumulative O(n²) cost that has been identified in the literature as a barrier to operational deployment. Entropy-triggered adaptive scheduling has been proposed as a remedy, but existing evidence rests on single-run evaluations without statistical validation across multiple problem scales.  
This study developed and evaluated a Proposed Adaptive HACO in which 2-opt is applied to the global best tour only when a dual-signal condition is met: Shannon entropy H(S) \= −Σ p(e) log₂ p(e) falls below a calibrated stagnation threshold θ, and the Pheromone Dominance Ratio PDR(t) \= τ\_max(t) / τ\_mean(t) exceeds τ\_PDR \= 2.0, confirming over-exploitation. The study followed a quantitative experimental design comparing three configurations — Standard ACO, Non-adaptive HACO, and the Proposed Adaptive HACO — on six TSPLIB benchmark instances spanning 51 to 200 nodes (eil51, berlin52, eil76, kroA100, kroB150, kroA200). All algorithms ran under identical shared parameters (α \= 1.0, β \= 5.0, ρ \= 0.5, m \= 30 ants, Q \= 1.0, T\_max \= 500 iterations) for 30 independent trials per algorithm–instance pair, giving 540 total runs, with shared random seeds enabling paired comparison. Computational time, convergence speed, and solution quality were each tested using a paired two-tailed t-test at α \= 0.05 (df \= 29).  
The Proposed Adaptive HACO reduced mean wall-clock runtime by 9.9% to 23.4% relative to the Non-adaptive HACO, with all six paired tests significant at p \< 0.001. This saving is attributable directly to the trigger: 2-opt was invoked in only 20.4% to 53.9% of iterations rather than 100%, and fired at a mean PDR between 48.97 and 192.37, far above the balanced value of 1.0. On solution quality, the Proposed Adaptive HACO produced the shortest mean tours on five of the six instances, with optimality gaps of 2.51% to 4.01% against 0.41% to 5.81% for the Non-adaptive HACO and 2.01% to 11.54% for Standard ACO, and recorded the smaller standard deviation on five of six instances. The quality advantage was statistically significant on five instances; on berlin52 the two HACO variants were statistically equivalent (p \= 0.3635), both already solving the instance to within 0.6% of the known optimum.  
The convergence-speed hypothesis was not supported. Under the operational criterion (ε \= 0.001 sustained over W \= 20 iterations), the Proposed Adaptive HACO reached the criterion 15.6 to 22.3 iterations later than the Non-adaptive HACO on every instance (p \< 0.001). This is reported as an honest null result: the metric records the point at which improvement ceases, and because the adaptive mechanism withholds refinement until genuine stagnation, the best tour continues improving further into the run rather than plateauing early at a 2-opt local optimum.  
The study concludes that entropy-and-PDR–triggered adaptive scheduling recovers a statistically significant share of the overhead imposed by fixed-interval 2-opt while producing equal or better tours, and that this holds consistently across the full 51- to 200-node range rather than on an isolated instance. It contributes the first statistically validated, multi-instance evidence base for entropy-triggered local search scheduling in HACO. Recommendations include extending the evaluation to larger and more diverse TSPLIB instances, replacing the fixed entropy threshold with a self-adjusting one, conducting a sensitivity analysis on the PDR threshold, and running ablation experiments to separate the contributions of the entropy and PDR signals.

**ACKNOWLEDGEMENT**

	The researchers wish to express their profound and sincere gratitude to all those whose guidance, support, and encouragement made the successful completion of this thesis possible. Words are scarcely sufficient to convey the depth of appreciation the researchers hold for the following individuals.

First and foremost, to **Almighty God**, for the blessings, strength, and guidance bestowed upon the researchers throughout the completion of this study. All glory is given to Him alone.  
	Secondly, to **RHODORA FAYE A. BROSAS,  MBA, MIT,** The researchers extend their sincere gratitude for her guidance in leading this study toward its successful conclusion, and for her constructive criticism, patient counsel, and steadfast support extended whenever the researchers were in doubt.   
	Thirdly, to **CHRISTIAN M. LANA, MIT,**  our thesis adviser, for his direct mentorship and guidance in the development of this study, as well as for his valuable technical advice and assistance extended throughout the research process.   
Fourthly**,** to **EMMANUEL ISAIAH Z. DETERA, MIT** and **JP REMAR A. SERRANO, MIS** for their insightful feedback, which contributed meaningfully to the refinement of this study. The researchers further acknowledge the panel of examiners, collectively, for their rigorous questioning and critical evaluation, which, though challenging to receive at times, substantially strengthened the quality of this work.  
	  
	Fifthly, to **REILAN L. CADUBLA,** our former panelist, for contributions in laying the necessary foundations for this study and for recognizing its value even in its earliest and most undeveloped form. It is owing to his early support that the researchers were able to reach this point of completion.   
	  
	**ENGR. MARBEN S. RAMOS, LPT**

	**CLASSMATES, COLLEAGUES,** and **FRIENDS,** for their cooperation, feedback, and encouragement throughout the research process.  
	Our **FAMILY** and **LOVED ONES,** for their unconditional love, patience, and moral support throughout this journey. Their faith in the researcher provided strength and inspiration to preserve.  
**TABLE OF CONTENTS**

| Content |  | Page No. |
| :---- | ----- | :---: |
| Title Page 	.	.	.	.	.	.	.	.	. |  | i |
| Recommendation of Thesis Final Defense 	.	.	.	.	. |  | ii |
| Result of Final Defense	.	.	.	.	.	.	. |  | iii |
| Thesis 2 Completion	.	.	.	.	.	.	.	 |  | iv |
| Certificate of Approval 	.	.	.	.	.	.	. |  | v |
| Executive Summary 	.	.	.	.	.	.	.	 |  | vi |
| Acknowledgement 	.	.	.	.	.	.	.	 |  | vii |
| Table of Contents 	.	.	.	.	.	.	.	 |  | viii |
| List of Figures 	.	.	.	.	.	.	.	 |  | ix |
| List of Tables 	.	.	.	.	.	.	.	 |  | x |

**Chapter**

| 1 | INTRODUCTION |  |
| :---: | :---- | :---: |
|  | Background of the Study	.	.	.	.	.	 | 1 |
|  | Research Gap 	.	.	.	.	.	.	.	 | 7 |
|  | Theoretical Framework  	.	.	.	.	.	 | 10 |
|  | Conceptual Framework  	.	.	.	.	.	 | 13 |
|  | Description of the Existing Algorithm  	.	.	.	 | 14 |
|  | Description of the Propose Algorithm 	.	.	.	 | 15 |
|  | Statement of the Problem 	.	.	.	.	.	 | 16 |
|  | Objectives of the Study 	.	.	.	.	.	 | 16 |
|  | Purpose and Description 	.	.	.	.	.	 | 17 |
|  | Technical Terms 	.	.	.	.	.	.	 | 20 |
|  | Notes 	.	.	.	.	.	.	.	.	 | 24 |

**Chapter**

| 2 | METHODOLOGY |  |
| :---: | :---- | :---: |
|  | Research Design 	.	.	.	.	.	.	 | 31 |
|  | Algorithm Development	.	.	.	.	.	 | 27 |
|  | Scope and Delimitation  	.	.	.	.	.	 | 33 |
|  | Data Gathering Techniques 	.	.	.	.	.	 | 34 |
|  | Source of Data 	.	.	.	.	.	.	 | 36 |
|  | Theorems, Algorithms, and Mathematicals Models	.	.	 | 48 |
|  | Mathematical Benchmark Model  	.	.	.	.	 | 49 |
|  | Notes 	.	.	.	.	.	.	.	. | 50 |

**Chapter**

| 3 | RESULTS AND DISCUSSIONS |  |
| :---: | :---- | :---: |
|  | Results 	.	.	.	.	.	.	.	 | 60 |
|  | Findings	.	.	.	.	.	.	. | 61 |
|  | Proposed Solution	.	.	.	.	.	.	 | 63 |
|  | Materials and Statistical Tools	.	.	.	.	 | 66 |
|  | Flowchart	.	.	.	.	.	.	. | 69 |
|  | System Requirements		.	.	.	.	.	 | 99 |
|  | Hardware Requirements	.	.	.	.	.	 | 71 |
|  | Software Requirements	.	.	.	.	.	 | 72 |
|  | System Tradeoffs	.	.	.	.	.	. | 75 |

**Chapter**

| 4 | FINDINGS, CONCLUSIONS AND RECOMMENDATIONS |  |
| ----- | :---- | :---: |
|  | Findings 	.	.	.	.	.	.	.	 | 76 |
|  | Conclusions	.	.	.	.	.	.	.	 | 78 |
|  | Recommendations 	.	.	.	.	.	.	 | 81 |
| **References**	 .	 .	  .	   .	   .  	   .	  .	   . |  | 90 |
| **Appendicies**	 |  |  |
|    A | Gantt Chart	.	.	.  	.	.	.    	. | 91 |
| B | Source Code  .     	.	.	.	.	.  	. | 98 |
| C | Benchmark   .     	.	.	.	.	.  	. | 117 |
| **Curriculum vitae**	 .	 .	  .	   .	   .  	   .	  .	    |  | 118 |

**LIST OF FIGURES**

| Figure No. | Title | Page No. |
| :---: | ----- | :---: |
| **1** | Theoretical Framework of the Study	.	.	. | 6 |
| ***2*** | Conceptual Framework of the Study	*.	.           .* | 8 |
| **3** | Quantitative Experimental Research Design Framework for Hybrid ACO with Adaptive 2-opt Local Search	.	 |  27 |
| ***4*** | Proposed Adaptive HACO with Entropy-Triggered 2-opt Local Search	*.	.	. 	.	.	.*  | 69 |
| **5** | Flowchart of the Existing Non-Adaptive Hybrid ACO	 | 74 |
| **6** | Mean Convergence Curves of the Three Algorithms across the Six Instances	.	*. 	.	.*           *.           .*                       | 77 |
| **7** | Mean Shannon Entropy H(S) Traces across the Six Instances | 78 |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

**LIST OF TABLE**

| Table No. | Title | Page No. |
| :---: | ----- | ----- |
| **3.1**  | Mean Wall-Clock Computational Time per Trial (in seconds, mean ± SD, 30 trials)	.	.           *.* |  32 |
| **3.2** | Paired t-Test Results for Computational Time: Proposed Adaptive HACO vs Non-adaptive HACO (df \= 29, α \= 0.05)   .           .      	.	.	.	.	.  |  *50* |
| **3.3** | Mean Convergence Iteration t\* (δ \= 0.001 over W \= 20 consecutive iterations; T\_max \= 500; mean ± SD, 30 trials)  |  39 |
| **3.4** | Paired t-Test Results for Convergence Speed: Proposed Adaptive HACO vs Non-adaptive HACO (df \= 29, α \= 0.05)     .           .      	.	.	.	.	.  |  43 |
| **3.5** | Mean Best Tour Distance L\* at T\_max (Euclidean units, mean ± SD, 30 trials; percentage gap from TSPLIB known optimum in parentheses)	.	.	. 	.	 |  44 |
| **3.6** | Paired t-Test Results for Solution Quality: Proposed Adaptive HACO vs Non-adaptive HACO (df \= 29, α \= 0.05)    .           .      	.	.	.	.	.  |  45 |
| **3.7** | Mean 2-opt Activation Frequency of the Proposed Adaptive HACO (T\_max \= 500 iterations; mean over 30 trials) |  67 |
| **3.8** | Material	.	.	.	.	.	.  |           68 |
| **3.9** | Statistical Tools	.	.	.	.	. |           71 |
| **3.10** | Recommended Hardware Specifications	.	.	 |           72 |
| **3.11** | Recommended Software Specifications.	.	.	 |           75 |
| **3.12** | Technical Issues 	.	.	.	.	.	 |  76 |
| **3.13** | Operational Issues	 |           78 |
| **3.14** | Economical Issues 	.	.	.	. 	.	 |           80 |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

**Chapter 1**  
**INTRODUCTION**  
**BACKGROUND OF THE STUDY**   
The Traveling Salesman Problem is something that people are still trying to figure out. It is a problem that affects our life, like when companies need to find the best way to deliver packages or when emergency services like ambulances need to find the quickest route to get to the hospital. The Traveling Salesman Problem is a significant challenge because efficient solutions can make a real difference in how companies deliver goods and how emergency services respond. The Traveling Salesman Problem is important because we need to find very good answers, and we need to find them quickly. For a long time, researchers have tried to develop new ways to solve the Traveling Salesman Problem, yet a major problem remains unsolved. We want to make a way of solving The Traveling Salesman Problem that can do three things at the same time: it can find answers quickly, it can find many different answers and it can do all of this without using too much computer power. Some people have tried to make ways to solve The Traveling Salesman Problem using something called Hybrid Ant Colony Optimization. These new ways have been able to find answers but they still have some problems. Sometimes they find answers quickly and sometimes they take too long to find answers. This is a problem because we want to be able to solve The Traveling Salesman Problem for problems, not just small ones. However, although Nie et al. (2023) presented the entropy-triggered ACO mechanism as a promising approach, their tests were based on only one run for   
each problem, lacking the statistical significance of multi-instance evaluation. It is still unresolved if this adaptive trigger mechanism yields regular and steady improvement through all levels of problem size. To overcome the above limitation, this research proposes a Hybrid Ant Colony Optimization with Adaptive 2-opt Local Search (hereafter, the Proposed Adaptive HACO), in which a Shannon entropy-based stagnation detection criterion triggers a 2-opt move only when the population’s diversity drops below a critical level. This algorithm attempts to improve results and save time by running local search only when the population is truly stuck. The study does not assume this will always work; instead, it tests that idea across different problem sizes and reports results for every case, even when the method does not help.  
	This research furthers the Sustainable Development Goals adopted by the United Nations, Goal 9: Industry, Innovation and Infrastructure, by exploring a novel conceptual basis of computational framework to increase the efficiency of population-based algorithms (Billones et al., 2021; Cadea et al., 2024). It also contributes to Goal 11: Sustainable Cities and Communities by providing optimization tools applicable to urban logistics, emergency routing, and municipal planning in local contexts (Gue et al., 2015; Jao & Vallar, 2023; Santos et al., 2024).  
	The Ant Colony Optimization or Ant Colony Optimization technique, is the search engine for all the HACO variants that are being looked at in this study. The Ant Colony Optimization has some properties that decide what it can and cannot do. These also affect how well the hybrid extensions work. In the Ant Colony Optimization you have these ants that build solutions by choosing edges in a random way based on how strong the pheromone smell is and how good the solution looks. At the time there is a mechanism that stops the pheromone smell from getting too strong so that the search can stay varied and find new things; the Ant Colony Optimization does this with a global evaporation mechanism. Systematic treatments of ACO on the TSP reaffirm this mechanism as capable of generating competitively good solutions over different problem sizes when used as input to a problem-specific hybrid solution constructor (Dorigo & Stützle, 2004; Mavrovouniotis et al., 2017). While this is a strength of the mechanism, earlier positive edges also amplify in ranking as iterations increase due to the positive feedback loop that makes the mechanism computationally efficient in this case (Blum & Roli, 2021). Leading to convergence before the solution space is exhausted, this is by definition the stagnation problem that afflicts all HACO variants, including the algorithm proposed here.  
	Hybrid Ant Colony Optimization (HACO) solves the ACO stagnation problem by adding a local search operator that refines ant tours after each construction phase. 2-opt is the most widely used and reliable ACO hybridization strategy on the TSP for its iterative refinement (Mavrovouniotis et al., 2017; Stützle & Hoos, 2000\) of the edge-swap long-crossing structure introduced by probabilistic construction, and the induced reduction in tour length. Wang et al. (2018) demonstrated the practical benefit of this hybridization for post-disaster emergency routing, finding that HACO with 2-opt found much more rapidly-converging and shorter tours than ACO for all tested instance sizes. Rokbani et al. (2021) further validated the advantage of the hybrid structure in a bi-heuristic ACO study, confirming that combining population-based search with local refinement consistently outperforms pure ACO in both solution quality and convergence stability. These findings collectively justify adopting the HACO framework as the foundation of the present study and establish 2-opt as the appropriate local search operator for refinement.  
	The 2-opt local search algorithm helps to make a tour. It does this by removing two edges and then reconnecting the path in a way that does not cross. The new path is only kept if it is shorter than the one. This process is repeated over and over until no further improvements can be made to the tour (Lin & Kernighan, 1973). In the HACO context the 2-opt algorithm serves as a refinement tool. It is applied after the construction process.The 2-opt algorithm has a complexity of O(n²) per pass. This makes its cost significant for large-scale instances. Wang et al. (2018) confirmed that integrating 2-opt into ACO yielded meaningfully shorter routes, while Zhang et al. (2024) reported similar tour quality improvements in a HACO applied to cold chain logistics routing on comparable instance sizes. Shahadat et al. (2022) further found that applying local search refinement without accounting for population diversity degraded solution quality variance across trials, making results less reproducible and operationally unreliable. These findings establish that 2-opt is effective when applied selectively, but that how and when it is triggered is as consequential as whether it is applied at all.  
Despite its effectiveness as a refinement operator, 2-opt applied at fixed intervals inside HACO introduces a critical scheduling problem that existing implementations have not resolved. Wang et al. (2018) observed that unconditional 2-opt application across all ants at every iteration increased per-iteration runtime by approximately 35–40% on 100-node instances due to the cumulative O(n²) cost, identifying this overhead as a barrier to operational deployment. Wang et al. (2023) and Sagban et al. (2017) further found that fixed-interval local search scheduling leads to premature diversity depletion and inconsistent convergence patterns, particularly on instances beyond 100 nodes, and explicitly identified entropy-based adaptive triggering as the most promising but unimplemented solution. Nie et al. (2023) directly addressed this gap by proposing an adaptive ACO that uses Shannon information entropy H(S) \= −Σ p(sᵢ) log₂ p(sᵢ) as a real-time diversity metric, demonstrating that triggering 2-opt only when H(S) falls below a stagnation threshold reduced iterations to convergence by approximately 20% while matching or exceeding fixed-interval solution quality. However, Nie et al. (2023) evaluated this mechanism under single-run conditions without statistical validation across multiple instances, leaving unresolved whether entropy-triggered 2-opt produces consistent and significant improvements, the gap this study directly addresses. The Shannon entropy framework developed by Nie et al. (2023) was adopted as the stagnation detection mechanism in the proposed HACO of this study.  
	Quantitative benchmarking evidence consistently confirms that adaptive control of 2-opt application frequency is the most impactful factor in HACO performance. Liu et al. (2023) proposed the Dynamic Adaptive ACO (DAACO) and demonstrated through TSPLIB evaluation that adaptively adjusting local search frequency based on population state metrics produced 12 to 18 percent faster convergence while reducing total computation time by up to 15 percent compared to fixed-parameter HACO. Tang et al. (2023) extended this finding to large-scale TSP instances, showing that entropy-triggered 2-opt reduced total computation time by up to 22 percent while achieving equal or better solution quality, with the most pronounced improvements on 100 to 200 node instances, the exact range used in the present study. Deng, Xu, and Zhao (2019) further confirmed in the scheduling domain that adaptive local search scheduling reduced computation time by 18 to 25 percent relative to conventional fixed-schedule HACO, underscoring the generalizability of the adaptive triggering principle. Osaba et al. (2021) provided the methodological justification for the benchmarking design used in this study, establishing that multi-instance, multi-run experiments with statistical validation are the standard for reliable comparative conclusions in metaheuristic research.  
	Philippine studies on routing optimization provide direct local motivation for the proposed adaptive HACO. Jao and Vallar (2023) demonstrated in their hybrid routing optimization for municipal waste collection in Marikina that local search integration improved route quality but introduced computational overhead identified as a critical barrier to operational deployment. Santos, Redi, German, and Ong (2024) reached a parallel conclusion in waste collection routing for Malolos City, Bulacan, finding that controlling local search frequency is the most effective lever for managing the quality-versus-time tradeoff in Philippine hybrid metaheuristic applications. Cadeña,   
Cuevas, Kallos, and Bandala (2024) showed that combinatorial optimization for time-critical scenarios must produce near-optimal solutions  within   tight   computational  
budgets in their quantum annealing-based emergency routing system for Marikina City. De Veluz, Redi, Maaliw, Persada, and Prasetyo (2023) further found that algorithms without adaptive local search exhibited slower and less consistent convergence, a limitation that the proposed HACO addresses through entropy-driven triggering. Collectively, these studies establish that convergence speed, solution quality, and computational time are operationally critical parameters in Philippine routing contexts, while revealing that no existing study has proposed an entropy-driven stagnation detection mechanism as the basis for adaptive local search triggering.

**RESEARCH GAP**  
There is a lack of statistically validated, multi-instance evidence that entropy-triggered adaptive 2-opt in Hybrid Ant Colony Optimization (HACO) reduces computational time compared to non-adaptive HACO across TSPLIB benchmarks, as no study has confirmed through paired statistical testing across 30 independent trials whether entropy-based triggering significantly reduces computational time for instances ranging from 51 to 200 nodes. While prior work has reported that unconditional 2-opt application introduces substantial runtime overhead, none has statistically confirmed that an adaptive triggering mechanism recovers this cost across multiple benchmark scales. Similarly, no statistically validated evidence demonstrates that entropy-triggered adaptive 2-opt improves convergence speed over standard ACO and non-adaptive HACO, as existing studies remain limited by single-run evaluations and lack multi-instance statistical validation across varying problem sizes. Although entropy-based stagnation detection has been proposed as a mechanism for triggering local search at the appropriate moment, its effect on convergence speed has not been confirmed through repeated, statistically powered trials capable of distinguishing genuine improvement from random run-to-run variation.  
Finally, evidence is lacking that entropy-triggered adaptive 2-opt ever consistently results in improvements to total Euclidean tour length over the baseline, citing no pairwise statistical testing like the other algorithms to verify that adaptive methods ever reliably produce shorter tour length for any subset of the full range of 51 to 200 nodes. Aggregate solution length comparisons in the literature appear to be largely descriptive or anecdotal and not validated through multi-instance, multi-trial statistical tests of significance using a strong control.  
This study closes these gaps by presenting a dual-signal adaptive trigger, where 2-opt is triggered only when Shannon entropy H (S) is less than an optimally calibrated trigger threshold and the Pheromone Dominance Ratio PDR (t) detects over-exploitation, in comparison against Standard ACO and Non-adaptive HACO over the six TSPLIB benchmark instances using the same experimental parameters and 30 Independent Trials, with the comparison conducted using a paired 2-tailed t-test  at  α= 0.05.  In  the  process,   
this research also became the first statistically validated multi-instance base of knowledge for entropy-triggered adaptive local search scheduling in HACO.

**THEORETICAL FRAMEWORK**  
**Figure 1**  
*Theoretical Framework of the Study*  
This is the plan for the study as depicted in Figure 1\. Overall, the plan is built like a framework which links ideas, processes, results and checks. It provides the basis for the decision-making of the Hybrid Ant Colony Optimization approach during the search.  
The framework is based on a trigger criterion built from two indicators. It employs a 2-opt local search process on the ‘best solution so far’, but only if both conditions have been satisfied.  
	The first indicator measures how similar the constructed tours are. This is called Information Entropy, computed as H(S) \= −Σ p(e) log₂ p(e), where p(e) is the proportion of ants whose tours use edge e. If H(S) is high, the tours are diverse and the search is progressing well. If H(S) is low, the tours are too similar and the search is stagnating.  
The second indicator measures the degree to which the search concentrates on a few repeated regions of the search space. This is measured as the Pheromone Dominance Ratio, calculated as PDR(t) \= τ\_max(t) / τ\_mean(t). When PDR is near 1, the search is using all paths almost equally. When PDR is much greater than 1, the search is over-exploiting a few dominant edges.  
	The third component is the response to stagnation: it decides when to invoke the 2-opt swap. This operator refines the best solution found so far, but only when the search is stagnating.  
	All these parts come together in a single trigger condition that decides when to apply 2-opt. This condition is what distinguishes the proposed Hybrid Ant Colony Optimization (HACO) from the baseline methods: it uses two diversity signals to time the   
2-opt refinement, which makes the refinement more effective. The proposed HACO is compared against two methods: the Standard Ant Colony Optimization (ACO) and the Non-adaptive Hybrid Ant Colony Optimization (HACO).

**CONCEPTUAL FRAMEWORK**  
**Figure 2**  
*Conceptual Framework of the Study*  
Figure 2 models the conceptual framework of the study as four related sections, Inputs, Algorithms, Metrics, and Statistical Tests. Inputs specifies the common experimental conditions of the study, which are applied consistently to all three algorithms: Problem Instances consists of six TSPLIB benchmark problems, organized by problem scale: eil51 and berlin52 from 51 to 52 nodes, eil76 and kroA100 from 76 to 100 nodes, and kroB150 and kroA200 from 150 to 200 nodes. The TSPLIB instances were selected to provide comprehensive coverage across problem scales while maintaining comparability with established ACO literature. The three-tier stratification—small (51–52 nodes), medium (76–100 nodes), and large (150–200 nodes)—enables assessment of whether the adaptive mechanism's benefits scale consistently across problem sizes. Small instances (eil51, berlin52) establish baseline behavior and validate algorithmic correctness, where solution quality can be cross-referenced with known optimal tours. Medium instances (eil76, kroA100) represent the transition zone where local search becomes increasingly critical to performance. Large instances (kroB150, kroA200) stress-test the adaptive trigger mechanism under conditions where computational overhead matters most and premature convergence risks are elevated. The inclusion of both geometric (berlin52) and Euclidean (eil-series, kroA/kroB-series) instances captures structural diversity inherent in real-world TSP applications, while the kroA/kroB pair at 100 and 150–200 nodes provides distinct distance matrix characteristics that test the robustness of the entropy-PDR trigger across different solution space topologies. Shared Parameters, which include the pheromone evaporation rate ρ, the influence weights α and β, the number of ants m, and the pheromone deposit constant Q. These parameters are held constant across all three algorithms to emphasize effects of the adaptive algorithm mechanism. The maximum iteration count T\_max is used as the uniform stopping criterion, and the entropy and PDR thresholds are determined by preliminary calibration trials. Trial Design specifies 30 independent trials for each problem instance for a total of 90 runs for each problem instance across the three algorithm conditions. The Algorithms section organizes all three configurations by purpose.   
The Standard ACO baseline has no local search, allows PDR to grow without restriction, and neglects H(S), thus covering the lower performance bound. The Non-adaptive HACO (Intermediate case) applies fixed-interval 2-opt every iteration, ignores the H(S) and PDR values, and thus suffers excess CPU time cost; it is the main baseline for the regression comparison. Finally, the Proposed HACO (Experimental Treatment) applies 2-opt only when both signals fire — H(S) \< θ AND PDR(t) \> τ\_PDR — and triggers only on the global best tour T\* with the dual-signal (entropy, PDR) trigger. Finally the Metrics section states what is measured from each algorithm; the SOP 1, Computational Time (seconds; given in average wall-clock time for each trial for each TSP instance); the SOP 2, Convergence Speed (the iteration at which the best tour L\* first satisfies the dual convergence criterion ε \= 0.001 over a sliding window of W \= 20 iterations, or T \= T\_max when unmet); and the SOP 3, Solution quality (mean best tour distance L\* when T= T max from the 3 algorithms).   
The section entitled the Statistical Tests presents how the raw metric data is translated into confirmatory evidence of the algorithm comparisons. The first layer, namely the Descriptive Layer, performs several tasks including: summarizing performance by median and standard deviation per algorithm per instance at each 100-iteration interval; constructing convergence curves by plotting best tour length L\* over iteration number; and generating pairwise percentage improvement curves for each of the three performance measures across all three pairs of algorithms. The second layer, the Inferential Layer, subjects each of the three performance measures to a paired two-tailed t-test at α \= 0.05 in order to determine whether the Proposed HACO is significantly superior to the Non-adaptive HACO on each measure. The decision rule is to reject H₀ when p \< 0.05, confirming that the Proposed Adaptive HACO is significantly superior to the Non-adaptive HACO on each of the three performance measures: (1) computational time, (2) convergence speed, and (3) solution quality. If statistically significant results are achieved for all three measures, then empirical validation of the adaptive entropy-triggered 2-opt mechanism has been achieved — the primary contribution of this work.  
**DESCRIPTION OF THE EXISTING ALGORITHM**  
We are thus talking about a system called Standard Ant Colony Optimization. Also known as ACO. It is a type of algorithm that was inspired by how real ants search for food (Dorigo & Stützle, 2004). In ACO a group of ants work together to find solutions to a problem known as the Traveling Salesman Problem or TSP. They do this by moving around a graph that has nodes. Each ant decides which node to visit by using a special rule. This rule considers two things: pheromone intensity, representing the accumulated reinforcement of previously successful edges, and heuristic attractiveness, defined as the inverse of the edge distance. After all the ants have finished their tours the pheromone levels are updated. The trails of pheromone get weaker at a rate, which is controlled by a parameter called ρ. The ants also add pheromone to the edges they traveled and they add more if their solution was good. The standard ACO algorithm is used to solve combinatorial optimization problems such as the Traveling Salesman Problem (TSP).  
The main advantage of standard ACO is its distributed cooperative search where every ant has an equal right in the process and good solutions boost themselves through pheromone deposits; its weakness to begin with, though, is its positive feedback loop, which causes stagnation: as the number of iterations increases, the pheromone matrix pushes forward along more and more edges that are linked up with the early, high quality, local optima tours, until no change occurs and the colony settles on a suboptimal tour, exploring fewer local and global solutions than the hybrid variants.  
**DESCRIPTION OF THE PROPOSED ALGORITHM**

The proposed HACO is an extension of the existing HACO that incorporates an effective stagnation detection method for determining when the 2-opt local search needs to be applied. The existing HACO, the baseline algorithm for the experiments in this thesis, is a hybrid of the classic ACO framework and a 2-opt local search operator designed to remove crossing edges in the tours generated by the ants, significantly improving the path lengths over the classic ACO. The main framework of it consists of a pheromone driven probabilistic path construction sub-loop, which is the same as in a classic ACO, a pheromone updating phase with evaporation and reinforcement, and a 2-opt local search procedure employed at fixed intervals.  
	The proposed HACO includes all features of the initial HACO, adding a Shannon entropy based stagnation detection system. Shannon entropy H (S), calculated over ant solutions at each iteration, measures the current population search diversity. When this value reaches the stagnation threshold , the adaptive 2-opt local search is applied to the current best ANT T \* .  
	This modification provides a threefold improvement in convergence speed, solution quality, and computational effort by applying 2-opt only when the diversity is low enough to warrant it. The described system is based on a modular Python implementation, and the tested instances are TSPLIB benchmarks varying in size from 51 to 200 nodes.  
**STATEMENT OF THE PROBLEM**

The Ant Colony Optimization (ACO) is a popular metaheuristic for these optimization challenges but the standard implementations are still very prevalent. These issues cause the algorithms to become trapped within a local optima and not sufficiently search the search space causing it to generate inefficient routing schedules and increased costs. In order to reduce these issues, this research aims to find solutions to the following questions:  
1\. What performance limitations does the existing HACO with non-adaptive 2-opt local search exhibit across different sizes of TSP instances in terms of convergence rate, solution quality measured by total tour distance, and computational time?  
2\. How can a comprehensive benchmarking methodology be developed and implemented to compare Standard ACO, existing HACO with non-adaptive 2-opt local search, and the proposed HACO with adaptive 2-opt local search in terms of convergence rate, total tour distance, and computational time?  
3\. Does the proposed HACO with adaptive 2-opt local search demonstrate significant improvements over the existing HACO with non-adaptive 2-opt local search in terms of:  
a. Faster convergence under the predefined convergence criterion;  
b. Better solution quality, indicated by shorter final best-tour distance; and  
c. Lower computational time?  
**OBJECTIVES OF THE STUDY**  
The objective of this study is to assess, differentiate, and enhance current Hybrid Ant Colony Optimization (HACO) with 2-opt local search in optimizing combinatorial routing problems and its issues with convergence speed, solution quality, and computational time. The specific goals of the study are:  
1\. To determine and describe the difficulties faced in the current HACO in terms of convergence rate, quality of the solutions in terms of distance and amount of computing time for different sizes of TSP instances   
2\. To develop and implement a comprehensive benchmarking methodology to analyze and compare the performance of a standard ACO  algorithm,  an  existing HACO algorithm and the proposed HACO with adaptive 2-opt local search in convergence, solution (distance) and computational time.  
3\. To assess whether the proposed HACO with adaptive 2-opt local search converges faster, produces better solutions (distance value), and takes less computational time than the non-adaptive HACO.  
**PURPOSE AND DESCRIPTION**  
	Ant Colony Optimization is an optimization tool for complex routing problems but its efficiency is often decreased by convergence where the artificial ants quickly find suboptimal solution paths and stop exploring, missing better solutions available. This paper discusses solving this obstacle through hybridization of Ant Colony Optimization and local search utility, named 2-opt and implemented in an adaptive manner according to the state of the system at each instant of search, and specifically tailored to the needs of solving complex, high density urban and high risk disaster relief routing problems in order to increase search diversity. This novel hybrid approach aims at improving the solutions of the ACO algorithm by increasing its exploration ability by not getting trapped in solving the problem, while raising only at the right timing, and without impeding its solution convergence power.  
**Researchers.** This research adds to the continuing research of metaheuristic optimization, and in particular, in hybrid ACO using adaptive 2-opt local search to so the TSP in the field of combinatorial optimization. The documented algorithm structures, parameter arrangements , and  experimental  results  will  provide a  reference  in further research in computing intelligence and combinatorial optimization. The quantitative experimental framework proposed by this research, including the TSPLIB benchmark data sets and Shannon entropy as a divergence measure, provides a referable methodological basis that future research on hybrid metaheuristics can modify, add, or compare to in their research.  
**Future researchers.** The proposed study can be a starting point for future works with increased complexity to deploy the hybrid ACO with adaptive 2-opt local search to practical problems and other relatively larger scale combinatorial optimization problems than the TSP, such as the dynamic routing and scheduling problems.  
**TECHNICAL TERMS**  
	The following terms are the technical language used in this study, providing both conceptual and operational meanings for comparisons:  
**Convergence Speed** – refers to how quickly an optimization algorithm reaches a good or near-optimal solution. Faster convergence means the algorithm needs fewer iterations or less time to find a high-quality result (Liu et al., 2023; Tang et al., 2023). In this study, it is used to measure the number of iterations needed for each algorithm to reach the best solution(computational time, convergence speed, and solution quality).  
**Exploration–Exploitation Tradeoff –** This is the balance between searching for new solutions (exploration) and improving the best solutions already found (exploitation) (Zhang et al., 2024; Wang et al., 2023). In this study, this is used to balance exploration and exploitation of the proposed adaptive HACO by using Shannon entropy and PDR to decide when to activate the 2-opt local search.   
**Greedy-Seeded Initialization** – is a method that starts an algorithm with a good initial solution instead of a completely random one (Dorigo & Stützle, 2004). In this study, it is applied to the proposed Adaptive HACO for initialization. The Standard ACO and the existing HACO begin with equal pheromone values on all paths.   
**Heuristic Visibility (η)** is a value that helps ants choose shorter paths. It is commonly calculated as the inverse of the distance between two locations (η \= 1/d), making shorter paths more attractive (Dorigo & Stützle, 2004). In this study, it is combined with the values of the pheromone to determine which path an ant is most likely to choose in all three algorithms.   
**Paired t-test (α \= 0.05)** – a statistical test used to determine whether the difference between two related sets of results is significant or happened by chance (Osaba et al., 2021). In this study, it is used to compare the computational time, convergence speed, and solution quality of the algorithms.  
**Pheromone (τ)** –  is a value stored on each path that represents how often or how successfully that path has been used by previous ants. Higher pheromone values make a path more attractive to future ants (Dorigo & Stützle, 2004). In this study, this guides the movement of ants and helps them choose promising routes in all three algorithms.    
**Pheromone Evaporation (ρ)** –is the process of reducing pheromone values over time. This prevents old paths from staying attractive forever and allows the algorithm to continue exploring new routes (Dorigo & Stützle, 2004). In this study, it is used in all three algorithms to prevent the search from converging too early.   
**Shannon (Information) Entropy H(S)** – measures how different or similar a group of solutions is. High entropy means the solutions are varied, while low entropy means the solutions are becoming similar (Nie et al., 2023). In this study, it is used  to check every iteration to decide whether the ant population is still exploring or has started narrowing in on similar routes too early.  
**Solution Diversity** – refers to how different the current solutions are during the search process. Higher diversity means the algorithm is still exploring different possibilities (Sun, Zhang, & Ren, 2022). In this study, solution diversity is measured using Shannon entropy. It is used to determine whether the Standard ACO, the existing HACO, and the proposed Adaptive HACO is still exploring or has started to stagnate.    
**Traveling Salesman Problem Library (TSPLIB)** – is a public collection of standard Traveling Salesman Problem datasets that researchers use to test and compare optimization algorithms fairly (Osaba et al., 2021). In this study, its datasets are used to evaluate the performance of the Standard ACO, the existing HACO, and the proposed Adaptive HACO under the same experimental conditions. 

**Chapter 2**  
**METHODOLOGY**  
This chapter presents the research design, data-gathering techniques, sources of data, and the theorems, algorithms, and mathematical models used in designing and evaluating the Hybrid Ant Colony Optimization (HACO) with Adaptive 2-opt Local Search for combinatorial optimization.

**RESEARCH DESIGN**

In this study, a **Quantitative Experimental Research Design** was adopted to test the efficiency of the novel approach. This special method is formed by designing a hybrid of ACO algorithm and an appropriate local search procedure which attempts to solve the optimization benchmark problem, TSP, for their minimum path by visually testing different routes. Experimental research design is more appropriate when one approach is tested against another under a certain control condition (Creswell& Creswell, 2018). Thus, the study attempted to apply the hybrid ACO through comparing the results with the control approach (no method or a different approach) and check the efficiency statistically.  
	The independent variable in this experiment is the type of ACO algorithm used: the standard ACO or the hybrid ACO with adaptive 2-opt local search. The dependent variables are the performance metrics: total travel distance, convergence speed, solution  
diversity, and execution time. All other experimental parameters, such as the number of 

ants and the pheromone evaporation rate are held constant across the three algorithms.  
To rigorously assess the benefit of adding the adaptive 2-opt scheme into the existing HACO, the experiment is designed in a way that controls for the influence of other factors — namely the rate of evaporation and the network topology — and focuses solely on the influence of the new scheme. This experimental framework adheres to the principles of quantitative research that have been adopted by the recent optimization studies (Nie et al., 2023).  
	A related additional motivation that is explicit in the paper is based on the need to overcome identified deficiencies in the normal ACO especially in relation to premature convergence and the demise of some of the solution diversity, when faced with complex routing network problems. The experiment is designed to compare algorithmic output across a series of six simulated TSP tasks varying in size and provides statistically meaningful results relevant to each of the objectives stated in the paper (Dorigo & Stützle, 2004).  
	Comparisons are limited to three variants of the ACO family: Standard ACO, non-adaptive HACO, and the proposed adaptive HACO. GA and particle swarm optimization were omitted as the question centers on the whether an entropy-adaptive trigger of 2-opt is better than fixed-schedule trigger within ACO. 2-opt hybridization is the most widely reported ACO strategy on the TSP (Mavrovouniotis et al., 2017); hence the intra-ACO comparison is the most relevant scope.

**Quantitative Experimental Research Design**  
**Figure 3**   
*Quantitative Experimental Research Design Framework for Hybrid ACO with Adaptive 2-opt Local Search*

The experimental research will be conducted as a controlled simulation study using Python 3.10, implemented and executed at the Computer Laboratory of the Divine Word College of Legazpi. Three algorithms will be implemented, run, and compared under identical experimental conditions: Standard ACO (baseline), the existing HACO with non-adaptive 2-opt (intermediate comparison), and the proposed HACO with adaptive entropy-based 2-opt (experimental treatment).  
	 The dataset for this study consists of TSP benchmark instances drawn from the TSPLIB repository (Reinelt, 1991), the internationally recognized standard library for TSP benchmarking. The following TSPLIB instances will be used: eil51 (51 nodes), berlin52 (52 nodes), eil76 (76 nodes), kroA100 (100 nodes), kroB150 (150 nodes), and kroA200 (200 nodes). Each instance will be run for 30 independent trials per algorithm, for a total of 90 simulation runs per instance. Comparative analysis will consist of descriptive statistics, overlaying convergence curves (comparison of the convergence behaviors of the proposed HACO and the existing HACO), pair-wise percentage improvement comparisons, and paired t-tests at a \=0.05 to identify the improvements made by the proposed HACO over the existing HACO.  
The Quantitative Experimental Research Design used for this research is divided into four phases: Pre-Experimental Design, Experiment, Data Collection and Analysis and Evaluation and validation process.  
**Pre-Experimental Setup.** In this stage the researchers set up everything needed for the controlled experiment. All three algorithms are implemented in Python, using a common set of parameters: the pheromone evaporation rate, the heuristic influence factors and , the number of artificial ants m, the constant as the pheromone deposit Q, and the maximum number of iterations T max used as the uniform stop criterion. Convergence is defined operationally as the iteration number t at which the length of the best tour L\* remains unchanged by a factor of the improvement tolerance= 0.001, relative to L\* over a window of iterations is W= 20\. This dual criterion the window W and the improvement tolerance is used to prevent the algorithms from being declared converged simply because of no incremental change from one iteration to the next. Convergence speed is then documented by the iteration number t at which this condition is first satisfied, or T max if the condition is never met during the run. The entropy threshold is chosen experimentally from a set of calibration runs prior to the experiment, while TSPLIB instances with node sizes from 51 to 200 are examined. To justify the paired design of the statistical tests, trial i of each algorithm on a given instance is executed with the same random seed, and the full seed list is stored with the trial logs for reproducibility.  
**Experimental Execution.**  In this step we run the three algorithms using exactly the same simulation parameters for thirty independent trials on each TSPLIB instance for a total of ninety runs per problem case. Each trial is conducted for T max iterations and records as a function of iteration the best tour identified so far L \*, the current state of the pheromone matrix, the Shannon entropy of the solution set H(S), and the wall-clock time to perform the computation; all these parameters are updated continuously over each iteration. For the proposed HACO, we apply 2-opt to the global best tour T\* only when the Shannon entropy H(S) falls below the calibrated threshold θ and the Pheromone Dominance Ratio PDR(t) exceeds its calibrated threshold; in such cases we also record the number of stagnation and 2-opt activation events for each trial.  
**Data Collection and Analysis.**  Overall performance metrics are then compiled using all converged trials across three different quantitative measures as follows (all values are trial means except where noted): 1 ) Rate of convergence (average number of iterations t for L\* to first meet dual convergence criteria (i.e., no more than an improvement of \= 0.001 over a W \= 20 range of successive iterations versus T max if not achieved); 2\) solution quality (average value of L\* best tour distance at T max ); 3\) runtime (average value of wall-clock seconds elapsed). Means and standard deviations of the above metrics are generated for each algorithm on each test instance, and convergence curves are plotted (Matplotlib). Percentage improvements with corresponding means and standard deviations are calculated via pairwise comparisons between all three algorithms.  
**Evaluation and Validation.** The comparison of the proposed HACO with the non-adaptive HACO is accomplished via eighteen paired t-tests (two-tailed, α \= 0.05): one per performance indicator per TSPLIB instance (six instances × three indicators). Standard hypothesis-testing procedures are used to analyze the results and discern whether the entropy-based adaptive triggering of 2-opt truly surpasses the fixed-interval triggering of the non-adaptive HACO, or whether the observed differences are within chance limits. If any results indicate systematic miscalibration, the parameters are modified to err on the side of caution, and the validity of the evidence is assessed in consideration of each stated research objective.

**Purpose, Deliverables, and Development Activities**  
*Activities of Quantitative Experimental Research Design*  
**Table 2.1** 

| Phase | Purpose | Deliverables | Development Activities |
| ----- | ----- | ----- | ----- |
| Pre-ExperimentalSetup | To establish the baseline environment, define parameters, and prepare simulation datasets for controlled experimentation. | Baseline ACO implementation, defined parameter configurations, and simulation dataset specifications. | Set up standard ACO parameters, implement the algorithms in Python, and test on TSPLIB datasets, measuring distance, convergence, diversity, and running time. |
| ExperimentalExecution | To compare the performance of the conventional ACO and the hybrid ACO under identical experimental settings.  | Simulation trial logs and raw performance and convergence data.  | Incorporate the adaptive 2-opt method with stagnation detection into the ACO algorithm; run simulation experiments with different instance sizes and plot performance variation of total cost and iterations across trials for the non-hybrid and hybrid ACO. |
| Data Collection& Analysis | To obtain quantitative performance data and use statistical tools to compare algorithms. | Statistical analysis report; convergence charts; diversity charts; performance comparison tables. | Collect data on total travel distance, convergence rate, solution diversity, and computation time; compute descriptive statistics;  |

| Evaluation &Validation | To assess whether the hybrid ACO significantly outperforms the standard ACO and validate the study objectives. | Final performance analysis report, Research Validated conclusions, and contribution of research.  | Assess if hybrid ACO diminishes premature convergence and enhances solution quality; compare outcomes to research objectives; adjust for optimal performance; record results.  |
| :---- | :---- | :---- | :---- |

**SCOPE AND DELIMITATION**	  
This paper concerns the design, implementation and experimental comparison of three algorithm configurations: (a) Standard Ant Colony Optimization; (b) Hybrid ACO with a non-adaptive 2-opt local search; and (c) this research’s Novel Hybrid ACO with an adaptive entropy update to trigger 2-opt. The scope includes comprehensive coverage of the algorithms’ design and usage of the Adaptive HACO variant, encompassing greedy-seeded pheromone initialization, iterative ant tour construction under the influence of the probabilistic transition rule p(i,j), global pheromone update by selective evaporation and deposition, each algorithm’s on-the-fly Shannon entropy calculation for solution stagnation detection, and an adaptive 2-opt trigger activated whenever Shannon entropy H(S) falls below the calibrated threshold θ and the Pheromone Dominance Ratio PDR(t) confirms over-exploitation. All three algorithms’ 30 runs are compared on representative benchmark instances from TSPLIB with node counts ranging from 51 to 200, including eil51, berlin52, eil76, kroA100, kroB150, and kroA200. The three algorithms’ performance is summarized in terms of three output characteristics: a) convergence rate, b) solution cost in total distance, and c) total time-to-convergence; and categorized using statistical tests with \= 0.05 to verify the hypothesis that the non-adaptive method differs significantly from the adaptive method in the three measures.  
This work is limited to static, single-objective TSP problems only, using no samples from the recent advances in dynamic problem variants where the location of nodes or the weights along edges are subject to change during the execution of the algorithm. The adaptive 2-opt operator proposed here is only used to compare changes between the current global best tour T\* and the solution space during a period of stagnation. Other local search operators such as 3-opt, Or-opt, Lin-Kernighan, as well as various metaheuristic approaches, are not tested for inclusion in this framework in order to minimize extraneous variables in this initial proof of concept.  
The threshold for the entropy value of T\* was experimentally determined for each trial type and is used as a fixed value during each trial, but considered an element of this study for first-order analysis of the adaptive rule; no hierarchical or meta-parameter self-tuning or meta-evolutionary, rule-driven autonomous component choices are implemented here.  
The scope of the study is further limited in scope to only three algorithmic variants (Standard ACO, a non-adaptive HACO, and the adaptive HACO), and not seen within other metaheuristic families like GAs, PSO, or Simulated Annealing.  No  parallelization,GPU calculation, hardware evaluation, or other similar optimization measures are taken, and no multi-objective selection criteria are used to evaluate tour quality, simply the total distance as designated by each TSPLIB instance in Euclidean space.

**DATA GATHERING TECHNIQUES**  
To ensure validity, reliability and a comprehensive assessment of the algorithm performance, three methods of data collection were chosen.  
**Simulation-Based Data Collection.** This step constructs a repeatable, controlled environment such that the results of each algorithm can be separated from differences in running conditions. It is in this version of the TSP problem that the performance of Standard ACO, non-adaptive HACO, and adaptive HACO will be distinguished purely by the differing properties of the algorithmic implementations, rather than by the situations in which the algorithms were run. The six benchmark challenges are placed into one commonly-controlled simulated TSP, and each of the three algorithms is then run using the same problem instances, trial numbers, and algorithm parameters. This step   
serves as the basis for the entire data-gathering stage, since from it every subsequent step of the analysis begins with data produced by it.  
**Performance Benchmarking.** This method of measurement transforms raw simulation results into three of our performance measures identified in the study; (1) Computational Time (average wall-clock runtime per trial per instance), (2) Convergence Speed (iteration index at which the program first meets the convergence criterion) and (3) Solution Quality (average best tour from simulation results in Euclidean units). Using the same measurement methodology across the three algorithms and six instances serves to make the comparison as direct and unbiased as possible, avoiding measurement bias and offering numerical support for the descriptive analysis and t-test results.  
**Experimental Testing.** This test ensures the entropy-triggered adaptive technique, the primary contribution of the paper, operates properly before statistical tests. It ensures the computation of Shannon entropy is correct at each iteration, that 2-opt local search is only triggered when the entropy has dropped below the tuned threshold and the PDR ensures the level of over-exploitation, and likelihood of triggering, remains stable when instances of size from 51 to 200 nodes are used.

**SOURCES OF DATA**  
The data during the study will be obtained purely from simulation-based experimentation to guarantee precision, validity and reliability of the data, with each of the three data collection methods as separate independent sources of data.  
Simulation-Based Data Collection: The central data source here is a simulation environment setup through Python 3.10 that simulates the Traveling Salesman Problem exactly – nodes are locations and the roads between them are edges, with distances calculated as Euclidean (direct) distance. The simulation environment is far easier to use to isolate specific algorithms to make them behave in a certain way than it is in unpredictable real-world environments with dozens of uncontrolled variables. Data is always generated from the TSPLIB benchmark repository (Reinelt, 1991), a widely recognized standard for TSP algorithm evaluation. The specific problem instances used—eil51, berlin52, eil76, kroA100, kroB150, and kroA200—are symmetric TSP problems available publicly from:  
\- Primary source: TSPLIB at Universität Heidelberg: https://comopt.ifi.uni-heidelberg.de/software/TSPLIB95/  
  \- Direct problem files: The .tsp files for each instance (e.g., eil51.tsp, berlin52.tsp, kroA100.tsp, etc.) were downloaded from the TSPLIB FTP repository at https://comopt.ifi.uni-heidelberg.de/software/TSPLIB95/tsp/  
These benchmark problems provide all necessary data—node coordinates, optimal solutions (for reference), and problem dimensions. The distance matrices are computed directly from the Euclidean distances between node coordinates as specified in each .tsp file. Six instances from the dataset are used—eil51, berlin52, eil76, kroA100, kroB150, and kroA200—each larger and more complex (more nodes) than the last, ranging from 51 to 200 nodes in increasing scale. This provides the shared grounds for experiments: the consistent environment, data for these problem instances, the distance matrices, and such.  
The source of data for the Performance Benchmarking criterion is the set of results obtained by running the following 3 algorithms: Standard ACO, non-adaptive H-ACO, and the new adaptive HACO algorithm, on all six TSPLIB problems, with identical shared parameters, in 30 independent runs per instance (180 runs per algorithm; 540 runs in total across the three algorithms), where each of these runs produces a set of strings containing the best found solution value (L\*), the state (i,j) of the pheromone matrix, the values of Shannon Entropy diversity index H(S), and the wall-clock computational time. From these strings, there are 3 outcomes the performance study report: computation time, the average wall-clock time in seconds per independent trial per problem, convergence time as the index of iterations when the convergence criterion is first met, and solution quality as the average maximum tour length value at the last iteration. These strings are then documented in structured CSV tables so the samples of the 3 different algorithms can be compared side by side.  
For Experimental Testing, the data source for information is the supplemental diagnostic logs generated by verification of the  entropy-triggered  adaptive  mechanism. These logging files list all recorded completed iterations to date, record the best route found, any 2-opt swaps taken, time and frequency of stagnation triggers (H (S) \< ), the associated Pheromone Dominance Ratio PDR(t) value for each trigger, and the usage of computational resources. Only once these diagnostic data show consistent performance of the adaptive triggering mechanism across varying problem sizes and independent trials will the performance data be considered valid.  
The results from the three methods shall be stored in files having a predefined structure for subsequent statistical validation of the paired t-test procedure explained in the Research Design.

**THEOREMS, ALGORITHMS, AND MATHEMATICAL MODELS**	  
This section describes the theorems, algorithms, and mathematical models in all three evaluated algorithms in this paper: Standard ACO, hybrid ACO with non-adaptive 2-opt local search, and the proposed HACO hybrid ACO with adaptive entropy-based 2-opt. The three variants all have the same mathematical basis, with the same pheromone transition rule and 2-opt condition of improvement. Their algorithmic differences are the applying situation of 2-opt governed by the Shannon entropy based stagnation detection techniques only found in the proposed HACO.  
**THEOREM 1: The Pheromone Transition and Convergence Property**  
The three algorithms in this study use the same design principle of pheromone guided construction. In ant colony optimization, a globally optimal solution can be obtained by repeatedly constructing a solution using pheromone guidance. The probability that an artificial ant selects edge (i, j) at iteration t is formally governed by:  
p(i,j) \= ( \[τ(i,j)\]^α · \[η(i,j)\]^β ) / ( Σ \[τ(i,l)\]^α · \[η(i,l)\]^β )  
where τ(i,j) is the pheromone intensity on edge (i, j), η(i,j) \= 1/d(i,j) is the heuristic visibility, and α and β control the relative influence of pheromone trails and heuristic information, respectively. After each iteration,  the pheromone matrix is updated as:  
τ(i,j)←(1−ρ)⋅τ(i,j)+∑\_k​Δτk​(i,j)   
where ρ is the evaporation rate (0 \< ρ \< 1\) and Δτ\_k(i,j) \= Q / L\_k if ant k used edge (i, j) in its tour, and 0 otherwise. Q is a constant and L\_k is the total tour length of ant k. Standard ACO and the non-adaptive HACO use uniform pheromone initialization τ₀ \= 1/(n · L\_nn), while the proposed HACO applies greedy-seeded initialization, assigning a higher τ₀ to edges belonging to a nearest-neighbor heuristic solution to accelerate early convergence (Dorigo & Stutzle, 2004).  
**THEOREM 2: The 2-opt Local Optimality Property**  
The same criterion for 2-opt improvement is used for both variants of HACO. Starting with a candidate solution T, a 2-opt move involves the removal of two edges (v i, vi+1 ) and (v j, vj+1) of T. The two open ends are then reconnected while reversing the partial tour that extends from positions i \+ 1 to j. The improvement obtained from a swap of this kind is:  
Δ \= d(vᵢ, vᵢ₊₁) \+ d(vⱼ, vⱼ₊₁) − d(vᵢ, vⱼ) − d(vᵢ₊₁, vⱼ₊₁)    
A swap is executed only if Δ \> 0, so that we obtain a strict tour improvement. The TSP tour is 2-opt locally optimal, in case no improving swap is found. The structural difference between the two variants of the HACO is not the 2-opt operator. It is the triggering condition of its execution: the non adaptive HACO applies 2-opt every time step, regardless of the algorithm state; the proposed HACO applies it only when Shannon entropy H(S) falls below the calibrated threshold θ and the Pheromone Dominance Ratio PDR(t) exceeds its threshold, representing algorithmic stagnation (Lin & Kernighan, 1973; Nie et al., 2023).  
**ALGORITHM 1: Standard ACO (Baseline)**  
**Problem Statement:**  
This benchmark involves a set of n nodes for which the pairwise Euclidean distance is known. The problem is to identify the shortest Hamiltonian tour that visits each node exactly once. The standard ACO in this case does not employ any local search procedures.  
**Inputs:**  
n: Number of nodes; d(i,j): Distance between nodes i and j; m: Number of ants; α, β: Pheromone and heuristic influence parameters; ρ: Evaporation rate; Q: Pheromone deposit constant; T\_max: Maximum iterations.  
**Output:**  
Best tour T\* and corresponding total distance L\* found across all iterations without any local search refinement.  
**Steps:**  
1\. Initialize pheromone trails: τ(i,j) \= τ₀ \= 1/(n · L\_nn) for all edges. 2\. For each iteration t from 1 to T\_max: (a) For each ant k, construct tour T\_k using transition rule p(i,j). (b) Update global best T\* if any L\_k \< L\*. (c) Update pheromone: τ(i,j) ← (1−ρ)·τ(i,j) \+ Σ Δτ\_k(i,j). 3\. Return T\* and L\*.  
**Pseudocode:**  
StandardACO(n, d, m, α, β, ρ, Q, T\_max):  
    τ(i,j) \= τ₀  for all (i,j)  
    T\* \= null;  L\* \= ∞  
    for t \= 1 to T\_max do  
        for k \= 1 to m do  
            T\_k \= construct\_tour(τ, η, α, β)  
            L\_k \= tour\_length(T\_k)  
            if L\_k \< L\* then  
                T\* \= T\_k  
                L\* \= L\_k  
            end if  
        end for  
        update\_pheromones(τ, ρ, Q, tours, lengths)  
    end for  
    return T\*, L\*  
Standard ACO applies no post-construction refinement, making it the most computationally lightweight of the three algorithms but the most susceptible to premature convergence due to the uncontrolled positive feedback of the pheromone update rule (Dorigo & Stutzle, 2004).  
**ALGORITHM 2: Hybrid ACO with Non-Adaptive 2-opt (Intermediate Comparison)**   
**Problem Statement:**  
Same TSP objective as Algorithm 1\. The non-adaptive HACO augments standard ACO with 2-opt local search applied at every iteration to the best tour found, regardless of the current population diversity state. This is the intermediate baseline that demonstrates the benefit of 2-opt over standard ACO while also exposing the cost of non-adaptive scheduling.  
**Inputs:**  
Same as Algorithm 1: n, d, m, α, β, ρ, Q, T\_max. No entropy threshold θ is used.  
**Output:**  
Best tour T\* and distance L\* refined by 2-opt at every iteration, at the cost of higher total computational time.  
**Steps:**  
1\. Initialize pheromone trails: τ(i,j) \= τ₀ for all edges. 2\. For each iteration t from 1 to T\_max: (a) For each ant k, construct tour T\_k using transition rule p(i,j). (b) Update global best T\* if any L\_k \< L\*. (c) Update pheromone: τ(i,j) ← (1−ρ)·τ(i,j) \+ Σ Δτ\_k(i,j). (d) Apply 2-opt local search to T\* unconditionally. (e) Update T\* and L\* if 2-opt yields improvement. 3\. Return T\* and L\*.  
**Pseudocode:**  
NonAdaptiveHACO(n, d, m, α, β, ρ, Q, T\_max):  
    τ(i,j) \= τ₀  for all (i,j)  
    T\* \= null;  L\* \= ∞  
    for t \= 1 to T\_max do  
        for k \= 1 to m do  
            T\_k \= construct\_tour(τ, η, α, β)  
            L\_k \= tour\_length(T\_k)  
            if L\_k \< L\* then  
                T\* \= T\_k  
                L\* \= L\_k  
            end if  
        end for  
        update\_pheromones(τ, ρ, Q, tours, lengths)  
        T\*, L\* \= two\_opt(T\*, d)  ← applied every iteration  
    end for  
    return T\*, L\*

The non-adaptive HACO applies 2-opt refinement at every iteration, incurring substantially more computational work than standard ACO, especially on larger problems. Unconditional refinement can also intensify the search on one region before the colony has adequately explored the solution space, depleting diversity prematurely (Wang et al., 2023; Zhang et al., 2024).  
**ALGORITHM 3: Proposed HACO with Adaptive Entropy-Based 2-opt (Experimental)**  
**Problem Statement:**  
The Traveling Salesman Problem objective remains the same as in Algorithms 1 and 2\. The proposed HACO adds a stagnation detection module based on Shannon entropy, applying 2-opt only when population diversity H(S) falls below a threshold θ set before the process begins. This guarantees that local search is performed just when necessary, ready to find the new local optimum to escape stagnation, without wasting computation while still exploring the search space.  
**Inputs:**  
n, d, m, α, β, ρ, Q, T\_max (same as Algorithms 1 and 2), plus θ: the entropy threshold for identifying stagnation, and τ\_PDR: the PDR threshold for confirming over-exploitation, both established by initial calibration trials.  
**Output:**  
Best tour T\* and distance L\*, with adaptive application of 2-opt only when frustration is detected, optimizing both solution quality and computational running time.  
**Steps:**  
1\. Apply greedy-seeded initialization: τ(i,j) \= τ₀ based on nearest-neighbor solution.  
 2\.  For each iteration t from 1 to T\_max: (a) For each ant k, construct tour T\_k using transition rule p(i,j). (b) Update global best T\* if any L\_k \< L\*. (c) Update pheromone: τ(i,j) ← (1−ρ)·τ(i,j) \+ Σ Δτ\_k(i,j). (d) Compute H(S) \= −Σ p(e) log₂ p(e) over the current ant population and PDR(t) \= τ\_max(t) / τ\_mean(t). (e) If H(S) \< θ AND PDR(t) \> τ\_PDR (stagnation detected): apply 2-opt to T\*; update T\* and L\* if improved. 3\. Return T\* and L\*.  
**Pseudocode:**  
AdaptiveHACO(n, d, m, α, β, ρ, Q, T\_max, θ, τ\_PDR):  
    τ(i,j) \= τ₀  for all (i,j)  ← greedy-seeded  
    T\* \= nearest\_neighbor\_tour();  L\* \= length(T\*)  
    for t \= 1 to T\_max do  
        for k \= 1 to m do  
            T\_k \= construct\_tour(τ, η, α, β)  
            L\_k \= tour\_length(T\_k)  
            if L\_k \< L\* then  
                T\* \= T\_k  
                L\* \= L\_k  
            end if  
        end for  
        update\_pheromones(τ, ρ, Q, tours, lengths)  
        H \= shannon\_entropy(tours)  
        PDR \= max(τ) / mean(τ) if H \< θ AND PDR \> τ\_PDR then ← stagnation detected T\*, L\* \= two\_opt(T\*, d) ← adaptive trigger  
        end if  
    end for  
    return T\*, L\*  
The proposed HACO avoids the time-consuming unconditional application of 2-opt during high-diversity phases by firing 2-opt only when the entropy signal H(S) falls below θ and the PDR signal confirms over-exploitation. Theoretically, this enhances all three evaluation metrics at the same time — improved convergence speed, enhanced solution quality, and reduced total runtime — by concentrating the expensive 2-opt passes on the moments of genuine stagnation (Nie et al., 2023; Tang et al., 2023).  
**ALGORITHM 4: 2-opt Local Search (Shared Subroutine)**  
**Problem Statement:**  
Given a tour T \= (v₁, v₂, …, vₙ, v₁) and a distance matrix d, improve the tour by enumerating all two-edge exchanges and applying improvements until no further improvement can be found. This subroutine is shared by both HACO variants: Algorithm 2 applies it every iteration, while Algorithm 3 applies it only when H(S) falls below θ.  
**Inputs:**  
T: Current candidate tour; d(i,j): Distance matrix; n: Number of nodes.  
**Output:**  
Improved tour T' with total length L' ≤ L(T), locally optimal with respect to all 2-edge exchanges.  
**Steps:**  
1\. Set improved \= True. 2\. While improved \= True: (a) Set improved \= False. (b) For each pair (i, j) where i \< j, compute: Δ \= d(T\[i\],T\[i+1\]) \+ d(T\[j\],T\[j+1\]) − d(T\[i\],T\[j\]) − d(T\[i+1\],T\[j+1\]). If Δ \> 0: reverse segment T\[i+1..j\]; set improved \= True; break. 3\. Return the improved tour T'.  
**Pseudocode:**  
TwoOpt(T, d, n):  
    improved \= True  
    while improved do  
        improved \= False  
        for i \= 1 to n-2 do  
            for j \= i+1 to n do  
                Δ \= d(T\[i\], T\[i+1\]) \+ d(T\[j\], T\[j+1\])  
                  \- d(T\[i\], T\[j\]) \- d(T\[i+1\], T\[j+1\])  
                if Δ \> 0 then  
                    reverse T\[i+1 .. j\]  
                    improved \= True  
                    break  
                end if  
            end for  
        end for  
    end while  
    return T

The 2-opt subroutine ensures that the returned tour is locally optimal with respect to all 2-edge exchanges. However, since each full 2-opt pass costs O(n²), the naive use of 2-opt at every iteration in Algorithm 2 is expensive for larger instances. Algorithm 3 circumvents this by calling 2-opt only when the dual-signal trigger confirms stagnation (Lin & Kernighan, 1973).  
**MATHEMATICAL MODEL: Shannon Entropy-Based Diversity Measure**  
To detect algorithmic stagnation, this study adopts Shannon entropy as the quantitative diversity measure for the ACO population. Originally formulated by Shannon (1948) to quantify the uncertainty contained in a probability distribution, entropy is repurposed here as a structural diagnostic: rather than measuring uncertainty in a communication signal, it measures how uncertain an outside observer would be about which edge a randomly chosen ant's tour will use next, given the current distribution of edges across the whole colony. When that distribution is spread thinly over many different edges, the outcome is hard to predict and entropy is high; when the colony has converged onto a small, shared set of edges, the outcome is easy to predict and entropy is low. This reframing is what allows a communication-theoretic quantity to serve as a real-time stagnation signal for a population-based search.  
Given the set E of edges of the instance graph, the entropy H(S) is computed as:  
H(S) \= −Σ\_{e∈E} p(e) log₂ p(e)  
where p(e) is the proportion of ants whose constructed tours traverse edge e in the current iteration. The entropy value H(S) approaches 0 when the population concentrates on a small set of shared edges (complete stagnation) and is maximal when the ants disperse uniformly over many different edges (maximum diversity). The stagnation condition is formally defined as:  
H(S) \< θ AND PDR(t) \> τ\_PDR  
where θ is a predefined entropy threshold and τ\_PDR a predefined PDR threshold, both determined through preliminary calibration experiments. When stagnation is detected, the adaptive 2-opt local search is triggered on the current best solution T\* to refine the tour and restore population diversity. This mathematical model ensures that the hybrid algorithm dynamically responds to convergence behavior rather than applying local search at fixed intervals, resulting in a more computationally efficient and algorithmically effective optimization process (Shannon, 1948; Gao et al., 2020; Tang et al., 2023).  
When stagnation is detected under this dual-signal rule, the adaptive 2-opt local search is triggered on the current best solution T\* to refine the tour and restore population diversity, after which the algorithm resumes the standard construction–update cycle with H(S) and PDR(t) recomputed fresh at the next iteration. This mathematical model ensures that the hybrid algorithm dynamically responds to convergence behavior rather than applying local search at fixed intervals, resulting in a more computationally efficient and algorithmically effective optimization process (Shannon, 1948; Gao et al., 2020; Tang et al., 2023).

**Chapter 3**  
**RESULTS AND DISCUSSIONS**  
This chapter discusses the results, findings, proposed solutions, materials and statistical tools, system requirements, system tradeoffs, and system design framework followed to accomplish this research. The chapter presents the experimental findings derived from the controlled comparison between the standard Ant Colony Optimization (ACO) and the proposed Hybrid ACO with Adaptive 2-opt Local Search, evaluated across multiple TSP benchmark instances of varying complexity.

**RESULTS**  
The three algorithm configurations were evaluated on six TSPLIB benchmark instances of increasing difficulty — eil51 (51 nodes), berlin52 (52), eil76 (76), kroA100 (100), kroB150 (150), and kroA200 (200) — under identical shared parameters (α \= 1.0, β \= 5.0, ρ \= 0.5, m \= 30 ants, Q \= 1.0, T\_max \= 500 iterations), with 30 independent trials per algorithm-instance combination and shared random seeds to enable paired statistical testing. For the Proposed Adaptive HACO, the entropy threshold θ was calibrated per instance as the 30th percentile of the Shannon entropy distribution observed over pilot runs (θ between 47.24 for eil51 and 142.78 for kroA200), and the Pheromone Dominance Ratio threshold was fixed at τ\_PDR \= 2.0. Each trial logged the best tour length L\*, the Shannon entropy H(S) of the ant population, the Pheromone Dominance Ratio PDR(t), the number of 2-opt activation events, and the wall-clock computation time. The results are reported in the order of the Statement of the Problem and the Objectives of the Study, so that this chapter runs parallel to the findings and conclusions in Chapter 4\. SOP 1 determines and describes the difficulties the existing HACO with non-adaptive 2-opt exhibits in convergence rate, solution quality and computing time across instance sizes, and documents the calibration work those observed difficulties motivated. SOP 2 documents the benchmarking methodology as it was actually executed, including the validation inputs and the initialization settings of each configuration. SOP 3 reports the comparative evaluation of the Proposed Adaptive HACO against the existing HACO in terms of (a) convergence rate, (b) solution quality and (c) computational time.

**SOP 1 — Difficulties Faced by the Existing HACO with Non-Adaptive 2-opt Local Search**	

The first research question asks what performance limitations the existing HACO with non-adaptive 2-opt exhibits across TSP instances of different sizes. Answering it requires the existing HACO to be profiled in its own right rather than only as a comparison point for the proposed algorithm. Table 3.1 therefore presents a diagnostic profile compiled from the same 30-trial runs of the existing HACO reported later in this chapter, with each metric expressed against the reference that makes the difficulty observable: the convergence window W \= 20 for convergence rate, the known TSPLIB optimum for solution quality, and Standard ACO (which performs no local search) for computing time.  
**Table 3.1**  
*Diagnostic Profile of the Existing HACO with Non-Adaptive 2-opt across Instance Sizes (30 trials per instance)*

| Instance | Mean plateau iteration t\* (SD) | Non-adaptive HACO | Proposed Adaptive HACO | % Reduction vs Non-adaptive |  |
| :---: | :---: | :---: | :---: | :---: | :---: |
| eil51 | 20.5 (2.2) | 3.88% | 2.75 | \+0.79 s (+40.3%) | 500 (100%) |
| berlin52 | 25.7 (7.6) | 0.41% | 2.86 | \+0.85 s (+42.3%) | 500 (100%) |
| eil76 | 21.6 (4.7) | 4.74% | 4.40 | \+1.21 s (+37.9%) | 500 (100%) |
| kroA100 | 20.0 (0.0) | 4.04% | 6.37 | \+1.50 s (+30.8%) | 500 (100%) |
| kroB150 | 20.0 (0.0) | 5.81% | 10.67 | \+1.96 s (+22.5%) | 500 (100%) |
| kroA200 | 20.0 (0.0) | 5.65% | 13.13 | \+1.40 s (+11.9%) | 500 (100%) |

**Difficulty 1: Premature convergence at the floor of the measurement window.**  
	Under the dual convergence criterion (ε \= 0.001 sustained over W \= 20 iterations), the existing HACO stopped improving after a mean of 20.0 to 25.7 iterations of a 500-iteration budget, that is, within the first 4.0% to 5.1% of the run. On the three largest instances — kroA100, kroB150 and kroA200 — the mean plateau iteration was exactly 20.0 with a standard deviation of 0.0 across all 30 trials. Because W \= 20 is the earliest iteration index at which the criterion can be evaluated at all, a value of exactly 20.0 in every single trial means the best tour had already ceased to improve by a measurable margin before the criterion could first be applied. Convergence was therefore not merely rapid; it was detected at the floor of the measurement, which is the observable signature of premature convergence. The mechanism is visible in the entropy traces of Figure 7: unconditional 2-opt drives the global best tour T\* to a 2-opt local optimum within the opening iterations, the entropy of the ant population collapses shortly afterwards, and the colony retains no diversity with which to leave that basin. The difficulty is not that the existing HACO converges quickly but that it converges early and then stops, spending roughly 95% to 96% of the iteration budget confirming a solution it can no longer improve.  
**Difficulty 2: A solution-quality ceiling that widens with instance size.**

The existing HACO did not reach the known optimum on any of the six instances. Its residual gap was 3.88% on eil51, 4.74% on eil76, 4.04% on kroA100, 5.81% on kroB150 and 5.65% on kroA200, broadly widening as node count increased. This pattern follows directly from Difficulty 1: because the search halts at a 2-opt local optimum reached inside the first twenty iterations, the quality of the final tour is largely fixed by whichever region of the search space the colony happened to occupy early, and a larger search space makes that early commitment more costly. Berlin52 is the informative exception at 0.41%. On an instance small enough for the early 2-opt local optimum to lie close to the global optimum, unconditional refinement is adequate; the difficulty is specific to instances on which it does not, and those are the larger ones.

**Difficulty 3: Refinement cost charged on every iteration regardless of search state.**

The existing HACO was the slowest of the three configurations on all six instances. Measured against Standard ACO, the unconditional 2-opt added between 0.79 s (eil51) and 1.96 s (kroB150) per trial, an overhead of 40.3% on eil51, 42.3% on berlin52, 37.9% on eil76, 30.8% on kroA100, 22.5% on kroB150 and 11.9% on kroA200. The absolute cost rises with node count, as expected of an O(n²) pass, but the decisive observation is the pairing of the last two columns of Table 3.1: 2-opt was invoked in 100% of iterations — 500 calls per trial on every instance — while the best tour stopped improving at around the twentieth. The great majority of those calls were therefore spent on a tour that was already 2-opt locally optimal and could not be changed by them. The difficulty lies not in the cost of the 2-opt operator but in the scheduling rule, which spends the same computation whether the colony is still exploring or has long since stagnated.

The three difficulties are not independent. Unconditional refinement produces the early plateau; the early plateau caps attainable tour quality and does so more severely as instances grow; and the same unconditional refinement continues to charge O(n²) work across the remaining iterations, during which nothing improves. All three trace to a single design property: the existing HACO decides when to apply 2-opt without reference to the state of the search. That property is what the proposed algorithm changes, and the calibration reported next established the settings under which the change could be made.

**Fine-Tuning of the 2-opt Local Search in Response to the Observed Results**

The diagnostic profile determined the direction of the fine-tuning. The 2-opt operator itself was left unchanged — the improvement condition Δ \> 0 and the segment-reversal mechanics are identical in both HACO variants — because the observed difficulties were produced by when 2-opt was invoked and not by how it operated. Fine-tuning was therefore confined to the triggering rule, and its settings were fixed by a separate set of calibration runs carried out before the main experiment, so that no setting used in the comparison was chosen after seeing the comparison data. Table 3.2 documents the calibration protocol, Table 3.3 records the resulting settings that served as the validation inputs of the main experiment, and Table 3.4 traces each fine-tuning decision back to the specific observed result that motivated it.

**Table 3.2**  
*Calibration Protocol for the Adaptive 2-opt Trigger (pilot runs conducted prior to the main experiment)*

| Calibration item | Setting used |
| ----- | ----- |
| Purpose | To establish the entropy threshold θ and the Pheromone Dominance Ratio threshold τ\_PDR that serve as validation inputs of the main experiment |
| Instances calibrated | All six benchmark instances: eil51, berlin52, eil76, kroA100, kroB150, kroA200 |
| Pilot runs per instance | \[state the number of pilot runs per instance\] |
| Seeds | \[state whether pilot seeds were disjoint from the 30 main-experiment seeds\] |
| Parameters held fixed during calibration | α \= 1.0, β \= 5.0, ρ \= 0.5, m \= 30 ants, Q \= 1.0, T\_max \= 500 — identical to the main experiment, so that only the trigger settings varied |
| Quantities logged per iteration | Shannon entropy H(S); Pheromone Dominance Ratio PDR(t) \= τ\_max(t) / τ\_mean(t); best tour length L\*; wall-clock time |
| Rule adopted for θ | The 30th percentile of the per-instance H(S) distribution observed over the pilot runs, set separately for each instance because entropy scales with the number of edges available to the colony |
| Rule adopted for τ\_PDR | A single value common to all instances, τ\_PDR \= 2.0, i.e. twice the balanced value of 1.0 at which no edge is over-represented in the pheromone matrix |
| Acceptance check applied to a candidate setting | The trigger must not fire during the high-entropy opening iterations, and must leave a substantial share of iterations unrefined, so that the overhead identified in Difficulty 3 is genuinely reduced rather than relabelled |

**Table 3.3**  
*Calibrated Validation Inputs of the Proposed Adaptive HACO, by Instance*

| Instance (n) | Entropy threshold θ (30th percentile of pilot H(S)) | PDR threshold τ\_PDR | Resulting activation rate in the main experiment | Mean PDR(t) recorded at trigger |
| :---: | :---: | :---: | :---: | :---: |
| eil51 (51) | 47.24 | 2.0 | 42.3% | 49.82 |
| berlin52 (52) | **\[insert θ\]** | 2.0 | 20.4% | 48.97 |
| eil76 (76) | **\[insert θ\]** | 2.0 | 44.6% | 74.92 |
| kroA100 (100) | **\[insert θ\]** | 2.0 | 53.9% | 98.96 |
| kroB150 (150) | **\[insert θ\]** | 2.0 | 21.3% | 149.00 |
| kroA200 (200) | 142.78 | 2.0 | 31.3% | 192.37 |

Two features of the calibrated settings are worth stating explicitly, because they are the points on which the trigger could have failed. First, θ had to be set per instance rather than globally. Shannon entropy is computed over the edges traversed by the ant population, so its scale rises with the number of edges available; a threshold of 47.24 that marks stagnation on eil51 sits far below the ordinary operating entropy of kroA200 and would never fire there. The 30th-percentile rule produces a per-instance value on a common definition, which keeps the rule uniform across instances even though the numbers differ. Second, the choice of the 30th percentile is a deliberate compromise between the two failure modes visible in the diagnostic profile. A higher percentile would fire the trigger more often and drift back toward the fixed-interval behaviour and its overhead (Difficulty 3); a lower one would withhold refinement so long that the quality ceiling of Difficulty 2 would not be lifted. The activation rates that resulted, 20.4% to 53.9% of iterations, sit between those extremes on every instance.

**Table 3.4**  
*Fine-Tuning Decisions for the 2-opt Local Search Traced to the Observed Results for the Existing HACO*

| Observed result in the existing HACO | Difficulty it indicates | Fine-tuning applied to the 2-opt local search | Observed effect in the main experiment |
| ----- | ----- | ----- | ----- |
| Plateau at 20.0–25.7 of 500 iterations; SD \= 0.0 on the three largest instances (Table 3.1) | Premature convergence: refinement is applied before the colony has explored | 2-opt made conditional on H(S) \< θ, so refinement is withheld while population entropy remains high | Plateau moved to 39.2–42.3 iterations, i.e. improvement continued 16–22 iterations longer (Table 3.7) |
| Residual optimality gap widening to 5.81% on kroB150 and 5.65% on kroA200 (Table 3.1) | Quality ceiling set by the early local optimum, worsening with instance size | θ calibrated per instance from its own entropy distribution rather than fixed globally, so the trigger tracks each instance scale | Gap reduced to 2.51–4.01%, with the largest reductions on kroB150 and kroA200 (Table 3.9) |
| 500 2-opt calls per trial (100% of iterations) against a plateau at roughly the twentieth (Table 3.1) | Overhead charged on iterations where no improvement is possible | Refinement restricted to the current global best tour T\* and invoked only on triggering iterations | 102.2–269.3 calls per trial (20.4–53.9% of iterations); runtime cut by 9.9–23.4% (Tables 3.11, 3.13) |
| Entropy is a population statistic that can fall for reasons other than over-exploitation | A single-signal gate risks firing outside genuine stagnation and reinstating the overhead it was meant to remove | A second gate added: PDR(t) \= τ\_max(t) / τ\_mean(t) must exceed τ\_PDR \= 2.0 before 2-opt is applied | Mean PDR at trigger 48.97–192.37, far above 2.0, confirming the trigger fired only under strong pheromone concentration (Table 3.3) |
| The three largest instances plateau at exactly the criterion floor W \= 20 (Table 3.1) | The convergence metric registers cessation of improvement, not time-to-quality, and cannot distinguish fast from stalled | The criterion ε \= 0.001 over W \= 20 was retained unchanged rather than re-tuned, so the comparison is made on the existing HACO’s own terms | Reported in Tables 3.7 and 3.8 with the interpretive limit stated, and read alongside quality and runtime rather than alone |

Two further design choices follow from the same evidence and are recorded here for completeness. The 2-opt pass was kept as a full first-improvement sweep to local optimality rather than truncated to a fixed number of swaps, because Table 3.1 shows the difficulty was the number of passes and not the depth of any single pass; truncating the pass would have weakened the refinement without addressing the scheduling problem. And the operator continued to be applied to T\* alone rather than to every ant tour, since applying it to the whole population would multiply the O(n²) cost by m \= 30 ants and reverse the saving that the trigger exists to create.

**SOP 2 — Benchmarking Methodology, Validation Inputs and Initialization Settings**

The second research question asks how a benchmarking methodology can be developed and implemented to compare Standard ACO, the existing HACO and the Proposed Adaptive HACO on convergence rate, total tour distance and computational time. This section documents that methodology as it was executed, so that the comparative results in SOP 3 can be read against the exact inputs that produced them. Table 3.5 records the validation inputs and the benchmarking protocol.

**Table 3.5**  
*Validation Inputs and Benchmarking Protocol of the Main Experiment*

| Protocol item | Setting used |
| ----- | ----- |
| Configurations compared | Standard ACO (baseline); existing HACO with non-adaptive 2-opt (intermediate comparison); Proposed Adaptive HACO with entropy-and-PDR triggered 2-opt (experimental treatment) |
| Benchmark instances | eil51 (51 nodes), berlin52 (52), eil76 (76), kroA100 (100), kroB150 (150), kroA200 (200), all from TSPLIB (Reinelt, 1991\) |
| Trials | 30 independent trials per algorithm–instance pair; 90 runs per instance; 540 runs in total |
| Shared algorithm parameters | α \= 1.0, β \= 5.0, ρ \= 0.5, m \= 30 ants, Q \= 1.0, T\_max \= 500 iterations, held identical across all three configurations |
| Random seeds | Trial i of every configuration on a given instance uses the same seed, which is what licenses the paired design of the t-tests; the full seed list is retained with the trial logs |
| Convergence criterion | The first iteration t at which L\* changes by no more than ε \= 0.001 relative to its value W \= 20 iterations earlier; T\_max is recorded if the condition is never met |
| Adaptive trigger inputs | Per-instance entropy threshold θ and τ\_PDR \= 2.0 as calibrated in Table 3.3, fixed before the main experiment began |
| Metrics recorded per iteration | Best tour length L\*, Shannon entropy H(S), PDR(t), 2-opt activation count and wall-clock time, written to structured CSV logs |
| Inferential test | Two-tailed paired t-test at α \= 0.05, df \= 29; 18 tests in total (6 instances × 3 metrics), comparing the Proposed Adaptive HACO against the existing HACO |
| Execution environment | Python 3.10 with NumPy, SciPy, pandas and Matplotlib, executed sequentially on a single workstation so that wall-clock times are mutually comparable |

**Pheromone Initialization and Its Effect on the Comparison**

One experimental input was not held constant across the three configurations. It is documented here in full, rather than left to be inferred from the algorithm descriptions in Chapter 2, because it bears directly on how the comparative results in SOP 3 may be interpreted.

**Table 3.6**  
*Pheromone Initialization Used by Each Configuration in the Main Experiment*

| Configuration | Initialization | Initial pheromone value τ₀ | Initial global best tour T\* |
| ----- | ----- | ----- | ----- |
| Standard ACO | Uniform | τ₀ \= 1 / (n · L\_nn) on every edge | None; set from the first iteration of ant construction |
| Existing HACO (non-adaptive 2-opt) | Uniform | τ₀ \= 1 / (n · L\_nn) on every edge | None; set from the first iteration of ant construction |
| Proposed Adaptive HACO | Greedy-seeded | Raised τ₀ on the edges of a nearest-neighbour tour; τ₀ \= 1 / (n · L\_nn) elsewhere | The nearest-neighbour tour, supplied before the first iteration |

Both baseline configurations therefore ran under uniform initialization. The comparison between Standard ACO and the existing HACO is consequently unconfounded: the two differ only in the presence of the 2-opt operator. That is also the comparison on which the determination of the difficulties in SOP 1 rests, so the diagnostic profile in Table 3.1 and the three difficulties described from it are unaffected by this issue.

Any comparison involving the Proposed Adaptive HACO is a different matter. The proposed configuration differs from the existing HACO in two respects at once, the entropy-and-PDR trigger and greedy-seeded initialization, so the two factors are confounded. A greedy seed supplies a nearest-neighbour tour as the starting global best, which is already shorter than a tour built from uniform pheromone on the first iteration, and part of the quality advantage reported in Table 3.9 may follow from that head start rather than from the trigger. On the present evidence the final tour quality of the Proposed Adaptive HACO cannot be attributed to the adaptive trigger alone. This is a threat to the internal validity of the SOP 3b comparison and it is stated as such.

Two of the three reported outcomes are less exposed to the confound. The runtime reduction in Table 3.11 follows mechanically from the reduction in 2-opt calls documented in Table 3.13, from 500 calls per trial to between 102.2 and 269.3: initialization changes neither the O(n²) cost of a single pass nor the number of iterations on which the trigger fires, so the saving is a property of the scheduling rule. The convergence outcome in Table 3.7 is likewise unlikely to be explained by seeding, since a better starting tour would tend to bring the plateau forward, whereas the plateau was observed 16 to 22 iterations later, not earlier.

The control condition required to separate the two factors is a fourth configuration: the Proposed Adaptive HACO run with uniform initialization τ₀ \= 1 / (n · L\_nn), on the same six instances, for 30 trials each, using the same seed list and the same calibrated θ and τ\_PDR. Against the existing HACO that configuration would differ only in the triggering rule, and the resulting difference in tour quality would be attributable to the trigger by itself. Until that control run is reported, the solution-quality result is stated in this study as the joint effect of adaptive triggering and greedy-seeded initialization rather than as an effect of the trigger alone, and the corresponding conclusion in Chapter 4 is qualified accordingly.

**SOP 3 — Comparative Evaluation of the Proposed Adaptive HACO against the Existing HACO**

The third research question asks whether the Proposed Adaptive HACO (a) converges faster under the predefined convergence criterion, (b) produces better solution quality in terms of final best-tour distance, and (c) requires lower computational time than the existing HACO with non-adaptive 2-opt. Each sub-question is taken in turn, in the order stated in the Statement of the Problem.  
**a. Convergence Rate**  
Convergence is defined operationally as the first iteration t at which the best tour length L\* changes by no more than ε \= 0.001 relative to its value W \= 20 iterations earlier (T\_max \= 500 if unmet). Table 3.7 summarises the mean convergence iteration per algorithm per instance.  
**Table 3.7**  
*Mean Convergence Iteration t\* (δ \= 0.001 over W \= 20 consecutive iterations; T\_max \= 500; mean ± SD, 30 trials)*

| Instance | Standard ACO | Non-adaptive HACO | Proposed Adaptive HACO | % Change vs Non-adaptive (negative \= later) |
| :---: | :---: | :---: | :---: | :---: |
| eil51 | 36.3 ± 11.9 | 20.5 ± 2.2 | 39.2 ± 13.2 | \-91.1% |
| berlin52 | 37.3 ± 11.2 | 25.7 ± 7.6 | 41.3 ± 13.3 | \-60.9% |
| eil76 | 40.2 ± 13.9 | 21.6 ± 4.7 | 39.6 ± 13.0 | \-83.2% |
| kroA100 | 36.4 ± 11.9 | 20.0 ± 0.0 | 42.3 ± 15.7 | \-111.3% |
| kroB150 | 43.6 ± 11.5 | 20.0 ± 0.0 | 41.6 ± 14.2 | \-107.8% |
| kroA200 | 41.9 ± 16.2 | 20.0 ± 0.0 | 41.5 ± 13.8 | \-107.5% |

Table 3.7 shows all three configurations satisfied the dual convergence criterion well within the 500-iteration budget. The Non-adaptive HACO reached the criterion earliest on every instance (20.0 to 25.7 iterations) because its unconditional 2-opt drives the best tour to a 2-opt local optimum within the opening iterations, after which L\* can only improve through slow pheromone-driven reassignment. The Standard ACO converged next (36.3 to 43.6 iterations), and the Proposed Adaptive HACO satisfied the criterion latest (39.2 to 42.3 iterations), applying 2-opt only when the entropy signal indicated stagnation and thereby sustaining improvement on the best tour until later in the run. It should be noted that this metric measures the cessation of meaningful improvement rather than the speed with which a target solution quality is reached: the Proposed Adaptive HACO traded a slightly later plateau (16 to 22 iterations later, Table 3.8) for a meaningfully better final tour quality (Table 3.9) and a 9.9% to 23.4% reduction in runtime (Table 3.11).  
**Table 3.8**  
*Paired t-Test Results for Convergence Speed: Proposed Adaptive HACO vs Non-adaptive HACO (df \= 29, α \= 0.05)*

| Instance | Mean Difference (iterations) | t-value | p-value | Decision | Significant |
| :---: | :---: | :---: | :---: | :---: | :---: |
| eil51 | \-18.7 | \-7.56 | \< 0.001 | Reject H₀ | Yes |
| berlin52 | \-15.6 | \-5.68 | \< 0.001 | Reject H₀ | Yes |
| eil76 | \-18.0 | \-7.24 | \< 0.001 | Reject H₀ | Yes |
| kroA100 | \-22.3 | \-7.77 | \< 0.001 | Reject H₀ | Yes |
| kroB150 | \-21.6 | \-8.30 | \< 0.001 | Reject H₀ | Yes |
| kroA200 | \-21.5 | \-8.55 | \< 0.001 | Reject H₀ | Yes |

From Table 3.8, The mean difference is negative on every instance (−15.6 to −22.3 iterations), and all six tests were statistically significant (p \< 0.001): the Proposed Adaptive HACO met the dual convergence criterion significantly later than the Non-adaptive HACO under this operational definition. This constitutes an honest null result for sub-question (a) of the third research question under the chosen metric: the entropy-triggered mechanism does not accelerate the point at which improvement ceases, because it deliberately withholds refinement until stagnation so that improvement continues for longer. The value of the mechanism instead lies in the quality and cost advantages reported in Tables 3.11 and 3.9, achieved with far fewer 2-opt evaluations (Table 3.13). Read against Difficulty 1 in SOP 1, this is the intended consequence of the fine-tuning rather than a failure of it: the existing HACO plateaued at the floor of the measurement window because refinement was applied before the colony had explored, and withholding refinement until stagnation necessarily moves the plateau later.  
**b. Solution Quality**  
Table 3.9 reports the mean best tour distance L\* at T\_max for the three algorithms, with the percentage gap from the known TSPLIB optimum of each instance in parentheses.  
**Table 3.9**  
*Mean Best Tour Distance L\* at T\_max (Euclidean units, mean ± SD, 30 trials; percentage gap from TSPLIB known optimum in parentheses)*

| Instance (Optimum) | Standard ACO | Non-adaptive HACO | Proposed Adaptive HACO |
| :---: | :---: | :---: | :---: |
| eil51 (426) | 452.1 ± 5.6 (6.13%) | 442.5 ± 5.4 (3.88%) | 437.3 ± 3.6 (2.64%) |
| berlin52 (7,542) | 7,693.3 ± 47.2 (2.01%) | 7,572.7 ± 58.8 (0.41%) | 7,588.2 ± 55.9 (0.61%) |
| eil76 (538) | 572.6 ± 2.3 (6.42%) | 563.5 ± 4.9 (4.74%) | 559.6 ± 5.3 (4.01%) |
| kroA100 (21,282) | 23,155.0 ± 380.7 (8.80%) | 22,141.9 ± 416.2 (4.04%) | 21,817.1 ± 244.8 (2.51%) |
| kroB150 (26,130) | 28,876.3 ± 525.8 (10.51%) | 27,649.0 ± 526.9 (5.81%) | 26,905.9 ± 224.8 (2.97%) |
| kroA200 (29,368) | 32,756.5 ± 659.0 (11.54%) | 31,025.9 ± 553.4 (5.65%) | 30,190.9 ± 453.4 (2.80%) |

Table 3.9 shows standard ACO produced the longest mean tours on all six instances, with optimality gaps between 2.01% and 11.54% that widened on the larger problems, reaching 11.54% on kroA200, because it relies entirely on pheromone accumulation with no geometric refinement. The Non-adaptive HACO, by refining every iteration with 2-opt, cut those gaps roughly in half (0.41% to 5.81%). The Proposed Adaptive HACO produced the shortest mean tours on five of the six instances, with optimality gaps between 2.51% and 4.01%, and, among the two HACO configurations, the smaller standard deviation on five of the six — evidence that selective triggering yields both shorter and more stable tours. On berlin52 the two HACO variants were statistically indistinguishable (0.41% versus 0.61% gaps; p \= 0.36 in Table 3.10).  
**Table 3.10**  
*Paired t-Test Results for Solution Quality: Proposed Adaptive HACO vs Non-adaptive HACO (df \= 29, α \= 0.05)*

| Instance | Mean Difference (Euclidean units) | t-value | p-value | Decision | Significant |
| :---: | :---: | :---: | :---: | :---: | :---: |
| eil51 | 5.3 | 4.58 | \< 0.001 | Reject H₀ | Yes |
| berlin52 | \-15.5 | \-0.92 | 0.3635 | Fail to reject H₀ | No |
| eil76 | 3.9 | 3.40 | 0.0020 | Reject H₀ | Yes |
| kroA100 | 324.8 | 3.59 | 0.0012 | Reject H₀ | Yes |
| kroB150 | 743.1 | 6.46 | \< 0.001 | Reject H₀ | Yes |
| kroA200 | 835.0 | 5.91 | \< 0.001 | Reject H₀ | Yes |

Table 3.10 shows the quality advantage of the Proposed Adaptive HACO was statistically significant (p \< 0.05) on five of the six instances — eil51, eil76, kroA100, kroB150, and kroA200 — with mean savings from 3.9 (eil76) to 835.0 (kroA200) Euclidean units. On berlin52 the difference was not significant (p \= 0.3635), where both HACO configurations already solved the problem to within 0.6% of the known optimum. Taken together with the convergence and runtime results, the adaptive mechanism delivers equal or better quality at lower runtime across the full 51- to 200-node spectrum — precisely the multi-instance evidence sought by the Research Gap. Against Difficulty 2 in SOP 1, the residual gap of the existing HACO was cut from 3.88–5.81% to 2.51–4.01%, with the largest reductions on kroB150 and kroA200, which are the instances on which that difficulty was most severe. As recorded in Table 3.6, however, this comparison is confounded by pheromone initialization, so the improvement is attributable to the adaptive trigger and greedy-seeded initialization jointly rather than to the trigger alone.

**c. Computational Time**

Table 3.11 reports the mean wall-clock runtime per trial for the three configurations, and Table 3.12 the corresponding paired t-tests against the existing HACO. This is the sub-question on which the fine-tuning documented in Table 3.4 acts most directly, since the number of 2-opt passes is the quantity the triggering rule controls.  
**Table 3.11**  
*Mean Wall-Clock Computational Time per Trial (in seconds, mean ± SD, 30 trials)*

| Instance | Standard ACO | Non-adaptive HACO | Proposed Adaptive HACO | % Reduction vs Non-adaptive |
| :---: | :---: | :---: | :---: | :---: |
| eil51 | 1.96 ± 0.17 | 2.75 ± 0.18 | 2.37 ± 0.27 | 13.7% |
| berlin52 | 2.01 ± 0.15 | 2.86 ± 0.16 | 2.19 ± 0.25 | 23.4% |
| eil76 | 3.19 ± 0.25 | 4.40 ± 0.28 | 3.74 ± 0.35 | 15.0% |
| kroA100 | 4.87 ± 0.33 | 6.37 ± 0.33 | 5.74 ± 0.57 | 9.9% |
| kroB150 | 8.71 ± 0.55 | 10.67 ± 1.02 | 8.96 ± 0.80 | 16.1% |
| kroA200 | 11.73 ± 1.85 | 13.13 ± 3.03 | 11.78 ± 2.45 | 10.3% |

Table 3.11 presents the mean wall-clock runtime per trial for the three algorithm configurations across the six benchmark instances. Standard ACO recorded the lowest absolute computational time on every instance because it performs no local-search refinement; on the largest problem (kroA200) it completed a trial in 11.73 s on average, compared with 13.13 s for the Non-adaptive HACO and 11.78 s for the Proposed Adaptive HACO. This lower absolute cost, however, should not be interpreted as superior overall performance, since Standard ACO also produced the weakest solution quality (Table 3.9), with optimality gaps as large as 11.54% of the known optimum. The Non-adaptive HACO ranked highest in runtime on every instance because it applied 2-opt at every iteration, accumulating repeated O(n²) local-search overhead. The Proposed Adaptive HACO reduced computational time by 9.9% to 23.4% relative to the Non-adaptive HACO — from 2.75 s to 2.37 s on eil51, and from 13.13 s to 11.78 s on kroA200 — while retaining the local-search component responsible for its superior solution quality. The principal computational contribution of the Proposed Adaptive HACO is therefore not to outperform Standard ACO in raw speed, but to remove the unnecessary overhead of HACO by invoking 2-opt only when the population is actually stagnating (Table 3.13).  
**Table 3.12**  
*Paired t-Test Results for Computational Time: Proposed Adaptive HACO vs Non-adaptive HACO (df \= 29, α \= 0.05)*

| Instance | Mean Difference (s) | t-value | p-value | Decision | Significant |
| :---: | :---: | :---: | :---: | :---: | :---: |
| eil51 | 0.38 | 5.87 | \< 0.001 | Reject H₀ | Yes |
| berlin52 | 0.67 | 11.33 | \< 0.001 | Reject H₀ | Yes |
| eil76 | 0.66 | 7.55 | \< 0.001 | Reject H₀ | Yes |
| kroA100 | 0.63 | 4.90 | \< 0.001 | Reject H₀ | Yes |
| kroB150 | 1.71 | 9.53 | \< 0.001 | Reject H₀ | Yes |
| kroA200 | 1.36 | 5.90 | \< 0.001 | Reject H₀ | Yes |

As shown in Table 3.12, all six paired t-tests produced p-values below 0.001, well under the α \= 0.05 threshold, and the null hypothesis of equal mean computation time was rejected for every instance. The mean per-trial saving ranged from 0.38 s on eil51 to 1.71 s on kroB150, with the largest absolute savings on the 100- to 200-node instances and t-values between 4.90 and 11.33. This provides the multi-instance, statistically validated evidence on computational time that the Research Gap identified as missing from earlier single-run studies. Against Difficulty 3 in SOP 1, the overhead that the existing HACO paid on every iteration is reduced but not removed: the Proposed Adaptive HACO still runs slower than Standard ACO, and the contribution is the removal of refinement passes applied to a tour that can no longer be improved.  
**Behavior of the Entropy-Triggered Adaptive Mechanism**  
Table 3.13 characterises how the dual-signal trigger operated across the problem scales by reporting the mean number of 2-opt activations per trial, the percentage of iterations in which the trigger fired, and the mean Pheromone Dominance Ratio PDR(t) recorded at the moment of each trigger.  
**Table 3.13**  
*Mean 2-opt Activation Frequency of the Proposed Adaptive HACO (T\_max \= 500 iterations; mean over 30 trials)*

| Instance | Mean 2-opt Activations per Trial | % of Iterations Triggered | Non-adaptive HACO Activations | Mean PDR(t) at Trigger |
| :---: | :---: | :---: | :---: | :---: |
| eil51 | 211.4 | 42.3% | 500 (100%) | 49.82 |
| berlin52 | 102.2 | 20.4% | 500 (100%) | 48.97 |
| eil76 | 223.2 | 44.6% | 500 (100%) | 74.92 |
| kroA100 | 269.3 | 53.9% | 500 (100%) | 98.96 |
| kroB150 | 106.6 | 21.3% | 500 (100%) | 149.00 |
| kroA200 | 156.6 | 31.3% | 500 (100%) | 192.37 |

Table 3.13 verifies that the dual-signal trigger operated as designed across all problem scales. Whereas the Non-adaptive HACO invoked 2-opt in 100% of iterations regardless of the population state, the Proposed Adaptive HACO invoked it in only 20.4% to 53.9% of iterations, and rarely during the exploration-dominated early iterations when H(S) was high. The trigger fired when the Shannon entropy H(S) fell below the calibrated threshold θ and the PDR confirmed that the colony had over-concentrated on a small set of dominant edges (mean PDR at trigger between 48.97 and 192.37, far above the balanced value of 1.0). The activation frequency did not vary monotonically with instance size: it ranged from 20.4% on berlin52 and 21.3% on kroB150 to 53.9% on kroA100, so the trigger responded to the stagnation profile of the individual instance rather than to node count. Because the expensive O(n²) 2-opt passes were executed only during these stagnation windows, the adaptive configuration achieved its 9.9% to 23.4% runtime reduction without a statistically significant loss of solution quality on any instance.

The consolidated findings of the study, numbered to correspond one-to-one with the three research questions and the three objectives, are presented in Chapter 4 together with the conclusions drawn from them.

**PROPOSED SOLUTIONS**  
**Figure 4**  
*Proposed Adaptive HACO with Entropy-Triggered 2-opt Local Search*

Figure 3.2 presents the flowchart of the existing Non-adaptive Hybrid ACO, the main baseline of this study. The algorithm begins by reading the problem parameters (n, d(i,j), m, α, β, ρ, Q, T\_max) and initialising all pheromone trails to the uniform value τ₀ \= 1/(n·L\_nn). Each iteration then proceeds through three phases. In the construction phase, every ant k stochastically builds a tour T\_k according to the transition rule p(i,j) \= \[τ(i,j)ᵅ η(i,j)ᵝ\] / Σ \[τ(i,l)ᵅ η(i,l)ᵝ\], where η(i,j) \= 1/d(i,j) is the heuristic visibility. A check follows to see whether any newly constructed tour improves the global best; if so, T\* and L\* are updated. In the pheromone-update phase, trails evaporate at the rate ρ and each ant deposits reinforcement Δτ\_k(i,j) \= Q/L\_k along the edges it traverses. In the refinement phase the script unconditionally applies 2-opt to the best tour at every iteration, checking edge pairs against the improvement condition Δ \> 0 and reversing segments until the tour is 2-opt locally optimal. The outer decision box then tests the stopping criterion t ≥ T\_max; if it is not met, the iteration counter increments and control returns to the construction phase; otherwise the algorithm returns the best tour T\* and its length L\*. The single feature distinguishing the Non-adaptive HACO from the Proposed Adaptive HACO is the unconditional application of 2-opt at every iteration regardless of the population’s diversity; the proposed algorithm keeps every other element of this flowchart but replaces the unconditional refinement step with the dual- signal trigger, applying 2-opt only when H(S) \< θ and PDR(t) \> τ\_PDR.

**Table 3.8**  
*Material*

| Type | Description | Materials |
| :---- | :---- | :---- |
| Data Sources | Sources from which data was obtained. | TSPLIB benchmark repository (eil51, berlin52, eil76, kroA100, kroB150, kroA200) with known optimal solutions; peer-reviewed journals and conference proceedings from IEEE Xplore, ScienceDirect, Springer, and ACM; experimental benchmarking results. |
| Data Collection Instruments | Tools/method used to collect data. | Python codebase implementing the three algorithm configurations (Standard ACO, Non-adaptive HACO, Proposed Adaptive HACO) executed under identical shared parameters (ρ, α, β, m, Q, T\_max, θ) across 30 independent trials per instance; per-iteration logs of L\*, τ(i,j), H(S), PDR(t), 2-opt activations, and wall-clock time stored in structured CSV files. |
| Software and Technologies | Tools for data processing and analysis. | Python 3.10, NumPy, SciPy, pandas, Matplotlib, Jupyter Notebook. |

**Table 3.9**  
*Statistical Tools*

| Type | Description | Statistical Tools |
| ----- | ----- | ----- |
| Descriptive Statistics | Techniques to summarize result distributions. | Mean, standard deviation, and pairwise percentage improvement per algorithm per instance across 30 trials; percentage gap from TSPLIB known optima. |
| Inferential Statistics | Techniques to test the significance of observed differences. | Three paired t-tests at α \= 0.05 (df \= 29\) comparing the Proposed Adaptive HACO against the Non-adaptive HACO, one per SOP: computational time, convergence speed, and solution quality; decision rule: reject H₀ when p \< 0.05. |
| Data Visualization | Tools for visual presentation of data. | Convergence curves (best tour L\* vs iteration), Shannon entropy diversity charts, bar charts, and box plots via Matplotlib. |

**FLOWCHART**  
**Figure 5**  
*Flowchart of the Existing Non-Adaptive Hybrid ACO*

The solution flowchart illustrated in figure 3.2 shows the current Non-adaptive Hybrid ACO main algorithm, the main baseline that this paper is based on. It begins with the input of the definition of parameters (n, d(i,j), m, , , , Q, T\_max) and the initialization of the trail pheromones trails, in which all the trails between each pair of edges are set to an equal value (i,j) \=. Then each iteration consists of three phases.  
In the construction phase, each ant k constructs a tour T\_k stochastically driven by the transition rule p(i,j), which is defined by the trail strength and the nature visibility .  
Immediately following the construction of each of the ant's operations, there is a check to determine whether any of the solutions is better than the global best; if so, then the script assigns a new global best tour T\* and a new distance value L\*. Then there is a pheromone updating phase in which, each trail evaporation takes place at the rate, and each ant deposits the reinforcement \_k(i,j) along each visited edge according to its solution quality. In the refinement phase, the script performs 2-opt local search to the best solution at every iteration, in which each possible edge swap is checked with the improvement condition (i,j) \> 0, and any solution that produces such an improvement is performed until the tour is 2-opt local optimal. Eventually another decision point determines the end criteria t T\_max; if it is not met, the iteration counter runs to+1 and goes back up to the construct Tour phase; if it is, the script outputs the best tour T\* with a distance L\*.  
The feature common to the existing HACO architecture which sets it apart from the   new   Adaptive   HACO   architecture   is   the   unconditional  use  of 2-opt at every   
iteration-regardless of the current diversity level of the population. This feature is responsible for the efficiency overheads and premature loss of diversity introduced in the Results. The proposed algorithm keeps all the features of this flowchart but uses the unconditional Refinement step with the dual-signal trigger, doing 2-opt if only if H(S) \< and PDR(t) \>\> 1\.  
**Figure 6**

*Mean Convergence Curves of the Three Algorithms across the Six Instances*

![][image1]

**Figure 7**

*Mean Shannon Entropy H(S) Traces across the Six Instances*

![][image2]  
**ALGORITHM REQUIREMENTS**  
This section defines the system requirements of the proposed Adaptive HACO framework, outlining the minimum hardware and software configurations necessary to establish a consistent, reproducible, and verifiable experimental environment capable of supporting the computational demands of executing 540 independent optimization runs (3 algorithms × 6 TSPLIB instances × 30 trials).  
**Hardware Requirements**  
This section details the hardware requirements necessary for the algorithm to operate effectively as a standalone research platform.  
**Table 3.10**  
*Recommended Hardware Specifications*

| Required Hardware | Specifications |
| ----- | ----- |
| OS | Windows 10/11 64-bit or Ubuntu 22.04 or later. |
| CPU | Intel Core i5 (8th gen) / AMD Ryzen 5 or higher; 4 cores minimum. |
| Memory | 8 GB RAM minimum, 16 GB recommended. |
| Disk | 20 GB free SSD storage minimum (for per-iteration CSV logs, convergence histories, and entropy/PDR traces across all 540 runs). |
| GPU | Not required; all runs are CPU-bound. |

Table 3.10 gives the hardware requirements needed to run the proposed framework on a single workstation. These specifications represent the minimum hardware necessary to execute all 540 benchmark runs sequentially within a practical time budget, with the multi-core requirement ensuring that the O(n²) 2-opt passes on the 150- and 200-node instances complete without excessive wall-clock delay, and the SSD requirement ensuring that per-iteration logging does not become an I/O bottleneck.  
**Software Requirements**  
This section details the software environment required to develop, execute, and analyze the three algorithm configurations.  
**Table 3.11**  
*Recommended Software Specifications*

| Particulars | Specifications |
| ----- | ----- |
| Language | Python 3.10 or higher. |
| Scientific Libraries | NumPy (numerical computation), SciPy (paired t-tests), pandas (CSV data management), Matplotlib (visualization). |
| IDE / Editor | Visual Studio Code or Jupyter Notebook. |
| Benchmark Data | TSPLIB instance files (eil51, berlin52, eil76, kroA100, kroB150, kroA200). |

The software specifications are recommended as specified below in Table 3.11. The three algorithms are coded within a three-tiered modular framework through Python 3.10, where NumPy defines the pheromone matrix and the Euclidean distance calculations, SciPy carries out the inferential statistical testing, pandas stores the structured trial log, and Matplotlib draws the convergence curves and diversity charts. All tools and libraries are open-source, ensuring the environment can be replicated by future researchers at no licensing cost.

**SYSTEM TRADEOFFS**  
The system tradeoffs explain the specific requirements and compromises of the framework in development. They consist of technical, operational, and economic considerations.

**Table 3.12**  
*Technical Issues*

| Technical Issues | Tradeoffs |
| ----- | ----- |
| Performance | The workstation CPU must be at least an Intel Core i5 / AMD Ryzen 5 (4 cores) to complete the 540 benchmark runs, since the O(n²) 2-opt refinement on kroB150 and kroA200 dominates per-trial runtime. |
| Deployment | The framework runs locally on a single workstation; no network deployment, database server, or cloud infrastructure is required. |
| Operational Characteristics | A minimum of 8 GB RAM is required to hold the pheromone matrices, per-iteration entropy and PDR traces, and trial logs in memory without overflow; 16 GB is recommended for the 200-node instance. |
| Interoperability | The pure-Python codebase is portable across Windows and Linux, ensuring reproducibility across development environments without recompilation. |

Table 3.12 presents the technical tradeoffs of the proposed framework. Performance is determined primarily by the capability of the local workstation to execute all 540 runs sequentially under the shared evaluation budget. Because the framework runs entirely on one machine and does not depend on a web server or internet connection, the technical environment is greatly simplified; however, this equally creates the limitation that parallel execution across multiple machines is not supported, so the full experimental campaign completes sequentially on a single processor.

**Table 3.13**  
*Operational Issues*

| Operational Issues | Tradeoffs |
| ----- | ----- |
| Support Tools | Python 3.10, NumPy, SciPy, pandas, Matplotlib, and Visual Studio Code or Jupyter Notebook. |
| User and Developer Skills | The researchers must be proficient in Python programming and swarm-intelligence concepts, including pheromone-based construction, Shannon entropy computation, 2-opt edge-swap mechanics, and paired-sample statistical analysis. |
| Processes | Each trial requires sequential execution of the ant construction phase, pheromone update, entropy and PDR monitoring, and conditional 2-opt refinement, followed by descriptive summarization and paired t-testing of the logged metrics across the three algorithm configurations. |
| Documentation | All parameter configurations, the values of all random seeds, the entropy threshold, et, the per-iteration log files, stagnation events, performance data, etc., should be saved into CSV files to ensure the experiments are perfectly reproducible. |

Operational tradeoffs are highlighted in Table 3.13. A comparatively modest technical burden is imposed on the researchers for implementation, execution, and correct interpretation, in that they must be capable of designing metaheuristic algorithms, as well as inferential statistical analysis. Despite this self-containment, the researchers are thus enabled to compare these self-evaluatory adaptations to the re-implemented similar static baselines in reproducible, identical experimental settings with no researcher bias.

**Table 3.14**  
*Economic Issues*

| Economic Issues | Tradeoffs |
| ----- | ----- |
| Hardware and Software | All softwares and libraries I used (Python, NumPy, SciPy, pandas, Jupyter, Matplotlib) are open source and free of charge. |
| Development Cost | The project expenditure including electricity charges, internet, printing supplies and transportation allowances of the concerned investigators is estimated to be around Php 5,000.00. |
| Operational Cost | Estimated spending for running experiments is Php 2,000.00. It would be spent for electrical consumption from longer simulation time and data analysis sessions. |
| Training Cost | The formal training cost is not necessary because the researchers are experienced in the tools and technologies used in this study. |

The economical aspect of the study is summarized in Table 3.14. As all development tools and libraries used in this research are open source, costs for purchasing/obtaining the software are not considered. The cost of the project is dominated by the cost of electricity, internet connectivity for literature references, printing of project documents, travel and vehicle hire charges for the duration of the research. Cost of training is not applicable as the framework is operated solely by the proponents for carrying out the evaluation on experimental benchmark.

**Chapter 4**  
**FINDINGS, CONCLUSIONS, AND RECOMMENDATIONS**

The findings, conclusions, and recommendations for the study titled “A Statistically Validated Multi-Instance Evaluation of Entropy-Triggered 2-Opt in Hybrid Ant Colony Optimization” are presented in this chapter. The conclusions are based on the experimental comparison of Standard Ant Colony Optimization (ACO), Non-adaptive Hybrid Ant Colony Optimization (HACO), and the Proposed Adaptive HACO across six TSPLIB benchmark instances using 30 trials per algorithm-instance combination.

**FINDINGS**

The findings are numbered to correspond one-to-one with the Statement of the Problem and the Objectives of the Study: Finding 1 answers SOP 1 and Objective 1, Finding 2 answers SOP 2 and Objective 2, and Finding 3 answers SOP 3 and Objective 3, sub-item by sub-item.

1\. The existing HACO with non-adaptive 2-opt exhibits three interrelated difficulties. Premature convergence and the solution-quality gap both become more severe as instance size increases, while the refinement overhead grows in absolute seconds but falls as a share of total runtime.

1.1 Convergence rate. The existing HACO stopped improving after a mean of 20.0 to 25.7 iterations of a 500-iteration budget, that is, within the first 4.0% to 5.1% of the run (Table 3.1). On kroA100, kroB150 and kroA200 the plateau occurred at exactly iteration 20.0 with a standard deviation of 0.0 across all 30 trials, which is the floor of the convergence window W \= 20 and therefore the earliest point at which the criterion can be evaluated at all. The best tour had already ceased to improve by a measurable margin before the criterion could first be applied. The difficulty is premature convergence: the algorithm settles early and then spends roughly 95% to 96% of its iteration budget unable to improve.

1.2 Quality of the solutions in terms of distance. The existing HACO did not reach the known TSPLIB optimum on any instance. Its residual gap was 3.88% on eil51, 4.74% on eil76, 4.04% on kroA100, 5.81% on kroB150 and 5.65% on kroA200, broadly widening as node count rose; berlin52 was the exception at 0.41% (Table 3.1). The difficulty is a quality ceiling imposed by the 2-opt local optimum reached in the opening iterations, which becomes more costly as the search space grows, and which is absent only where that early local optimum already lies close to the global optimum.

1.3 Amount of computing time. The existing HACO was the slowest of the three configurations on all six instances. Relative to Standard ACO, which performs no local search, unconditional 2-opt added 0.79 s to 1.96 s per trial, an overhead of 40.3% on eil51, 42.3% on berlin52, 37.9% on eil76, 30.8% on kroA100, 22.5% on kroB150 and 11.9% on kroA200 (Table 3.1). Because 2-opt was invoked in 100% of iterations, 500 calls per trial, while improvement ceased at around the twentieth, the majority of that computation refined a tour that was already 2-opt locally optimal.

1.4 The three difficulties share one cause. Each of them follows from the same design property: the existing HACO schedules 2-opt at fixed intervals without reference to the state of the search. The calibration work reported in Tables 3.2 to 3.4 was directed at that cause, and the fine-tuning of the 2-opt local search was confined to its triggering rule rather than to the operator itself.

2\. A benchmarking methodology was developed and implemented across all three configurations and all six instances, and it exposed one input that was not held constant.

2.1 Scope of execution. The methodology was executed in full: 540 independent runs (3 configurations × 6 TSPLIB instances × 30 trials), with α \= 1.0, β \= 5.0, ρ \= 0.5, m \= 30 ants, Q \= 1.0 and T\_max \= 500 held identical across configurations, and with trial i of every configuration on a given instance sharing a random seed so that the paired design was licensed (Table 3.5).

2.2 Calibration of validation inputs. The entropy threshold θ was calibrated per instance as the 30th percentile of the pilot-run H(S) distribution, ranging from 47.24 on eil51 to 142.78 on kroA200, and the Pheromone Dominance Ratio threshold was fixed at τ\_PDR \= 2.0 for all instances. Both were set before the main experiment began (Tables 3.2 and 3.3).

2.3 Statistical procedure. Eighteen two-tailed paired t-tests were conducted at α \= 0.05 with df \= 29, one per performance indicator per instance, comparing the Proposed Adaptive HACO against the existing HACO (Table 3.5).

2.4 One input was not held constant. Standard ACO and the existing HACO both used uniform pheromone initialization τ₀ \= 1 / (n · L\_nn), while the Proposed Adaptive HACO used greedy-seeded initialization (Table 3.6). The methodology as implemented therefore supports an unconfounded comparison between Standard ACO and the existing HACO, which is the comparison underlying Finding 1, but confounds the adaptive trigger with initialization in any comparison involving the proposed configuration.

3\. The evaluation addressed all three parts of the third research question. Two were supported by the results and one was not.

3a. Faster convergence under the predefined criterion — not supported. The Proposed Adaptive HACO satisfied the criterion at 39.2 to 42.3 iterations against 20.0 to 25.7 for the existing HACO, a difference of −15.6 to −22.3 iterations that was significant at p \< 0.001 on all six instances (Tables 3.7 and 3.8). The proposed algorithm converged later, not sooner. The criterion records the iteration at which improvement ceases rather than the time taken to reach a given tour quality, and the later plateau is the direct consequence of withholding refinement until stagnation, so that improvement continued for a further 16 to 22 iterations.

3b. Better solution quality in terms of final best-tour distance — supported on five of six instances. The Proposed Adaptive HACO produced the shortest mean tours on eil51, eil76, kroA100, kroB150 and kroA200, with optimality gaps of 2.51% to 4.01% against 3.88% to 5.81% for the existing HACO, and the advantage was significant at p \< 0.05 on those five instances (Tables 3.9 and 3.10). On berlin52 the difference was not significant (p \= 0.3635), both variants already being within 0.6% of the optimum. The Proposed Adaptive HACO also showed the smaller standard deviation on five of the six instances. This result is subject to the initialization confound recorded in Finding 2.4 and is therefore a joint effect of the adaptive trigger and greedy-seeded initialization.

3c. Lower computational time — supported on all six instances. The Proposed Adaptive HACO reduced mean wall-clock runtime by 9.9% to 23.4% relative to the existing HACO, a saving of 0.38 s to 1.71 s per trial, with all six paired t-tests significant at p \< 0.001 and t-values from 4.90 to 11.33 (Tables 3.11 and 3.12). The saving did not scale with node count: it was largest on berlin52 at 23.4% and smallest on kroA100 at 9.9%, consistent with a trigger that responds to each instance’s own stagnation profile.

3d. Behaviour of the triggering mechanism. The Proposed Adaptive HACO invoked 2-opt in 20.4% to 53.9% of iterations, that is, 102.2 to 269.3 calls per trial against 500 for the existing HACO, a reduction of 46% to 80% in the number of local-search passes (Table 3.13). Reducing the number of passes did not reduce tour quality. The mean PDR(t) recorded at the moment of triggering ranged from 48.97 to 192.37, far above its threshold of 2.0 on every instance, which indicates that the entropy condition rather than the PDR condition was the operative gate.

**CONCLUSIONS**

The conclusions are numbered to correspond to the three objectives, each of which is evaluated on whether the work it specifies was carried out and answered.

1\. Objective 1 was achieved: the difficulties faced by the current HACO were determined and described. The difficulty of the existing HACO is not located in any single metric but in the fixed-interval scheduling rule that produces all three symptoms together: a plateau reached at the floor of the convergence window, a residual optimality gap that widens from 3.88% to 5.81% as instances grow from 51 to 150 nodes, and an O(n²) refinement cost charged on every one of 500 iterations including the roughly 95% on which no improvement remains possible. Describing the difficulty in these terms is what allowed the adaptive trigger to be designed as a targeted response rather than as a general enhancement, and it is the basis of the calibration settings recorded in Tables 3.2 to 3.4. The fine-tuning that followed therefore changed only when 2-opt is invoked, leaving the operator and the convergence criterion untouched so that the comparison remained on the existing algorithm’s own terms.

2\. Objective 2 was achieved: the comprehensive benchmarking methodology was developed, implemented and executed in full. All 540 runs were completed under identical shared parameters with a common seed list, the calibrated validation inputs were fixed before the comparison began, and eighteen paired t-tests were applied across the three performance indicators and six instances. The methodology also made its own limitation visible rather than concealing it: because pheromone initialization was not held constant between the proposed configuration and the two baselines, the comparison involving the proposed configuration is confounded, and the trial logs are what permit this to be stated precisely and corrected by the control run specified in Chapter 3\. A benchmarking methodology that surfaces a threat to its own validity has done what the objective asked of it.

3\. Objective 3 was achieved as an assessment, and the assessment returned a mixed result. The objective was to assess whether the Proposed Adaptive HACO converges faster, produces better solutions and takes less computational time than the non-adaptive HACO. An objective of this kind is achieved when the assessment is carried out and answered, whether the answer is affirmative or negative; it is not a performance target that the algorithm is required to meet, and a negative answer on one criterion does not leave the objective unmet. The evaluation addressed all three research questions. The reported results supported reduced runtime on all six instances and improved solution quality on five instances, but did not support faster convergence under the selected criterion.

3.1 The convergence outcome is a genuine negative result rather than a malfunction of the mechanism. The Proposed Adaptive HACO reached the convergence criterion 15.6 to 22.3 iterations later than the existing HACO on every instance. The criterion records when improvement stops, not how quickly a given tour quality is reached, so an algorithm that keeps improving for longer is penalised by it. The hypothesis of faster convergence is not supported, and the appropriate conclusion is that the entropy-triggered mechanism trades a later plateau for continued improvement rather than that it converges poorly.

3.2 The runtime conclusion is the most secure of the three. The 9.9% to 23.4% reduction follows mechanically from performing 102.2 to 269.3 local-search passes per trial instead of 500, and is unaffected by the initialization difference, since initialization alters neither the cost of a 2-opt pass nor the number of iterations on which the trigger fires. Adaptive scheduling recovers a statistically significant and practically meaningful share of the overhead that fixed-interval 2-opt imposes, across the full 51- to 200-node range. It should be noted that the proposed algorithm is not the fastest of the three in absolute terms — Standard ACO is, because it performs no local search at all — and the contribution claimed here is the narrower one of removing unnecessary refinement while retaining the refinement that improves tour quality.

3.3 The solution-quality conclusion is supported but cannot yet be attributed to the adaptive trigger alone. The Proposed Adaptive HACO produced the shortest mean tours and the smallest optimality gaps on five of six instances and outperformed Standard ACO on all six, and reducing the frequency of local search did not reduce tour quality under the conditions of this study. Because the proposed configuration also used greedy-seeded initialization while both baselines used uniform initialization, the quality advantage is the joint effect of the trigger and the seeding, and the two cannot be separated on the present evidence. The control run specified in Chapter 3 is required before the trigger alone can be credited with the improvement.

3.4 The two trigger signals did not contribute equally. The dual-signal rule worked as designed in that 2-opt was applied in roughly one-fifth to one-half of iterations rather than in all of them, which supports the central proposition that local search need not be performed continuously to be useful. However, the Pheromone Dominance Ratio stood far above its threshold of 2.0 at every recorded trigger, so the entropy condition was effectively deciding when refinement occurred. The independent contribution of the PDR signal is therefore not established, and the ablation study recommended below is needed to determine whether it adds anything beyond the entropy condition.

3.5 Taken as a whole, adaptive local-search scheduling is supported as a strategy for improving the efficiency of hybrid ant colony optimization: it delivers equal or better tour quality at lower computational cost than unconditional refinement across instances of 51 to 200 nodes. Its effect on convergence speed, as that construct was operationalised in this study, is not supported, and its effect on solution quality is established jointly with initialization rather than in isolation. Both qualifications are matters for the further work set out in the recommendations.

**RECOMMENDATIONS**  
Based on the findings and conclusions of the study, the following recommendations are proposed:  
1\. Use adaptive local-search scheduling in larger TSP experiments. Future implementations should investigate the Proposed Adaptive HACO on substantially larger TSP instances to determine whether the computational savings observed on instances up to 200 nodes continue as problem size increases.  
2\. Evaluate additional benchmark instances. Future studies should include a larger and more diverse collection of TSPLIB instances, including symmetric and asymmetric TSP variants where appropriate. Additional benchmark structures would provide stronger evidence regarding the generalizability of the adaptive mechanism.  
3\. Investigate alternative entropy thresholds. The entropy threshold used by the Proposed Adaptive HACO was calibrated for the experimental environment. Future research should investigate dynamic, self-adjusting, or instance-dependent entropy thresholds instead of relying on a fixed threshold.  
4\. Investigate alternative pheromone-dominance thresholds. Future studies should examine how different Pheromone Dominance Ratio thresholds affect activation frequency, computational time, convergence behavior, and solution quality. A sensitivity analysis could determine whether the threshold should adapt according to problem size or search stage.  
5\. Conduct ablation experiments on the adaptive signals. Future researchers should separately evaluate:

* entropy-only triggering,  
* PDR-only triggering,  
* entropy \+ PDR triggering,  
* unconditional 2-opt,  
* and no local search.

This would allow the individual contribution of each component of the adaptive mechanism to be isolated more rigorously.  
6\. Standardize initialization when isolating algorithmic effects. Future comparative experiments should use identical initialization procedures and controlled random seeds across algorithm variants when the objective is to isolate the effect of the adaptive local-search mechanism. This would minimize the possibility that differences in initialization contribute to observed performance differences.  
7\. Explore alternative local-search operators. Future research may investigate whether other local-search procedures, such as 3-opt, Lin-Kernighan, or other neighborhood-search strategies, can be incorporated into the same adaptive triggering framework. The objective would be to determine whether the adaptive scheduling concept extends beyond 2-opt.  
8\. Examine other statistical approaches for broader algorithm comparisons. Since the present study focuses its inferential comparisons primarily on the Proposed Adaptive HACO and Non-adaptive HACO, future research involving several algorithm variants should consider omnibus tests and appropriate post-hoc procedures. Effect-size measures should also be reported to complement p-values and provide information about the practical magnitude of performance differences.  
9\. Improve reproducibility through complete experimental logging. Future implementations should record random seeds, iteration-level entropy values, PDR values, trigger events, convergence iterations, tour lengths, and runtime for every trial. Such logging would make it possible to reproduce the adaptive decisions and conduct more detailed post-experiment analysis.  
10\. Investigate adaptive mechanisms for other metaheuristic algorithms. The principle demonstrated in this study may be extended beyond ACO. Future research could investigate whether entropy- or diversity-based triggers can determine when expensive local-search or intensification operators should be activated in other population-based optimization algorithms.

**REFERENCES**  
Billones, R. K. C., Guillermo, M., Lucas, K. C., Era, M., & Dadios, E. P. (2021). Smart region mobility framework. Proceedings of the IEEE 13th International Conference on Humanoid, Nanotechnology, Information Technology, Communication and Control, Environment, and Management (HNICEM). https://doi.org/10.1109/HNICEM54116.2021.9731944

Biswas, A., Pal, S., & Mandal, T. (2024). Modern applications of the spiral model in large-scale simulation and optimization projects. Journal of Systems and Software Engineering, 19(2), 45–60. https://doi.org/10.1016/j.jsse.2024.01.005

Blum, C., & Roli, A. (2003). Metaheuristics in combinatorial optimization: Overview and conceptual comparison. ACM Computing Surveys, 35(3), 268–308. https://doi.org/10.1145/937503

Cadeliña, A. R., Cuevas, M. A., Kallos, M., & Bandala, A. A. (2024). D-wave implementation of quantum annealing for optimal resource allocation in disaster response operation of Marikina City. ECTI Transactions on Computer and Information Technology, 18(1).

Creswell, J. W., & Creswell, J. D. (2018). Research design: Qualitative, quantitative, and mixed methods approaches (5th ed.). SAGE Publications.

de Veluz, M. R. D., Redi, A. A. N. P., Maaliw, R. R., Persada, S. F., & Prasetyo, Y. T. (2023). Scenario-based multi-objective location-routing model for pre-disaster planning: A Philippine case study. Sustainability, 15\.

Deng, W., Xu, J., & Zhao, H. (2019). An improved ant colony optimization algorithm based on hybrid strategies for scheduling problems. IEEE Access, 7, 20281–20292. https://doi.org/10.1109/ACCESS.2019.2897580

Dorigo, M., & Stutzle, T. (2004). Ant colony optimization. MIT Press. \[Seminal foundational work — retained due to no modern equivalent\]

Gao, W., Yen, G. G., & Liu, S. (2020). A cluster-based differential evolution with a self-adaptive strategy for multimodal optimization. IEEE Transactions on Cybernetics, 44(8), 1314–1327. https://doi.org/10.1109/TCYB.2013.2282491

Gue, I. H. V., Mayol, A. P., Felix, C. B., Ubando, A. T., & Culaba, A. B. (2015). Application of ant colony optimization on the transport route of algal biofuels. In Proceedings of the 3rd International Conference on Clean Energy.

Jao, J. R., & Vallar, E. A. (2023). Optimization of the routing problem using the physics-based electromagnetism-like algorithm. IOP Conference Series: Materials Science and Engineering, 1294(1), 012042\. https://doi.org/10.1088/1757-899x/1294/1/012042

Lin, S., & Kernighan, B. W. (1973). An effective heuristic algorithm for the traveling salesman problem. Operations Research, 21(2), 498–516. https://doi.org/10.1287/opre.21.2.498 \[Seminal foundational work — retained due to no modern equivalent\]

Liu, Y., Wang, S., & Zhang, Z. (2023). DAACO: Adaptive dynamic quantity of ant ACO algorithm to solve the traveling salesman problem. Complex & Intelligent Systems, 9, 2145–2161. https://doi.org/10.1007/s40747-022-00949-6

Malikov, A., Yusupov, R., & Komilov, F. (2023). Application of the spiral model in risk management of complex algorithmic systems. International Journal of Advanced Computer Science and Applications, 14(3), 210–218. https://doi.org/10.14569/IJACSA.2023.0140326

Mavrovouniotis, M., Müller, F. M., & Yang, S. (2017). Ant colony optimization with local search for dynamic traveling salesman problems. IEEE Transactions on Cybernetics, 47(7), 1743–1756. https://doi.org/10.1109/TCYB.2016.2582749

Nie, X., Wang, H., & Nie, H. (2023). Adaptive ant colony optimization algorithm based on information entropy for robot path planning. Symmetry, 15(4), 785\. https://doi.org/10.3390/sym15040785

Nie, X., Wang, H., & Nie, H. (2023). Adaptive ant colony optimization algorithm based on information entropy for robot path planning. Symmetry, 15(4), 785\. https://doi.org/10.3390/sym15040785

Osaba, E., Villar-Rodriguez, E., Del Ser, J., Nebro, A. J., Molina, D., LaTorre, A., Suganthan, P. N., Coello Coello, C. A., & Herrera, F. (2021). A tutorial on the design, experimentation and application of metaheuristic algorithms to real-world optimization problems. Swarm and Evolutionary Computation, 64, 100888\. https://doi.org/10.1016/j.swevo.2021.100888

Reinelt, G. (1991). TSPLIB — A traveling salesman problem library. ORSA Journal on Computing, 3(4), 376–384. https://doi.org/10.1287/ijoc.3.4.376 \[Benchmark standard — no modern equivalent; retained as primary data source reference\]

Rokbani, N., Kumar, R., Abraham, A., Alimi, A. M., & Khanna, A. (2021). Bi-heuristic ant colony optimization-based approaches for the traveling salesman problem. Soft Computing, 25, 3913–3934. https://doi.org/10.1007/S00500-020-05406-5

Sagban, R., Ku-Mahamud, K. R., & Abu Bakar, M. S. (2017). Unified strategy for intensification and diversification balance in ACO metaheuristic. In the 2017 International Conference on Infocomm Technologies (ICIT). IEEE. https://doi.org/10.1109/ICITECH.2017.8079991

Santos, A. R. P., Redi, A. A., German, J. D., & Ong, A. K. S. (2024). Routing optimization for waste collection: A case study in the urban community of Malolos City, Bulacan. International Journal of Industrial and Systems Engineering.

Shahadat, M. S., Kabir, M. A., & Rahman, M. S. (2022). Visibility adaptation in ant colony optimization for solving the traveling salesman problem. Mathematics, 10(14), 2448\. https://doi.org/10.3390/math10142448

Shannon, C. E. (1948). A mathematical theory of communication. Bell System Technical Journal, 27(3), 379–423. https://doi.org/10.1002/j.1538-7305.1948.tb01338.x \[Foundational theorem — retained as the source of the entropy formula used in Section 2.3\]

Stützle, T., & Hoos, H. H. (2000). MAX–MIN ant system. Future Generation Computer Systems, 16(8), 889–914. https://doi.org/10.1016/S0167-739X(00)00043-1

Tang, J., He, Y., & Wu, X. (2023). An adaptive ant colony optimization for solving the large-scale traveling salesman problem. Mathematics, 11(21), 4439\. https://doi.org/10.3390/math11214439

Wang, J., Zhang, L., & Chen, H. (2023). A scheme library-based ant colony optimization with 2-opt local search for the dynamic traveling salesman problem. Computer Modeling in Engineering & Sciences, 136(3), 2481–2507. https://doi.org/10.32604/cmes.2022.022807

Wang, X., Choi, T. M., Liu, H., & Yue, X. (2018). A novel hybrid ant colony optimization algorithm for emergency transportation problems during post-disaster scenarios. IEEE Transactions on Systems, Man, and Cybernetics: Systems, 48(10), 1678–1693.

Wang, Z., Zhao, X., & Liu, J. (2016). Simulation-based optimization of ant colony algorithms for dynamic vehicle routing problems. Transportation Research Part C: Emerging Technologies, 67, 144–160. https://doi.org/10.1016/j.trc.2016.02.00

Zhang, X., Wang, Q., & Zhang, D. (2024). Location-routing optimization for two-echelon cold chain logistics of front warehouses. Journal of Cleaner Production.

**APPENDIX A**

**GANTT CHART**

|  | JAN |  |  |  | FEB |  |  |  | MARCH |  |  |  | APRIL |  |  |  | MAY |  |  |  | JUNE |  |  |  | JULY |  |  |  | AUG |  |  |  | SEPT |  |  |  | OCT |
| :---- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
|  | **1** | **2** | **3** | **4** | **1** | **2** | **3** | **4** | **1** | **2** | **3** | **4** | **1** | **2** | **3** | **4** | **1** | **2** | **3** | **4** | **1** | **2** | **3** | **4** | **1** | **2** | **3** | **4** | **1** | **2** | **3** | **4** | **1** | **2** | **3** | **4** | **1** |
| **Phase 1: Pre-Experimental Setup** |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Define the ACO algorithm parameters (pheromone evaporation rate, alpha, beta, number of ants) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Determine parameter values through initial calibration runs |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Implement the standard ACO algorithm in Python as the baseline |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Select TSPLIB benchmark datasets (10, 50, 100, and 200 nodes) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Establish performance metrics (total travel distance, convergence speed, diversity index, computational time) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **Phase 2: Experimental Execution** |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Integrate the adaptive 2-opt local search module into the standard ACO framework |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Integrate the Shannon entropy-based stagnation detection mechanism |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Execute the standard ACO and hybrid ACO under identical simulation conditions |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Conduct multiple trials across different TSP instance sizes |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Log all performance data systematically per run |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Monitor the stagnation detection mechanism to verify the 2-opt trigger |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **Phase 3: Data Collection and Analysis** |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Compute descriptive statistics (mean and standard deviation) for each performance metric |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Generate convergence curves using Matplotlib |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Generate diversity index graphs |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Tabulate results from standard ACO and hybrid ACO for direct comparison |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Calculate percentage improvements in solution quality |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **Phase 4: Evaluation and Validation** |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Assess whether statistically significant improvements were achieved compared to the baseline |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Validate reduction of premature convergence and maintenance of higher solution diversity |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Verify the research objectives against the experimental findings |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Refine algorithm parameters if necessary |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Document findings for reporting |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **Phase 5: Final Manuscript and Defense** |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Compile the final thesis manuscript |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Prepare the defense presentation and supporting materials |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Conduct the pre-defense review |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Present the final defense |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Apply revisions and submit the final document |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Proposed Solutions |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Conclusion and Recommendations |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Final Manuscript Compilation and Formatting |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Pre-Defense and Defense Preparation |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Final Defense |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Revisions and Final Submission |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

    

**LEGEND**   

| Completed |  |
| :---- | :---- |
| Incomplete |  |

**APPENDIX B**

**SOURCE CODE**  
This documents a single-page browser application that visualises and benchmarks three variants of Ant Colony Optimization (ACO) on six classic TSP instances from TSPLIB. The simulation runs inside a Web Worker (off the main thread), and the UI renders the colony's self-organisation in real time: ant trails, pheromone concentration, entropy, and the adaptive trigger firing.

The codebase is a TypeScript port of the Python thesis implementation (algorithms.py, aco.py, entropy\_pdr.py, two\_opt.py, tsplib.py), cross-checked to \~9 decimal places. The three algorithm variants are:

1\.       Standard ACO — plain Ant System, no local search. Baseline.

2\.       Non-adaptive HACO — 2-opt applied every iteration, regardless of colony state. Maximum local search cost.

3\.       Adaptive HACO (proposed) — 2-opt applied only when two signals agree: entropy H(S) \< theta AND PDR \> 2\. Selective refinement.

The application is structured as a Web Worker that precomputes all 500 frames of all three algorithms on load, then serves snapshots on demand. This makes scrubbing, stepping, and replay instant. The UI draws three city maps (WebGL), three live charts (Canvas 2D), a telemetry rail, a narration panel, and a manual benchmark modal.

**Helper Modules**  
**Distance matrix(aco.ts)**

WHAT: Computes the pairwise euclidean distance matrix d\[i\*n+j\] for all n cities. Symmetric: d\[i\]\[j\] \= d\[j\]\[i\]. Diagonal is zero.

WHY: The distance matrix is used everywhere — tour construction, tour length evaluation, pheromone updates, and 2-opt gain calculations. Computing it once at load saves repeated sqrt calls.  
export function distanceMatrix(coords: number\[\]\[\]):   
Float64Array {   const n \= coords.length;   const d \= new Float64Array(n \* n);    
 for (let i \= 0; i \< n; i++) {  for (let j \= i \+ 1; j \< n; j++) {     
 const dx \= coords\[i\]\[0\] \- coords\[j\]\[0\];     
 const dy \= coords\[i\]\[1\] \- coords\[j\]\[1\];      
d\[i \* n \+ j\] \= d\[j \* n \+ i\] \= Math.sqrt(dx \* dx \+ dy \* dy);    
}     
}     
return d; } 

**Shannon entropy(entropy.ts)**

WHAT: H(S) \= \-sum\_e p(e) \* log2(p(e)), where p(e) \= fraction of ants using directed edge e. Counts edge usage across all m ant tours, then computes Shannon entropy in bits.

WHY: Entropy measures colony diversity. High entropy \= ants exploring broadly. Low entropy \= ants converging on the same edges. The adaptive trigger uses H(S) \< theta as one of its two gates.  
export function shannonEntropy(tours: Int32Array, n: number, m: number): number {  
  const counts \= new Float64Array(n \* n);  
  for (let k \= 0; k \< m; k++) {  
	const off \= k \* n;  
	for (let s \= 0; s \< n \- 1; s++) counts\[tours\[off \+ s\] \* n \+ tours\[off \+ s \+ 1\]\]++;  
	counts\[tours\[off \+ n \- 1\] \* n \+ tours\[off\]\]++;  
  }  
  let H \= 0;  
  for (let e \= 0; e \< n \* n; e++) {  
	if (counts\[e\] \> 0\) {  
  	const p \= counts\[e\] / m;  
  	H \+= \-p \* Math.log2(p);  
	}  
  }  
  return H;  
}  
**Pheromone Dominance Ratio(entropy.ts)**  
WHAT: PDR \= max(tau) / mean(tau) over active (positive) edges. Returns 1.0 when the pheromone matrix is uniform or empty.  
WHY: PDR measures how concentrated the pheromone is. Around 1 \= no edge dominates. High PDR \= one trail has taken over. The adaptive trigger uses PDR \> 2 as its second gate.  
export function pdr(tau: Float64Array): number {  
  let max \= 0, sum \= 0, count \= 0;  
  for (let i \= 0; i \< tau.length; i++) {  
    const v \= tau\[i\];  
    if (v \> 0\) { if (v \> max) max \= v; sum \+= v; count++; }  
  }  
  return count \=== 0 ? 1 : max / (sum / count);  
}  
**2-opt local search(twoOpt.ts)**  
WHAT: Best-improvement 2-opt: for every pair of edges (a,b) and (c,d) that cross, reverse the segment between them to remove the crossing. Repeat until no improving swap exists (up to 500 passes). Returns a NEW array; input is untouched.  
WHY: A tour that crosses itself is never optimal. 2-opt untangles it strictly shortening the tour each time a swap is accepted. This is the local refinement the adaptive trigger activates selectively.  
export function twoOpt(tour: Int32Array, d: Float64Array, n: number,  
                       maxPasses \= 500): Int32Array {  
  const t \= new Int32Array(tour);  
  for (let pass \= 0; pass \< maxPasses; pass++) {  
    let improved \= false;  
    for (let i \= 0; i \< n \- 2; i++) {  
      const a \= t\[i\], b \= t\[i \+ 1\];  
      let bestJ \= \-1, bestGain \= \-Infinity;  
      for (let j \= i \+ 2; j \< n; j++) {  
        const c \= t\[j\], cNext \= t\[(j \+ 1\) % n\];  
        const gain \= d\[a\*n+b\] \+ d\[c\*n+cNext\] \- d\[a\*n+c\] \- d\[b\*n+cNext\];  
        if (gain \> bestGain) { bestGain \= gain; bestJ \= j; }  
      }  
      if (bestJ \>= 0 && bestGain \> 1e-12) {  
        // reverse segment \[i+1 .. bestJ\]  
        for (let lo \= i+1, hi \= bestJ; lo \< hi; lo++, hi--) {  
          const tmp \= t\[lo\]; t\[lo\] \= t\[hi\]; t\[hi\] \= tmp;  
        }  
        improved \= true; break;  
      }  
    }  
    if (\!improved) break;  
  }  
  return t;  
}  
**Deterministic PRNG(rng.ts)**  
WHAT: Mulberry32: a 32-bit seeded PRNG that returns a float in \[0, 1). Also provides randInt(rng, bound) for random integers in \[0, bound).  
WHY: Determinism is critical: the same seed must reproduce the same run, so the browser simulation matches the Python reference. Each algorithm gets a derived seed via bit mixing (seed \* 2654435761 ^ algo \* 40503).  
export function mulberry32(seed: number): Rng {  
  let a \= seed \>\>\> 0;  
  return function () {  
    a |= 0;  
    a \= (a \+ 0x6d2b79f5) | 0;  
    let t \= Math.imul(a ^ (a \>\>\> 15), 1 | a);  
    t \= (t \+ Math.imul(t ^ (t \>\>\> 7), 61 | t)) ^ t;  
    return ((t ^ (t \>\>\> 14)) \>\>\> 0\) / 4294967296;  
  };  
}  
**ACO Core(aco.ts)**  
**Phéromone initialisation**  
WHAT: tau0 \= 1 / (n \* L\_nn), where L\_nn is the nearest-neighbour tour length. All edges start at tau0 (uniform). For the adaptive variant, the nearest-neighbour tour's edges get tau0 \* 10 (greedy boost), giving it a head start.  
WHY: Uniform tau0 means no edge is initially favoured, so the colony explores broadly. The greedy boost for adaptive seeds the pheromone map with the structure of a reasonable tour, which is why adaptive starts with a better champion.  
export function initialTau(n: number, d: Float64Array,  
  boostTour: Int32Array | null \= null,  
  boost \= 10, start \= 0): Float64Array {  
  const nn \= nearestTour(d, n, start);  
  const Lnn \= tourLen(d, n, nn);  
  const tau0 \= 1 / (n \* Lnn);  
  const tau \= new Float64Array(n \* n).fill(tau0);  
  for (let i \= 0; i \< n; i++) tau\[i \* n \+ i\] \= 0;  
  if (boostTour) {  
    for (let s \= 0; s \< n; s++) {  
      const i \= boostTour\[s\];  
      const j \= boostTour\[(s \+ 1\) % n\];  
      tau\[i \* n \+ j\] \*= boost;  
      tau\[j \* n \+ i\] \*= boost;  
    }  
  }  
  return tau;  
}  
**Effective matrix**  
WHAT: p\[i\]\[j\] \= tau\[i\]\[j\]^alpha \* eta\[i\]\[j\]^beta, where eta \= 1/d\[i\]\[j\] is the visibility heuristic. This is the attractiveness matrix used for roulette-wheel tour construction.  
WHY: Alpha \= 1 means pheromone weight is linear. Beta \= 5 means distance dominates — ants strongly prefer short edges, but pheromone provides the collective memory that steers them toward consensus.  
export function effective(d: Float64Array, tau: Float64Array,  
  alpha: number, beta: number): Float64Array {  
  const n \= Math.sqrt(tau.length) | 0;  
  const p \= new Float64Array(n \* n);  
  for (let i \= 0; i \< n; i++) {  
    for (let j \= 0; j \< n; j++) {  
      p\[i\*n+j\] \= Math.pow(tau\[i\*n+j\], alpha)  
                \* Math.pow(1 / d\[i\*n+j\], beta);  
    }  
  }  
  return p;  
}  
**Tour construction**  
WHAT: Each ant builds a tour by roulette-wheel selection: at each city, pick the next city with probability proportional to p\[i\]\[j\] among unvisited cities. Each ant starts from a random city. Produces m tours as a flat Int32Array of shape (m \* n).  
WHY: Roulette-wheel selection balances exploration (probabilistic) with exploitation (higher p values are more likely). The random start city adds diversity — no two ants follow the same path from the same origin.  
export function constructTours(p: Float64Array, n: number,  
  m: number, rng: Rng): Int32Array {  
  const tours \= new Int32Array(m \* n);  
  const allowed \= new Int32Array(n \- 1);  
  const partial \= new Float64Array(n \- 1);  
  for (let k \= 0; k \< m; k++) {  
    const startIdx \= randInt(rng, n);  
    // ... fill allowed \= all cities except start ...  
    for (let step \= 1; step \< n; step++) {  
      const cur \= tours\[k \* n \+ step \- 1\];  
      // sum p\[cur\]\[allowed\], then roulette-wheel pick  
      // ...  
    }  
  }  
  return tours;  
}  
**Pheromone update**  
WHAT: Standard AS evaporation \+ deposit: tau\_new \= (1 \- rho) \* tau\_old \+ sum\_k (Q / L\_k) for each edge used by ant k. rho \= 0.5 means the colony forgets half each generation.  
WHY: Evaporation prevents pheromone from growing unboundedly and allows the colony to abandon poor edges. Deposit reinforces good edges proportionally to 1/tour\_length — shorter tours deposit more, concentrating pheromone on good routes.  
export function updatePheromones(tau: Float64Array, n: number,  
  d: Float64Array, tours: Int32Array,  
  m: number, Q: number, rho: number): Float64Array {  
  const next \= new Float64Array(tau.length);  
  for (let i \= 0; i \< n; i++)  
    for (let j \= 0; j \< n; j++)  
      next\[i\*n+j\] \= (1 \- rho) \* tau\[i\*n+j\];  
  for (let k \= 0; k \< m; k++) {  
    const Lk \= tourLen(d, n, tours.subarray(k\*n, k\*n+n));  
    const dep \= Q / Lk;  
    for (let s \= 0; s \< n; s++) {  
      const i \= tours\[k\*n \+ s\];  
      const j \= tours\[k\*n \+ ((s+1) % n)\];  
      next\[i\*n+j\] \+= dep;  
    }  
  }  
  return next;  
}  
**Simulation Orchestrator(runner.ts)**  
**runALL(instance, seed, maxFrames)**  
WHAT: Runs all three algorithms (standard, non-adaptive, adaptive) for maxFrames=500 iterations each, using the same seed (with per-algorithm derivation). Returns a RunState containing arrays of best-tour-length, entropy, PDR, trigger flags, champion-tour snapshots, and trail-edge lists for every frame.  
WHY: Running all three algorithms in one pass ensures they share the same random-seed derivation and that the UI can show them in lockstep. Precomputing all 500 frames at load time makes scrubbing and replay instant.  
export function runAll(instance: InstanceName, seed \= 7,  
  maxFrames \= T\_MAX): RunState {  
  const coords \= COORDS\[instance\];  
  const n \= coords.length;  
  const d \= distanceMatrix(coords);  
  const theta \= THETA\[instance\];  
  const opt \= OPTIMA\[instance\];

  const results \= \[make(0), make(1), make(2)\];

  for (const r of results) {  
    const rng \= mulberry32(  
      ((seed \* 2654435761\) ^ (r.algo \* 40503)) \>\>\> 0);  
    const isAdaptive \= r.algo \=== 2;  
    const isNonadaptive \= r.algo \=== 1;

    // Adaptive: greedy-seeded tau, NN champion  
    // Standard/Non-adaptive: uniform tau, empty champion  
    // ...

    for (let f \= 0; f \< maxFrames; f++) {  
      const p \= effective(d, tau, alpha, beta);  
      const tours \= constructTours(p, n, m, rng);  
      const lens \= tourLengths(d, n, tours, m);  
      const k \= argmin(lens, m);  
      if (lens\[k\] \< bestLen) { /\* update champion \*/ }

      tau \= deposit(tau, n, d, tours, m);  
      const H \= shannonEntropy(tours, n, m);  
      const P \= pdr(tau);

      if (isAdaptive && H \< theta && P \> tauPdr) {  
        bestTour \= twoOpt(bestTour, d, n);  
        bestLen \= tourDistance(d, n, bestTour);  
        r.fired\[f\] \= 1; r.nAct++;  
      } else if (isNonadaptive) {  
        bestTour \= twoOpt(bestTour, d, n);  
        bestLen \= tourDistance(d, n, bestTour);  
      }

      r.best\[f\] \= bestLen;  
      r.H\[f\] \= H; r.P\[f\] \= P;  
      r.bestTourAt.set(bestTour, f \* n);  
      r.trailAt\[f\] \= topEdges(tau, n, 1000);  
    }  
  }  
  return { instance, n, theta, tauPdr, opt, maxFrames, results };  
}  
**benchmark(instance,seeds, onProgress)**  
WHAT: Runs runAll() for N independent seeds, collects the final L\* and activation count for each algorithm, and computes mean, sd, best, worst, mean gap%, and best gap%. Calls onProgress(done, total) after each seed for the progress bar.  
WHY: This replicates the thesis's 30-trial benchmark protocol. The aggregation (mean/sd/gap%) matches the published tables exactly.  
export function benchmark(instance: InstanceName,  
  seeds: number\[\],  
  onProgress?: (done: number, total: number) \=\> void  
): BenchResult {  
  const n \= seeds.length;  
  const perAlgo \= \[0,1,2\].map(() \=\> ({ last: \[\] as number\[\],  
                                         act: \[\] as number\[\] }));  
  seeds.forEach((seed, idx) \=\> {  
    const run \= runAll(instance, seed);  
    for (let a \= 0; a \< 3; a++) {  
      perAlgo\[a\].last.push(run.results\[a\].best\[maxFrames-1\]);  
      perAlgo\[a\].act.push(run.results\[a\].nAct);  
    }  
    onProgress?.(idx \+ 1, n);  
  });  
  // ... compute rows: mean, sd, best, worst, meanGap, ...  
  return { instance, trials: n, opt, rows, thesisGaps };  
}  
**Web Worker (worker.ts)**  
WHAT: The worker owns a RunState and serves snapshots to the main thread. It handles commands: load, play, pause, seek, step, reset, speed, and bench. On 'load', it runs runAll() once and stores the full trace. Snapshots are slices of the precomputed arrays up to the current frame.  
WHY: Running the simulation in a Web Worker keeps the main thread free for rendering at 60fps. Precomputing all frames at load means every other operation (play, seek, step, scrub) is just a slice \+ postMessage — no recomputation.  
self.onmessage \= (e: MessageEvent\<WorkerMsg\>) \=\> {  
  const m \= e.data;  
  switch (m.cmd) {  
    case 'load':  
      run \= runAll(m.instance as never, 7, T\_MAX);  
      frame \= 0; playing \= false;  
      post({ type: 'meta', instance: run.instance,  
             n: run.n, theta: run.theta,  
             tauPdr: run.tauPdr, opt: run.opt,  
             maxFrames: run.maxFrames });  
      post(snapshot());  
      break;  
    case 'play':  /\* start interval \*/ break;  
    case 'pause': /\* stop interval \*/  break;  
    case 'seek':  frame \= m.frame; post(snapshot()); break;  
    case 'step':  frame++; post(snapshot()); break;  
    case 'reset': frame \= 0; playing \= false; post(snapshot()); break;  
    case 'bench':  
      const seeds \= Array.from({length: m.trials}, (\_, s) \=\> s);  
      post({ type: 'bench-progress', done: 0, total: seeds.length });  
      const result \= benchmark(inst, seeds, (done) \=\> {  
        post({ type: 'bench-progress', done, total: seeds.length });  
      });  
      post({ type: 'bench-result', ...result });  
      break;  
  }  
};  
**UI Layer**  
**City maps (mapview.ts)**  
WHAT: Three WebGL canvases (Three.js), one per algorithm. Each renders: city dots (slate \+ glow), the best tour (algorithm-colored line), a comet orbiting the tour, the top \~1000 pheromone edges (color-coded by strength: cyan-\>rose-\>yellow), and a fire ring pulse on trigger frames. Drag to pan, wheel to zoom.  
WHY: The trail visualization is the key visual: you watch pheromone concentrate onto good edges as the colony self-organizes. The comet makes the champion tour visible even when trails are dense. The fire ring is the 2-opt activation made loud.  
**Trace charts (tracemap.ts)**  
WHAT: Three Canvas 2D charts: L\*(t) with green optimum line, H(S)(t) with amber theta line, PDR(t) with amber theta\_P=2 line. Fire ticks at the start of each firing streak. Dashed playhead \+ hover tooltip shows t and per-algo values.  
WHY: Charts make the temporal dynamics visible: entropy falling toward theta, PDR climbing, L\* stepping down on refinements. The fire ticks show exactly where in the run the adaptive trigger fired.  
**Narration (narration.ts)**  
WHAT: Turns a snapshot into a plain-English sentence. Color-coded by mood: info (gray), fire (rose), warning (amber), done (green). Phrases: 'Colony exploring', 'Self-organisation', 'Stagnation windows', 'Long-run phase', 'Run complete'.  
WHY: The narration gives the audience something to read at every moment without needing to interpret the charts. It is the pre-written script for the demo.  
**Benchmark modal(bench.ts)**  
WHAT: Renders the benchmark results: auto-written verdict sentence, HTML table (mean/sd/best/worst/gap%/activations/thesis-gap%), canvas bar chart (live means with sd whiskers vs thesis diamonds), and a glossary explaining L\*, gap%, H(S), PDR, theta, tau\_P, 2-opt, and the three algorithms.  
WHY: The bar chart is the credibility shot: seeing live bars land near the published diamonds proves the browser simulation reproduces the thesis results.  
**Main Wiring (main.ts)**  
WHAT: Boot creates the three MapViews and three TraceCharts, starts the worker, and wires all event handlers. The onSnap handler receives each snapshot and: updates the scrubber, fires the maps and charts, reads the stats, generates the narration, and pushes non-info events to the log. The bench handler opens the modal, sends the bench command, updates the progress bar, and calls renderBench on completion.  
WHY: The main thread does zero simulation work — it only draws what the worker sends. This is why the UI stays smooth even while the benchmark is computing hundreds of trials in the background.  
worker.onmessage \= (e: MessageEvent) \=\> {  
  const m \= e.data as Record\<string, any\>;  
  if (m.type \=== 'meta') {  
    meta \= metaFromWorker(m);  
    charts.forEach(c \=\> {  
      if (c.kind \=== 'pdr') c.threshold \= PDR\_THRESHOLD;  
      if (c.kind \=== 'entropy') c.theta \= meta\!.theta;  
      if (c.kind \=== 'length') c.opt \= meta\!.opt;  
    });  
    // URL params: ?instance=\&t=\&autoplay  
    const q \= new URLSearchParams(location.search);  
    const inst \= q.get('instance');  
    if (inst && inst \!== meta.instance) {  
      els.selInstance.value \= inst;  
      send({ cmd: 'load', instance: inst });  
      return;  
    }  
    const seek \= q.get('t');  
    if (seek \!== null) send({ cmd: 'seek', frame: Number(seek) });  
    if (q.has('autoplay')) playPause();  
  }  
  if (m.type \=== 'snap') onSnap(m as SnapMsg);  
  if (m.type \=== 'bench-progress') {  
    els.benchBar.style.width \= (m.done/m.total)\*100 \+ '%';  
    els.benchPct.textContent \= Math.round((m.done/m.total)\*100) \+ '%';  
  }  
  if (m.type \=== 'bench-result') {  
    const bench \= m as unknown as BenchResult;  
    renderBench(els.benchResults, bench);  
    els.benchResults.classList.remove('hidden');  
  }  
};  
**Cross-Check (how we know it is correct)**  
• verify.test.ts (vitest): asserts TS functions reproduce Python reference values to \~9 decimal places — transition probs, entropy, tour lengths, 2-opt length, pheromone update.  
• run.test.ts: full runs on all 6 instances — monotone best, H in \[0, n\*log2 n\], PDR \>= 1, valid permutation tours, adaptive fires \>=1 on eil51, others never.  
• scripts/verify\_headless.mjs: boots the built page in a headless browser, autoplays to t=120, compares rendered values (PDR, activations, canvas count, log lines) against the reference snapshot.  
• instances.ts is AUTO-GENERATED by web/scripts/gen\_refs.py from the Python code — the numbers embedded in the app are the paper's numbers by construction.

**CURRICULUM VITAE**

**John Earl C. Mirabete**                                                                          

Purok 3, Brgy. Mayon, Daraga, Albay

09634109179

07304309@dwc-legazpi.edu

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**PERSONAL INFORMATION:**

Birthdate		     : 	December 20, 2002

Civil Status                      : 	Single

Gender			     :	Male

Religious Affiliation	     : 	Roman Catholic

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**EDUCATIONAL ATTAINMENT:**

Tertiary                             : 	Divine Word College of Legazpi

				Course: BS Computer Science

Secondary		      :	Anislag National High School

Year Graduated: 2022

Elementary		      : 	Mayon Elementary School

Year Graduated: 2016

**CURRICULUM VITAE**

**Joshua M. Bermas**

Purok 7 San Rafael, Castilla, Sorsogon

09958924067

07205218@dwc-legazpi.edu

---

**PERSONAL INFORMATION**

| Birthdate | : | February 29, 2004 |
| :---- | :---: | :---- |
| Status | **:** | Single |
| Gender | **:** | Male |
| Religious affiliation | **:** | Roman Catholic |

---

**EDUCATIONAL ATTAINMENT**

| Tertiary | : | Divine Word College of Legazpi Course: BS Computer Science |
| :---- | :---: | :---- |
| Secondary | **:** | Saint Louise de Marillac College of Sorsogon Year Graduated: 2022 |
| Elementary | **:** | San Rafael Elementary School Year graduate: 2016 |

**CURRICULUM VITAE**

**Vincent Brian E. Somido**

Estanza, Legazpi City, Albay

09605154803

07411994@dwc-legazpi.edu

---

**PERSONAL INFORMATION**

| Birthdate | : | October 25, 2003 |
| :---- | :---: | :---- |
| Status | **:** | Single |
| Gender | **:** | Male |
| Religious affiliation | **:** | Roman Catholic |

---

**EDUCATIONAL ATTAINMENT**

| Tertiary | : | Divine Word College of Legazpi Course: BS Computer Science |
| :---- | :---: | :---- |
| Secondary | **:** | St. John’s Wort Montessori Year Graduated: 2022 |
| Elementary | **:** | BUDFI Dream Buds Learning Center Year graduate: 2016 |

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAkAAAAGmCAYAAACUbzs0AACAAElEQVR4XuzdB5jUROMG8O8TRcTey9/eFcXPioIKgkgR6SBNqQKCWEBREBQsqAiCgiBdunQQlKZU6b1Kb1LlwKMcx9HmzzvLxNywN7vZTba+v+fJk+xs9jhgNnkzmcz8RxARERElmf/oBURERESJjgGIiIiIkg4DEBERESUdBiAiIiJKOgxARERElHQYgIiIiCjpMAARERFR0mEAIiIioqTDAERERERJhwGIiIiIkg4DUBy65ppr5Pq8886T6wIFCojHHntMLvZ90tLSrNdEsWjLli2iSpUqenGW/vMf3yEre/bs2jv/sn8XlixZIl588UVRokQJMXfuXG1PotjWokULMXHiRHH11VfL16pu58yZU77esWOHqFmzpsibN6/9YxQkBqA4pgJQ0aJFtXeEGDx4MAMQxYVQAlCwRo8eLdenTp2yvi9E8UYFIOXKK6+U65tvvlmuT5w4YX+bguTsaEJRUatWLdG9e3fxwAMPiIMHD1onAXVAf+GFF8QVV1whunbtan1myJAhDEAUF8qVKyd++OEHq9XmwgsvFG+88YYYO3asGDdunKzvqP/dunWz6v5ll10m12XKlBFvvvmmuPXWW62f99BDD2V6rZx//vl6EVFMufbaa0W7du1EnTp1xMiRI0WlSpVkuR6AZs6cKdd58uQRDz/8sGjdunWm9yk4DEBxoFixYuLQoUOiYMGC8rUegNLT0+W6R48evg8IBiCKHziIw+233y6OHTsmVq1aJeu7quf2Vh+1fd1118n1Bx98INfr16+39lGqVq1qbderV08cPnzY9i5RbFm5cqX45ptvZN1Xx3Z/AQi3vRT1fejVq5eYPn26VU7BYQCKA4UKFZJXwlhAD0DKmjVrrG0GIIoX6hZYyZIlxa5du8SIESP81nf7th6ANm3aZO2joMVUef31123vEMWe4cOHi48//jhT3fcXgBo0aGBtX3TRRXKN+l+/fn2rnILDABQH1MG+S5cucq0HINUBrmPHjnINDEAUL9TtLNWxWd3KVf0bnASgX375xbfjabiNALlz55brsmXLWu8RxRocr5944gm5XaFCBbn2F4Dw0ItyzjnnyHWnTp1kCxI5wwAUB1555RXRuXNncd9991m3Bnbu3CmyZcsm1q5dK08cuF+srgbg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>

[image2]: <data:image/png;base64,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97uPPPKImG/Tpg01adJEzBcrVky0Ryv8+9//phMnToh53s8OHz5czPO+v0aNGo6rasP7v927d1OtWrVoxYoVRvvnNsBtMSYmRv0WLbiOEiVKiP5ckydPpgULFohy7vdZvnx5ZW09xowZI9o8q1ChAr3//vtinv8/3333XcdVnfKqANSlSxfxyYMlWu29994Tn88884z4HDx4ML355pti/ueffzbW043r+/Of/yzm+T9Pzo8dO9ZxNa34AMsbBOOn7OSO2qqn344dO2YEIEd8kN+7d69arAXvAH766SexIcoN4uTJk/TEE08oa3qX+vXri8+C+j05AMnAzTsuKbf/L134iZ/w8HAxzwegSZMmifm33nrLcTWt0tPT7+nozR1gz549KzrgWiEwMFB8yocqduzYQf/617/EvFXBi/dVZ86coV69eomvn376aQoJCRHzJUuWdFzVq6xbt85oE1b729/+Jj4d9wubN2+2/KSDQ4djyOMXhF++fNnSgYA/++wzeu6558T81KlTxUkny2swcBUHLt6PzJ8/X3wt62My+Ok2atQo2rBhg5ifMmWKGOsnISGBoqKiaPbs2cra5rwqAH3//ffik6/EWE0GoBdffFF88tmwPAitWbNGrqYV75jS0tLoL3/5i/iaw4gMIbxxWIXr5bMDxmcg8ixc/h66/frrr7keUPn3kGdGVnnyySeNgw2fhcizP28lz0Jz+3tZgQPQtm3bxDwHcOnBBx805nVr1aqVOOiwTp06iZMNxldnrMJnpup2zAfdS5cuiUCmW6lSpcTPZsWLFxefHLjkNib3N1bYuXMntW7dWsw///zz4qoTe+ONNxxX8yp8VayghmKQAUhekeD2f+DAASOwWkGe0DoGD273/KQUB1ar/N///Z8RwAcMGECPP/64mLfiahtfvWYcgEaPHi3mixQpYiyfPn26Ma+TfHqQ6+er1xw0OQTxVdbVq1cra5vzqgD00UcfiU+rztAcyR0SX65kfCuMGwyzajwNvhzKP1ueifCtqT/96U9i3sqNwnGHz4FLpue//vWvRrlu8oDOjygmJyeLeb7tMXHiRMfVtJG3TjkAydDDGwofjDzxuK2r+JIx/35WXY5XyVtg165do//5n/8xyuVBQrfu3bsb83z2y1d95K1X3llbQZ6N8m0+3t7kgbZdu3ai7Vs1/owMQH//+9/FJ9crh/Xg22JW4QP6ypUrRTvi/Znc3uQtTm/E+74ZM2aoxZaQbfvhhx8W7Z7/TnzFbPHixcqaevCVR74Fz1fd//GPf4irkaxatWpiP2/FCT6Pus349q+8AsS/g9z+ZNcHK3AA4ttsfJx59tlnjXLHEyyd5HbGAahjx46imwP/n/K2zVek8sKrAhBfHSmoPkB8eZobI//h5H1z5jivE9/W2759u5iYvBWk1q8bH2y4gTD+2965c8cotzIY8L+TkzmfZfFtB8aXKa26F52RkSHOKvnfxAc4x1ttfLbnzfbv368WWYL/JrKtcV832RYOHjzosJZejm2eDwjyYMB9VGT9unG/D24LjG83yP44fIYYGhrquKpW/Lflv7Ha/qzcp/HVVnlLhduR3KatutWsC58YxcbGqsXacQDmfT3j/xfZ1y0pKYkiIiIcV9WG6+M2zz+f/z+4SwDjY4DsiqAb9yfltsChWz2mWHl84TAi/74cuOTJBf8u6i1oXfh4Its3/z/KbZq3+7xeVfSqAAQAAABQEBCAAAAAoNBBAAIAAIBCBwEIAAAACh0EIAAAACh0EIC8hByP6OLFizkXmJCP68sxfgB8iXxENy9jED322GPiUz7lBeBrWrRoQatWrXL5KUh+ysmqJ6oKOwQgL6EGIB4ziB/t5scb/9//s/838YjOjEd7ZTIAffjhhyIE8TgM8gDBr6Cw8jF3AHepAUi23QYNGtCcOXPEjp+H9eehFHjAM8d1vv32W/HJg77xcP88vpEcdJAPMADeyjEAcdvloUHefvttsYzb8IgRI8TE+28em04NQI0bNxafPI4bDwDIY4nxQJyQdwhAXiK3ALR27VrRwP/zn/+IMp7n92o98MAD4mvHACQH/+vZs6f4nDBhgvgE8FZqAOIB67jN8+BxHIAkHrmc3yHHJwOOAYhPEHgUZNawYUMjAHnzCMgAjgGoc+fOos23bNlSLJPhhseOql27thg8UQ1Acnt57bXXxDGBx9bi9g95hwDkJRwDEA+YxQPFMR659L///a+Yf+edd8SnHGVZjnLLAYhf9Mh4g2FWDUMOoIsMQNyeeScuR+zl12XIAMQD5vFAlvyeNxmA+MAhrwDJVw7wS39lAJKvAgDwRhyA+JUN3I79/PxEGQ8CzOSLe2XI4Sv5agDi152wf/7zn0YAksEJ8gYByEs0a9ZMjIzKw/fzhrFp0ybq3bu3sYzxJVF+rxKfLfAGwRsLv1tGLud3qfEBQ34PHxzkgQLA23Ab5Rcg82sc+IonBxx+XYVcJts1v2eIAxB/zS//5NsDPM9tPygoyLjayWU8urv8PgBvw/tobp88YrK86sMvLeXRohcuXGi0XW7bfPuLv+b9Pr/Amtfj/T/jN9tzlwe5nfDkeNUUXIMABAAAAIUOAhAAAAAUOghAAAAAUOggAAEAAEChgwAEAAAAhQ4CEAAAABQ6CEAAAABQ6CAAAQAAQKGDAAQAAACFDgIQAAAAFDoIQAAAAFDo/H9oEV8qWn4j8QAAAABJRU5ErkJggg==>