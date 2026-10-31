# Arte do escritório completo

Gerada com a ferramenta integrada image_gen, usando como referência o escritório marcado na miniatura do portfólio. Não foram usados sprites ou tilesets de terceiros.

## Arquivos

- `cozy-room.png`: sala ilustrada de referência; seu piso é reutilizado como textura no escritório completo.
- `chibi-walk.png`: sprites com transparência, quatro direções e quatro quadros de caminhada por direção.

A aplicação desenha os personagens, monitores e interações separadamente da arte da sala. A personalização tinge os sprites no navegador e mantém os controles do visitante.

## Prompt da sala

Recreate and enlarge only the small pixel-art office in the marked rightmost project card of the supplied portfolio thumbnail, ignoring all other content. Preserve its polished cozy RPG pixel-art style and composition: honey oak horizontal floorboards, grey-blue back wall, two tall blue-glass windows with mountains, narrow dark-wood bookcase at upper left, leafy plant between the windows and bookcases full of colored books at upper right. Keep the navy two-seat sofa at middle right, the small light-oak computer desk with black monitor, paper and chair at lower left, and the bigger slate-blue computer desk with mug, monitor, keyboard, paper and chair at lower right. Keep the side plants and an open central floor. Remove the central person so the game can draw its animated character there. Standalone 16:9 game background, complete room, no people, no UI, no labels, no red annotation, no browser frame. Detailed pixel clusters, crisp outlines and cozy RPG shading, not flat rectangles.

## Prompt dos personagens

Create a transparent 4-column by 4-row sprite sheet of the chibi pixel-art character from the marked office. Large expressive head, tousled navy-black hair with pixel highlights, warm skin, black eyes with white glints, little ears and rosy cheeks, white collared shirt with a small dark-blue tie, navy trousers and dark shoes. Row 1 down, row 2 left, row 3 right, row 4 up. Columns are left step, neutral, right step, neutral, with consistent scale and feet baseline. Each cell contains one centered full-body character with generous transparent margins. Rich crisp pixel shading and dark outlines matching the room; no text, props, room or painted checkerboard.

## Escritório unificado e animações de cadeira

A sala principal separada foi removida. `office-art.js` usa os móveis abaixo em todos os setores, preservando o mapa e as colisões. `seat-motion.js` controla a transição reversível de levantar, dobrar os joelhos, acomodar e trabalhar. Os sprites têm alturas proporcionais, com pés ancorados à cadeira; a volta é concluída antes de caminhar. Digitação alternada, alongamento breve, leitura, café, gestos de conversa e rega complementam as rotinas. A redução de movimento desativa os ciclos e resolve a postura imediatamente.

- `furniture.png`: atlas transparente com mesas de madeira/ardósia, cadeira de frente/costas, sofá, estante, planta e janela.
- `chibi-sit.png`: atlas transparente de pé, joelhos dobrados, sentado e digitando, de frente e costas.

### Prompt dos móveis (ferramenta integrada image_gen)

Use case: background-extraction. Reference: the existing illustrated cozy office. Extract and recreate its furniture as a transparent sprite atlas, four columns by two rows: oak computer desk without chair; slate-blue computer desk without chair; empty navy desk chair front; empty navy desk chair back; navy sofa; wooden bookcase full of colored books; leafy plant in blue pot; blue mountain-view window. Preserve the reference's detailed chibi RPG pixel shading, crisp dark outlines, colors and perspective. Each complete prop separated with generous transparent margins; no people, text, labels, UI, floor or checkerboard.

### Prompt de sentar (ferramenta integrada image_gen)

Use case: stylized-concept. Reference: existing chibi walking character. Create a transparent four-column by two-row animation sheet of this same character: upright standing, bending knees to sit, fully seated with knees bent, seated typing with hands forward. First row facing down, second row facing up. Keep identical head size, body scale, clothing, pixel shading and foot baseline between frames; seated body must be shorter than standing. Navy-black tousled hair, white shirt and tie, navy trousers and dark shoes. Full bodies, transparent margins, no chair or desk, no text, labels or checkerboard. Match the supplied office art exactly in style.

Referência de interação: [Stardew Valley 1.5 — cadeiras funcionais](https://www.stardewvalley.net/stardew-valley-1-5-update-full-changelog/). Os sprites e gestos são próprios; nenhum recurso do jogo foi incorporado.
