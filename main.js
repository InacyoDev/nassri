(function () {
  var WHATSAPP = "557399008600";
  var PADRAO = "Olá! Gostaria de agendar uma avaliação.";
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function ligarWa(a) {
    a.href = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(a.getAttribute("data-wa") || PADRAO);
    a.target = "_blank";
    a.rel = "noopener";
  }
  $$("[data-wa]").forEach(ligarWa);

  /* Menu no celular */
  var topo = $(".topo");
  var btn = $("#menu-btn");
  function setMenu(aberto) {
    topo.classList.toggle("aberto", aberto);
    btn.setAttribute("aria-expanded", aberto ? "true" : "false");
    btn.textContent = aberto ? "Fechar" : "Menu";
  }
  btn.addEventListener("click", function () { setMenu(!topo.classList.contains("aberto")); });
  $$(".menu a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* Abertura: o nome e a dupla se movem em ritmos diferentes com a rolagem e o mouse */
  var abertura = $(".abertura");
  var fixo = $("#wa-fixo");
  var alvoX = 0, atualX = 0, pedido = null;
  /* As variáveis ficam em cada peça, não no pai, para não recalcular a abertura inteira */
  var pecas = $$(".nome-gigante, .nome-letras, .dupla, .pessoa, .abertura-txt, .abertura-local");
  var progresso = document.createElement("span");
  progresso.className = "progresso";
  topo.append(progresso);
  var fotosMedicos = $$(".medico figure img");
  function pintar() {
    pedido = null;
    var y = window.scrollY, vh = window.innerHeight;
    atualX += (alvoX - atualX) * .08;
    if (!reduz) {
      if (y < abertura.offsetHeight) {
        pecas.forEach(function (p) {
          p.style.setProperty("--r", y.toFixed(1));
          p.style.setProperty("--mx", atualX.toFixed(3));
        });
      }
      fotosMedicos.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var t = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        img.style.translate = "0 " + (t * -7).toFixed(2) + "%";
      });
    }
    var total = document.documentElement.scrollHeight - vh;
    progresso.style.transform = "scaleX(" + (total > 0 ? y / total : 0).toFixed(4) + ")";
    if (Math.abs(alvoX - atualX) > .002) pedido = requestAnimationFrame(pintar);
  }
  function pedir() { if (!pedido) pedido = requestAnimationFrame(pintar); }
  function aoRolar() {
    var y = window.scrollY;
    topo.classList.toggle("rolou", y > 40);
    /* O botão fixo sai de cena na abertura e a partir da faixa de agendamento */
    fixo.classList.toggle("oculto", y < abertura.offsetHeight * .7 || $("#contato").getBoundingClientRect().top < window.innerHeight);
    pedir();
  }
  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();
  if (!reduz && window.matchMedia("(hover: hover)").matches) {
    abertura.addEventListener("pointermove", function (e) {
      alvoX = (e.clientX / window.innerWidth - .5) * 2;
      pedir();
    });
    abertura.addEventListener("pointerleave", function () { alvoX = 0; pedir(); });
  }

  /* A abertura espera fontes e fotos, com limite para não prender a página em rede lenta */
  function pronto() { document.documentElement.classList.add("pronto"); }
  var espera = $$(".pessoa").map(function (i) { return i.decode ? i.decode().catch(function () {}) : null; });
  if (document.fonts && document.fonts.load) espera.push(document.fonts.load('400 100px "Bodoni Moda"', "NASSRI").catch(function () {}));
  Promise.all(espera).then(pronto);
  setTimeout(pronto, 2500);

  /* Entrada das seções: fio de ouro, cartões, foto da sala, títulos palavra por palavra e blocos em sequência */
  var secoes = $$(".secao, .contato");
  function partir(el) {
    var n = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function parte(no) {
      if (no.nodeType === 1) { Array.prototype.slice.call(no.childNodes).forEach(parte); return; }
      if (no.nodeType !== 3 || !no.textContent.trim()) return;
      var frag = document.createDocumentFragment();
      no.textContent.split(/(\s+)/).forEach(function (t) {
        if (!t.trim()) { if (t) frag.append(" "); return; }
        var fora = document.createElement("span"), dentro = document.createElement("span");
        fora.className = "pal";
        dentro.className = "pal-in";
        dentro.style.transitionDelay = Math.min(n++ * 45, 450) + "ms";
        dentro.textContent = t;
        fora.append(dentro);
        frag.append(fora);
      });
      no.replaceWith(frag);
    });
  }
  if ("IntersectionObserver" in window && !reduz) {
    var entrada = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) {
        if (!i.isIntersecting) return;
        i.target.classList.add("vista");
        entrada.unobserve(i.target);
      });
    }, { threshold: .12 });
    secoes.forEach(function (s) { entrada.observe(s); });

    var revelar = function (el) {
      el.classList.add("visto");
      /* Depois de entrar, a peça volta às próprias transições */
      setTimeout(function () {
        el.classList.remove("sobe", "visto");
        el.style.transitionDelay = "";
      }, 1600);
    };
    var aparecer = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) {
        if (!i.isIntersecting) return;
        aparecer.unobserve(i.target);
        if (i.target.matches(".titulo, .medico figure")) i.target.classList.add("visto");
        else revelar(i.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });

    $$(".secao-cab h2, .procura h2, .duvidas h2, .contato h2, .medico h3, .artigo-destaque h3, .tema-bloco h2").forEach(function (t) {
      t.classList.add("titulo");
      partir(t);
      aparecer.observe(t);
    });
    $$(".medico figure").forEach(function (f) { aparecer.observe(f); });
    $$(".secao-cab > p, .link-cab, .procura-lead, .celula, .resposta, .servicos li, .medico > p, .medico .botao, .artigo-destaque > p, .credenciais > div, .etapas li, .galeria, .acc-item, .tema-texto > p, .contato-logo, .contato-txt > p, .contato-acoes, .contato-dados, .rodape-grade > *").forEach(function (el) {
      var irmaos = Array.prototype.slice.call(el.parentNode.children);
      el.classList.add("sobe");
      el.style.transitionDelay = Math.min(irmaos.indexOf(el), 6) * 70 + "ms";
      aparecer.observe(el);
    });
  } else {
    secoes.forEach(function (s) { s.classList.add("vista"); });
    $$(".medico figure").forEach(function (f) { f.classList.add("visto"); });
  }

  /* Sem mouse, a foto ganha cor ao passar pelo centro da tela */
  if ("IntersectionObserver" in window && window.matchMedia("(hover: none)").matches) {
    var foco = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) { i.target.classList.toggle("em-foco", i.isIntersecting); });
    }, { rootMargin: "-32% 0px -32% 0px" });
    $$(".cartao, .medico").forEach(function (el) { foco.observe(el); });
  }

  /* Item atual do menu */
  var links = $$(".menu a");
  if ("IntersectionObserver" in window) {
    var atual = new IntersectionObserver(function (itens) {
      itens.forEach(function (i) {
        if (!i.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("atual", a.getAttribute("href") === "#" + i.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (a) {
      var alvo = $(a.getAttribute("href"));
      if (alvo) atual.observe(alvo);
    });
    atual.observe(abertura);
    atual.observe($("#contato"));
  }

  /* Sala 706: a rolagem da página passa as fotos, com uma pequena parada em cada uma */
  var paineis = $("#paineis");
  if (paineis) {
    var sala = $("#clinica");
    var galeria = $("#galeria");
    var figs = $$("figure", paineis);
    var barras = $$(".seg", galeria);
    var quadroG = null;
    var cabe = window.matchMedia("(min-height: 560px)");
    sala.style.setProperty("--n", figs.length);
    var centro = function (f) { return f.offsetLeft + f.offsetWidth / 2; };
    var desenhar = function () {
      quadroG = null;
      var fixa = sala.classList.contains("sala-fixa");
      var meio = galeria.clientWidth / 2, pos, t;
      if (fixa) {
        var r = sala.getBoundingClientRect();
        if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
        t = Math.max(0, Math.min(1, -r.top / (r.height - window.innerHeight)));
        var v = t * (figs.length - 1), i = Math.min(Math.floor(v), figs.length - 2), f = v - i;
        var parada = f * f * (3 - 2 * f);
        pos = centro(figs[i]) + (centro(figs[i + 1]) - centro(figs[i])) * parada;
        paineis.style.transform = "translate3d(" + (meio - pos).toFixed(1) + "px, 0, 0)";
      } else {
        pos = paineis.scrollLeft + meio;
        t = (pos - centro(figs[0])) / (centro(figs[figs.length - 1]) - centro(figs[0]));
        paineis.style.transform = "";
      }
      figs.forEach(function (fig) {
        var d = (centro(fig) - pos) / fig.offsetWidth;
        var a = Math.min(1, Math.abs(d));
        var pv = fig.firstElementChild;
        if (!reduz) {
          pv.style.transform = "scale(" + (1 - .14 * a).toFixed(3) + ")";
          pv.querySelector("img").style.transform = "translateX(" + (Math.max(-1, Math.min(1, d)) * -7).toFixed(2) + "%) scale(1.16)";
        }
        pv.style.opacity = (1 - .6 * a).toFixed(3);
        pv.querySelector("figcaption").style.opacity = Math.max(0, 1 - a * 2.4).toFixed(3);
      });
      barras.forEach(function (b, n) {
        b.style.setProperty("--f", Math.max(0, Math.min(1, t * barras.length - n)).toFixed(3));
      });
    };
    var pedirG = function () { if (!quadroG) quadroG = requestAnimationFrame(desenhar); };
    /* Com movimento reduzido ou tela muito baixa, a galeria desliza por conta própria */
    var montar = function () {
      var fixa = !reduz && cabe.matches;
      sala.classList.toggle("sala-fixa", fixa);
      if (fixa) { paineis.removeAttribute("tabindex"); paineis.scrollLeft = 0; }
      else paineis.setAttribute("tabindex", "0");
      desenhar();
    };
    window.addEventListener("scroll", pedirG, { passive: true });
    paineis.addEventListener("scroll", pedirG, { passive: true });
    window.addEventListener("resize", pedirG);
    if (cabe.addEventListener) cabe.addEventListener("change", montar);
    montar();
    $$("img", paineis).forEach(function (i) { i.loading = "eager"; });
  }

  /* O que traz você à clínica */
  var CASOS = {
    pele: { quem: "Dra. Kelly Nassri", area: "Dermatologia", mais: "melasma.html",
      foto: "jaleco-fundo-preto", pos: "50% 18%", alt: "Dra. Kelly Nassri de blazer branco, com uma lupa e um dermatoscópio",
      txt: "Consulta de avaliação da pele. O plano de cuidado é definido na consulta, de forma individual.",
      msg: "Olá! Gostaria de agendar uma consulta de Dermatologia com a Dra. Kelly." },
    cabelo: { quem: "Dra. Kelly Nassri", area: "Tricologia",
      foto: "espelho", pos: "32% 20%", alt: "Dra. Kelly Nassri com os cabelos longos refletidos em uma superfície espelhada",
      txt: "Avaliação de cabelo e couro cabeludo, incluindo a queda de cabelo.",
      msg: "Olá! Gostaria de agendar uma avaliação de Tricologia com a Dra. Kelly." },
    estetica: { quem: "A equipe orienta", area: "Estética Especializada",
      foto: "procedimento-equipamento", pos: "62% 60%", alt: "Procedimento estético com equipamento aplicado na região do rosto e pescoço",
      txt: "Procedimentos estéticos são indicados após avaliação com um dos médicos. Ultraformer III e Skinbooster são definidos em consulta com a Dra. Kelly.",
      msg: "Olá! Gostaria de saber mais sobre os procedimentos estéticos da clínica." },
    cirurgia: { quem: "Dr. Victor Nassri", area: "Cirurgia Plástica",
      foto: "cirurgia", pos: "60% 15%", alt: "Dr. Victor Nassri paramentado, com lupa cirúrgica, em procedimento",
      txt: "Avaliação do seu caso e explicação das opções, antes de qualquer decisão.",
      msg: "Olá! Gostaria de agendar uma avaliação de Cirurgia Plástica com o Dr. Victor." },
    nao: { quem: "A equipe orienta", area: "Os dois médicos",
      foto: "dr-victor-dra-kelly", pos: "50% 22%", alt: "Dra. Kelly e Dr. Victor Nassri lado a lado, diante da parede de mármore com o monograma da clínica",
      txt: "Conte pelo WhatsApp o que você procura e a equipe da clínica indica com quem agendar.",
      msg: "Olá! Gostaria de agendar uma avaliação, mas ainda não sei com qual médico." }
  };
  var resp = $("#resposta");
  function par(cls, txt) { var p = document.createElement("p"); p.className = cls; p.textContent = txt; return p; }
  function mostrar(c) {
    resp.innerHTML = "";
    var foto = document.createElement("div");
    foto.className = "resposta-foto";
    var img = new Image();
    img.src = "img/web/" + c.foto + ".webp";
    img.alt = c.alt;
    img.style.objectPosition = c.pos;
    foto.append(img);
    var corpo = document.createElement("div");
    corpo.className = "resposta-corpo";
    var a = document.createElement("a");
    a.className = "botao botao-cheio";
    a.textContent = "Enviar pelo WhatsApp";
    a.setAttribute("data-wa", c.msg);
    ligarWa(a);
    var acoes = document.createElement("div");
    acoes.className = "resposta-acoes";
    acoes.append(a);
    if (c.mais) {
      var l = document.createElement("a");
      l.className = "link-simples";
      l.href = c.mais;
      l.textContent = "Entender o melasma";
      acoes.append(l);
    }
    corpo.append(par("resposta-nome", c.quem), par("resposta-area", c.area), par("resposta-txt", c.txt), par("resposta-rotulo", "Sua mensagem"), par("resposta-msg", c.msg), acoes);
    resp.append(foto, corpo);
  }
  if (resp) {
    mostrar(CASOS.pele);
    Object.keys(CASOS).forEach(function (k) { new Image().src = "img/web/" + CASOS[k].foto + ".webp"; });
  }
  $$(".celula").forEach(function (b) {
    b.addEventListener("click", function () {
      var c = CASOS[b.getAttribute("data-k")];
      $$(".celula").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      mostrar(c);
      fixo.setAttribute("data-wa", c.msg);
      ligarWa(fixo);
      /* No celular a resposta fica abaixo da lista: leva o paciente até ela */
      if (window.innerWidth <= 900) resp.scrollIntoView({ behavior: reduz ? "auto" : "smooth", block: "center" });
    });
  });

  /* Dúvidas */
  $$(".acc-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var item = b.closest(".acc-item");
      var abre = !item.classList.contains("open");
      $$(".acc-item.open").forEach(function (o) {
        o.classList.remove("open");
        $(".acc-btn", o).setAttribute("aria-expanded", "false");
      });
      if (abre) { item.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
    });
  });
})();
