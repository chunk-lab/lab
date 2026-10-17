# 訳が長すぎるチャンク（13字以上）を、分ける／訳を短くする。行番号は passages_v6.txt 基準
R={
20:["{cucumbers|cucumber|a cucumber|cucumbering}, :: キュウリ","and many {kinds|kind|kindness|kinded} of flowers. :: たくさんの種類の花を"],
26:['"Plants {teach|teaches|taught to|teaching} us patience." :: 「植物は忍耐を教える」'],
38:["{that|what|which|who} good things take time. :: 良いことは時間がかかると"],
54:["he {looked|looked at|looking|looks like} nervous :: 彼は緊張して見えた"],
55:["{because|so|but|though} he could not :: 彼は…できなかったので"],
59:["{to talk|talking|talk|talked} to him in English. :: 英語で彼と話すことを"],
62:["but he {listened|heard|listen|listening} to me :: でも彼は聞いてくれた","{carefully|careful|carefulness|care} :: 注意深く"],
69:["we {went|go|gone|going} to a ramen shop :: ラーメン店に行った"],
79:["can {change|changes|changed|changing} a lot. :: 多くを変えられると"],
87:["Many students {stay up|get up|wake up|stand up} late :: 多くの生徒が夜ふかしする"],
89:["or {use|uses|using|used} their smartphones. :: スマホを使うために"],
99:["sleep {helps us turn|helps us turning|helps turn us|help us turn} :: 睡眠は…変える助けになる"],
105:["{to memorize|memorize|memorizing|memorized} a list of words. :: 単語の一覧を覚えるよう"],
112:["remembered {far more|very more|much many|far many} words :: ずっと多くの単語を覚えた"],
122:["{could|can|should|would} be :: …かもしれない","the most {effective|effect|effectively|affect} strategy. :: 最も効果的な戦略"],
134:["You can {find|found|finding|to find} them :: それらを見つけられる"],
139:["{such as|such like|as such|so as} hot and cold drinks, :: 温かい・冷たい飲み物など"],
140:["ice cream, and {even|ever|every|evenly} fresh eggs. :: アイスや新鮮な卵まで"],
142:["so {many|much|lot|lots} vending machines :: そんなに多くの自販機が","{in|on|at|to} Japan? :: 日本に"],
146:["so the machines {are rarely|are rare|rarely|are rarer} :: だから機械はめったに"],
158:["they {provide|provides|providing|provision} free drinks :: 無料の飲み物を提供する"],
161:["{vending|vend|vended|vendor} machines :: 自動販売機は","are {not just|not yet|just not|not even} convenient; :: 単に便利なだけでない"],
173:["{that|what|which|it} having more options :: 選択肢が多いことが"],
182:["that this is not {always|never|often|usually} the case. :: いつもそうとは限らないと"],
184:["researchers {set up|set on|set off|set in} a table :: 研究者は台を置いた"],
187:["{either|neither|both|whether} six or twenty-four types of jam. :: 6種か24種のジャムを"],
188:["{Although|Despite|However|Because} the larger display :: 大きな陳列は…けれど"],
196:["and make {it|that|this|its} difficult to decide. :: 決めるのを難しくする"],
206:["The {lesson|lessen|lessons|lesson's} :: 教訓は","{is not that|is not what|not is that|is that not} choice is bad, :: 選択が悪いのではなく"],
207:["{but that|but what|and that|so that} we should be aware :: 気づくべきだということ"],
218:["linguists {have debated|debating|have debate|has debated} :: 言語学者は議論してきた"],
219:["{whether|that|what|which} the language we speak :: 話す言語が…かどうか"],
235:["Another example {concerns|concern|concerned|concerning} color. :: もう1つの例は色の話"],
236:["Russian has two {separate|separately|separation|separates} words :: ロシア語には別々の2語が"],
239:["{that|what|which|whose} Russian speakers :: ロシア語話者が…と","{can distinguish|can distinguishing|can to distinguish|cans distinguish} :: 区別できる"],
244:["that language {completely|complete|completion|completed} determines :: 言語が完全に決めると","{thought|thoughts|think|thinking}. :: 思考を"],
245:["{Rather|Rather than|Instead of|Other}, they suggest :: むしろそれらは示す"],
251:["may {offer|offers|offering|to offer} more :: より多くをくれるかも"],
253:["it {may offer|may offering|may offers|maybe offer} :: それは…をくれるかも","a new way {of seeing|to seeing|of see|for seen}. :: 新しい見方を"],
}
L=open('passages_v6.txt',encoding='utf8').read().split('\n')
for n in sorted(R,reverse=True):
    old=L[n-1];assert '::' in old,(n,old)
    oe=old.split('::')[0].replace('{','').split('}')[0]  # 粗い確認用
    L[n-1:n]=R[n]
for x in R.values():
    for ln in x:assert len(ln.split('::')[1].strip())<=12,ln
open('passages.txt','w',encoding='utf8').write('\n'.join(L))
print('置き換え',len(R),'行')
