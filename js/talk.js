/* talk.js - content around each activity: the talk band (what the instructor covers), the hook that
   opens the try-it band, the steps, and a short check-yourself quiz. Written in first person plural. */
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
    <div class="mlgroup gs"><h5>Supervised<small>the answers are known for some samples</small></h5><div class="mcards">
      ${card('classification', 'Classification', 'Sort samples into categories we already have names for.', 'Lithology from logs, fault or no fault, facies from attributes.', 'k-nearest neighbors, logistic regression, decision trees, support vector machines')}
      ${card('regression', 'Regression', 'Predict a number from other numbers.', 'Porosity from density, permeability estimates, velocity from depth.', 'Linear and polynomial regression')}
    </div></div>
    <div class="mlgroup gu"><h5>Unsupervised<small>no answers, only the measurements</small></h5><div class="mcards">
      ${card('clustering', 'Clustering', 'Find groups that nobody named yet.', 'Seismic facies, geochemical populations.', 'k-means, self-organizing maps, DBSCAN')}
      ${card('dimension', 'Dimension reduction', 'Fewer axes, same story.', 'Many logs or attributes shown on one page.', 'PCA, ICA, t-SNE')}
      ${card('anomaly', 'Anomaly detection', 'Spot the sample that fits none of the groups.', 'Geochemical anomalies, unusual well behavior.', 'Distance to clusters, isolation forests')}
    </div></div>
    <div class="mlgroup gr"><h5>Reinforcement<small>learn by trial, reward, and error</small></h5><div class="mcards">
      ${card('reinforcement', 'Reinforcement learning', 'An agent tries actions in an environment and keeps the ones that earn reward.', 'Steering wells in a simulator, planning inspection routes.', 'Q-learning, deep Q-networks')}
    </div></div>
    <div class="mlgroup ge"><h5>Ensembles<small>a lot of simple models</small></h5><div class="mcards">
      ${card('ensemble', 'Ensembles', 'Many small models vote, and the vote usually beats any one of them.', 'Facies prediction, prospectivity maps.', 'Random forest, gradient boosting')}
    </div></div>
    <div class="mlgroup gn"><h5>Neural networks<small>layers that learn their own features</small></h5><div class="mcards">
      ${card('network', 'Deep learning', 'Layers of neurons learn what to look for.', 'Fault picking on seismic (convolutional), language models (transformers).', 'Convolutional networks, transformers')}
    </div></div>
  </div>
  <p class="hint">Click a card to open it. The outline follows Vas3k's <a href="https://vas3k.com/blog/machine_learning/" target="_blank" rel="noopener">Machine Learning for Everyone</a>, and it is a really nice read for anyone who wants more.</p>`;

  const pair = (a, b) => `<div class="pc">
      <div class="pc-col good"><h5>${a.h}</h5><ul>${a.l.map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="pc-col bad"><h5>${b.h}</h5><ul>${b.l.map(x => `<li>${x}</li>`).join('')}</ul></div>
    </div>`;

  g.TALK = {
    vocab: {
      mins: [1, 1],
      html: `<div class="split">
          <svg id="v-rings" viewBox="0 0 400 400" role="group" aria-label="Nested circles: AI, machine learning, deep learning, LLM"></svg>
          <div id="v-info" class="info" aria-live="polite"></div>
        </div>
        <p class="hint">Click the rings from the outside in.</p>`
    },
    types: { mins: [2, 1], html: mlmap },
    fit: {
      mins: [1, 1],
      html: pair(
        { h: 'Often a good fit', l: ['A lot of examples, and some of them with known answers', 'Patterns that are hard to write down as rules', 'The same kind of measurement over and over, like logs, traces, images and samples'] },
        { h: 'Often a poor fit', l: ['A handful of samples', 'The physics already gives us the answer', 'Predictions well outside the range of the training data', 'No independent way to check the result'] })
    },
    pca: {
      mins: [2, 1],
      cards: [
        { h: 'Lots of variables', t: 'Four log curves make every sample a point in four dimensions. We can\'t plot that, but we can still measure it.' },
        { h: 'Directions of spread', t: 'PCA finds the direction with the most variance, and then the next direction at right angles to it.' },
        { h: 'Keeping fewer components', t: 'Two components often hold most of the variance, so the samples fit on a page and we can really look at them.' },
        { h: 'Reading a component', t: 'Each component is a weighted mix of the original variables, and the loadings show us the mix. What the mix means in the rocks comes afterward, when we compare with what we know.' }
      ]
    },
    unsup: {
      mins: [1, 1], html: learnStrip('un'),
      cards: [
        { h: 'No labels', t: 'The method only sees the measurements.' },
        { h: 'k-means', t: 'We place k centers, every sample joins its nearest one, each center moves to the middle of its samples, and we repeat until nothing changes.' },
        { h: 'Choosing k', t: 'The bend in the total-distance curve is one guide, and what we know about the geology is another.' },
        { h: 'Self-organizing maps', t: 'A grid of neurons that gets used a lot for seismic facies. We will see one at work in the geophysics tab.' }
      ]
    },
    sup: {
      mins: [2, 2], html: learnStrip('sup'),
      cards: [
        { h: 'Known labels', t: 'Some samples come with an answer, like a lithology from core.' },
        { h: 'The model is a boundary', t: 'Training decides where the boundary between the classes goes.' },
        { h: 'Training and test data', t: 'We keep some samples out of the fitting and use them only to check the predictions.' },
        { h: 'Overfitting', t: 'A model can follow the training samples very closely and then predict new samples worse.' }
      ]
    },
    semi: {
      mins: [1, 1], html: learnStrip('semi'),
      cards: [
        { h: 'Few labels, many samples', t: 'A cored interval is short, and the logs run the whole well.' },
        { h: 'Label propagation', t: 'Each sample links to its nearest neighbors, and the labels spread along the links.' },
        { h: 'When it helps', t: 'Most when labels are scarce and the classes form separate clusters.' }
      ]
    },
    nn: {
      mins: [1, 1],
      cards: [
        { h: 'Layers of neurons', t: 'Each neuron takes a weighted sum of its inputs and passes it through a nonlinear function.' },
        { h: 'Training', t: 'We adjust the weights to make the loss smaller, one epoch at a time.' },
        { h: 'Hidden layers', t: 'More neurons and more layers let the boundary bend, so it can wrap around a ring.' },
        { h: 'Deep learning', t: 'Networks with many layers. Convolutional networks pick faults on seismic sections, and that is a really fun application.' }
      ]
    },
    cnn: {
      mins: [1, 2],
      html: `<div class="tcards">
          <div class="tc"><h5>A filter slides over the image</h5><p>A small grid of weights moves across the picture and marks where it finds a match. The result is a feature map.</p></div>
          <div class="tc"><h5>Layers build up</h5><p>Early layers respond to edges and spots, later layers to arrangements of them, and the last layers to whole objects.</p></div>
          <div class="tc"><h5>Training picks the filters</h5><p>In a real network the weights are learned. Here we set two filters by hand so we can see exactly what they do.</p></div>
          <div class="tc"><h5>Muffin or chihuahua?</h5><p>Two dark eyes and a nose look a lot like blueberries. The meme by @teenybiscuit made that point, and the <a href="https://www.bbc.com/bbcthree/article/2fa66196-ab28-4610-b494-88607becf5ee" target="_blank" rel="noopener">BBC Three article</a> tells the story.</p></div>
        </div>
        <figure class="meme"><img src="img/muffin-or-chihuahua.png" alt="A grid of sixteen photos: chihuahua faces and blueberry muffins that look alike" onerror="this.parentNode.remove()"><figcaption>Credit: @teenybiscuit. Shown for teaching.</figcaption></figure>`
    },
    sam: {
      mins: [1, 2],
      html: `<div class="tcards">
          <div class="tc"><h5>Prompts in, masks out</h5><p>We click a point or draw a box, and the model returns an outline of the thing under it. That outline is a mask.</p></div>
          <div class="tc"><h5>Three answers per click</h5><p>One click can mean a part, a whole object, or a group, so the model offers several masks and we pick.</p></div>
          <div class="tc"><h5>Segment everything</h5><p>A grid of clicks gives masks for the whole image, which is handy for counting grains.</p></div>
          <div class="tc"><h5>No names</h5><p>The masks carry no mineral names. Naming comes from a second step, like grouping colors and textures, or from us.</p></div>
        </div>
        <p class="hint">This page uses a synthetic thin section and a simple region-growing stand-in that behaves like the real model in these ways. The real Segment Anything Model comes from Meta AI: <a href="https://segment-anything.com/" target="_blank" rel="noopener">segment-anything.com</a> and <a href="https://github.com/facebookresearch/segment-anything" target="_blank" rel="noopener">the code on GitHub</a>. On real thin sections, the modal percentages still need a check against a point count.</p>`
    },
    llm: {
      mins: [2, 2],
      html: pair(
        { h: 'Strengths in research', l: ['Drafting and debugging code for reading files and making plots', 'Plain-language explanations of a method we haven\'t met yet', 'Rewording, translation and editing', 'Suggesting methods for us to look up'] },
        { h: 'Limits in research', l: ['References and numbers that read correctly and may not exist', 'No knowledge of anything after the training cutoff', 'Anything we type is sent to the provider, unpublished data included', 'The same prompt can give different text, and the models change over time'] })
    },
    geo: {
      mins: [2, 4],
      html: `<ol class="flow"><li>Seismic section</li><li>Attributes</li><li>Self-organizing map</li><li>Facies map</li><li>Wells</li></ol>
             <p class="hint">A synthetic channel system with three facies: floodplain shale, channel sand, and levee. I like to show this example because we know the answer, so we can see exactly where each step helps.</p>`
    },
    tracks: {
      mins: [1, 2],
      cards: [
        { h: 'Sedimentology', t: 'Facies from logs. Which curves we use and where the core is cut change the answer.' },
        { h: 'Geochemistry', t: 'PCA on concentrations depends on how the data are scaled and transformed.' },
        { h: 'Critical minerals', t: 'A few known deposits among a lot of barren cells.' },
        { h: 'Paleontology', t: 'Size and shape can land on different axes.' }
      ]
    },
    hw: {
      mins: [0, 0], pills: ['for after class', 'about 30 min'],
      cards: [
        { h: 'Bring a table', t: 'Any .csv or Excel file with columns of numbers works: logs, geochemistry, counts, measurements. A label column, like a lithology or a yes/no, unlocks the prediction step.' },
        { h: 'The same workflow', t: 'We look at the columns, run PCA, group with k-means, and check a nearest-neighbor classifier, the same steps we used in class.' },
        { h: 'Your data stay put', t: 'The file is read inside your browser and goes nowhere. A few sample tables are here if you want to practice first.' },
        { h: 'Want seismic?', t: 'Try <a href="https://hbedle-subsurface.github.io/analyze-2d/" target="_blank" rel="noopener">Analyze 2D</a>, where you load a 2D seismic line and run attributes, a SOM and SHAP, or the guided exercise in <a href="https://hbedle-subsurface.github.io/scan-lecture/" target="_blank" rel="noopener">scan-lecture</a>.' }
      ]
    },
    traps: {
      mins: [1, 2],
      cards: [
        { h: 'Small samples', t: 'A test score from a few samples can land almost anywhere.' },
        { h: 'Neighbors resemble each other', t: 'A random split of spatial data puts near-copies of each test sample in the training set.' },
        { h: 'Rare targets', t: 'When positives are rare, accuracy can stay high while the target is missed.' }
      ]
    }
  };

  /* ---------- the hook that opens each try-it band, and the steps ---------- */
  g.TRY = {
    vocab: { hook: 'An expert wrote that rule for a different basin. Can a rule that learns from our own samples do better?', steps: ['Slide the training samples from 2 up to 100 and watch the red line.', 'Find the number of samples where the learned threshold stops moving much.', 'Compare its accuracy with the expert rule.'] },
    types: { hook: 'Half the battle is knowing what kind of problem we have. Let\'s see how many of these we can name.', steps: ['Slide the curviness from 1 to 10 and watch the line follow the filled dots.', 'Keep an eye on the hollow test dots and the two error numbers.', 'Answer the six questions below.'] },
    fit: { hook: 'Before we reach for a method, we ask whether machine learning fits the problem at all. Sort these six.', steps: ['Read each situation and pick Good fit, Depends or Poor fit.', 'Finish all six and read the score.'] },
    pca: { hook: 'Four log curves and one page. How much of the story can two axes keep?', steps: ['Turn the cloud, then slide Flatten to bring it down onto PC1 and PC2.', 'Turn on the lithology colors and see where the rocks land.', 'If you have time, use the angle slider to find the direction with the most variance, and then step through the components kept.'] },
    unsup: { hook: 'No labels at all. Can we still find the rocks, and how many groups should we ask for?', steps: ['Press Watch it run and follow the centers.', 'Raise k one step at a time and find the bend in the curve.', 'Press New start a few times at k = 4 and see whether the groups change.', 'Turn on the lithology check and compare the groups with the rocks.'] },
    sup: { hook: 'Now we have the answers for some samples. How closely should the model follow them?', steps: ['Move the angle and offset sliders until the line separates sandstone from shale.', 'Press Fit by machine and compare.', 'In the second panel set k to 1 and read the training and test accuracy.', 'Raise k and follow the two curves.'] },
    semi: { hook: 'Labels are scarce and logs are everywhere. Can a handful of labels go a long way?', steps: ['Start with one label per lithology and compare the two maps.', 'Raise the number of labels one at a time.', 'Press New labels a few times and read the 30-draw average.'] },
    nn: { hook: 'A straight boundary can\'t wrap around a mineralized zone. How many neurons does it take?', steps: ['Choose the ring data, set 0 hidden layers and press Train.', 'Add neurons and layers and train again. Move the cursor over the map and watch the network light up.', 'Compare training and test accuracy after 1000 epochs.'] },
    cnn: { hook: 'Two dark eyes and a nose, or three blueberries? Play first, and then see how a small stack of filters makes the call.', steps: ['Mark each of the eight pictures Muffin or Chihuahua.', 'Slide the resolution down, press New set of eight, and try again.', 'Click a picture and follow it through layer 1 and layer 2.', 'Slide the spot size, eye spacing and threshold and watch the dots for muffins and chihuahuas separate.'] },
    sam: { hook: 'Point counting 300 grains by hand takes a while. Can a click, or a grid of clicks, get us a modal analysis faster?', steps: ['Click a grain and slide the mask size from part to grain to look-alikes.', 'Segment everything and move the color sensitivity. Watch the counts against the real grains.', 'Group the masks, name each group, and compare your modal percentages with the true ones.'] },
    llm: { hook: 'These references all look right. Can we tell which four exist?', steps: ['Mark each of the eight references real or made up. Four are real.', 'If there is time, lower the temperature and press Sample 20 answers, then raise it and sample again.'] },
    geo: { hook: 'Can we go from one seismic line to a facies map, and find out which attributes carried the answer?', steps: ['Press Play the line across the map and follow the channel on the section.', 'Change the window length and compare the four attribute maps.', 'Press Watch the map train and turn on the true facies.', 'Shuffle one attribute and read the refit chart.', 'Add wells and see which facies the first wells never cut.'] },
    tracks: { hook: 'Same tools, different rocks. What changes when the data come from a core, a stream, or a shell?', steps: ['Sedimentology: check only gamma ray, then add curves, and move the start of the core.', 'Geochemistry: try raw, standardized and log10, and color the pegmatite catchments.', 'Prospectivity: raise the known deposits and count the hits in the top 10%.', 'Paleontology: raise the range of growth stages.'] },
    hw: { hook: 'Your own data are the best test. Load a table and see whether the tools from class find something we should go and check.', steps: ['Load your file, or start with one of the sample tables.', 'Tick the numeric columns to use as features, and pick a label column if you have one.', 'Walk through Look, PCA, Clusters and Predict.', 'Open Results, download your summary, and answer the questions.'] },
    traps: { hook: 'A high score is nice. What could make it misleading?', steps: ['Small samples: lower the training samples and read the spread of the dots.', 'Spatial: raise the correlation length and compare the two splits.', 'Rare targets: lower the share of positives, compare accuracy with recall, then weight the classes.'] }
  };

  /* ---------- check yourself: q, opts, a (index of the right option), why ---------- */
  const T6 = ['Classification', 'Regression', 'Clustering', 'Dimension reduction', 'Anomaly detection', 'Reinforcement learning'];
  g.QUIZ = {
    vocab: [
      { q: 'A rule says: call it shale when gamma ray is above 90. Which term fits best?', o: ['Artificial intelligence', 'Machine learning', 'Deep learning', 'A large language model'], a: 0, why: 'A person wrote the rule, so it is AI in the broad sense. Nothing was learned from data.' },
      { q: 'When we raised the number of training samples, what changed?', o: ['The expert rule moved', 'The learned threshold settled near the value that separates the samples best', 'Both stayed put', 'The rule turned into a neural network'], a: 1, why: 'The expert rule is fixed. The learned one is estimated from the samples, so more samples make it steadier.' }
    ],
    types: [
      { q: 'Predict porosity, a number, from bulk density.', o: T6, a: 1, why: 'A number on a continuous axis is regression.' },
      { q: 'Label every seismic sample as fault or not fault, using faults a person already picked.', o: T6, a: 0, why: 'Known categories and known examples make this classification.' },
      { q: 'Group 50,000 stream-sediment samples when no classes exist yet.', o: T6, a: 2, why: 'No labels and no names for the groups. Clustering.' },
      { q: 'Squeeze eight element concentrations onto two axes so we can plot them.', o: T6, a: 3, why: 'Fewer axes that keep the structure is dimension reduction, and PCA is the usual first choice.' },
      { q: 'Flag the one sample that fits none of the known geochemical populations.', o: T6, a: 4, why: 'Finding what does not belong to any group is anomaly detection.' },
      { q: 'Let a simulated drill bit try steering moves, and reward it for staying in the reservoir.', o: T6, a: 5, why: 'An agent, an environment, and a reward make this reinforcement learning.' }
    ],
    pca: [
      { q: 'After we flatten the cloud onto PC1 and PC2, what have we kept?', o: ['All of the variance', 'Most of the variance of the three variables, in two axes', 'Only gamma ray', 'None of the structure'], a: 1, why: 'Two components hold most of the variance here, and the readout says how much.' },
      { q: 'PC1 has similar positive loadings on several logs. What does that tell us?', o: ['PC1 is really just one log', 'PC1 is a mix in which those logs rise and fall together', 'PC1 measures lithology directly', 'PC1 is noise'], a: 1, why: 'The loadings are arithmetic. Calling that mix clay content or lithology is a geological reading we add afterward.' }
    ],
    unsup: [
      { q: 'In k-means, what happens after every sample has joined its nearest center?', o: ['Each center moves to the mean of its samples', 'The lithology labels are added', 'k changes', 'Nothing, and the method stops'], a: 0, why: 'Assign, move, and repeat until no sample changes group.' },
      { q: 'The total distance keeps dropping as k rises. Why is a bigger k not always better?', o: ['Distance cannot drop below k = 3', 'With one group per sample the distance is zero, and the groups say nothing about the rocks', 'k-means fails above 5', 'Bigger k is always better'], a: 1, why: 'So we look for the bend in the curve and check the groups against the geology.' }
    ],
    sup: [
      { q: 'At k = 1 the training accuracy is 100%. What does a lower test accuracy tell us?', o: ['The model will be perfect on new samples', 'The model followed the training samples closely and does worse on new ones', 'The test samples are mislabeled', 'Nothing'], a: 1, why: 'That gap is overfitting.' },
      { q: 'Why do we keep test samples out of the fitting?', o: ['It runs faster', 'They give an honest check on samples the model has not seen', 'The software requires it', 'They have no labels'], a: 1, why: 'A model always looks good on the samples it was fit to.' }
    ],
    semi: [
      { q: 'With one label per lithology, why can label propagation beat the supervised method?', o: ['It uses where the unlabeled samples fall among their neighbors', 'It has more labels', 'It ignores the labels', 'It always wins'], a: 0, why: 'The unlabeled samples show where the clusters are, and the labels spread through them.' },
      { q: 'When would we expect it to struggle?', o: ['When the classes overlap so much that neighbors carry different labels', 'When there are many unlabeled samples', 'When the logs are clean', 'When labels are scarce'], a: 0, why: 'Labels spread along neighbor links, so overlapping classes spread the wrong labels.' }
    ],
    nn: [
      { q: 'With 0 hidden layers, why could training not fit the ring?', o: ['Not enough epochs', 'A network with no hidden layer draws a straight boundary', 'The ring was too small', 'The loss was too low'], a: 1, why: 'A ring needs a boundary that bends, and the bending comes from the hidden neurons.' },
      { q: 'A large network scores higher on training samples than on test samples. What word do we use?', o: ['Overfitting', 'Underfitting', 'Convergence', 'Normalization'], a: 0, why: 'The same idea we saw with k = 1.' }
    ],
    cnn: [
      { q: 'What does a convolutional filter produce as it slides over an image?', o: ['A feature map showing where the pattern matches', 'A smaller copy of the image', 'A class label', 'The training data'], a: 0, why: 'High values mark where the filter found something like its pattern.' },
      { q: 'Why did some muffins get called chihuahuas?', o: ['Their blueberries can line up like two eyes and a nose', 'The threshold was too high', 'Muffins are brown', 'The filters were learned'], a: 0, why: 'The layer 2 filter looks for two spots above a third, and blueberries sometimes make that arrangement by chance.' },
      { q: 'In a trained CNN, who chooses the filter weights?', o: ['We do, by hand', 'Training does, by making the loss smaller', 'The image does', 'They never change'], a: 1, why: 'Here we set them by hand to see what they do. A real network learns them from the labeled pictures.' }
    ],
    sam: [
      { q: 'One click returned three masks of different sizes. Why?', o: ['The click is ambiguous: a part, the whole grain, or a group', 'The model made a mistake', 'The image is too big', 'The masks are for three minerals'], a: 0, why: 'A stripe in plagioclase, the grain, and the grain with similar neighbors are all reasonable answers to one click.' },
      { q: 'After segmenting everything, why do we still need a second step?', o: ['The masks are too small', 'The masks carry no mineral names', 'The masks are always wrong', 'We do not'], a: 1, why: 'Segmentation finds the outlines. Naming the minerals takes color, texture, or our own judgment.' },
      { q: 'Your modal percentages differ from the true ones. Which is a likely cause?', o: ['A mask that swallowed grains of two minerals', 'The image has too many pixels', 'The legend is wrong', 'Quartz is not a mineral'], a: 0, why: 'A mixed mask gets a single name, so part of the section is counted as the wrong mineral.' }
    ],
    llm: [
      { q: 'A model gives a full citation with journal, volume and page numbers. What does that tell us about whether the paper exists?', o: ['It exists', 'It does not exist', 'Nothing on its own, so we look it up', 'It exists if it is recent'], a: 2, why: 'A citation can look complete and still be made up. We check the journal or a database.' },
      { q: 'Which use needs the least worry?', o: ['An age for a stratigraphic boundary', 'A reference list for a paper', 'A plotting script that we then test on a case with a known answer', 'A summary of a paper we have not read'], a: 2, why: 'We can run and test a script. The other three need a source check.' }
    ],
    geo: [
      { q: 'Why did mean frequency help separate the channel from the levee?', o: ['In this model the channel sand attenuates the wavelet, so its frequency is lower', 'Frequency always separates channels', 'The levee is thicker', 'It did not help'], a: 0, why: 'We built that into the synthetic data. With real data we would check whether the same tie holds.' },
      { q: 'With six wells, the supervised map had no channel. Why?', o: ['The noise was too high', 'No well had cut the channel, so the classifier had never seen it', 'k was too small', 'The SOM was too big'], a: 1, why: 'A supervised method can only predict the classes in its wells.' }
    ],
    tracks: [
      { q: 'Gamma ray alone confuses which two lithologies?', o: ['Sandstone and limestone, which both read low', 'Shale and sandstone', 'Shale and limestone', 'None of them'], a: 0, why: 'Density or sonic separates them.' },
      { q: 'Why did PCA on raw ppm pick potassium?', o: ['Potassium matters most geologically', 'Its numbers are the largest, so it carries most of the variance', 'It marks the pegmatites', 'Chance'], a: 1, why: 'Standardizing or taking logs puts the elements on comparable footing.' }
    ],
    hw: [
      { q: 'The PCA on raw values is led by one column with big numbers. What do we try?', o: ['Delete that column for good', 'Standardize the columns, or take logs first', 'Use fewer rows', 'Nothing, PC1 is always right'], a: 1, why: 'PCA follows variance, and big numbers carry a lot of variance. Standardizing or logging puts the columns on comparable footing.' },
      { q: 'Random-split accuracy is 95% and blocked-split accuracy is 60%. What does that suggest?', o: ['The model is excellent everywhere', 'Nearby samples resemble each other, so the model may not carry to a new area', 'The blocked split has a bug', 'We need a bigger k'], a: 1, why: 'The random split lets near-copies of each test sample into the training set. The blocked split is closer to predicting somewhere new.' }
    ],
    traps: [
      { q: 'The random split scores far higher than the blocked split. Why?', o: ['Neighbors in the training set look like the test samples', 'The blocked split has more data', 'Random splits are unbiased', 'The model changed'], a: 0, why: 'Nearby locations have similar values, so a random split leaks information about the test samples.' },
      { q: 'Accuracy is 98% and only 2% of the samples are positive. What else should we ask for?', o: ['Nothing, 98% is high', 'Recall, the fraction of the positives we find', 'A bigger k', 'More neurons'], a: 1, why: 'A model that says negative every time also scores 98%.' }
    ]
  };

  g.learnStrip = learnStrip;
})(window);
