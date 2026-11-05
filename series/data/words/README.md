# レベル・頻度つき単語表(word_levels.xlsx / word_levels.csv / dict_all_words.csv)

作り方:  `python3 tools/build_wordtable.py [en_full.txt]`(頻度の元ファイルがなければ freq_counts.tsv をつかう)

- word_levels.xlsx … シート1「レベル表(CEFR-J)」=CEFR-Jなどの語×品詞 / シート2「辞書の全単語」=辞書の全語に頻度とレベル(CEFR-Jにない語は頻度からの推定)

## 材料と出典(商用の出版物に入れるときは、下の出典を表示すること)
- CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies (http://www.cefr-j.org/download.html). 商用可・無料・出典を示すこと。データは Open Language Profiles (https://github.com/openlanguageprofiles/olp-en-cefrj) 経由。
- Octanove Vocabulary Profile C1/C2 1.0 (CC BY-SA 4.0)。**同じ条件での公開が必要になる可能性があるので、アプリに入れる前に確認する。**
- いまの辞書(core/dict/data.js)の意味・順位。

- 頻度: FrequencyWords 2018 en(hermitdave、OpenSubtitles由来、CC BY-SA 4.0)。原形+変化形の合計、Zipf=log10(10億語あたりの出現数)。**字幕のコーパスなので、人名・話しことば(don, won など)が高めに出る。**
- 推定レベル: CEFR-Jの語の頻度の中央値の境目で、CEFR-Jにない語のレベルを割りふった粗い目安。

## 目安の対応(公式ではない)
- 英検: A1=5〜3級 / A2=準2級 / B1=2級 / B2=準1級 / C1=1級
- TOEIC L&R: ETSのCEFR対応の点数帯(A1〜220, A2 225〜545, B1 550〜780, B2 785〜940, C1 945〜)
- 学校: A1・A2=中学 / B1=高校 / B2=大学受験・大学 / C1以上=大学以上

## 未取りこみ
- TOEIC頻出語 TSL 1.2(CC BY-SA 4.0)。取りこむと、同じ条件で公開が必要になる可能性がある。

## 出題の区分(出題 ○ / △ / ×)
- ○ 通常・熟語 / △ 人名にもなる語・固有名詞(地名・国・言語など)・専門でほぼ使わない語・頻度なし / × 人名・話しことばの断片(don, won, ll など)・略語や短すぎる語
- 「人名にもなる語」は、アメリカの名(パブリックドメイン smashew/NameDatabases の first names/us.txt)に一致した語。rose や china のように本物の語でもあるので、△(要確認)。
- 姓の一覧は、普通の語(white, hill など)と区別できないので使っていない。
