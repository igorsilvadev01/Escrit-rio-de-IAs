/* Ambient choreography only: no task mutations, network requests or AI calls. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FirmaLifeModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const companions = [
    {
      id: 'life-nina',
      name: 'Nina',
      role: 'Designer de experiência',
      department: 'planning',
      color: '#b35cf0',
      skin: '#a96e4b',
      hair: '#231c23',
      hairStyle: 'curly',
      gender: 'female',
      shirtStyle: 'jacket',
      hat: 'none',
    },
    {
      id: 'life-ravi',
      name: 'Ravi',
      role: 'Engenheiro de qualidade',
      department: 'testing',
      color: '#148b99',
      skin: '#875338',
      hair: '#24202b',
      hairStyle: 'short',
      gender: 'male',
      shirtStyle: 'hoodie',
      hat: 'beanie',
    },
    {
      id: 'life-bia',
      name: 'Bia',
      role: 'Desenvolvedora de interfaces',
      department: 'development',
      color: '#e26a91',
      skin: '#e0aa80',
      hair: '#7b342f',
      hairStyle: 'bob',
      gender: 'female',
      shirtStyle: 'stripes',
      hat: 'none',
    },
    {
      id: 'life-caio',
      name: 'Caio',
      role: 'Infraestrutura e operações',
      department: 'development',
      color: '#4365bc',
      skin: '#b68462',
      hair: '#352b26',
      hairStyle: 'short',
      gender: 'male',
      shirtStyle: 'jacket',
      hat: 'cap',
    },
    {
      id: 'life-yara',
      name: 'Yara',
      role: 'Especialista em acessibilidade',
      department: 'testing',
      color: '#bc8535',
      skin: '#633d2d',
      hair: '#201b26',
      hairStyle: 'long',
      gender: 'neutral',
      shirtStyle: 'plain',
      hat: 'bucket',
    },
    {
      id: 'life-miguel',
      name: 'Miguel',
      role: 'Estratégia de produto',
      department: 'publishing',
      color: '#708c55',
      skin: '#edc5a3',
      hair: '#b3a090',
      hairStyle: 'short',
      gender: 'male',
      shirtStyle: 'hoodie',
      hat: 'none',
    },
  ].map((a) => ({ ...a, ambient: true, rest: false, meetingUntil: 0 }));
  const conversations = [
    {
      title: 'Uma interface que acolhe',
      ids: ['life-nina', 2],
      place: 'cafe',
      lines: [
        'Quero que a primeira visita seja simples. O que você acha de começar com uma escolha clara?',
        'Concordo, Nina. Podemos mostrar o personagem antes da entrada para a pessoa reconhecer seu espaço.',
        'E se os controles aparecerem aos poucos, quando forem necessários? Assim não sobrecarregamos a tela.',
        'Boa ideia. Também precisamos testar o tamanho dos textos e o contraste dos botões no celular.',
        'Vou levar essas perguntas para o quadro. A experiência precisa funcionar para quem chega sem conhecer o escritório.',
        'Combinado! Depois podemos observar uma visita completa e ajustar os pontos que causarem dúvida.',
      ],
    },
    {
      title: 'Qualidade antes da entrega',
      ids: ['life-ravi', 3],
      place: 'testing',
      lines: [
        'Theo, podemos revisar juntos os caminhos mais importantes antes de preparar a próxima demonstração?',
        'Vamos, Ravi. Quero conferir a entrada, a personalização e a movimentação por todas as salas.',
        'Eu também incluiria o teclado. Uma pessoa deve conseguir navegar sem depender do mouse.',
        'Faz sentido. Podemos verificar o foco ao abrir e fechar os painéis e ao voltar para o cenário.',
        'Ótimo. Se encontrarmos um problema, registramos o contexto e uma maneira clara de reproduzi-lo.',
        'Assim a correção fica mais objetiva. Depois repetimos o caminho e confirmamos o resultado.',
      ],
    },
    {
      title: 'Acessibilidade faz parte do projeto',
      ids: ['life-bia', 'life-yara'],
      place: 'planning',
      lines: [
        'Yara, quero deixar as interações mais claras. Uma cor sozinha é suficiente para indicar o estado de um botão?',
        'Não. Podemos combinar a cor com texto, ícone e foco visível. Cada sinal ajuda uma pessoa diferente.',
        'E as animações do escritório? Elas dão vida ao ambiente, mas podem incomodar algumas pessoas.',
        'Precisamos respeitar a preferência por menos movimento e manter as conversas disponíveis para leitura.',
        'Vou pensar também no celular: botões maiores e espaço para tocar sem selecionar o vizinho.',
        'Perfeito. Acessibilidade funciona melhor quando acompanha cada decisão, desde o primeiro desenho.',
      ],
    },
    {
      title: 'Dados com contexto',
      ids: ['life-caio', 6],
      place: 'cafe',
      lines: [
        'Maya, um painel cheio de números pode parecer completo, mas qual pergunta ele deveria responder primeiro?',
        'Eu começaria pela decisão que queremos apoiar. Sem contexto, até um gráfico bonito pode confundir.',
        'Então precisamos explicar a origem dos dados e o que cada filtro muda na visualização.',
        'Exatamente. E quando não houver registros, a interface deve explicar isso com tranquilidade.',
        'Também quero evitar números de exemplo que pareçam resultados reais. A demonstração precisa ser transparente.',
        'Concordo. Bons dados ajudam a entender limites, comparar cenários e fazer perguntas melhores.',
      ],
    },
    {
      title: 'Planejar sem perder o foco',
      ids: ['life-miguel', 1],
      place: 'publishing',
      lines: [
        'Atlas, temos muitas ideias para o escritório. Como escolher o que merece atenção primeiro?',
        'Podemos começar pelo que mais dificulta uma visita. O objetivo vem antes da quantidade de funções.',
        'Então a navegação e a clareza das interações entram antes de uma nova sala cheia de botões?',
        'Isso. Podemos dividir cada mudança em uma parte pequena, observar o efeito e decidir o próximo passo.',
        'Gosto desse ritmo. A equipe entende o motivo da escolha e consegue colaborar com mais contexto.',
        'Combinado. Vamos manter as ideias no quadro e transformar as prioridades em etapas compreensíveis.',
      ],
    },
    {
      title: 'Uma pausa também aproxima',
      ids: [5, 'life-nina'],
      place: 'cafe',
      lines: [
        'Nina, aceita uma pausa para o café? Quero ouvir como você costuma encontrar inspiração para uma interface.',
        'Aceito! Gosto de observar situações comuns: uma placa clara, uma fila organizada, uma conversa sem ruído.',
        'É curioso como isso também serve para escrever. Uma boa mensagem ajuda sem exigir esforço para entender.',
        'Exato. O texto faz parte do desenho. Um botão precisa dizer o que vai acontecer depois do clique.',
        'Vou levar essa ideia para as descrições do escritório. Podemos trocar termos técnicos por palavras mais próximas.',
        'E manter os detalhes disponíveis para quem quiser aprofundar. Clareza não precisa eliminar informação.',
      ],
    },
    {
      title: 'Ouvir antes de propor',
      ids: [4, 'life-yara'],
      place: 'planning',
      lines: [
        'Yara, quero preparar uma conversa com visitantes. Como perguntar sem induzir a resposta que esperamos?',
        'Podemos pedir que contem o que estavam tentando fazer, sem sugerir uma solução antes de ouvir.',
        'Em vez de perguntar se gostaram do botão, posso observar se perceberam para onde ele leva.',
        'Isso. E vale lembrar que pessoas diferentes usam dispositivos, ritmos e formas de navegação diferentes.',
        'Vou organizar as observações por contexto, preservando as dúvidas e os limites de cada relato.',
        'Ótimo. Assim a equipe aprende com a experiência das pessoas e evita decidir apenas pela própria preferência.',
      ],
    },
    {
      title: 'Preparar uma publicação tranquila',
      ids: ['life-caio', 'life-ravi'],
      place: 'publishing',
      lines: [
        'Ravi, antes de publicar uma mudança, o que você gostaria de conferir comigo?',
        'Quero saber se os arquivos necessários estão incluídos e se os links levam à versão que acabamos de revisar.',
        'Eu também verificaria a configuração do ambiente para não misturar dados privados com a demonstração.',
        'Boa lembrança. Depois abrimos a página publicada e repetimos um caminho curto como visitantes.',
        'Se surgir algum problema, precisamos identificar a versão e entender como retomar um estado conhecido.',
        'Com esse cuidado, a publicação deixa de ser uma surpresa e vira uma etapa clara do trabalho.',
      ],
    },
  ];
  for (const story of conversations) story.ids = story.ids.map(String);
  function create(W, E) {
    let elapsed = 0,
      reduced = false;
    const history = [],
      seen = new Set();
    const roster = (s) => [
      ...s.agents,
      ...companions.filter((a) => !s.agents.some((x) => x.id === a.id)),
    ];
    const index = (s, a) =>
      Math.max(
        0,
        roster(s).findIndex((x) => x.id === a.id),
      );
    const current = () => ({
      story: conversations[Math.floor(elapsed / 90) % conversations.length],
      phase: elapsed % 90,
      cycle: Math.floor(elapsed / 90),
    });
    function busy(s, a) {
      return s.tasks.some(
        (t) =>
          t.agent === a.id &&
          t.status === 'working' &&
          (t.execution?.kind === 'real' || t.workRunId),
      );
    }
    function home(s, a) {
      if (a.id === 'codex-leader') return W.leaderHome;
      const group = roster(s).filter((x) => E.departmentOf(x) === E.departmentOf(a));
      return W.agentSeat(
        { ...a, department: E.departmentOf(a) },
        Math.max(
          0,
          group.findIndex((x) => x.id === a.id),
        ),
      );
    }
    function nearby(point) {
      if (W.walkable(point.x, point.y)) return point;
      for (let radius = 8; radius <= 64; radius += 8)
        for (const [dx, dy] of [
          [radius, 0],
          [-radius, 0],
          [0, radius],
          [0, -radius],
        ])
          if (W.walkable(point.x + dx, point.y + dy)) return { x: point.x + dx, y: point.y + dy };
      return W.spawn;
    }
    function meeting(story, side) {
      if (story.place === 'cafe')
        return nearby({ x: W.lounge.x + 40 + side * 38, y: W.lounge.y + 70 });
      const room = W.rooms.find((r) => r.id === story.place);
      return nearby({ x: room.x + room.w - 12 - side * 30, y: room.y + room.h - 12 });
    }
    function plan(s, a) {
      const native = E.routine(s, a),
        base = home(s, a),
        i = index(s, a),
        { story, phase } = current();
      if (
        !E.officeOpen(s) ||
        s.assembly?.active ||
        E.presence(s, a.id) !== 'inside' ||
        a.rest ||
        busy(s, a) ||
        reduced ||
        a.id === 'codex-leader'
      )
        return { mode: native, target: null };
      const side = story.ids.indexOf(a.id);
      if (side >= 0 && phase < 70) return { mode: 'chat', target: meeting(story, side) };
      const p = (elapsed + i * 13 + 22) % 100,
        room = W.rooms.find((r) => r.id === E.departmentOf(a)) || W.rooms[0];
      if (p < 27) return { mode: 'desk', target: base };
      if (p < 48)
        return { mode: 'board', target: nearby({ x: room.x + room.w - 16, y: room.y + 36 }) };
      if (p < 67)
        return {
          mode: 'coffee',
          target: nearby({
            x: W.lounge.coffee.x - 12 - (i % 3) * 18,
            y: W.lounge.coffee.y + W.lounge.coffee.h + 20,
          }),
        };
      if (p < 82)
        return {
          mode: 'plant',
          target: nearby({ x: W.lounge.x - 28, y: W.lounge.y + 8 + (i % 3) * 20 }),
        };
      return { mode: 'desk', target: base };
    }
    function speech(s, positions) {
      const { story, phase } = current();
      if (!E.officeOpen(s) || s.assembly?.active || phase < 20 || phase >= 68) return [];
      const line = Math.min(5, Math.floor((phase - 20) / 8)),
        id = story.ids[line % 2],
        other = story.ids[(line + 1) % 2],
        p = positions.get(id),
        q = positions.get(other);
      if (
        !p ||
        !q ||
        !p.visible ||
        !q.visible ||
        p.route?.length ||
        q.route?.length ||
        Math.hypot(p.x - q.x, p.y - q.y) > 85 ||
        busy(s, { id }) ||
        busy(s, { id: other })
      )
        return [];
      return [
        {
          id,
          text: story.lines[line],
          kind: 'ambient',
          name: roster(s).find((a) => a.id === id)?.name || 'Colega',
          title: story.title,
          line,
          cycle: Math.floor(elapsed / 90),
        },
      ];
    }
    function record(s, positions) {
      for (const item of speech(s, positions)) {
        const key = item.cycle + ':' + item.line;
        if (seen.has(key)) continue;
        seen.add(key);
        history.push({ ...item, time: elapsed });
        if (history.length > 48) history.shift();
      }
      if (seen.size > 64) {
        seen.clear();
        for (const item of history) seen.add(item.cycle + ':' + item.line);
      }
    }
    function advance(dt, options = {}) {
      reduced = !!options.reduced;
      if (!options.paused && Number.isFinite(dt) && dt > 0) elapsed += Math.min(0.1, dt);
    }
    const avatarColors = ['#875338', '#edc5a3', '#c49373', '#633d2d', '#dfba92', '#a96e4b'];
    function appearance(s, a) {
      const i = index(s, a);
      return {
        name: a.name,
        gender: a.gender || ['male', 'female', 'neutral'][i % 3],
        color: a.color,
        skin: a.skin || avatarColors[i % 6],
        pants: ['#253654', '#554764', '#2b5056'][i % 3],
        shoes: ['#ffffff', '#23334b', '#b37854'][i % 3],
        shoeStyle: ['sneakers', 'boots', 'formal'][i % 3],
        hair: a.hair || ['#322820', '#70452b', '#201b26'][i % 3],
        hairStyle: a.hairStyle || ['short', 'long', 'curly', 'bob', 'short', 'mohawk'][i % 6],
        hat: a.hat || 'none',
        hatColor: a.color,
        shirtStyle: a.shirtStyle || ['jacket', 'plain', 'hoodie', 'stripes'][i % 4],
        pantsStyle: 'straight',
      };
    }
    return {
      roster,
      home,
      plan,
      advance,
      speech,
      record,
      appearance,
      current,
      history,
      companions,
      conversations,
      get reduced() {
        return reduced;
      },
      get elapsed() {
        return elapsed;
      },
      animation: (mode) =>
        ({
          desk: 'typing',
          board: 'reading',
          plant: 'watering',
          coffee: 'coffee',
          chat: 'talking',
          rest: 'coffee',
        })[mode] || 'idle',
    };
  }
  return { create, companions, conversations };
});
