**Design Guidelines**

このドキュメントは `src/screens/ProfileEditScreen.tsx` と `src/screens/AuthScreen/AuthScreen.tsx` を基に、プロダクトのUIルールをまとめたものです。実装時はここに記載のトークンとルールを優先してください。

**Design Tokens**

- `typography.display`: 44/52, W200（ロゴなど）
- `typography.title`: 22/28, W300（小見出し）
- `typography.body`: 16/24, W400（本文・入力）
- `typography.footnote`: 14/20, W300（補助テキスト・エラー）
- `spacing.xs`: 8（最小間隔、メッセージ上側など）
- `spacing.sm`: 16（要素間の基本間隔）
- `spacing.md`: 24（セクション間の基本間隔）
- `colors.neutral[0..900]`: 白〜黒の階調（背景・文字）
- `colors.semantic.error`: #DC2626（エラー）
- `colors.semantic.success`: #059669（成功・強め）
- `colors.semantic.successMuted`: #059669B3（成功・控えめ）
- `colors.semantic.warning`: #D97706（警告）
- `colors.semantic.link`: #1D70B8（リンク）

**Layout / Spacing**

- 入力直下のメッセージ行の上マージン: `spacing.xs`（8）
- 入力コンテナの下マージン（1フィールドあたり）: `spacing.sm`（16）
- セクション/ブロック間: `spacing.md`（24）基準で倍数に揃える
- 入力の最大横幅: `300px`（`styles.inputContainer`）を統一（セレクトも同様）
- ステップ見出し下マージン: 通常 `88`、アバターのステップのみ `48`（`stepHeaderTight`）

**Text / 書式**

- 見出し: 画面タイトルは30px/W200/38line（`stepTitle`）。中央揃え。
- 本文: `typography.body`。入力のテキストも同じ。
- 補助/注意: `typography.footnote` を使用。エラーは赤、成功は緑（控えめ）。

**Inputs（単一行）**

- 高さ: 56 / 角丸: 12 / 横パディング: 16
- 背景: `neutral[200]`、文字: `neutral[700]`、placeholder: `neutral[500]`
- フォーカス枠は未実装（必要なら1pxアウトラインを追加）
- エラー時の枠: 1px、`semantic.error`
- 下部メッセージ行: 高さ固定（`footnote.lineHeight`）で常設。内容が無い場合は透明テキストを出し、レイアウトジャンプを防止

**Textarea（Bio）**

- `multiline`、高さ120、上寄せ（`textAlignVertical: 'top'`）
- 右下にカウンタ常設「n / 300」
- しきい値: 240〜は`warning`色、300超で`error`色

**Selects（Country / Region）**

- 見た目はTextInputと同一（高さ56/角丸12/背景`neutral[200]`）
- 国選択が未完のときは地域の行は非表示
- 国ボタン直下のエラー行はTextInput同様の間隔（`spacing.xs` + `spacing.sm`）
- モーダル: 背景 `rgba(neutral[900], 0.33)`、シート角丸12、行高48（`getItemLayout`で固定）
- リストの初期位置: 選択済み > 首都（JP: Tokyo, KR: Seoul, US: District of Columbia）

**Buttons**

- プライマリ（Authの「次へ」）: 高さ56/角丸12、背景`neutral[800]`、文字`neutral[0]`、非活性は`opacity: 0.5`
- ステップナビ（< > アイコン）: 最小48×48、パディング左右20/上下16
- 進む/戻るの有効時カラー: `neutral[900]`（同色で統一）
- 非活性時: `opacity: 0.35` で視覚的に無効を表現

**Messages（エラー・成功・補足）**

- 原則、入力直下の固定行に表示（レイアウトジャンプを禁止）
- エラー色: `semantic.error`、成功色: `semantic.successMuted`（成功は控えめ）
- セレクトのエラーも同じ行間ルールに合わせる

**Colors / Contrast**

- 文字色の基本: 見出し`neutral[900]`、本文`neutral[700]`、補足`neutral[600]`
- 背景の基本: `neutral[0]`、入力背景`neutral[200]`
- 成功メッセージは強めの緑ではなく `successMuted` を使用し視線の集中を妨げない

**Navigation / Progress**

- 下部中央に「現在のステップ/全体数」を表示（`footnote`、`neutral[600]`）
- 進むは常に右、戻るは左に配置
- 進むボタンはバリデーション未完了時に`disabled`+`opacity:0.35`

**Validation / UX**

- 入力中にエラーは即時クリア（`clearErrors`）。ユーザー名は500msデバウンスで可用性チェック
- 成功とエラーは同時表示しない（成功は`!errors`のときのみ）
- 国/地域の選択時はエラーを確実に消去

**Motion**

- ステップ遷移: フェード+水平スライド（150〜200ms）
- フォーカスや押下時の微アニメーションは100ms程度のスケールで可（Authのボタン参照）

**Accessibility**

- すべてのタップ領域は44pt以上（セレクト・ナビゲーション・リンク）
- 色だけに依存しない（非活性は不透明度+`disabled`属性）
- モーダルオープン時はタイトルを先に読み上げられる構造（現状は視覚優先・必要時に調整）

**実装パターン（再利用可）**

- TextInput共通: `src/components/ui/TextInput.tsx` を使用（成功/エラーのメッセージ行常設）
- スペーシング: `src/styles/spacing.ts` の `xs/sm/md` を使用。8/16/24の倍数に統一
- 色: `src/styles/colors.ts` の`neutral/semantic`を必ず参照し、直値は避ける
- タイトル間隔: 基本 `stepHeader`、例外は `stepHeaderTight` を条件付けで適用
- セレクト: 入力と同じ見た目の擬似ボタン+モーダル（`FlatList(getItemLayout)`でチラつき防止）

**コード例（入力+メッセージ行）**

```
<View style={styles.inputContainer}>
  <TextInput
    value={value}
    onChangeText={onChange}
    placeholder="example"
    error={errors.field?.message}
    success={!errors.field && successText}
  />
</View>
```

**チェックリスト**

- 余白は `spacing` のみを使用しているか
- 入力/セレクトの横幅は300pxに統一されているか
- メッセージ行は常設で、表示非表示で高さが変わらないか
- 非活性のボタンに `disabled` と `opacity` の両方が適用されているか
- 成功メッセージに `successMuted` を使用しているか
