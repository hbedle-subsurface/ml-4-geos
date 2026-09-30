/* talk.js - the words around each activity. Written for geology undergraduates who have not used machine
   learning: every term is defined where it first appears, and steps come in the order we need them.
   TALK: intro (one plain sentence), pre (html before the steps), steps (numbered, each with a drawing),
   html (after the steps). TRY: the sentence that opens Try it Out!, and the steps. QUIZ: check yourself. */
(function (g) {
  const { ML, DATA: D } = g;
  const INK = '#16191C', RED = '#841617', SL = '#5C6670', GR = '#C9CDD2';

  /* ---------- three small pictures of labeled and unlabeled samples ---------- */
  function learnStrip(active) {
    const r = ML.rng(6), cen = [[34, 34], [96, 28], [66, 78]], pts = [];
    cen.forEach((c, k) => { for (let i = 0; i < 16; i++) pts.push([c[0] + 15 * ML.gauss(r), c[1] + 11 * ML.gauss(r), k]); });
    const draw = kind => pts.map((p, i) => {
      const lab = kind === 'sup' || (kind === 'semi' && [3, 20, 37].includes(i));
      return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${lab && kind === 'semi' ? 6.5 : 4}" fill="${lab ? D.LCOL[p[2]] : '#B4BAC1'}"${lab && kind === 'semi' ? ' stroke="#16191C" stroke-width="2"' : ''}/>`;
    }).join('');
    const one = (kind, name, cap) => `<figure class="learn${kind === active ? ' on' : ''}"><svg viewBox="0 0 130 108" role="img" aria-label="${name}">${draw(kind)}</svg><figcaption><b>${name}</b><br>${cap}</figcaption></figure>`;
    return `<div class="learn-row">${one('un', 'Unsupervised', 'no labels')}${one('semi', 'Semi-supervised', 'a few labels')}${one('sup', 'Supervised', 'every sample labeled')}</div>`;
  }

  /* ---------- small original drawings for the map of machine learning ---------- */
  const dot = (x, y, c, r) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r || 3.4}" fill="${c}"/>`;
  const icons = {
    classification() {
      const r = ML.rng(2); let s = '';
      for (let i = 0; i < 14; i++) s += dot(30 + 14 * ML.gauss(r), 26 + 11 * ML.gauss(r), D.LCOL[0]) + dot(88 + 14 * ML.gauss(r), 58 + 11 * ML.gauss(r), D.LCOL[1]);
      return s + `<line x1="46" y1="84" x2="78" y2="2" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/>`;
    },
    regression() {
      const r = ML.rng(3); let s = '';
      for (let i = 0; i < 18; i++) { const x = 12 + i * 5.8; s += dot(x, 70 - 0.5 * (x - 12) + 7 * ML.gauss(r), SL, 3); }
      return s + `<line x1="8" y1="72" x2="112" y2="18" stroke="${RED}" stroke-width="3"/>`;
    },
    clustering() {
      const r = ML.rng(4); let s = ''; const C = [[30, 26], [88, 30], [60, 66]], col = ['#3B6FB6', '#E0703C', '#4E9F3D'];
      C.forEach((c, k) => { for (let i = 0; i < 9; i++) s += dot(c[0] + 10 * ML.gauss(r), c[1] + 8 * ML.gauss(r), col[k], 3); s += `<text x="${c[0] - 5}" y="${c[1] + 5}" font-size="16" font-weight="700" fill="${INK}">×</text>`; });
      return s;
    },
    dimension() {
      const r = ML.rng(5); let s = '';
      for (let i = 0; i < 16; i++) { const t = (i - 8) * 3.4; s += dot(24 + t + 3 * ML.gauss(r), 46 - t * 0.55 + 6 * ML.gauss(r), SL, 2.8); }
      return s + `<line x1="6" y1="70" x2="50" y2="14" stroke="${RED}" stroke-width="2.4"/><path d="M62 42 h22" stroke="${INK}" stroke-width="2"/><path d="M84 42 l-6 -4 v8 z" fill="${INK}"/>` +
        Array.from({ length: 14 }, (_, i) => dot(92 + (i - 7) * 2.2 + 0.5 * ML.gauss(r), 42, RED, 2.6)).join('') + `<line x1="90" y1="42" x2="114" y2="42" stroke="${RED}" stroke-width="2"/>`;
    },
    anomaly() {
      const r = ML.rng(6); let s = '';
      for (let i = 0; i < 26; i++) s += dot(50 + 15 * ML.gauss(r), 48 + 11 * ML.gauss(r), '#8A929A', 3);
      return s + `<circle cx="102" cy="16" r="9" fill="none" stroke="${RED}" stroke-width="2.4"/>` + dot(102, 16, RED, 3.8);
    },
    reinforcement() {
      let s = ''; for (let i = 0; i <= 5; i++) s += `<line x1="${10 + i * 20}" y1="8" x2="${10 + i * 20}" y2="72" stroke="${GR}" stroke-width="1.4"/>`;
      for (let j = 0; j <= 4; j++) s += `<line x1="10" y1="${8 + j * 16}" x2="110" y2="${8 + j * 16}" stroke="${GR}" stroke-width="1.4"/>`;
      s += `<rect x="50" y="24" width="20" height="16" fill="${SL}"/><rect x="70" y="56" width="20" height="16" fill="${SL}"/>`;
      s += `<polyline points="20,64 20,48 40,48 40,32 40,16 60,16 80,16 80,32 100,32 100,16" fill="none" stroke="${RED}" stroke-width="2.6" stroke-dasharray="5 4"/>`;
      return s + dot(20, 64, INK, 5) + `<path d="M100 8 l3.4 7 7.6 1 -5.5 5.3 1.4 7.6 -6.9 -3.7 -6.9 3.7 1.4 -7.6 -5.5 -5.3 7.6 -1z" transform="translate(-1 -6) scale(0.8)" fill="#E0B22B" stroke="${INK}" stroke-width="1"/>`;
    },
    ensemble() {
      let s = '';
      [22, 60, 98].forEach((x, k) => {
        s += `<path d="M${x} 14 L${x - 10} 30 M${x} 14 L${x + 10} 30 M${x - 10} 30 L${x - 15} 44 M${x - 10} 30 L${x - 5} 44 M${x + 10} 30 L${x + 5} 44 M${x + 10} 30 L${x + 15} 44" stroke="${SL}" stroke-width="2" fill="none"/>`;
        s += dot(x, 14, INK, 3.4) + [-15, -5, 5, 15].map((d, j) => dot(x + d, 44, [D.LCOL[0], D.LCOL[1], D.LCOL[0], D.LCOL[0]][(j + k) % 4], 3.6)).join('');
        s += `<path d="M${x} 52 L60 68" stroke="${GR}" stroke-width="1.6"/>`;
      });
      return s + `<circle cx="60" cy="72" r="9" fill="${D.LCOL[0]}" stroke="${INK}" stroke-width="2"/>`;
    },
    network() {
      const L = [3, 4, 4, 2], xs = [16, 46, 76, 104]; let s = '';
      const y = (l, i) => 42 + (i - (L[l] - 1) / 2) * 17;
      for (let l = 0; l < 3; l++) for (let i = 0; i < L[l]; i++) for (let j = 0; j < L[l + 1]; j++) s += `<line x1="${xs[l]}" y1="${y(l, i)}" x2="${xs[l + 1]}" y2="${y(l + 1, j)}" stroke="${(i + j) % 3 ? SL : RED}" stroke-opacity="0.45" stroke-width="1.2"/>`;
      for (let l = 0; l < 4; l++) for (let i = 0; i < L[l]; i++) s += `<circle cx="${xs[l]}" cy="${y(l, i)}" r="5.2" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
      return s;
    }
  };
  const card = (key, name, tag, uses, algs) => `<button type="button" class="mcard" aria-expanded="false"><svg viewBox="0 0 120 84" aria-hidden="true">${icons[key]()}</svg><b>${name}</b><span class="mt">${tag}</span><span class="md"><i>In geoscience</i> ${uses}<br><i>Common methods</i> ${algs}</span></button>`;
  const mlmap = `<div class="mlmap">
    <div class="mlgroup gs"><h5>Supervised<small>we know the answer for some samples</small></h5><div class="mcards">
      ${card('classification', 'Classification', 'Put each sample into a category we already have a name for.', 'Calling a log interval sandstone, shale or limestone. Marking seismic samples as fault or not fault.', 'k-nearest neighbors, logistic regression, decision trees')}
      ${card('regression', 'Regression', 'Predict a number from other numbers.', 'Porosity from density. Velocity from depth.', 'Linear and polynomial regression')}
    </div></div>
    <div class="mlgroup gu"><h5>Unsupervised<small>no answers, only measurements</small></h5><div class="mcards">
      ${card('clustering', 'Clustering', 'Find groups of similar samples when nobody has named the groups yet.', 'Seismic facies. Groups of stream-sediment chemistry.', 'k-means, self-organizing maps')}
      ${card('dimension', 'Dimension reduction', 'Squeeze many measurements into two or three new ones that keep most of the pattern, so we can plot them.', 'Eight element concentrations on one plot.', 'PCA')}
      ${card('anomaly', 'Anomaly detection', 'Find the sample that does not fit any group.', 'Odd geochemistry. A well that behaves differently from its neighbors.', 'Distance to the nearest group')}
    </div></div>
    <div class="mlgroup gr"><h5>Reinforcement<small>learn by trying, with rewards and penalties</small></h5><div class="mcards">
      ${card('reinforcement', 'Reinforcement learning', 'A program tries actions, gets a reward or a penalty for each, and keeps what works.', 'Steering a simulated drill bit toward a reservoir.', 'Q-learning')}
    </div></div>
    <div class="mlgroup ge"><h5>Ensembles<small>many small models that vote</small></h5><div class="mcards">
      ${card('ensemble', 'Ensembles', 'Many simple models each give an answer, and the most common answer wins.', 'Facies from logs. Mineral prospectivity maps.', 'Random forest')}
    </div></div>
    <div class="mlgroup gn"><h5>Neural networks<small>layers that learn what to look for</small></h5><div class="mcards">
      ${card('network', 'Deep learning', 'Networks with many layers that learn which patterns matter in images or signals.', 'Picking faults on seismic sections. Reading thin sections.', 'Convolutional networks, transformers')}
    </div></div>
  </div>
  <p class="hint">Click a card to open it. The outline follows Vas3k's <a href="https://vas3k.com/blog/machine_learning/" target="_blank" rel="noopener">Machine Learning for Everyone</a>, a friendly read for anyone who wants more.</p>`;

  const pair = (a, b) => `<div class="pc">
      <div class="pc-col good"><h5>${a.h}</h5><ul>${a.l.map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="pc-col bad"><h5>${b.h}</h5><ul>${b.l.map(x => `<li>${x}</li>`).join('')}</ul></div>
    </div>`;

  g.TALK = {
    start: {
      intro: 'Today we teach a computer to sort rocks. First we set up the problem, then we try two ways of solving it.',
      steps: [
        { art: 'table', h: 'A table of samples', t: 'Every row is a rock sample, and the columns are what we measured: gamma ray, density, sonic slowness. A fourth column, the rock type, is hidden from the computer.' },
        { art: 'bunches', h: 'Similar rocks bunch together', t: 'Plot the measurements and samples of the same rock type tend to land near each other. Grouping means finding those bunches without being told what they are.' },
        { art: 'kmeans', h: 'Method 1: k-means', t: 'We pick a number, k. The computer drops k markers (called centers) into the data. Every sample joins its closest center, then each center moves to the middle of its samples. That repeats until nothing moves.' },
        { art: 'som', h: 'Method 2: self-organizing map', t: 'A SOM spreads a grid of small units (neurons) over the data. Each sample pulls its closest neuron, and the neurons beside it, a little closer. The grid ends up stretched over the data like a net.' },
        { art: 'check', h: 'Checking the answer', t: 'These 300 samples are made up, so we know each rock type and can check the groups. With real data we usually do not have that, so we check against core or wells.' }
      ]
    },
    vocab: {
      intro: 'These four terms get mixed up a lot. Each one is a smaller part of the one before it.',
      pre: `<div class="split">
          <svg id="v-rings" viewBox="0 0 400 400" role="group" aria-label="Nested circles: AI, machine learning, deep learning, LLM"></svg>
          <div id="v-info" class="info" aria-live="polite"></div>
        </div>
        <p class="hint">Click the rings from the outside in. Every LLM is deep learning, every deep-learning model is machine learning, and all of machine learning counts as AI.</p>`
    },
    types: {
      intro: 'One word we need first is label. A label is an answer we already know for a sample, such as a rock type from core. Whether we have labels sorts most of machine learning into a few families.',
      pre: `<div class="lab-demo"><div class="cs"><div class="fig">${'{{labels}}'}</div><h5>With labels</h5><p>Each sample comes with its rock type.</p></div><div class="cs"><div class="fig">${'{{fewdots}}'}</div><h5>Without labels</h5><p>The computer sees only the measurements.</p></div></div>`,
      html: mlmap
    },
    fit: {
      intro: 'Machine learning is not the right tool for every problem. These two lists help us decide before we start.',
      html: pair(
        { h: 'Often a good fit', l: ['Hundreds or thousands of samples, some of them with known answers.', 'A pattern that is hard to write as a rule, like telling facies apart from six log curves.', 'The same kind of measurement repeated many times: logs, seismic traces, photos.'] },
        { h: 'Often a poor fit', l: ['Only a handful of samples.', 'A known equation already gives the answer, like travel time through layers of known velocity.', 'The question is far outside the data we trained on.', 'No independent way to check the result, such as core or a well.'] })
    },
    pca: {
      intro: 'Logs give us several measurements at every depth. PCA is a way to show all of them on one flat plot.',
      steps: [
        { art: 'table', h: 'Many measurements per sample', t: 'Gamma ray, density, sonic and neutron porosity make four measurements. That puts each sample at a point in a four-dimensional space, which we cannot draw.' },
        { art: 'rescale', h: 'Put them on the same scale', t: 'Gamma ray is in API units, density in g/cc, sonic in microseconds per foot. Before we compare spread, we rescale each measurement so its average is zero and its typical spread is one. Otherwise the measurement with the biggest numbers would win.' },
        { art: 'spread', h: 'Find the direction of most spread', t: 'Principal component analysis (PCA) looks for the line through the cloud of points along which the samples spread out the most. That line is the first principal component, PC1. PC2 is the next best direction, at right angles to PC1. We find both by hand first.' },
        { art: 'flatten', h: 'Flatten the cloud', t: 'Plot every sample using only PC1 and PC2. The whole data set now fits on one page, and we keep as much of the spread as two directions allow.' },
        { art: 'loadings', h: 'Read the components', t: 'A component is a mix of the original measurements, and the loadings say how much of each goes into the mix. What that mix means in the rock, such as clay content, is something we work out afterward by comparing with what we know.' }
      ]
    },
    unsup: {
      intro: 'In unsupervised learning the computer gets no labels. This time the samples are sandstones, and the question is where their sand came from.',
      steps: [
        { art: 'provenance', h: 'The scenario', t: 'Long ago, rivers carried sand from four mountain ranges into the Redbud Basin. The Boomer Mountains are granite, the Sooner Range is dark volcanic rock, the Thunder Ridge Mountains are limestone and shale, and the Red Dirt Hills are old iron-stained sandstone. All four ranges are made up for this exercise. Each weathers into sand with its own chemistry.' },
        { art: 'table6', h: 'Six measurements per sample', t: 'We analyzed 375 sandstone samples from the basin for six things: potassium (K₂O), zirconium (Zr), chromium (Cr), nickel (Ni), calcium (CaO) and strontium (Sr). Nobody wrote down which mountains each sample came from, and the rivers mixed sand from more than one range.' },
        { art: 'bunches', h: 'Groups of similar samples', t: 'Sand from the same range has similar chemistry, so those samples land near each other. Finding those bunches is called clustering, and each bunch is a cluster.' },
        { art: 'kmeans', h: 'k-means, one round at a time', t: 'We choose the number of groups, k. The computer drops k centers into the data, joins each sample to its closest center, and moves each center to the middle of its samples. It repeats until no sample changes group. It measures closeness using all six elements at once.' },
        { art: 'elbow', h: 'Choosing k, and the samples that never fit', t: 'More groups always bring the centers closer to the samples, so we look for where the curve flattens. It is not a sharp bend, so the geology has to help decide. Watch for a small group that fits nowhere. A source like that, which nobody has seen, is a bit of a unicorn.' }
      ]
    },
    semi: {
      intro: 'A sandstone analysis is cheap, and a trip into the mountains is not. Suppose the crew can visit each range once and bring back a single sample. That is a few labels and a lot of unlabeled sandstone.',
      pre: '{{strip:semi}}',
      steps: [
        { art: 'fewlabels', h: 'A few labels, lots of samples', t: 'A field sample from the Sooner Range has a known source: that is a label. The 375 basin sandstones still have none. With one label per range we have 4 labeled samples and 375 unlabeled ones.' },
        { art: 'labels', h: 'The closest field sample', t: 'The simplest use of the labels: each basin sample takes the label of the field sample it most resembles. This uses only the 4 labeled samples.' },
        { art: 'spreadlabels', h: 'Labels pass to neighbors', t: 'Semi-supervised learning also uses the unlabeled samples. Each sample connects to its closest neighbors, and the labels travel along the connections. This is called label propagation. A label can reach a sample that no field sample resembles closely, by way of the samples between them.' },
        { art: 'check', h: 'When it helps', t: 'It helps most when labels are scarce and the sources form separate bunches, as they do here.' }
      ]
    },
    sup: {
      intro: 'Now the crew has more time. Each field sample is labeled with its range, and the basin sandstones are the test. A random forest is the supervised method we build here.',
      pre: '{{strip:sup}}',
      steps: [
        { art: 'labels', h: 'Field samples are the training set', t: 'A label is an answer we already know. The labeled field samples are the training set: the computer learns from them. The basin sandstones are the test set, the samples we ask it about afterward.' },
        { art: 'tree', h: 'A decision tree asks yes or no questions', t: 'A tree splits the samples with a series of questions about one measurement at a time, like "Is chromium above 180 ppm?" Each answer sends a sample down a branch until it reaches a leaf, and the leaf gives the label. The computer picks the questions that separate the ranges best.' },
        { art: 'overfit', h: 'One tree can memorize', t: 'A tree that keeps asking questions until every training sample has its own leaf memorizes the field samples, odd ones included. That is overfitting. A different set of field samples grows a different tree, so one tree is jumpy.' },
        { art: 'forest', h: 'A random forest is many trees that vote', t: 'Each tree in a forest learns from a random redraw of the field samples, and at each question it may look at only a random few of the measurements. The trees end up different, and each one votes. The most common answer wins, and that answer is steadier than any single tree.' },
        { art: 'flood', h: 'Only the categories it has seen', t: 'A supervised model can answer only with the labels in its training set. Samples from a source nobody sampled get forced into one of the known categories.' }
      ]
    },
    nn: {
      intro: 'A neural network is a computer program loosely inspired by how brain cells connect. It is built from very simple pieces.',
      steps: [
        { art: 'neuron', h: 'A neuron is a small calculator', t: 'It multiplies each input by a weight, adds up the results, and passes the total through a simple curve. The weights decide how much each input matters.' },
        { art: 'layers', h: 'Neurons come in layers', t: 'The outputs of one layer become the inputs of the next. Layers between the input and the output are called hidden layers.' },
        { art: 'loss', h: 'Training adjusts the weights', t: 'The computer starts with random weights and nudges them over many passes through the data, called epochs. The loss is a number that says how far off the answers are, and training pushes it down.' },
        { art: 'ring', h: 'Why hidden layers matter', t: 'With no hidden layer, a network can only draw a straight boundary. Hidden neurons let the boundary bend, for example around a ring-shaped mineralized zone.' }
      ]
    },
    cnn: {
      intro: 'A convolutional neural network (CNN) is a neural network designed for images. Fault picking on seismic and reading thin sections both use them.',
      steps: [
        { art: 'pixels', h: 'A picture is a grid of numbers', t: 'A pixel is one number, dark or light. The computer works with the numbers, not with what we see.' },
        { art: 'kernel', h: 'A filter slides across the picture', t: 'A filter is a small grid of weights. It slides over the picture and gives a high value wherever the picture matches its pattern. The result is a new picture called a feature map.' },
        { art: 'buildup', h: 'Layers build on each other', t: 'First-layer filters find simple things like edges and dark spots. The next layer looks for arrangements of those, like two spots above a third. Later layers pick out whole objects.' },
        { art: 'magnify', h: 'Muffin or chihuahua?', t: 'Two dark eyes and a nose look a lot like blueberries in a muffin. In a trained network the computer learns the filters. Here we set two by hand so we can see what they do.' }
      ],
      html: `<p class="hint">The famous photo grid is by @teenybiscuit. The <a href="https://www.bbc.com/bbcthree/article/2fa66196-ab28-4610-b494-88607becf5ee" target="_blank" rel="noopener">BBC Three article</a> tells the story.</p>
        <figure class="meme"><img src="img/muffin-or-chihuahua.png" alt="A grid of sixteen photos: chihuahua faces and blueberry muffins that look alike" onerror="this.parentNode.remove()"><figcaption>Credit: @teenybiscuit. Shown for teaching.</figcaption></figure>`
    },
    sam: {
      intro: 'A thin section is a picture full of grains. Before we can count minerals, something has to outline each grain.',
      steps: [
        { art: 'mask', h: 'Segmentation outlines things', t: 'Segmentation splits a picture into regions. The outline of one region is called a mask.' },
        { art: 'three', h: 'A click gives several masks', t: 'The Segment Anything Model (SAM) from Meta AI takes a prompt, such as a click on a grain. A click could mean a stripe inside the grain, the whole grain, or a group of touching grains, so SAM returns several masks and we pick.' },
        { art: 'everything', h: 'Segment everything', t: 'A grid of clicks gives masks for the whole picture, which helps with counting grains.' },
        { art: 'names', h: 'Masks have no names', t: 'SAM does not know which mineral is which. Naming the masks is a second step, done by color and texture or by us.' }
      ],
      html: `<p class="hint">This page uses a synthetic thin section and a simple stand-in that grows a region from each click. It behaves like the real model in the ways shown here, and it is not the real model. The real one is at <a href="https://segment-anything.com/" target="_blank" rel="noopener">segment-anything.com</a> and <a href="https://github.com/facebookresearch/segment-anything" target="_blank" rel="noopener">on GitHub</a>. On real thin sections, the mineral percentages should still be checked against a point count.</p>`
    },
    llm: {
      intro: 'A large language model (LLM) is the kind of program behind chat assistants.',
      steps: [
        { art: 'llm', h: 'It predicts the next word', t: 'An LLM has read a huge amount of text. Given some words, it picks a likely next piece of text (a token), then the next, and so on. It writes what sounds likely. It does not look facts up.' }
      ],
      html: pair(
        { h: 'Where it helps in research', l: ['Writing and fixing short scripts that read files and make plots.', 'Explaining a method we have not met yet, in plain words.', 'Rewording, editing and translating text.', 'Suggesting methods and terms to look up.'] },
        { h: 'Where it can mislead', l: ['It can invent references and numbers that look real.', 'It knows nothing published after its training.', 'What we type goes to the company running it, unpublished data included.', 'The same question can get different answers, and the models change over time.'] })
    },
    geo: {
      intro: 'Here we build a fake channel system, so the right answer is known. The path goes from a seismic line to a map of rock types.',
      steps: [
        { art: 'seismic', h: 'Seismic section', t: 'A seismic line is a picture made from sound waves reflected off rock boundaries. Sand and shale reflect differently.' },
        { art: 'attribute', h: 'Attributes', t: 'An attribute is a number measured from the seismic inside a window, such as how strong the reflections are. Every trace gets its own numbers.' },
        { art: 'facies', h: 'Facies', t: 'A facies is a body of rock with its own character. In this made-up example: floodplain shale, channel sand and levee.' },
        { art: 'som', h: 'Grouping with a SOM', t: 'A self-organizing map groups the traces by their attributes, without being told about facies. Then we check which attributes the groups depended on.' },
        { art: 'wells', h: 'Wells give labels', t: 'A well tells us the facies at one spot. A few wells let a supervised method label the whole map, but only for the facies the wells cut.' }
      ]
    },
    tracks: {
      intro: 'The same tools work on other kinds of rock data. Each tab below uses made-up data shaped like a real problem.',
      steps: [
        { art: 'core', h: 'Sedimentology', t: 'Predict facies from well logs. The curves we use, and where the core was cut, change the answer.' },
        { art: 'elements', h: 'Geochemistry', t: 'PCA on element concentrations depends on how the numbers are scaled first.' },
        { art: 'depmap', h: 'Critical minerals', t: 'A few known deposits are scattered among a lot of empty map cells, and the model still has to rank the cells.' },
        { art: 'shell', h: 'Paleontology', t: 'Shell size and shell shape can end up on different axes.' }
      ]
    },
    traps: {
      intro: 'A high score does not always mean a good model. These three situations give scores that look better than they should.',
      steps: [
        { art: 'fewdots', h: 'Very few samples', t: 'With a small training set, the test score changes a lot from one random draw to the next.' },
        { art: 'neighbors', h: 'Neighbors look alike', t: 'Samples close together on a map have similar values. A random split puts near-copies of each test sample in the training set, so the test is too easy.' },
        { art: 'rare', h: 'A rare target', t: 'If only 2% of the samples are positive, a model that always answers no is 98% accurate and finds nothing.' }
      ]
    },
    hw: {
      intro: 'This last tab is for after class. It runs the same steps on a table of your own.',
      steps: [
        { art: 'file', h: 'Bring a table', t: 'Any .csv or Excel file with columns of numbers works: logs, geochemistry, counts, measurements. A label column, like a rock type or a yes/no, turns on the prediction step.' },
        { art: 'magnify', h: 'Look, then reduce', t: 'First we look at each column, then run PCA to see the main patterns.' },
        { art: 'kmeans', h: 'Group, then predict', t: 'Next we group the samples with k-means, and if there is a label column, we check how well nearest neighbors can predict it.' },
        { art: 'tick', h: 'Your data stay put', t: 'The file is read inside the browser and goes nowhere. Sample tables are provided for practice. For seismic, try <a href="https://hbedle-subsurface.github.io/analyze-2d/" target="_blank" rel="noopener">Analyze 2D</a> or the guided exercise in <a href="https://hbedle-subsurface.github.io/scan-lecture/" target="_blank" rel="noopener">scan-lecture</a>.' }
      ]
    }
  };

  /* ---------- the sentence that opens Try it Out!, and the steps ---------- */
  g.TRY = {
    start: { hook: 'Neither method is told what a sandstone is. Group the same 300 samples both ways, then reveal the true rock types and see how each did.', steps: ['Choose k-means and press Watch it run. Follow the big markers (the centers) as they move.', 'Change the number of groups, k, and watch the colors change.', 'Switch to the self-organizing map and press Watch it run. The grid stretches over the samples.', 'Turn on Reveal the true rock types. Compare the two plots and the scores.', 'Try a 2 by 2 map, then a 6 by 6 map. Then try merging the neurons into groups.'] },
    vocab: { hook: 'An expert wrote a rule for another basin. Move the slider to see whether a rule learned from our own samples does better.', steps: ['Slide the training samples from 2 up to 100 and watch the red line.', 'Find the number of samples where the learned line stops moving much.', 'Compare its accuracy with the expert rule.'] },
    types: { hook: 'Naming the kind of problem comes before choosing a method. Draw a line through the dots, then name six problems.', steps: ['Slide the curviness from 1 to 10 and watch the line follow the filled dots.', 'Watch the hollow test dots and the two error numbers.', 'Answer the six questions below.'] },
    fit: { hook: 'Six situations, three answers each. Decide whether machine learning fits.', steps: ['Read each situation and pick Good fit, Depends or Poor fit.', 'Finish all six and read the score.'] },
    pca: { hook: 'Four log curves have to fit on one page. First we hunt for the direction of most spread by hand, and then the computer does it for us.', steps: ['Step 1: turn the cloud with the two sliders until it looks as wide as possible from left to right. Watch the meter.', 'Press Show the computer\'s answer and compare it with your best.', 'Step 2: find the second direction, at right angles to the first, and check the computer\'s answer.', 'Step 3: slide Flatten and turn on the rock-type colors.', 'Step 4: slide Components kept from 1 to 4 and read the bars.'] },
    unsup: { hook: 'Six measurements are too many to plot, so the clouds show their three main directions (from PCA). Group the samples first, and then reveal which mountains the sand really came from.', steps: ['Press Watch it run and follow the centers.', 'Read the table on the right. A red cell means the group is higher than average in that element, and a blue cell means lower. Which mountain range would each group be?', 'Raise k one step at a time and see where the curve flattens.', 'Try k = 5 and look for a small group that fits nowhere.', 'Turn on Reveal the true source of each sample and compare.'] },
    sup: { hook: 'Now the crew has time for more field samples. Grow a tree, then a forest, and see what too few samples does.', steps: ['Step 1: set 5 field samples per range and slide the tree depth from 1 to 6. Compare the two scores.', 'Step 2: slide the number of trees from 1 to 100 and click a sample to see how the trees voted.', 'Step 3: slide the samples per range from 1 to 30 and watch the dots for the tree and the forest.', 'Step 4: reveal the true sources and look at the ringed mystery samples.'] },
    semi: { hook: 'One field sample per range is all the crew could bring back. See how far four labels go when 375 unlabeled samples help.', steps: ['Start with one field sample per range and compare the two clouds.', 'Raise the number of field samples per range one at a time.', 'Press New field trip a few times and read the 20-trip average.', 'Look at where the red rings cluster: which samples are hard?'] },
    nn: { hook: 'A straight boundary cannot wrap around a mineralized zone. Add neurons until the network can.', steps: ['Choose the ring data, set 0 hidden layers and press Train.', 'Add neurons and layers and train again. Move the cursor over the map and watch the network light up.', 'Compare training and test accuracy after 1000 epochs.'] },
    cnn: { hook: 'Two dark eyes and a nose look a lot like three blueberries. Play first, then watch two hand-made filters make the call.', steps: ['Mark each of the eight pictures Muffin or Chihuahua.', 'Slide the resolution down, press New set of eight, and try again.', 'Click a picture and follow it through layer 1 and layer 2.', 'Slide the spot size, eye spacing and threshold and watch the dots for muffins and chihuahuas separate.'] },
    sam: { hook: 'Counting 300 grains by hand takes a while. See how far a grid of clicks gets us toward the mineral percentages.', steps: ['Click a grain and slide the mask size from part to grain to look-alikes.', 'Segment everything and move the color sensitivity. Compare the mask count with the real grain count.', 'Group the masks, name each group, and compare your mineral percentages with the true ones.'] },
    llm: { hook: 'Eight references, all formatted the same way, and only four exist. Pick out the four that do.', steps: ['Mark each of the eight references real or made up.', 'If there is time, lower the randomness and press Sample 20 answers, then raise it and sample again.'] },
    geo: { hook: 'Start from one seismic line and end with a map of rock types, then find out which attributes carried the answer.', steps: ['Press Play the line across the map and follow the channel on the section.', 'Change the window length and compare the four attribute maps.', 'Press Watch the map train and turn on the true facies.', 'Shuffle one attribute and read the refit chart.', 'Add wells and see which facies the first wells never cut.'] },
    tracks: { hook: 'Same tools, different rocks. See what changes when the data come from a core, a stream, or a shell.', steps: ['Sedimentology: check only gamma ray, then add curves, and move the start of the core.', 'Geochemistry: try raw, standardized and log10, and color the pegmatite catchments.', 'Prospectivity: raise the known deposits and count the hits in the top 10%.', 'Paleontology: raise the range of growth stages.'] },
    traps: { hook: 'Three ways a test score can look better than it should. Move each slider and watch the score.', steps: ['Small samples: lower the training samples and read the spread of the dots.', 'Spatial: raise how far the pattern extends and compare the two splits.', 'Rare targets: lower the share of positives, compare accuracy with recall, then weight the classes.'] },
    hw: { hook: 'Your own data are the best test. Load a table and see what the tools from class find.', steps: ['Load your file, or start with one of the sample tables.', 'Tick the numeric columns to use as features, and pick a label column if you have one.', 'Walk through Look, PCA, Clusters and Predict.', 'Open Results, download your summary, and answer the questions.'] }
  };

  /* ---------- check yourself: q, o (options), a (index of the right one), why ---------- */
  const T6 = ['Classification', 'Regression', 'Clustering', 'Dimension reduction', 'Anomaly detection', 'Reinforcement learning'];
  g.QUIZ = {
    start: [
      { q: 'In k-means, what decides which group a sample belongs to?', o: ['The closest of the k centers', 'A neuron on a grid', 'The rock type from core', 'The sample\'s depth'], a: 0, why: 'Every sample joins its nearest center, and the centers move until nothing changes.' },
      { q: 'What does the self-organizing map add compared with k-means?', o: ['Neighboring neurons on the grid describe similar samples, so we get a map', 'It uses the rock labels', 'It always finds more groups', 'It needs no data'], a: 0, why: 'A sample pulls its closest neuron and that neuron\'s grid neighbors, so the grid folds over the data and keeps similar samples close together.' },
      { q: 'Why can we check both methods against the true rock types here?', o: ['The data are made up, so the answers are known', 'Both methods use the labels', 'Real data always come with labels', 'k-means guesses the labels'], a: 0, why: 'With real data the answer is usually not known, so we compare with wells, core, or geological judgment.' }
    ],
    vocab: [
      { q: 'A rule says: call it shale when gamma ray is above 90. Which term fits best?', o: ['Artificial intelligence', 'Machine learning', 'Deep learning', 'A large language model'], a: 0, why: 'A person wrote the rule, so it counts as AI in the broad sense. Nothing was learned from data.' },
      { q: 'When we raised the number of training samples, what changed?', o: ['The expert rule moved', 'The learned line settled near the value that separates the samples best', 'Both stayed put', 'The rule turned into a neural network'], a: 1, why: 'The expert rule is fixed. The learned one is estimated from the samples, so more samples make it steadier.' }
    ],
    types: [
      { q: 'Predict porosity, a number, from bulk density.', o: T6, a: 1, why: 'A number on a continuous scale is regression.' },
      { q: 'Label every seismic sample as fault or not fault, using faults a person already picked.', o: T6, a: 0, why: 'Known categories and known examples make this classification.' },
      { q: 'Group 50,000 stream-sediment samples when no classes exist yet.', o: T6, a: 2, why: 'No labels and no names for the groups: clustering.' },
      { q: 'Squeeze eight element concentrations onto two axes so we can plot them.', o: T6, a: 3, why: 'Fewer axes that keep the pattern is dimension reduction. PCA is the usual first choice.' },
      { q: 'Flag the one sample that fits none of the known geochemical populations.', o: T6, a: 4, why: 'Finding what does not belong to any group is anomaly detection.' },
      { q: 'Let a simulated drill bit try steering moves, and reward it for staying in the reservoir.', o: T6, a: 5, why: 'A program, a set of actions, and a reward make this reinforcement learning.' }
    ],
    pca: [
      { q: 'Why do we rescale the measurements before running PCA?', o: ['So the measurement with the biggest numbers does not dominate', 'So the samples fit on the screen', 'To remove the outliers', 'PCA does not need it'], a: 0, why: 'PCA follows spread, and a measurement in big units has a big spread. Rescaling puts them on equal terms.' },
      { q: 'After we flatten the cloud onto PC1 and PC2, what have we kept?', o: ['All of the spread', 'Most of the spread of the three measurements, in two axes', 'Only gamma ray', 'None of the pattern'], a: 1, why: 'Two components hold most of the spread here, and the readout says how much.' },
      { q: 'PC1 has similar positive loadings on several logs. What does that tell us?', o: ['PC1 is really just one log', 'PC1 is a mix in which those logs rise and fall together', 'PC1 measures lithology directly', 'PC1 is noise'], a: 1, why: 'The loadings only describe the mix. Calling that mix clay content or lithology is a geological reading we add afterward.' }
    ],
    unsup: [
      { q: 'In k-means, what happens after every sample has joined its closest center?', o: ['Each center moves to the middle of its samples', 'The sources are added', 'k changes', 'The method stops'], a: 0, why: 'Join, move, and repeat until no sample changes group.' },
      { q: 'A group is high in Cr and Ni and low in K₂O and Zr. Which range is the best match?', o: ['Boomer Mountains (granite)', 'Sooner Range (dark volcanic rock)', 'Thunder Ridge Mountains (limestone and shale)', 'Red Dirt Hills (old sandstone)'], a: 1, why: 'Dark volcanic rock is rich in chromium and nickel and poor in potassium and zirconium. Granite is the other way around.' },
      { q: 'At k = 5, a small group appears that matches none of the four ranges. What is a sensible reading?', o: ['A fifth mountain range has been found', 'Something else supplied those samples, and we should investigate before naming a source', 'k-means is broken', 'k = 5 is always better'], a: 1, why: 'More groups always shrink the distances. A small group that fits none of the ranges is a reason to ask questions, not a discovery yet.' }
    ],
    sup: [
      { q: 'A tree scores 100% on the field samples and much lower on the basin samples. What is this called?', o: ['Overfitting', 'Underfitting', 'Convergence', 'Rescaling'], a: 0, why: 'The tree memorized the training samples, odd ones included, and did worse on samples it had not seen.' },
      { q: 'Why does a random forest usually beat a single tree?', o: ['Many different trees vote, so one tree\'s odd mistakes get outvoted', 'It has more field samples', 'It ignores the measurements', 'It grows one very deep tree'], a: 0, why: 'Each tree learns from a random redraw of the samples and a random choice of measurements, so the trees make different mistakes, and the vote cancels many of them.' },
      { q: 'With 1 field sample per range, results change a lot from one field trip to the next. Why?', o: ['Four samples give the computer very little to learn from, so a different four gives a different rulebook', 'The forest broke', 'The basin changed', 'Field trips are random'], a: 0, why: 'A small training set can land almost anywhere, which is why the dots are spread out at the left of the plot.' },
      { q: 'The forest labeled most of the mystery samples as Thunder Ridge. Why?', o: ['It can only answer with the categories it was trained on, and Thunder Ridge was the closest', 'Those samples came from Thunder Ridge', 'The forest was overfitting', 'The forest measured them wrong'], a: 0, why: 'Nobody sampled the source of those samples, so the forest had no category for them.' }
    ],
    semi: [
      { q: 'With one field sample per range, how does label propagation use the 375 unlabeled samples?', o: ['It lets labels travel from sample to neighboring sample', 'It ignores them', 'It labels them by hand', 'It throws away the field samples'], a: 0, why: 'Each sample connects to its closest neighbors, and the labels spread along the connections.' },
      { q: 'When would we expect label propagation to struggle?', o: ['When the sources overlap so much that neighbors carry different labels', 'When there are many unlabeled samples', 'When the chemistry is clean', 'When labels are scarce'], a: 0, why: 'Labels travel along neighbor links, so overlapping sources spread the wrong labels.' }
    ],
    nn: [
      { q: 'With 0 hidden layers, why could training not fit the ring?', o: ['Not enough epochs', 'A network with no hidden layer draws a straight boundary', 'The ring was too small', 'The loss was too low'], a: 1, why: 'A ring needs a boundary that bends, and the bending comes from the hidden neurons.' },
      { q: 'A large network scores higher on training samples than on test samples. What is this called?', o: ['Overfitting', 'Underfitting', 'Convergence', 'Normalization'], a: 0, why: 'The same thing we saw with k = 1.' }
    ],
    cnn: [
      { q: 'What does a filter produce as it slides over an image?', o: ['A feature map showing where the pattern matches', 'A smaller copy of the image', 'A class label', 'The training data'], a: 0, why: 'High values mark where the filter found something like its pattern.' },
      { q: 'Why did some muffins get called chihuahuas?', o: ['Their blueberries can line up like two eyes and a nose', 'The threshold was too high', 'Muffins are brown', 'The filters were learned'], a: 0, why: 'Layer 2 looks for two spots above a third, and blueberries sometimes land in that arrangement by chance.' },
      { q: 'In a trained CNN, who chooses the filter weights?', o: ['We do, by hand', 'Training does, by making the loss smaller', 'The image does', 'They never change'], a: 1, why: 'Here we set them by hand to see what they do. A real network learns them from labeled pictures.' }
    ],
    sam: [
      { q: 'One click returned three masks of different sizes. Why?', o: ['A click is ambiguous: it could mean a part, the whole grain, or a group', 'The model made a mistake', 'The image is too big', 'Each mask is a different mineral'], a: 0, why: 'A stripe in plagioclase, the grain, and the grain with similar neighbors are all reasonable answers to one click.' },
      { q: 'After segmenting everything, why do we still need a second step?', o: ['The masks are too small', 'The masks carry no mineral names', 'The masks are always wrong', 'We do not'], a: 1, why: 'Segmentation finds the outlines. Naming the minerals takes color, texture, or our own judgment.' },
      { q: 'Your mineral percentages differ from the true ones. Which is a likely cause?', o: ['A mask that swallowed grains of two minerals', 'The image has too many pixels', 'The legend is wrong', 'Quartz is not a mineral'], a: 0, why: 'A mixed mask gets a single name, so part of the section is counted as the wrong mineral.' }
    ],
    llm: [
      { q: 'A model gives a full citation with journal, volume and page numbers. What does that tell us about whether the paper exists?', o: ['It exists', 'It does not exist', 'Nothing on its own, so we look it up', 'It exists if it is recent'], a: 2, why: 'A citation can look complete and still be made up. We check the journal or a database.' },
      { q: 'Which use needs the least worry?', o: ['An age for a stratigraphic boundary', 'A reference list for a paper', 'A plotting script that we then test on a case with a known answer', 'A summary of a paper we have not read'], a: 2, why: 'We can run and test a script. The other three need a check against a source.' }
    ],
    geo: [
      { q: 'Why did mean frequency help separate the channel from the levee?', o: ['In this model the channel sand weakens the high frequencies, so its frequency is lower', 'Frequency always separates channels', 'The levee is thicker', 'It did not help'], a: 0, why: 'We built that into the made-up data. With real data we would check whether the same tie holds.' },
      { q: 'With six wells, the supervised map had no channel. Why?', o: ['The noise was too high', 'No well had cut the channel, so the method had never seen it', 'k was too small', 'The SOM was too big'], a: 1, why: 'A supervised method can only predict the classes that its wells contain.' }
    ],
    tracks: [
      { q: 'Gamma ray alone confuses which two lithologies?', o: ['Sandstone and limestone, which both read low', 'Shale and sandstone', 'Shale and limestone', 'None of them'], a: 0, why: 'Density or sonic separates them.' },
      { q: 'Why did PCA on raw ppm pick potassium?', o: ['Potassium matters most geologically', 'Its numbers are the largest, so it carries most of the spread', 'It marks the pegmatites', 'Chance'], a: 1, why: 'Rescaling or taking logs puts the elements on comparable footing.' }
    ],
    traps: [
      { q: 'The random split scores far higher than the blocked split. Why?', o: ['Neighbors in the training set look like the test samples', 'The blocked split has more data', 'Random splits are unbiased', 'The model changed'], a: 0, why: 'Nearby locations have similar values, so a random split leaks information about the test samples.' },
      { q: 'Accuracy is 98% and only 2% of the samples are positive. What else should we ask for?', o: ['Nothing, 98% is high', 'Recall, the fraction of the positives we find', 'A bigger k', 'More neurons'], a: 1, why: 'A model that says negative every time also scores 98%.' }
    ],
    hw: [
      { q: 'The PCA on raw values is led by one column with big numbers. What do we try?', o: ['Delete that column for good', 'Rescale the columns, or take logs first', 'Use fewer rows', 'Nothing, PC1 is always right'], a: 1, why: 'PCA follows spread, and big numbers carry a lot of spread. Rescaling or logging puts the columns on comparable footing.' },
      { q: 'Random-split accuracy is 95% and blocked-split accuracy is 60%. What does that suggest?', o: ['The model is excellent everywhere', 'Nearby samples resemble each other, so the model may not carry to a new area', 'The blocked split has a bug', 'We need a bigger k'], a: 1, why: 'The random split lets near-copies of each test sample into the training set. The blocked split is closer to predicting somewhere new.' }
    ]
  };

  g.learnStrip = learnStrip;
})(window);
