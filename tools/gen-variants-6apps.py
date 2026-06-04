# -*- coding: utf-8 -*-
"""
gen-variants-6apps.py — generate variants.ts + rules.tsx for 6 missing apps:
  - Solitaire, Kdoub, Poker, Ronda, Concentration, KantCopy

Each variants file follows the simplified pattern (make() factory + as const) that
passed Hermes bundling cleanly for Okey/Quiestce.
"""
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
DEPLOY = ROOT / "apps-deploy"

# Each app's variants (id, emoji, deck/board size, name×5 langs, tag×5, ov×5)
VARIANTS_DATA = {
    "solitaire": [
        ("klondike",  "🃏", 52, {"fr":"Klondike","en":"Klondike","ar":"كلوندايك","es":"Klondike","darija":"Klondike"},
                              {"fr":"Le classique 1‑joueur","en":"The classic 1‑player","ar":"الكلاسيكي لشخص واحد","es":"El clásico 1‑jugador","darija":"الكلاسيكي 1 لاعب"},
                              {"fr":"7 piles, 4 fondations As→Roi","en":"7 piles, 4 foundations Ace→King","ar":"7 أكوام، 4 أساسات","es":"7 pilas, 4 fundamentos","darija":"7 piles, 4 fondations"}),
        ("spider",    "🕷️", 104, {"fr":"Spider","en":"Spider","ar":"العنكبوت","es":"Spider","darija":"Spider"},
                              {"fr":"2 paquets 10 colonnes","en":"2 decks 10 columns","ar":"مجموعتان 10 أعمدة","es":"2 mazos 10 columnas","darija":"2 paquets 10 colonnes"},
                              {"fr":"Suites de la même couleur","en":"Same‑suit sequences","ar":"تسلسلات بنفس اللون","es":"Secuencias del mismo palo","darija":"تسلسلات نفس اللون"}),
        ("freecell",  "🆓", 52, {"fr":"FreeCell","en":"FreeCell","ar":"فري سل","es":"FreeCell","darija":"FreeCell"},
                              {"fr":"4 cellules libres","en":"4 free cells","ar":"4 خلايا حرة","es":"4 celdas libres","darija":"4 free cells"},
                              {"fr":"Toute carte visible déplaçable","en":"Any visible card movable","ar":"كل ورقة مرئية متحركة","es":"Cualquier carta visible movible","darija":"كل ورقة مرئية متحركة"}),
        ("tripeaks",  "🏔️", 52, {"fr":"Tri Peaks","en":"Tri Peaks","ar":"ثلاث قمم","es":"Tri Peaks","darija":"Tri Peaks"},
                              {"fr":"3 pyramides de cartes","en":"3 card pyramids","ar":"3 أهرامات أوراق","es":"3 pirámides","darija":"3 أهرامات"},
                              {"fr":"Cartes ±1 du talon","en":"Cards ±1 from waste","ar":"أوراق ±1","es":"Cartas ±1","darija":"أوراق ±1"}),
        ("yukon",     "🏕️", 52, {"fr":"Yukon","en":"Yukon","ar":"يوكون","es":"Yukon","darija":"Yukon"},
                              {"fr":"Variante du Klondike","en":"Klondike variant","ar":"نسخة كلوندايك","es":"Variante Klondike","darija":"نسخة Klondike"},
                              {"fr":"Tableau initial complet","en":"Full initial layout","ar":"تخطيط كامل","es":"Disposición completa","darija":"تخطيط كامل"}),
    ],
    "kdoub": [
        ("classique", "🎭", 40, {"fr":"Kdoub Classique","en":"Classic Kdoub","ar":"كدوب كلاسيكي","es":"Kdoub Clásico","darija":"كدوب كلاسيكي"},
                              {"fr":"Bluff sur les valeurs","en":"Bluff on values","ar":"خداع على القيم","es":"Farol en valores","darija":"خداع على القيم"},
                              {"fr":"Pose face cachée, déclare une valeur","en":"Lay face‑down, declare a value","ar":"ضع مقلوبة، أعلن قيمة","es":"Boca abajo, declarar valor","darija":"اقلب، صرح بالقيمة"}),
        ("rapide",    "⚡", 40, {"fr":"Kdoub Rapide","en":"Quick Kdoub","ar":"كدوب سريع","es":"Kdoub Rápido","darija":"كدوب سريع"},
                              {"fr":"Tours timés 15s","en":"15s timed turns","ar":"أدوار 15 ثانية","es":"Turnos 15s","darija":"أدوار 15s"},
                              {"fr":"Pression du chrono","en":"Time pressure","ar":"ضغط الوقت","es":"Presión del tiempo","darija":"ضغط الوقت"}),
        ("equipes",   "👥", 40, {"fr":"Kdoub Équipes","en":"Team Kdoub","ar":"كدوب فرق","es":"Kdoub Equipos","darija":"كدوب فرق"},
                              {"fr":"2 équipes de 2 joueurs","en":"2 teams of 2","ar":"فريقان من اثنين","es":"2 equipos de 2","darija":"2 فرق دل 2"},
                              {"fr":"Communication interdite","en":"No communication","ar":"بدون تواصل","es":"Sin comunicación","darija":"بلا تواصل"}),
        ("bluff-king","👑", 40, {"fr":"Roi du Bluff","en":"Bluff King","ar":"ملك الخداع","es":"Rey del Farol","darija":"ملك الخداع"},
                              {"fr":"Mode tournoi","en":"Tournament mode","ar":"وضع البطولة","es":"Modo torneo","darija":"وضع البطولة"},
                              {"fr":"Top scoreurs s'affrontent","en":"Top scorers compete","ar":"الأبطال يتنافسون","es":"Mejores compiten","darija":"الأبطال يتنافسون"}),
    ],
    "poker": [
        ("texas-holdem","🤠", 52, {"fr":"Texas Hold'em","en":"Texas Hold'em","ar":"تكساس هولدم","es":"Texas Hold'em","darija":"Texas Hold'em"},
                              {"fr":"2 cartes privées + 5 communes","en":"2 hole + 5 community","ar":"2 خاصة + 5 مشتركة","es":"2 propias + 5 comunes","darija":"2 خاصة + 5 مشتركة"},
                              {"fr":"Limit, No Limit, Pot Limit","en":"Limit, No Limit, Pot Limit","ar":"محدد، بلا حد، حد القدر","es":"Limit, No Limit, Pot Limit","darija":"Limit, No Limit, Pot Limit"}),
        ("omaha",     "🌊", 52, {"fr":"Omaha","en":"Omaha","ar":"أوماها","es":"Omaha","darija":"Omaha"},
                              {"fr":"4 cartes privées","en":"4 hole cards","ar":"4 أوراق خاصة","es":"4 cartas propias","darija":"4 أوراق خاصة"},
                              {"fr":"Doit utiliser exactement 2","en":"Must use exactly 2","ar":"يجب استخدام 2 تماماً","es":"Usar exactamente 2","darija":"يجب 2 تماماً"}),
        ("seven-card","🎴", 52, {"fr":"7 Card Stud","en":"7 Card Stud","ar":"ستد 7 أوراق","es":"7 Card Stud","darija":"7 Card Stud"},
                              {"fr":"Mélange face cachée/visible","en":"Mix face‑down/up","ar":"خليط مكشوف/مغطى","es":"Mezcla boca arriba/abajo","darija":"خليط مكشوف/مغطى"},
                              {"fr":"Pas de cartes communes","en":"No community cards","ar":"بدون أوراق مشتركة","es":"Sin cartas comunes","darija":"بدون أوراق مشتركة"}),
        ("five-draw", "🃏", 52, {"fr":"5 Card Draw","en":"5 Card Draw","ar":"درو 5 أوراق","es":"5 Card Draw","darija":"5 Card Draw"},
                              {"fr":"Tirage 5 cartes","en":"Draw 5","ar":"اسحب 5","es":"Robo de 5","darija":"اسحب 5"},
                              {"fr":"Échange jusqu'à 3","en":"Swap up to 3","ar":"بدّل حتى 3","es":"Intercambia hasta 3","darija":"بدل حتى 3"}),
    ],
    "ronda": [
        ("classique", "🌙", 40, {"fr":"Ronda Marocaine","en":"Moroccan Ronda","ar":"الروندا المغربية","es":"Ronda Marroquí","darija":"الروندا المغربية"},
                              {"fr":"Capture rapide 40 cartes espagnoles","en":"Fast capture 40 Spanish cards","ar":"التقاط سريع 40 ورقة","es":"Captura rápida 40 cartas","darija":"التقاط سريع 40 ورقة"},
                              {"fr":"1‑1 ou 2v2 en équipes","en":"1‑1 or 2v2 teams","ar":"1‑1 أو فريق 2","es":"1‑1 o equipos 2","darija":"1‑1 ولا فريق 2"}),
        ("chkobba",   "🎯", 40, {"fr":"Chkobba","en":"Chkobba","ar":"شكوبة","es":"Chkobba","darija":"شكوبة"},
                              {"fr":"Variante point à 21","en":"21‑point variant","ar":"نسخة 21 نقطة","es":"Variante 21 puntos","darija":"نسخة 21 نقطة"},
                              {"fr":"Capture par somme égale","en":"Capture by sum","ar":"التقاط بمجموع متساو","es":"Captura por suma","darija":"التقاط بمجموع"}),
        ("escoba",    "🧹", 40, {"fr":"Escoba","en":"Escoba","ar":"المكنسة","es":"Escoba","darija":"الإسكوبا"},
                              {"fr":"Balayage de la table","en":"Sweep the table","ar":"كنس الطاولة","es":"Barrer la mesa","darija":"كنس الطاولة"},
                              {"fr":"Bonus si on prend tout","en":"Bonus for full sweep","ar":"مكافأة لكنس الكل","es":"Bono por barrido","darija":"مكافأة لكنس الكل"}),
        ("ronda-50",  "🏆", 40, {"fr":"Ronda 50","en":"Ronda 50","ar":"روندا 50","es":"Ronda 50","darija":"روندا 50"},
                              {"fr":"Premier à 50 points","en":"First to 50","ar":"الأول إلى 50","es":"Primero a 50","darija":"أول 50"},
                              {"fr":"Format tournoi standard","en":"Standard tournament","ar":"بطولة قياسية","es":"Torneo estándar","darija":"بطولة عادية"}),
    ],
    "concentration": [
        ("classique", "🧠", 24, {"fr":"Memory Classique","en":"Classic Memory","ar":"الذاكرة الكلاسيكية","es":"Memory Clásico","darija":"الذاكرة الكلاسيكية"},
                              {"fr":"24 cartes (12 paires)","en":"24 cards (12 pairs)","ar":"24 ورقة (12 زوجاً)","es":"24 cartas (12 pares)","darija":"24 ورقة (12 زوج)"},
                              {"fr":"Niveau facile","en":"Easy level","ar":"مستوى سهل","es":"Nivel fácil","darija":"مستوى سهل"}),
        ("medium",    "🎯", 36, {"fr":"Memory Moyen","en":"Medium Memory","ar":"الذاكرة المتوسطة","es":"Memory Medio","darija":"الذاكرة المتوسطة"},
                              {"fr":"36 cartes (18 paires)","en":"36 cards (18 pairs)","ar":"36 ورقة (18 زوجاً)","es":"36 cartas (18 pares)","darija":"36 ورقة (18 زوج)"},
                              {"fr":"Plus de mémoire requise","en":"More memory needed","ar":"يتطلب ذاكرة أكثر","es":"Más memoria","darija":"ذاكرة أكثر"}),
        ("hard",      "🔥", 52, {"fr":"Memory Difficile","en":"Hard Memory","ar":"الذاكرة الصعبة","es":"Memory Difícil","darija":"الذاكرة الصعبة"},
                              {"fr":"52 cartes (26 paires)","en":"52 cards (26 pairs)","ar":"52 ورقة (26 زوجاً)","es":"52 cartas (26 pares)","darija":"52 ورقة (26 زوج)"},
                              {"fr":"Pour les experts","en":"For experts","ar":"للخبراء","es":"Para expertos","darija":"للخبراء"}),
        ("timed",     "⏱️", 36, {"fr":"Memory Chronométré","en":"Timed Memory","ar":"الذاكرة المؤقتة","es":"Memory Cronometrado","darija":"الذاكرة المؤقتة"},
                              {"fr":"Course contre le temps","en":"Race against time","ar":"سباق مع الزمن","es":"Carrera contra tiempo","darija":"سباق مع الزمن"},
                              {"fr":"Bonus rapidité","en":"Speed bonus","ar":"مكافأة السرعة","es":"Bono velocidad","darija":"مكافأة السرعة"}),
    ],
    "kantcopy": [
        ("originale", "✨", 40, {"fr":"Kant Copy Originale","en":"Original Kant Copy","ar":"كانت كوبي الأصلية","es":"Kant Copy Original","darija":"كانت كوبي الأصلية"},
                              {"fr":"Création SallyStar","en":"SallyStar original","ar":"إبداع سالي ستار","es":"Original SallyStar","darija":"إبداع سالي ستار"},
                              {"fr":"Copie + Annonce = points","en":"Copy + Announce = points","ar":"نسخ + إعلان = نقاط","es":"Copia + Anuncio = puntos","darija":"نسخ + إعلان = نقاط"}),
        ("duo",       "👯", 40, {"fr":"Kant Copy Duo","en":"Kant Copy Duo","ar":"كانت كوبي ثنائي","es":"Kant Copy Dúo","darija":"كانت كوبي ثنائي"},
                              {"fr":"2 joueurs en duel","en":"2 players duel","ar":"لاعبان مبارزة","es":"2 jugadores duelo","darija":"2 لاعبان مبارزة"},
                              {"fr":"Annonce simultanée","en":"Simultaneous announce","ar":"إعلان متزامن","es":"Anuncio simultáneo","darija":"إعلان متزامن"}),
        ("quatuor",   "🎼", 40, {"fr":"Kant Copy Quatuor","en":"Kant Copy Quartet","ar":"كانت كوبي رباعي","es":"Kant Copy Cuarteto","darija":"كانت كوبي رباعي"},
                              {"fr":"4 joueurs en équipes","en":"4 players in teams","ar":"4 لاعبين فرق","es":"4 jugadores equipos","darija":"4 لاعبين فرق"},
                              {"fr":"Coopération + bluff","en":"Coop + bluff","ar":"تعاون + خداع","es":"Coop + farol","darija":"تعاون + خداع"}),
        ("speed",     "💨", 40, {"fr":"Kant Copy Speed","en":"Kant Copy Speed","ar":"كانت كوبي سريع","es":"Kant Copy Speed","darija":"كانت كوبي سريع"},
                              {"fr":"Mode rapide 10s","en":"Fast mode 10s","ar":"الوضع السريع 10 ثوان","es":"Modo rápido 10s","darija":"الوضع السريع 10s"},
                              {"fr":"Adrénaline maximale","en":"Max adrenaline","ar":"أدرينالين أقصى","es":"Adrenalina máxima","darija":"أدرينالين أقصى"}),
    ],
}


