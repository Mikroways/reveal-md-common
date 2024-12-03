function snakeToCamel(str) {
    return str.toLowerCase().replace(/([-_][a-z])/g, group =>
          group
            .toUpperCase()
            .replace('-', '')
            .replace('_', '')
        );
}

function setAsciinema(event) {
    const asciinemas = document.getElementsByTagName("asciinema");
    for (let i=0; i < asciinemas.length; i++) {
          let opts = {}
          let attrs = asciinemas[i].getAttributeNames().filter(
                  (n) => n.startsWith("opts-") );
          for (let o=0; o < attrs.length; o++) {
                  opts[snakeToCamel(attrs[o].replace(/^opts-/,''))] =
                        asciinemas[i].getAttribute(attrs[o]);
                }
          asciinemas[i].playerObject = AsciinemaPlayer.create(
                  asciinemas[i].getAttribute("cast"),
                  asciinemas[i],
                  opts
                );
        }
};

function playAscinema(event) {
    const asciinemas = event.currentSlide.getElementsByTagName("asciinema");
    for (let i=0; i < asciinemas.length; i++) {
          if (asciinemas[i].playerObject) {
                    asciinemas[i].playerObject.seek(0);
                    asciinemas[i].playerObject.play();
                }
        }
};


Reveal.on('ready', setAsciinema);
Reveal.on('slidechanged', playAscinema);

if (Object.hasOwn(options, 'audio')) {
  if ( Object.hasOwn(options.audio, 'enabled') && options.audio.enabled )
    options.plugins.push(RevealAudioSlideshow);
}
options.plugins.push(CopyCode);
