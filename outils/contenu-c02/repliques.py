# Répliques du Général Calpin (caisson 02) et de la scène de son réveil. Courtes (choix du propriétaire : tenir
# dans les crédits ElevenLabs restants). Rejouable.
import json
R = "./src/content/"

def load(n): return json.load(open(R + n))
def save(n, d):
    json.dump(d, open(R + n, "w"), ensure_ascii=False, indent=1); open(R + n, "a").write("\n")

comp = load("compagnon.json")
comp["c02"] = {
 "reactions": {
  "sommeil": {
   "premier": ["… bonne réponse… notée au registre… repos…", "… exact… article premier… zzz…"],
   "perseverance": ["… raté… puis réussi… c'est réglementaire…", "… on recommence… jusqu'à la victoire…"],
   "indice": ["… la réponse… est écrite… plus haut… au tableau…", "… relis la définition… c'est un ordre… zzz…"],
   "serie": ["… trois de suite… je rêve de médailles…", "… encore une… le clairon va sonner…"]},
  "demi": {
   "premier": ["Exact. Consigné au règlement.", "Bonne réponse. Une cellule de plus."],
   "perseverance": ["Une erreur, puis la réussite. C'est ainsi qu'on apprend.", "Tu as recommencé, et trouvé. Je salue."],
   "indice": ["Négatif. Relis la définition, puis réessaie.", "Pas tout à fait. Tout est écrit plus haut."],
   "serie": ["Trois d'affilée. Je me redresse.", "Encore une. Garde-à-vous… presque."]}},
 "protocoles": {
  "p1": {"etat": "sommeil", "debut": "… mmh… qui va là ?… une séance de travail ?… repos… je dors en service…",
         "blocs": {"3": "… l'atelier est prêté… on rend les clés le soir… zzz…", "8": "… regarde bien… ne touche à rien… c'est un ordre…"},
         "fin": "… je sens un courant… termine… branche la batterie…"},
  "p2": {"etat": "sommeil", "debut": "… une table de travail… pleine de miettes… et de règles…",
         "blocs": {"7": "… la table déborde… on résume… on range… zzz…", "8": "… ce qui est écrit reste… ce qui est dit s'envole…"},
         "fin": "… la batterie… presque pleine… branche-la…"},
  "p3": {"etat": "demi", "debut": "Mmh… le règlement de bord. Mon sujet préféré. Pardon, je bâille.",
         "blocs": {"3": "Le CLAUDE.md, je le relis à chaque séance. Court et clair, s'il te plaît.", "10": "Relis chaque règle avant de fusionner. Un règlement flou ne sert à rien."},
         "fin": "Mes paupières se lèvent. Termine le protocole."},
  "p4": {"etat": "demi", "debut": "Un conseil, on peut l'oublier. Une serrure, non.",
         "blocs": {"3": "Deux règles deny. Personne ne passe. Pas même moi.", "7": "Le mode auto va vite. Pour l'important, montre-moi d'abord le plan."},
         "fin": "Presque au garde-à-vous. Termine."},
  "p5": {"etat": "demi", "debut": "Les savoir-faire de l'équipe : rangés, étiquetés, prêts.",
         "blocs": {"5": "Une étiquette claire, sinon personne ne trouve l'outil.", "6": "Colle ton skill, et fais-le entrer dans le dépôt."},
         "fin": "Encore un peu de courant. Termine."},
  "p6": {"etat": "demi", "debut": "Les clés, maintenant. Une clé n'ouvre qu'une porte.",
         "blocs": {"3": "Chaque droit en trop, c'est une porte ouverte au voleur.", "5": "Une seule porte, quatre-vingt-dix jours. Réglementaire."},
         "fin": "Presque réveillé. Termine, répare la panne, et j'ouvre les yeux."}},
 "carte": "… zzz… caisson 02… article douze… viens me réveiller… repos…",
 "panne": "Alertes au règlement ! Réfléchis avant d'agir : les fusibles sont fragiles.",
 "panneFin": "Le courant passe. Envoie l'arc, maintenant.",
 "livraison": "Inspection : ton règlement, ta serrure, ton premier skill et ta synchronisation.",
}
save("compagnon.json", comp)

eq = load("equipe.json")
eq["c02"]["demi"] = "… mmh… article un… une séance, une tâche… je me réveille… presque…"
eq["c02"]["reveil"] = "Au rapport, chef. Ton règlement est écrit, tes serrures sont posées. J'y veillerai à chaque séance."
save("equipe.json", eq)

it = load("interactions.json")
it["retours"]["c02"] = {"sommeil": ["… qui va là ?… ah… c'est toi…", "… repos… on reprend…", "… zzz… présent !…"],
                        "eveil": ["Au rapport, chef.", "Te revoilà. On reprend.", "Tout est en ordre."]}
it["toucher"]["c02"] = {"sommeil": ["… halte-là… qui touche le général ?…", "… article douze… interdit de chatouiller…", "… cinq minutes… c'est un ordre…"],
                        "eveil": ["Garde-à-vous ! Ah, c'est toi.", "Une question de règlement ?", "Doucement, mes galons."]}
it["defis"]["c02"] = {
 "questions": [
  {"question": "Défi du jour ! Où écris-tu une règle valable à chaque séance ?", "choix": ["Dans le fichier CLAUDE.md", "Dans la conversation", "Dans un commit"], "bonne": 0, "piste": "Négatif. Ce qui est dit s'oublie ; ce qui est écrit reste."},
  {"question": "Défi du jour ! Quelle règle l'emporte toujours ?", "choix": ["Allow", "Ask", "Deny"], "bonne": 2, "piste": "Négatif. Pense à la serrure."},
  {"question": "Défi du jour ! Un bon jeton d'accès, c'est…", "choix": ["Tous les dépôts, sans limite", "Un seul dépôt, pour un temps limité", "Le même que ton mot de passe"], "bonne": 1, "piste": "Négatif. Une clé n'ouvre qu'une porte."}],
 "bravo": ["Exact ! Quinze kilowatts. Rompez.", "Consigné au registre : défi réussi."],
 "fait": "Défi relevé. Le suivant, demain à l'aube."}
it["question"]["c02"] = {"cle": "Pour m'interroger, il faut ta clé Claude, dans Réglages. J'attends."}
it["scenes"]["c02"] = [
 {"qui": "ora", "texte": "Général Calpin ? L'équipe a besoin d'un règlement."},
 {"qui": "c02", "texte": "Garde-à-vous ! Euh… repos. Bonjour à tous."},
 {"qui": "c02", "reveil": True},
 {"qui": "c01", "texte": "Enfin des règles bien rangées. Je les archive."},
 {"qui": "ora", "texte": "Plus que huit dormeurs. On continue."}]
save("interactions.json", it)
print("ok")
