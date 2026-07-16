const fs = require('fs');
const TextToSVG = require('text-to-svg');
const https = require('https');

const fontUrl = 'https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf';
const fontPath = './BebasNeue.ttf';

https.get(fontUrl, (res) => {
  if (res.statusCode === 302 || res.statusCode === 301) {
    https.get(res.headers.location, (res2) => {
        const file = fs.createWriteStream(fontPath);
        res2.pipe(file);
        file.on('finish', () => {
            file.close();
            generate();
        });
    });
  } else {
    const file = fs.createWriteStream(fontPath);
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        generate();
    });
  }
}).on('error', (err) => {
  console.error(err);
});

function generate() {
    TextToSVG.load(fontPath, (err, textToSVG) => {
      if (err) {
        console.error(err);
        return;
      }
      
      const options = { x: 0, y: 0, fontSize: 120, anchor: 'top', attributes: { fill: 'none', stroke: 'currentColor', 'stroke-width': '2' } };
      
      let svg = textToSVG.getSVG('RANGMANCH', options);
      
      svg = svg.replace(/<path/g, '<path class="line"');
      
      fs.writeFileSync('./rangmanch-svg.txt', svg);
      console.log('SVG generated in rangmanch-svg.txt');
    });
}
