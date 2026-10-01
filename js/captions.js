/* captions.js - one or two plain sentences under each chart: what a dot, a bar, a color or a line stands for.
   main.js puts each caption under the canvas with the same id. */
window.CAPTIONS = {
  /* Start */
  'st-a': 'Each dot is one rock sample, placed by its gamma ray, density and sonic slowness. The colors are the groups the method found. For k-means the × marks are the group centers, and for the map the lines join neighboring neurons.',
  'st-b': 'The same samples, colored by the rock type we know. They stay gray until we turn on the switch.',
  'st-m': 'For k-means, each point is one choice of k, and a lower point means the samples are closer to their group centers. The red point is the k in use. For the map, each square is one neuron on the grid.',
  /* Vocabulary and Types */
  'v-c': 'Each bar counts the samples in one 10 API range of gamma ray. Purple is shale and gray is every other rock. The dashed line is the expert rule, and the red line is the rule learned from the training samples.',
  'ty-a': 'Each dot is one sample, placed by its depth and its porosity. Filled dots are the samples the line is drawn from, and hollow dots were held back to test it. The red line is the model.',
  /* Dimensions */
  'pc-a': 'Each dot is one sample. The strip along the bottom shows where every sample falls from left to right, and the red bar is how wide that spread is.',
  'pc-b': 'PC1 is now the left-right direction. The strip on the right shows where every sample falls up and down, and the red bar is how wide that spread is.',
  'pc-d': 'Each dot is one sample, placed by its first two principal components.',
  'pc-e': 'Each bar is the share of the total spread that one component holds. Red bars are the components we keep.',
  'pc-f': 'Each pair of bars shows how much one measurement goes into PC1 (red) and PC2 (gray). A bar above zero means the measurement rises with that component, and a bar below zero means it falls.',
  /* Unsupervised */
  'u-a': 'Each dot is one sandstone sample, placed by its first three principal components. The colors are the groups k-means found, and the × marks are the group centers.',
  'u-b': 'The same samples, colored by the range the sand really came from once the switch is on. The gray dots are the 15 mystery samples that fit none of the four ranges.',
  'u-e': 'Each point is one choice of k. A lower point means the samples are closer to their group centers, and the red point is the k in use.',
  /* Semi-supervised */
  'sm2-a': 'Each dot is one basin sandstone, placed by its first three principal components. The big outlined dots are the field samples, and each color is a range. Red rings mark wrong labels.',
  'sm2-b': 'The same samples and field samples. Now the labels have spread from neighbor to neighbor through the basin samples. Red rings mark wrong labels.',
  /* Supervised */
  'su-t': 'The rulebook the computer wrote. A sample answers each yes or no question and goes left for yes and right for no, until it reaches a colored box that names a range. The small number is how many field samples ended there.',
  'su-a': 'Each dot is one basin sandstone, colored by the range the tree gives it. The big dots are the field samples the tree learned from, and red rings mark wrong answers.',
  'su-b': 'Each dot is one basin sandstone, colored by the range the forest gives it. The big dots are the field samples, and red rings mark wrong answers. Clicking a dot shows how the trees voted.',
  'su-v': 'Each bar counts how many trees voted for that range, for the sample we clicked.',
  'su-c': 'Each dot is one field trip, which is a fresh random set of field samples scored on the basin. Gray dots are a single tree and red dots are a forest, and the lines join the averages. The dashed line marks the number of field samples we have set.',
  'su-e': 'The forest\'s answer for every basin sample. The big dots are the field samples. When the switch is on, rings mark the 15 mystery samples.',
  'su-g': 'The true source of every basin sample. When the switch is on, rings mark the 15 mystery samples.',
  /* Neural networks */
  'nn1-a': 'Each dot is one depth in a well, placed by its gamma ray. Siltstone is in the top row and the other rocks are in the bottom row. The shaded window is the part we call siltstone.',
  'nn1-b': 'The same dots. The red curve is the network\'s probability that a sample is siltstone, from 0 at the bottom to 1 at the top.',
  'n-a': 'The shading is what the network predicts at every point on the map. The dots are the samples, red where the rock holds copper-bearing minerals and gray where it does not. Filled dots are training samples and hollow dots are test samples.',
  'n-b': 'Each point on the curve is the loss, how far off the answers are, after one pass through the data (an epoch). Lower is better.',
  'n-t': 'One small map for each first-layer neuron. Red is where that neuron switches on, and the lighter areas are where it stays off.',
  'n-d': 'Circles are neurons and lines are the weights between them. Red lines are positive weights and gray lines are negative, and thicker lines are bigger. The output circles show the probability for the point under the cursor.',
  /* CNN */
  'c-in': 'The height above the ground in every 1 m cell, from the LiDAR scan. Darker green is taller. The flat-topped blocks are roofs.',
  'c-ir': 'The average number of returns per laser pulse in every cell. Darker purple means more returns, which is common in tree crowns.',
  'c-fh': 'The first filter takes the typical height in a small window, so this is a smoothed copy of the heights.',
  'c-fr': 'The second filter takes the average number of returns in the same window.',
  'c-pr': 'The land cover that our four thresholds give for every cell. The colors are the same as in the key below.',
  'c-tr': 'The true land cover, with the same colors.',
  'c-cf': 'Each row is a true land cover, and each column is what the network called it. The diagonal holds the right answers.',
  /* Segment Anything */
  'sm-a': 'A made-up thin section. Each polygon is one mineral grain: quartz is light gray, plagioclase is gray with twin stripes, K-feldspar is pink, biotite is brown, amphibole is green and opaque minerals are black. The yellow outline is the mask from our click.',
  'sm-c': 'The masks colored by the mineral name we gave their group. Masks in a group we left unnamed are dark gray.',
  'sm-d': 'Each pair of bars is one mineral. The red bar is our percentage of the thin section, and the gray bar is the true percentage.',
  /* Other fields */
  'sd-a': 'A made-up 200 m well. The four curves are the log readings at every depth. The True column is the rock type at every depth, and the Predicted column is what the computer says. The shaded band is the cored interval, the only part it learns from.',
  'sd-m': 'Each row is a true rock type, and each column is what the computer called it, for the samples outside the core. The diagonal holds the right answers.',
  'ig-b': 'The same samples, colored by what the computer calls them. A dark ring marks a wrong answer.',
  'ig-m2': 'Each row is a true rock type, and each column is what the computer called it. The diagonal holds the right answers.',
  'gc-a': 'Each dot is one stream-sediment sample, placed by its first two principal components.',
  'gc-b': 'Each pair of bars shows how much one element goes into PC1 (red) and PC2 (gray).',
  'p2-a': 'Each dot is one shell, colored by species and placed by its first two principal components.',
  'p2-b': 'Each pair of bars shows how much one measurement goes into PC1 (red) and PC2 (gray).',
  /* Pitfalls */
  't-a': 'Each red dot is one random draw of training samples, scored on the same held-out samples. The gray lines are the lowest and highest scores over 40 draws, and the dark line is the average. The dashed line marks the number of training samples we have set.',
  't-c': 'The accuracy of the same model with each kind of split. The dashed line is chance, 50%.',
  't-d': 'Each dot is one sample, placed by two measurements. Red dots are the rare positives and gray dots are everything else. The black line is where the model switches from answering negative to positive.',
  't-e': 'Accuracy, recall and precision for the same model. The dashed line is the accuracy of always answering negative.',
  /* Homework */
  'hw-h': 'Each bar counts the samples that fall in one range of the column we picked.',
  'hw-pc': 'Each dot is one sample, placed by the two components we picked.',
  'hw-pl': 'Each bar shows how much one column goes into the component. A bar above zero means the column rises with it, and a bar below zero means it falls.',
  'hw-pv': 'Each bar is the share of the total spread that one component holds.',
  'hw-cs': 'Each dot is one sample, colored by the cluster k-means gave it.',
  'hw-ce': 'Each point is one choice of k. A lower point means the samples are closer to their cluster centers.',
  'hw-km': 'Each row is a cluster and each column is one of our columns. Red means the cluster is above the average of all samples, and blue means below.',
  'hw-kb': 'The accuracy of the same model with a random split and with a blocked split.'
};