def gen_variants_file(app, variants):
    """Generate src/data/<app>-variants.ts with simplified factory pattern."""
    ids = " | ".join(f"'{v[0]}'" for v in variants)
    deck_default = variants[0][2]
    lines = [
        f"// Auto-generated for sally-{app} — v6 design refresh",
        "export type Lang = 'fr' | 'en' | 'ar' | 'es' | 'darija';",
        f"export type VariantId = {ids};",
        "",
        "export interface VariantTexts {",
        "  name:     Record<Lang, string>;",
        "  tagline:  Record<Lang, string>;",
        "  overview: Record<Lang, string>;",
        "  bidding:  Record<Lang, string>;",
        "  scoring:  Record<Lang, string>;",
        "  bonuses:  Record<Lang, string>;",
        "  endgame:  Record<Lang, string>;",
        "}",
        "",
        "export interface Variant {",
        "  id: VariantId; emoji: string; players: number[]; deckSize: number;",
        "  target: number; hasCustom: boolean; i18n: VariantTexts;",
        "}",
        "",
        "const make = (id: VariantId, emoji: string, deck: number, names: Record<Lang,string>, tag: Record<Lang,string>, ov: Record<Lang,string>): Variant => ({",
        "  id, emoji, players: [2, 4], deckSize: deck, target: 1, hasCustom: false,",
        "  i18n: {",
        "    name: names, tagline: tag, overview: ov,",
        "    bidding: { fr: 'Voir règles complètes', en: 'See full rules', ar: 'انظر القواعد', es: 'Ver reglas', darija: 'شوف القواعد' },",
        "    scoring: { fr: 'Comptage standard', en: 'Standard scoring', ar: 'تسجيل قياسي', es: 'Puntuación estándar', darija: 'تسجيل عادي' },",
        "    bonuses: { fr: 'Bonus série', en: 'Streak bonus', ar: 'مكافأة سلسلة', es: 'Bono racha', darija: 'مكافأة سلسلة' },",
        "    endgame: { fr: 'Premier à atteindre la cible', en: 'First to reach target', ar: 'الأول إلى الهدف', es: 'Primero al objetivo', darija: 'الأول للهدف' },",
        "  },",
        "});",
        "",
        "export const VARIANTS: Variant[] = [",
    ]
    for vid, emoji, deck, names, tag, ov in variants:
        lines.append(f"  make('{vid}', '{emoji}', {deck},")
        lines.append(f"    {{ fr: {names['fr']!r}, en: {names['en']!r}, ar: {names['ar']!r}, es: {names['es']!r}, darija: {names['darija']!r} }},")
        lines.append(f"    {{ fr: {tag['fr']!r}, en: {tag['en']!r}, ar: {tag['ar']!r}, es: {tag['es']!r}, darija: {tag['darija']!r} }},")
        lines.append(f"    {{ fr: {ov['fr']!r}, en: {ov['en']!r}, ar: {ov['ar']!r}, es: {ov['es']!r}, darija: {ov['darija']!r} }}),")
    lines.append("];")
    lines.append("")
    return "\n".join(lines)


