// Reverse the encoding applied by csv-stringify when its `escape_formulas`
// option is active.
//
// A field is unescaped when it starts with `'` and its second character is
// either another `'` or a formula trigger char:
// - `'=SUM(A1)` decodes to `=SUM(A1)` (escaped formula)
// - `''=already` decodes to `'=already` (doubled leading quote)
// Any other value is returned untouched, including fields consisting of a
// single `'` or starting with `'` followed by another character.
const formula_chars = new Set([
  "=",
  "+",
  "-",
  "@",
  "\t",
  "\r",
  "\uFF1D", // Unicode '='
  "\uFF0B", // Unicode '+'
  "\uFF0D", // Unicode '-'
  "\uFF20", // Unicode '@'
]);

const unescape_formula = function (value) {
  if (
    value.length >= 2 &&
    value[0] === "'" &&
    (value[1] === "'" || formula_chars.has(value[1]))
  ) {
    return value.slice(1);
  }
  return value;
};

export { formula_chars, unescape_formula };
