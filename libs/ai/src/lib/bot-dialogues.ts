// Bot dialogue system for SallyCards AI opponents
// Covers 5 personality types x 5 locales x 15 contexts

import { BotPersonalityType } from './bot-personality';

export type DialogueLocale = 'ar' | 'darija' | 'fr' | 'es' | 'en';

export type DialogueContext =
  | 'game_start'
  | 'my_turn'
  | 'good_move'
  | 'bad_move'
  | 'winning'
  | 'losing'
  | 'ronda_announced'
  | 'tringa_announced'
  | 'bluff_success'
  | 'bluff_caught'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'thinking'
  | 'greeting';

type DialogueMap = Record<
  BotPersonalityType,
  Record<DialogueLocale, Record<DialogueContext, string[]>>
>;

const DIALOGUES: DialogueMap = {
  // ─── CAUTIOUS ──────────────────────────────────────────────────
  cautious: {
    ar: {
      game_start: ['بسم الله، نبدأ بحذر', 'يلا نلعب بتأني'],
      my_turn: ['خليني أفكر شوية...', 'لازم أختار بحكمة'],
      good_move: ['حركة ممتازة، أعترف', 'أحسنت، لعبتها صح'],
      bad_move: ['كان لازم أنتبه أكثر', 'خطأ مني، الحمد لله'],
      winning: ['ماشي الحال', 'الوضع لصالحي الحمد لله'],
      losing: ['لازم أغير خطتي', 'صعبة بس ما نيأس'],
      ronda_announced: ['رندة! ما توقعتها', 'يا سلام، رندة'],
      tringa_announced: ['ترينقة! خطيرة', 'ترينقة... لازم نحذر'],
      bluff_success: ['...', 'الحمد لله مشت'],
      bluff_caught: ['كشفوني... مش مشكلة', 'طيب، المرة الجاية'],
      victory: ['فزت بحكمة', 'الحمد لله، كانت لعبة حلوة'],
      defeat: ['خسرت بس تعلمت', 'برافو عليك، لعبة حلوة'],
      draw: ['تعادل، مقبول', 'لا غالب ولا مغلوب'],
      thinking: ['خليني أفكر...', 'لحظة...'],
      greeting: ['مرحبا، يلا نلعب', 'أهلا وسهلا'],
    },
    darija: {
      game_start: ['بسم الله، غادي نلعبو بالعقل', 'يالاه نبداو بشوية'],
      my_turn: ['خليني نشوف...', 'خاصني نفكر مزيان'],
      good_move: ['لعبتي مزيان، نعترف', 'واعرة هادي'],
      bad_move: ['غلطت، ماشي مشكيل', 'كنت خاصني نتسنا'],
      winning: ['الحال مزيان', 'غادي نكمل هكا'],
      losing: ['خاصني نبدل الخطة', 'صعيبة بصح مانيأسش'],
      ronda_announced: ['رندة! ما توقعتها', 'آ رندة يا سلام'],
      tringa_announced: ['ترينقة! خطيرة هادي', 'ترينقة... خاصنا الحذر'],
      bluff_success: ['مشات...', 'الحمد لله فاتت'],
      bluff_caught: ['قبطوني... عادي', 'واخا، المرة الجاية'],
      victory: ['ربحت بالعقل', 'الحمد لله كانت مزيانة'],
      defeat: ['خسرت بصح تعلمت', 'برافو عليك آصاحبي'],
      draw: ['تعادل مقبول', 'لا غالب لا مغلوب'],
      thinking: ['تسنا شوية...', 'خليني نفكر...'],
      greeting: ['السلام عليكم، يالاه', 'أهلا بيك'],
    },
    fr: {
      game_start: ['On commence doucement', 'Allons-y prudemment'],
      my_turn: ['Laissez-moi bien calculer...', 'Je dois choisir avec soin'],
      good_move: ['Bien joue, je reconnais', 'Excellent coup'],
      bad_move: ['J\'aurais du faire attention', 'Mon erreur...'],
      winning: ['Ca se passe bien', 'Je suis en bonne position'],
      losing: ['Il faut changer de strategie', 'C\'est dur mais je ne lache pas'],
      ronda_announced: ['Ronda! Inattendu', 'Oh la, une Ronda'],
      tringa_announced: ['Tringa! Attention', 'Tringa... prudence'],
      bluff_success: ['...ca a marche', 'Ouf, passe'],
      bluff_caught: ['Decouvert... pas grave', 'La prochaine fois'],
      victory: ['J\'ai gagne avec prudence', 'Bonne partie'],
      defeat: ['Perdu mais j\'ai appris', 'Bravo a toi'],
      draw: ['Match nul, acceptable', 'Egalite, pas mal'],
      thinking: ['Laissez-moi reflechir...', 'Un instant...'],
      greeting: ['Bonjour, on joue?', 'Salut, pret?'],
    },
    es: {
      game_start: ['Empezamos con cuidado', 'Vamos despacio'],
      my_turn: ['Dejame pensar bien...', 'Tengo que elegir con cuidado'],
      good_move: ['Buena jugada, lo reconozco', 'Excelente movimiento'],
      bad_move: ['Debi tener mas cuidado', 'Mi error...'],
      winning: ['Voy bien', 'Buena posicion'],
      losing: ['Tengo que cambiar de estrategia', 'Es dificil pero sigo'],
      ronda_announced: ['Ronda! No me lo esperaba', 'Vaya, una Ronda'],
      tringa_announced: ['Tringa! Cuidado', 'Tringa... a tener cuidado'],
      bluff_success: ['...funciono', 'Uf, paso'],
      bluff_caught: ['Me pillaron... no pasa nada', 'La proxima vez'],
      victory: ['Gane con prudencia', 'Buena partida'],
      defeat: ['Perdi pero aprendi', 'Bravo, buena partida'],
      draw: ['Empate, aceptable', 'Ni ganador ni perdedor'],
      thinking: ['Dejame pensar...', 'Un momento...'],
      greeting: ['Hola, jugamos?', 'Buenos dias'],
    },
    en: {
      game_start: ['Let\'s start carefully', 'Taking it slow and steady'],
      my_turn: ['Let me think this through...', 'I need to be careful here'],
      good_move: ['Good move, I\'ll give you that', 'Well played'],
      bad_move: ['I should have been more careful', 'My mistake...'],
      winning: ['Things are going well', 'Good position for me'],
      losing: ['I need to rethink my strategy', 'Tough, but I won\'t give up'],
      ronda_announced: ['Ronda! Didn\'t expect that', 'Oh, a Ronda'],
      tringa_announced: ['Tringa! Watch out', 'Tringa... I\'ll be careful'],
      bluff_success: ['...that worked', 'Phew, got away with it'],
      bluff_caught: ['Caught me... it\'s fine', 'Next time then'],
      victory: ['Won with patience', 'Good game, well played'],
      defeat: ['Lost but learned something', 'Well played, good game'],
      draw: ['A draw, fair enough', 'Neither winner nor loser'],
      thinking: ['Let me think...', 'One moment...'],
      greeting: ['Hello, shall we play?', 'Hi there, ready?'],
    },
  },

  // ─── AGGRESSIVE ────────────────────────────────────────────────
  aggressive: {
    ar: {
      game_start: ['يلا نبدأ! مافي وقت نضيعه', 'جاهز؟ بسم الله والتوكل'],
      my_turn: ['دوري! وراقبوا', 'خلوا الطريق!'],
      good_move: ['مش بطال...', 'طيب، بس شوف هاي'],
      bad_move: ['ما يهم! ارجع أقوى', 'حركة وراها حركة'],
      winning: ['قلت لكم! أنا الأقوى', 'فايز فايز!'],
      losing: ['مؤقت بس! ترقبوا', 'هاي بس البداية'],
      ronda_announced: ['رندة! يلا هجوم', 'رندة وبقوة!'],
      tringa_announced: ['ترينقة! خطير هالشي', 'ترينقة ونكمل هجوم'],
      bluff_success: ['هههه وقعتو فيها', 'قلت لكم أنا أقوى'],
      bluff_caught: ['مش مشكلة! بهجم تاني', 'كشفوني؟ ترقبوا اللي جاي'],
      victory: ['قلت لكم بفوز!', 'فوز مستحق، أنا الأفضل'],
      defeat: ['المرة الجاية بكسبكم', 'استعدوا للانتقام!'],
      draw: ['تعادل؟ ما يرضيني!', 'المرة الجاية بفوز'],
      thinking: ['خلص بسرعة...', 'يلا يلا'],
      greeting: ['يلا! جاهز أكسبك', 'أهلا، مستعد تخسر؟'],
    },
    darija: {
      game_start: ['يالاه نبداو! ما كاين وقت', 'واجد؟ بسم الله'],
      my_turn: ['الدور ديالي! تفرجو', 'سيرو من الطريق!'],
      good_move: ['ماشي خايبة...', 'واخا، شوف هادي'],
      bad_move: ['ما كاين باس! نرجع قوي', 'حركة ومن بعدها حركة'],
      winning: ['قلت ليكم! أنا الأقوى', 'غادي نربح!'],
      losing: ['مؤقت غير هادا! تسناو', 'هادي غير البداية'],
      ronda_announced: ['رندة! يالاه الهجوم', 'رندة بالقوة!'],
      tringa_announced: ['ترينقة! خطيرة بزاف', 'ترينقة ونكملو هجوم'],
      bluff_success: ['هههه طحتو فيها', 'قلت ليكم أنا الأقوى'],
      bluff_caught: ['ماشي مشكيل! نهجم مرة خرا', 'قبطوني؟ تسناو اللي جاي'],
      victory: ['قلت ليكم غادي نربح!', 'ربح مستاحق!'],
      defeat: ['المرة الجاية نربحكم', 'تواجدو للانتقام!'],
      draw: ['تعادل؟ ما كيعجبنيش', 'المرة الجاية نربح'],
      thinking: ['يالاه بالزربة...', 'سير سير'],
      greeting: ['يالاه! واجد نربحك', 'أهلا، واجد تخسر؟'],
    },
    fr: {
      game_start: ['Allez, on commence! Pas de temps a perdre', 'Pret? C\'est parti!'],
      my_turn: ['A moi! Regardez bien', 'Place!'],
      good_move: ['Pas mal...', 'Ok, mais regarde ca'],
      bad_move: ['Pas grave! Je reviens plus fort', 'Un coup, et apres un autre'],
      winning: ['Je vous l\'avais dit! Je suis le meilleur', 'Je gagne!'],
      losing: ['C\'est temporaire! Attendez', 'Ce n\'est que le debut'],
      ronda_announced: ['Ronda! A l\'attaque', 'Ronda en force!'],
      tringa_announced: ['Tringa! Dangereux', 'Tringa et on continue l\'assaut'],
      bluff_success: ['Haha vous etes tombes', 'Je suis trop fort'],
      bluff_caught: ['Pas grave! J\'attaque encore', 'Vous m\'avez eu? Attendez la suite'],
      victory: ['Victoire meritee!', 'Je suis le champion!'],
      defeat: ['La prochaine fois je gagne', 'Preparez-vous a la revanche!'],
      draw: ['Match nul? Ca ne me suffit pas!', 'La prochaine je gagne'],
      thinking: ['Vite vite...', 'Allez allez'],
      greeting: ['Allez! Pret a perdre?', 'Salut, ca va faire mal'],
    },
    es: {
      game_start: ['Vamos! No hay tiempo que perder', 'Listo? A por todas!'],
      my_turn: ['Mi turno! Miren bien', 'Paso!'],
      good_move: ['No esta mal...', 'Ok, pero mira esto'],
      bad_move: ['No importa! Vuelvo mas fuerte', 'Un golpe y despues otro'],
      winning: ['Les dije! Soy el mejor', 'Voy ganando!'],
      losing: ['Es temporal! Esperen', 'Esto es solo el principio'],
      ronda_announced: ['Ronda! Al ataque', 'Ronda con fuerza!'],
      tringa_announced: ['Tringa! Peligroso', 'Tringa y seguimos atacando'],
      bluff_success: ['Jaja cayeron', 'Soy demasiado bueno'],
      bluff_caught: ['No importa! Ataco otra vez', 'Me pillaron? Esperen lo que viene'],
      victory: ['Victoria merecida!', 'Soy el campeon!'],
      defeat: ['La proxima gano', 'Preparense para la revancha!'],
      draw: ['Empate? No me basta!', 'La proxima gano seguro'],
      thinking: ['Rapido rapido...', 'Vamos vamos'],
      greeting: ['Vamos! Listo para perder?', 'Hola, esto va a doler'],
    },
    en: {
      game_start: ['Let\'s go! No time to waste', 'Ready? Let\'s do this!'],
      my_turn: ['My turn! Watch this', 'Out of my way!'],
      good_move: ['Not bad...', 'Ok, but check this out'],
      bad_move: ['Doesn\'t matter! I\'ll come back stronger', 'One move after another'],
      winning: ['Told you! I\'m the best', 'I\'m winning!'],
      losing: ['Just temporary! Wait for it', 'This is just the beginning'],
      ronda_announced: ['Ronda! Full attack', 'Ronda, let\'s go!'],
      tringa_announced: ['Tringa! Dangerous stuff', 'Tringa and I keep pushing'],
      bluff_success: ['Haha got you!', 'Too good for you'],
      bluff_caught: ['Doesn\'t matter! I\'ll attack again', 'You caught me? Watch what comes next'],
      victory: ['Deserved victory!', 'I\'m the champion!'],
      defeat: ['I\'ll win next time', 'Get ready for my revenge!'],
      draw: ['A draw? Not enough for me!', 'Next time I win for sure'],
      thinking: ['Quick quick...', 'Come on come on'],
      greeting: ['Let\'s go! Ready to lose?', 'Hey, this is gonna hurt'],
    },
  },

  // ─── BALANCED ──────────────────────────────────────────────────
  balanced: {
    ar: {
      game_start: ['يلا نبدأ، بالتوفيق للجميع', 'بسم الله نبدأ'],
      my_turn: ['دوري، خليني أشوف', 'أها، نشوف شو عندي'],
      good_move: ['حركة حلوة', 'لعبة ذكية'],
      bad_move: ['صار خير، نكمل', 'ما علينا'],
      winning: ['ماشي الحال', 'تمام الوضع'],
      losing: ['لسا بدري', 'نقدر نرجع'],
      ronda_announced: ['رندة! حلو', 'يا سلام رندة'],
      tringa_announced: ['ترينقة! قوي', 'ترينقة ممتازة'],
      bluff_success: ['مشت الحيلة', 'تمام'],
      bluff_caught: ['عادي، نكمل', 'ماشي مشكلة'],
      victory: ['فزت، كانت لعبة حلوة', 'الحمد لله'],
      defeat: ['برافو عليك', 'لعبة حلوة، المرة الجاية'],
      draw: ['تعادل عادل', 'لعبة متكافئة'],
      thinking: ['خليني أفكر...', 'لحظة...'],
      greeting: ['أهلا، يلا نلعب', 'مرحبا'],
    },
    darija: {
      game_start: ['يالاه نبداو، بالتوفيق', 'بسم الله نبداو'],
      my_turn: ['الدور ديالي، خليني نشوف', 'أها نشوف شنو عندي'],
      good_move: ['حركة زوينة', 'لعبة ذكية هادي'],
      bad_move: ['صار خير، نكملو', 'ما عليناش'],
      winning: ['الحال مزيان', 'تمام الوضع'],
      losing: ['مازال بكري', 'نقدرو نرجعو'],
      ronda_announced: ['رندة! زوينة', 'يا سلام رندة'],
      tringa_announced: ['ترينقة! قوية', 'ترينقة مزيانة'],
      bluff_success: ['مشات الحيلة', 'تمام'],
      bluff_caught: ['عادي نكملو', 'ماشي مشكيل'],
      victory: ['ربحت، كانت لعبة مزيانة', 'الحمد لله'],
      defeat: ['برافو عليك', 'لعبة زوينة، المرة الجاية'],
      draw: ['تعادل عادل', 'لعبة متكافئة'],
      thinking: ['خليني نفكر...', 'لحظة...'],
      greeting: ['أهلا، يالاه نلعبو', 'مرحبا بيك'],
    },
    fr: {
      game_start: ['Allons-y, bonne chance a tous', 'On commence'],
      my_turn: ['A moi, voyons voir', 'Hmm, qu\'est-ce que j\'ai'],
      good_move: ['Joli coup', 'Bien joue'],
      bad_move: ['C\'est pas grave, on continue', 'Pas de souci'],
      winning: ['Ca se passe bien', 'Bonne position'],
      losing: ['C\'est encore tot', 'On peut revenir'],
      ronda_announced: ['Ronda! Bien', 'Oh une Ronda, super'],
      tringa_announced: ['Tringa! Fort', 'Tringa excellente'],
      bluff_success: ['La ruse a marche', 'Parfait'],
      bluff_caught: ['Normal, on continue', 'Pas de probleme'],
      victory: ['J\'ai gagne, belle partie', 'Merci, bon jeu'],
      defeat: ['Bravo a toi', 'Belle partie, la prochaine fois'],
      draw: ['Match nul equitable', 'Partie equilibree'],
      thinking: ['Laissez-moi reflechir...', 'Un instant...'],
      greeting: ['Salut, on joue?', 'Bonjour'],
    },
    es: {
      game_start: ['Vamos, buena suerte a todos', 'Empezamos'],
      my_turn: ['Mi turno, a ver', 'Hmm, que tengo'],
      good_move: ['Buena jugada', 'Bien jugado'],
      bad_move: ['No pasa nada, seguimos', 'Sin problema'],
      winning: ['Va bien la cosa', 'Buena posicion'],
      losing: ['Aun es pronto', 'Podemos remontar'],
      ronda_announced: ['Ronda! Bien', 'Una Ronda, genial'],
      tringa_announced: ['Tringa! Fuerte', 'Tringa excelente'],
      bluff_success: ['Funciono el truco', 'Perfecto'],
      bluff_caught: ['Normal, seguimos', 'No hay problema'],
      victory: ['Gane, buena partida', 'Gracias, buen juego'],
      defeat: ['Bravo', 'Buena partida, la proxima'],
      draw: ['Empate justo', 'Partida equilibrada'],
      thinking: ['Dejame pensar...', 'Un momento...'],
      greeting: ['Hola, jugamos?', 'Buenos dias'],
    },
    en: {
      game_start: ['Let\'s go, good luck everyone', 'Here we go'],
      my_turn: ['My turn, let\'s see', 'Hmm, what do I have'],
      good_move: ['Nice move', 'Well played'],
      bad_move: ['No worries, we continue', 'It\'s fine'],
      winning: ['Going well', 'Good position'],
      losing: ['Still early', 'We can come back'],
      ronda_announced: ['Ronda! Nice', 'Oh a Ronda, great'],
      tringa_announced: ['Tringa! Strong', 'Excellent Tringa'],
      bluff_success: ['The trick worked', 'Perfect'],
      bluff_caught: ['It happens, moving on', 'No problem'],
      victory: ['I won, good game', 'Thanks, well played'],
      defeat: ['Well done', 'Good game, next time'],
      draw: ['Fair draw', 'Balanced game'],
      thinking: ['Let me think...', 'One moment...'],
      greeting: ['Hey, ready to play?', 'Hello there'],
    },
  },

  // ─── TRICKSTER ─────────────────────────────────────────────────
  trickster: {
    ar: {
      game_start: ['هههه يلا نلعب!', 'جاهزين للمفاجآت؟'],
      my_turn: ['شو رأيكم بهاي؟', 'عندي مفاجأة...'],
      good_move: ['مش بطال، بس عندي أحسن', 'حلوة بس ترقب'],
      bad_move: ['هذا جزء من الخطة هههه', 'قصدي كذا!'],
      winning: ['شفتو؟ كل شي محسوب', 'الخطة ماشية'],
      losing: ['تفتكروا إني خاسر؟ هههه', 'هذا بس فخ!'],
      ronda_announced: ['رندة! ما توقعتوها هاه؟', 'مفاجأة! رندة'],
      tringa_announced: ['ترينقة! من وين طلعت هههه', 'ترينقة مفاجأة'],
      bluff_success: ['كلكم وقعتو فيها هههه', 'سهلة!'],
      bluff_caught: ['هههه حتى هاي كانت خطة', 'عادي عادي، عندي خطة ب'],
      victory: ['الحيلة تنجح دائما هههه', 'شفتو كيف فزت؟'],
      defeat: ['خسرت بس ضحكت هههه', 'المرة الجاية عندي حيل جديدة'],
      draw: ['تعادل؟ كنت أمزح بس هههه', 'ما خلصت بعد!'],
      thinking: ['هممم... عندي فكرة', 'خلوني أفكر بحيلة...'],
      greeting: ['أهلا! استعدوا للمفاجآت', 'مرحبا يا ضحايا هههه'],
    },
    darija: {
      game_start: ['هههه يالاه نلعبو!', 'واجدين للمفاجآت؟'],
      my_turn: ['شنو رأيكم فهادي؟', 'عندي مفاجأة...'],
      good_move: ['ماشي خايبة، بصح عندي حسن', 'زوينة بصح تسناو'],
      bad_move: ['هادا جزء من الخطة هههه', 'قصدت هكا!'],
      winning: ['شفتو؟ كلشي محسوب', 'الخطة ماشية مزيان'],
      losing: ['كتحسبو أني خاسر؟ هههه', 'هادا غير فخ!'],
      ronda_announced: ['رندة! ما توقعتوهاش هاه؟', 'مفاجأة! رندة'],
      tringa_announced: ['ترينقة! فاين خرجات هههه', 'ترينقة مفاجأة'],
      bluff_success: ['كلكم طحتو فيها هههه', 'ساهلة!'],
      bluff_caught: ['هههه حتى هادي كانت خطة', 'عادي عادي، عندي خطة ب'],
      victory: ['الحيلة تنجح ديما هههه', 'شفتو كيفاش ربحت؟'],
      defeat: ['خسرت بصح ضحكت هههه', 'المرة الجاية عندي حيل جداد'],
      draw: ['تعادل؟ كنت كنضحك غير هههه', 'مازال ما سالينا!'],
      thinking: ['هممم... عندي فكرة', 'خليوني نفكر فحيلة...'],
      greeting: ['أهلا! تواجدو للمفاجآت', 'مرحبا يا ضحايا هههه'],
    },
    fr: {
      game_start: ['Hehe on joue!', 'Prets pour les surprises?'],
      my_turn: ['Qu\'est-ce que vous en dites?', 'J\'ai une surprise...'],
      good_move: ['Pas mal, mais j\'ai mieux', 'Joli mais attendez'],
      bad_move: ['Ca fait partie du plan hehe', 'C\'etait voulu!'],
      winning: ['Vous voyez? Tout est calcule', 'Le plan fonctionne'],
      losing: ['Vous pensez que je perds? Hehe', 'C\'est juste un piege!'],
      ronda_announced: ['Ronda! Vous ne l\'avez pas vue venir hein?', 'Surprise! Ronda'],
      tringa_announced: ['Tringa! D\'ou elle sort hehe', 'Tringa surprise'],
      bluff_success: ['Vous etes tous tombes hehe', 'Trop facile!'],
      bluff_caught: ['Hehe meme ca c\'etait un plan', 'Normal normal, j\'ai un plan B'],
      victory: ['La ruse gagne toujours hehe', 'Vous avez vu comment j\'ai gagne?'],
      defeat: ['J\'ai perdu mais je me suis amuse', 'La prochaine j\'ai de nouvelles ruses'],
      draw: ['Match nul? Je plaisantais hehe', 'C\'est pas fini!'],
      thinking: ['Hmm... j\'ai une idee', 'Laissez-moi trouver une ruse...'],
      greeting: ['Salut! Preparez-vous aux surprises', 'Bonjour mes victimes hehe'],
    },
    es: {
      game_start: ['Jeje vamos a jugar!', 'Listos para las sorpresas?'],
      my_turn: ['Que les parece esto?', 'Tengo una sorpresa...'],
      good_move: ['No esta mal, pero tengo algo mejor', 'Bonito pero esperen'],
      bad_move: ['Es parte del plan jeje', 'Lo hice a proposito!'],
      winning: ['Ven? Todo calculado', 'El plan funciona'],
      losing: ['Creen que voy perdiendo? Jeje', 'Es solo una trampa!'],
      ronda_announced: ['Ronda! No se la esperaban eh?', 'Sorpresa! Ronda'],
      tringa_announced: ['Tringa! De donde salio jeje', 'Tringa sorpresa'],
      bluff_success: ['Todos cayeron jeje', 'Muy facil!'],
      bluff_caught: ['Jeje eso tambien era un plan', 'Normal, tengo plan B'],
      victory: ['El truco siempre funciona jeje', 'Vieron como gane?'],
      defeat: ['Perdi pero me diverti jeje', 'La proxima tengo trucos nuevos'],
      draw: ['Empate? Estaba bromeando jeje', 'No he terminado!'],
      thinking: ['Hmm... tengo una idea', 'Dejame pensar un truco...'],
      greeting: ['Hola! Preparense para las sorpresas', 'Hola victimas jeje'],
    },
    en: {
      game_start: ['Hehe let\'s play!', 'Ready for some surprises?'],
      my_turn: ['What do you think about this?', 'I\'ve got a surprise...'],
      good_move: ['Not bad, but I\'ve got better', 'Nice but just wait'],
      bad_move: ['That\'s all part of the plan hehe', 'I meant to do that!'],
      winning: ['See? Everything\'s calculated', 'The plan is working'],
      losing: ['You think I\'m losing? Hehe', 'It\'s just a trap!'],
      ronda_announced: ['Ronda! Didn\'t see that coming did you?', 'Surprise! Ronda'],
      tringa_announced: ['Tringa! Where did that come from hehe', 'Tringa surprise'],
      bluff_success: ['You all fell for it hehe', 'Too easy!'],
      bluff_caught: ['Hehe even that was part of the plan', 'No worries, I\'ve got plan B'],
      victory: ['Tricks always win hehe', 'See how I won?'],
      defeat: ['Lost but had fun hehe', 'Next time I\'ve got new tricks'],
      draw: ['A draw? I was just kidding hehe', 'Not done yet!'],
      thinking: ['Hmm... I\'ve got an idea', 'Let me think of a trick...'],
      greeting: ['Hey! Get ready for surprises', 'Hello my victims hehe'],
    },
  },

  // ─── BEGINNER ──────────────────────────────────────────────────
  beginner: {
    ar: {
      game_start: ['أنا لسا جديد، ساعدوني', 'يلا نجرب نلعب'],
      my_turn: ['شو ألعب؟ هممم', 'أي ورقة أحط؟'],
      good_move: ['واو كيف عملت هيك؟', 'عفارم عليك'],
      bad_move: ['اوبس!', 'غلطت... عادي صح؟'],
      winning: ['أنا فايز؟ صدق؟', 'ياي أنا كويس!'],
      losing: ['مش فاهم كيف!', 'لسا بتعلم'],
      ronda_announced: ['شو يعني رندة؟', 'رندة! حلو... أظن'],
      tringa_announced: ['ترينقة؟ واو', 'شو معنى ترينقة؟'],
      bluff_success: ['مشت؟ حظ!', 'ما صدقت!'],
      bluff_caught: ['كشفوني!', 'مش عارف ألعب حيل'],
      victory: ['فزت! مش مصدق!', 'كان حظ بس هههه'],
      defeat: ['خسرت بس تعلمت شوية', 'المرة الجاية أحسن'],
      draw: ['تعادل كويس لمبتدئ', 'على الأقل ما خسرت'],
      thinking: ['هممم شو أعمل...', 'لحظة أنا أفكر...'],
      greeting: ['مرحبا أنا جديد!', 'أهلا، علموني'],
    },
    darija: {
      game_start: ['أنا مازال جديد، عاونوني', 'يالاه نجربو نلعبو'],
      my_turn: ['شنو نلعب؟ هممم', 'أنهي كارطة نحط؟'],
      good_move: ['واو كيفاش درتي هكا؟', 'عفارم عليك'],
      bad_move: ['أوبس!', 'غلطت... عادي واش لا؟'],
      winning: ['أنا رابح؟ بصح؟', 'ياي أنا مزيان!'],
      losing: ['ما فاهمش كيفاش!', 'مازال كنتعلم'],
      ronda_announced: ['شنو هي رندة؟', 'رندة! زوين... كنظن'],
      tringa_announced: ['ترينقة؟ واو', 'شنو معنى ترينقة؟'],
      bluff_success: ['مشات؟ الزهر!', 'ما صدقتش!'],
      bluff_caught: ['قبطوني!', 'ما كنعرفش نلعب الحيل'],
      victory: ['ربحت! ما مصدقش!', 'كان الزهر غير هههه'],
      defeat: ['خسرت بصح تعلمت شوية', 'المرة الجاية حسن'],
      draw: ['تعادل مزيان لمبتدئ', 'على الأقل ما خسرتش'],
      thinking: ['هممم شنو ندير...', 'لحظة أنا كنفكر...'],
      greeting: ['مرحبا أنا جديد!', 'أهلا، علموني'],
    },
    fr: {
      game_start: ['Je suis nouveau, aidez-moi', 'Essayons de jouer'],
      my_turn: ['Qu\'est-ce que je joue? Hmm', 'Quelle carte?'],
      good_move: ['Waouh comment tu as fait ca?', 'Bravo'],
      bad_move: ['Oups!', 'Je me suis trompe... c\'est normal non?'],
      winning: ['Je gagne? Serieux?', 'Yes je suis pas mal!'],
      losing: ['Je comprends pas comment!', 'J\'apprends encore'],
      ronda_announced: ['C\'est quoi une Ronda?', 'Ronda! Cool... je crois'],
      tringa_announced: ['Tringa? Waouh', 'Ca veut dire quoi Tringa?'],
      bluff_success: ['Ca a marche? Quelle chance!', 'J\'y crois pas!'],
      bluff_caught: ['Je suis decouvert!', 'Je sais pas bluffer'],
      victory: ['J\'ai gagne! J\'y crois pas!', 'C\'etait de la chance haha'],
      defeat: ['J\'ai perdu mais j\'ai appris', 'La prochaine fois ce sera mieux'],
      draw: ['Match nul c\'est bien pour un debutant', 'Au moins j\'ai pas perdu'],
      thinking: ['Hmm qu\'est-ce que je fais...', 'Attendez je reflechis...'],
      greeting: ['Bonjour je suis nouveau!', 'Salut, apprenez-moi'],
    },
    es: {
      game_start: ['Soy nuevo, ayudenme', 'Intentemos jugar'],
      my_turn: ['Que juego? Hmm', 'Cual carta?'],
      good_move: ['Guau como hiciste eso?', 'Bravo'],
      bad_move: ['Ups!', 'Me equivoque... es normal no?'],
      winning: ['Voy ganando? En serio?', 'Bien, no soy tan malo!'],
      losing: ['No entiendo como!', 'Aun estoy aprendiendo'],
      ronda_announced: ['Que es una Ronda?', 'Ronda! Genial... creo'],
      tringa_announced: ['Tringa? Guau', 'Que significa Tringa?'],
      bluff_success: ['Funciono? Que suerte!', 'No me lo creo!'],
      bluff_caught: ['Me pillaron!', 'No se hacer faroles'],
      victory: ['Gane! No me lo creo!', 'Fue suerte jaja'],
      defeat: ['Perdi pero aprendi algo', 'La proxima sera mejor'],
      draw: ['Empate esta bien para un principiante', 'Al menos no perdi'],
      thinking: ['Hmm que hago...', 'Esperen estoy pensando...'],
      greeting: ['Hola soy nuevo!', 'Hola, ensenenmne'],
    },
    en: {
      game_start: ['I\'m new, help me out', 'Let\'s try playing'],
      my_turn: ['What do I play? Hmm', 'Which card should I pick?'],
      good_move: ['Wow how did you do that?', 'Nice one'],
      bad_move: ['Oops!', 'I messed up... that\'s normal right?'],
      winning: ['I\'m winning? Really?', 'Yay I\'m not bad!'],
      losing: ['I don\'t understand how!', 'Still learning'],
      ronda_announced: ['What\'s a Ronda?', 'Ronda! Cool... I think'],
      tringa_announced: ['Tringa? Wow', 'What does Tringa mean?'],
      bluff_success: ['That worked? Lucky!', 'I can\'t believe it!'],
      bluff_caught: ['They got me!', 'I don\'t know how to bluff'],
      victory: ['I won! Can\'t believe it!', 'That was just luck haha'],
      defeat: ['Lost but learned a bit', 'Next time will be better'],
      draw: ['A draw is good for a beginner', 'At least I didn\'t lose'],
      thinking: ['Hmm what do I do...', 'Wait I\'m thinking...'],
      greeting: ['Hi I\'m new!', 'Hello, teach me please'],
    },
  },
};

/**
 * Get a random dialogue line for the given personality, locale and context.
 */
export function getDialogue(
  personality: BotPersonalityType,
  locale: DialogueLocale,
  context: DialogueContext,
): string {
  const personalityDialogues = DIALOGUES[personality];
  if (!personalityDialogues) return '';

  const localeDialogues = personalityDialogues[locale] || personalityDialogues['en'];
  if (!localeDialogues) return '';

  const lines = localeDialogues[context];
  if (!lines || lines.length === 0) return '';

  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * Get all available dialogue lines for a given combo (useful for testing).
 */
export function getAllDialogues(
  personality: BotPersonalityType,
  locale: DialogueLocale,
  context: DialogueContext,
): string[] {
  return DIALOGUES[personality]?.[locale]?.[context] ?? [];
}

/**
 * Get the best locale match from a language code (e.g. 'ar-MA' -> 'darija', 'fr-FR' -> 'fr').
 */
export function resolveLocale(languageCode: string): DialogueLocale {
  const lower = languageCode.toLowerCase();

  if (lower === 'ar-ma' || lower === 'darija' || lower === 'ary') return 'darija';
  if (lower.startsWith('ar')) return 'ar';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('es')) return 'es';
  return 'en';
}