def gen_rules_file(app):
    """Generate app/rules.tsx — same template as Belote/etc."""
    return f'''/**
 * @file rules.tsx (sally-{app})
 * @description Multi-variant rules screen.
 */
import React, {{ useMemo, useState }} from 'react';
import {{
  View, Text, ScrollView, TouchableOpacity, LayoutAnimation,
  Platform, UIManager, StyleSheet,
}} from 'react-native';
import {{ SafeAreaView }} from 'react-native-safe-area-context';
import {{ router }} from 'expo-router';
import {{ Ionicons }} from '@expo/vector-icons';
import {{ LinearGradient }} from 'expo-linear-gradient';
import {{ useTranslation }} from 'react-i18next';
import {{ VARIANTS, VariantId, Lang }} from '../src/data/{app}-variants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {{
  UIManager.setLayoutAnimationEnabledExperimental(true);
}}

export default function RulesScreen() {{
  const {{ i18n }} = useTranslation();
  const lang = (['fr','en','ar','es','darija'].includes(i18n.language) ? i18n.language : 'fr') as Lang;
  const [variantId, setVariantId] = useState<VariantId>(VARIANTS[0].id);
  const [expanded, setExpanded] = useState<string | null>('overview');

  const variant = useMemo(() => VARIANTS.find(v => v.id === variantId)!, [variantId]);
  const sections: Array<{{ key: keyof typeof variant.i18n; icon: string; title: Record<Lang,string> }}> = [
    {{ key: 'overview', icon: 'information-circle-outline', title: {{ fr: 'Présentation', en: 'Overview', ar: 'نظرة عامة', es: 'Presentación', darija: 'تقديم' }} }},
    {{ key: 'bidding',  icon: 'hammer-outline',            title: {{ fr: 'Enchères',     en: 'Bidding',  ar: 'المزايدة', es: 'Apuestas',    darija: 'المزايدة' }} }},
    {{ key: 'scoring',  icon: 'calculator-outline',        title: {{ fr: 'Scoring',      en: 'Scoring',  ar: 'النقاط',   es: 'Puntuación',  darija: 'النقاط' }} }},
    {{ key: 'bonuses',  icon: 'star-outline',              title: {{ fr: 'Bonus',        en: 'Bonuses',  ar: 'المكافآت', es: 'Bonos',       darija: 'مكافآت' }} }},
    {{ key: 'endgame',  icon: 'flag-outline',              title: {{ fr: 'Fin',          en: 'Endgame',  ar: 'النهاية',  es: 'Final',       darija: 'النهاية' }} }},
  ];

  const toggle = (k: string) => {{
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === k ? null : k);
  }};

  return (
    <SafeAreaView style={{styles.root}}>
      <LinearGradient colors={{['#0A0A1A', '#16213E']}} style={{StyleSheet.absoluteFill}} />
      <View style={{styles.header}}>
        <TouchableOpacity onPress={{() => router.back()}} style={{styles.backBtn}}>
          <Ionicons name="chevron-back" size={{28}} color="#fff" />
        </TouchableOpacity>
        <Text style={{styles.title}}>Règles</Text>
        <View style={{{{ width: 28 }}}} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={{false}} contentContainerStyle={{styles.chipsRow}}>
        {{VARIANTS.map(v => (
          <TouchableOpacity key={{v.id}} onPress={{() => setVariantId(v.id)}}
            style={{[styles.chip, variantId === v.id && styles.chipActive]}}>
            <Text style={{styles.chipEmoji}}>{{v.emoji}}</Text>
            <Text style={{[styles.chipText, variantId === v.id && styles.chipTextActive]}}>{{v.i18n.name[lang]}}</Text>
          </TouchableOpacity>
        ))}}
      </ScrollView>

      <ScrollView style={{{{ flex: 1 }}}} contentContainerStyle={{{{ padding: 16 }}}}>
        <Text style={{styles.variantHeader}}>{{variant.i18n.tagline[lang]}}</Text>
        {{sections.map(s => (
          <View key={{s.key}} style={{styles.section}}>
            <TouchableOpacity onPress={{() => toggle(s.key)}} style={{styles.sectionHead}}>
              <Ionicons name={{s.icon as any}} size={{20}} color="#FCD34D" />
              <Text style={{styles.sectionTitle}}>{{s.title[lang]}}</Text>
              <Ionicons name={{expanded === s.key ? 'chevron-up' : 'chevron-down'}} size={{20}} color="#fff" style={{{{ marginLeft: 'auto' }}}} />
            </TouchableOpacity>
            {{expanded === s.key && (
              <Text style={{styles.sectionBody}}>{{variant.i18n[s.key][lang]}}</Text>
            )}}
          </View>
        ))}}
      </ScrollView>
    </SafeAreaView>
  );
}}

const styles = StyleSheet.create({{
  root: {{ flex: 1 }},
  header: {{ flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' }},
  backBtn: {{ width: 40, height: 40, justifyContent: 'center' }},
  title: {{ fontSize: 22, fontWeight: '900', color: '#fff' }},
  chipsRow: {{ paddingHorizontal: 16, gap: 8 }},
  chip: {{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, marginRight: 8 }},
  chipActive: {{ backgroundColor: '#FCD34D' }},
  chipEmoji: {{ fontSize: 18, marginRight: 6 }},
  chipText: {{ color: '#fff', fontWeight: '600' }},
  chipTextActive: {{ color: '#0A0A1A' }},
  variantHeader: {{ color: '#FCD34D', fontSize: 16, fontWeight: '700', marginBottom: 16 }},
  section: {{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }},
  sectionHead: {{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }},
  sectionTitle: {{ color: '#fff', fontSize: 15, fontWeight: '700' }},
  sectionBody: {{ color: '#D1D5DB', padding: 14, lineHeight: 22, fontSize: 14 }},
}});
'''


for app, variants in VARIANTS_DATA.items():
    # Variants file
    src_path = DEPLOY / f"sally-{app}" / "src" / "data" / f"{app}-variants.ts"
    src_path.parent.mkdir(parents=True, exist_ok=True)
    src_path.write_text(gen_variants_file(app, variants), encoding='utf-8')
    # Also mirror to apps/mobile/
    mono_path = ROOT / "apps" / "mobile" / app / "src" / "data" / f"{app}-variants.ts"
    if mono_path.parent.parent.exists():
        mono_path.parent.mkdir(parents=True, exist_ok=True)
        mono_path.write_text(gen_variants_file(app, variants), encoding='utf-8')

    # Rules file
    rules_path = DEPLOY / f"sally-{app}" / "app" / "rules.tsx"
    rules_path.write_text(gen_rules_file(app), encoding='utf-8')
    print(f"OK {app}: variants ({len(variants)}) + rules.tsx")

print("\nDONE — 6 apps initialized with variants + rules")
